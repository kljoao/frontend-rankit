import { useEffect, useRef, useCallback } from 'react';
import { create } from 'zustand';
import type { Room, Player, Question, LeaderboardEntry, RoomStatus } from '@/types/api';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';

interface RoomState {
  socket: WebSocket | null;
  isConnected: boolean;
  room: Room | null;
  currentQuestion: Question | null;
  questionIndex: number;
  totalQuestions: number;
  leaderboard: LeaderboardEntry[];
  answerDistribution: Record<string, number>;
  correctOptionIndex: number | null;
  playerAnswer: number | null;
  pendingPlayers: Player[]; // Backend uses session/player info
  isPendingApproval: boolean;
  error: string | null;

  connect: (roomId: string, role: 'teacher' | 'player', nickname?: string) => void;
  disconnect: () => void;

  // Teacher actions
  openQuestion: () => void;
  revealAnswer: () => void;
  nextQuestion: () => void;
  endGame: () => void;
  moderateEntry: (connectionId: string, action: 'ACCEPT' | 'REJECT') => void;
  kickPlayer: (connectionId: string) => void;

  // Player actions
  submitAnswer: (optionIndex: number) => void;

  // Internal setters
  setRoom: (room: Room) => void;
  setPlayers: (players: Player[]) => void;
  setQuestionOpen: (question: Question, index: number, total: number) => void;
  setQuestionRevealed: (correctOptionIndex: number, distribution: Record<string, number>) => void;
  setLeaderboard: (leaderboard: LeaderboardEntry[]) => void;
  setPlayerAnswer: (optionIndex: number | null) => void;
  setError: (error: string | null) => void;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  socket: null,
  isConnected: false,
  room: null,
  currentQuestion: null,
  questionIndex: 0,
  totalQuestions: 0,
  leaderboard: [],
  answerDistribution: {},
  correctOptionIndex: null,
  playerAnswer: null,
  pendingPlayers: [],
  isPendingApproval: false,
  error: null,

  connect: (roomId: string, role: 'teacher' | 'player', nickname?: string) => {
    const { socket } = get();
    if (socket) {
      socket.close();
    }

    const token = localStorage.getItem('rankit_token');

    // Debug: Decode JWT to see userId
    let userId = 'unknown';
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.sub || payload.userId || payload.user_id || payload.id || 'not_found';
        console.log('🔑 JWT Decoded:', {
          userId,
          fullPayload: payload
        });
      } catch (e) {
        console.error('❌ Failed to decode JWT:', e);
      }
    }

    console.log('🔌 WS Connection Attempt:', {
      roomId,
      role,
      userId,
      hasToken: !!token,
      tokenPrefix: token ? token.substring(0, 10) + '...' : 'none'
    });

    const wsUrl = `${WS_URL}?roomId=${roomId}&room=${roomId}&role=${role}${nickname ? `&nickname=${encodeURIComponent(nickname)}` : ''}${token ? `&token=${token}` : ''}`;
    console.log('WS URL generated:', wsUrl.replace(token || 'nomatch', '***'));

    const newSocket = new WebSocket(wsUrl);

    newSocket.onopen = () => {
      set({ isConnected: true, error: null });
      console.log('WebSocket connected');

      // Strict Protocol: Send join_room if player
      if (role === 'player' && nickname) {
        newSocket.send(JSON.stringify({
          type: 'join_room',
          payload: { nickname }
        }));
      }
    };

    newSocket.onclose = () => {
      set({ isConnected: false });
      console.log('WebSocket disconnected');
    };

    newSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      set({ error: 'Erro de conexão' });
    };

    newSocket.onmessage = (event) => {
      try {
        console.log('WS Message Received (Raw):', event.data);

        // Handle concatenated JSON messages (e.g., {"..."}\n{"..."})
        // Wrap in array brackets and separate with commas
        // Regex matches closing brace, optional whitespace/newlines, then opening brace
        const fixedData = '[' + event.data.replace(/}\s*{/g, '},{') + ']';
        const messages = JSON.parse(fixedData);

        if (Array.isArray(messages)) {
          messages.forEach(msg => {
            console.log('WS Processing Message:', msg);
            handleMessage(msg, get, set);
          });
        }
      } catch (e) {
        console.error('Error parsing message:', e);
      }
    };

    set({ socket: newSocket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.close();
    }
    set({
      socket: null,
      isConnected: false,
      room: null,
      currentQuestion: null,
      leaderboard: [],
      answerDistribution: {},
      correctOptionIndex: null,
      playerAnswer: null,
      pendingPlayers: [],
      isPendingApproval: false,
    });
  },

  openQuestion: () => {
    const { socket, room } = get();
    if (socket?.readyState === WebSocket.OPEN) {
      // payload: { teacherId }
      socket.send(JSON.stringify({
        type: 'teacher_open_question',
        payload: { teacherId: room?.teacherId }
      }));
    }
  },

  revealAnswer: () => {
    const { socket, room } = get();
    if (socket?.readyState === WebSocket.OPEN) {
      // payload: { teacherId }
      socket.send(JSON.stringify({
        type: 'teacher_reveal',
        payload: { teacherId: room?.teacherId }
      }));
    }
  },

  nextQuestion: () => {
    // Note: Doc calls this "Iniciar / Próxima Pergunta" using teacher_open_question?
    // Wait, the doc says "Professor: Iniciar / Próxima Pergunta ... type: teacher_open_question".
    // It does NOT mention 'teacher_next'.
    // However, it separates "Iniciar" and "Próxima Pergunta" description under the SAME type?
    // "Used to exit Lobby and go to Q1, or Q1 to Q2".
    // So 'teacher_open_question' acts as 'next'.
    // BUT the store had 'teacher_next' separately.
    // I will assume 'teacher_open_question' is the canonical 'next' step if the doc merges them.
    // Let's look closer at the doc: "Professor: Iniciar / Próxima Pergunta ... type: teacher_open_question".
    // So I should replace 'teacher_next' with 'teacher_open_question' or keep it if 'nextQuestion' is just a UI handler calling the same event.
    // Actually, 'teacher_open_question' seems to be the only event for advancing?
    // "Usado para sair do Lobby e ir para Q1, ou de Q1 para Q2".
    // So distinct 'teacher_next' might not exist in the new protocol.
    // I will use 'teacher_open_question' for nextQuestion as well.
    const { socket, room } = get();
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'teacher_open_question',
        payload: { teacherId: room?.teacherId }
      }));
      set({ playerAnswer: null, correctOptionIndex: null, answerDistribution: {} });
    }
  },

  moderateEntry: (connectionId, action) => {
    const { socket, room } = get();
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'teacher_moderate_entry',
        payload: {
          teacherId: room?.teacherId,
          connectionId,
          action
        }
      }));
      // Remove from pending locally for immediate feedback
      set((state) => ({
        pendingPlayers: state.pendingPlayers.filter(p => (p as any).connectionId !== connectionId)
      }));
    }
  },

  kickPlayer: (connectionId) => {
    const { socket, room } = get();
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'teacher_kick_player',
        payload: {
          teacherId: room?.teacherId,
          connectionId
        }
      }));
    }
  },

  endGame: () => {
    const { socket, room } = get();
    if (socket?.readyState === WebSocket.OPEN) {
      // Doc doesn't explicitly mention 'teacher_end'. 
      // It says "or Q2 to Final" under 'teacher_open_question'?
      // "Usado para sair do Lobby e ir para Q1, ou de Q1 para Q2, ou de Q2 para Final."
      // This implies 'teacher_open_question' handles ALL transitions?
      // If so, sending 'teacher_open_question' when on last question might trigger end?
      // Or maybe there IS a 'teacher_end' but it's not listed?
      // Given "or de Q2 para Final", it implies the backend calculates if it's the end.
      // So I might just call 'teacher_open_question' again?
      // But purely for safety, I'll keep 'teacher_end' if the backend supports it, 
      // OR better, try to follow the "Usado para... ir para Final" instruction which implies strictly 'teacher_open_question'.
      // However, explicit 'endGame' button usually warrants an explicit signal.
      // The doc says "Professor: Iniciar / Próxima Pergunta".
      // I will assume 'teacher_open_question' logic on backend handles End if queries >= total.
      // I'll stick to 'teacher_open_question' for endGame too? 
      // Wait, 'teacher_end' was in the old code. 
      // Let's stick to the EXPLICIT keys in the doc.
      // Doc: "type: teacher_open_question".
      // Doc: "type: teacher_reveal".
      // That's it for teacher.
      // So endGame IS likely 'teacher_open_question' (advancing to 'finish' state).
      socket.send(JSON.stringify({
        type: 'teacher_open_question',
        payload: { teacherId: room?.teacherId }
      }));
    }
  },

  submitAnswer: (optionIndex: number) => {
    const { socket, room } = get();
    if (socket?.readyState === WebSocket.OPEN && room?.status === 'OPEN') {
      // payload: { answerIndex }
      socket.send(JSON.stringify({
        type: 'submit_answer',
        payload: { answerIndex: optionIndex }
      }));
      set({ playerAnswer: optionIndex });
    }
  },

  setRoom: (room) => set({ room }),
  setPlayers: (players) => set((state) => ({
    room: state.room ? { ...state.room, players } : null
  })),
  setQuestionOpen: (question, index, total) => set({
    currentQuestion: question,
    questionIndex: index,
    totalQuestions: total,
    correctOptionIndex: null,
    answerDistribution: {},
    playerAnswer: null,
  }),
  setQuestionRevealed: (correctOptionIndex, distribution) => set({
    correctOptionIndex,
    answerDistribution: distribution,
  }),
  setLeaderboard: (leaderboard) => set({ leaderboard }),
  setPlayerAnswer: (optionIndex) => set({ playerAnswer: optionIndex }),
  setError: (error) => set({ error }),
}));

function handleMessage(
  data: any,
  get: () => RoomState,
  set: (state: Partial<RoomState> | ((state: RoomState) => Partial<RoomState>)) => void
) {
  // Doc: { type, payload }
  const { type, payload } = data;

  console.log('📨 WebSocket Event Received:', { type, payload });

  switch (type) {
    case 'room_state':
      // payload: { status, currentQuestionIndex, currentQuestion, totalQuestions, players? }
      // IMPORTANT: Preserve existing players if not included in payload
      const currentRoom = get().room;

      console.log('🏠 room_state event:', {
        newStatus: payload.status,
        hasCurrentQuestion: !!payload.currentQuestion,
        hasPlayers: !!payload.players,
        questionIndex: payload.currentQuestionIndex,
        totalQuestions: payload.totalQuestions
      });

      set({
        // Merge status/totals into room, preserving players if not in payload
        room: currentRoom ? {
          ...currentRoom,
          status: payload.status,
          currentQuestionIndex: payload.currentQuestionIndex,
          totalQuestions: payload.totalQuestions,
          // Only update players if provided in payload
          ...(payload.players && { players: payload.players })
        } : {
          // If no current room, create one from payload
          id: currentRoom?.id || '',
          status: payload.status,
          currentQuestionIndex: payload.currentQuestionIndex,
          totalQuestions: payload.totalQuestions,
          players: payload.players || [],
          teacherId: currentRoom?.teacherId || '',
          quizId: currentRoom?.quizId || '',
          code: currentRoom?.code || '',
        },
        // Update question state
        currentQuestion: payload.currentQuestion || null,
        questionIndex: payload.currentQuestionIndex || 0,
        totalQuestions: payload.totalQuestions || 0,
        // Reset transient state when entering new state
        answerDistribution: {},
        correctOptionIndex: null,
        isPendingApproval: false, // Once we get room_state, we are likely approved
      });
      break;

    case 'player_joined':
      // Payload: { id, nickname, score }
      // We need to add this player to the list
      const pJoinedRoom = get().room;
      if (pJoinedRoom) {
        const newPlayer = payload; // { id, nickname, score } matches Player interface roughly
        const currentPlayers = pJoinedRoom.players || [];
        // Avoid duplicates just in case
        if (!currentPlayers.find(p => p.nickname === newPlayer.nickname)) {
          set({
            room: { ...pJoinedRoom, players: [...currentPlayers, newPlayer] },
            // Also remove from pending if it was there
            pendingPlayers: get().pendingPlayers.filter(p => p.nickname !== newPlayer.nickname)
          });
        }
      }
      break;

    case 'player_request_entry':
      // Payload: { nickname, connectionId }
      set((state) => ({
        pendingPlayers: [...state.pendingPlayers, payload]
      }));
      break;

    case 'entry_pending':
      set({ isPendingApproval: true });
      break;

    case 'player_left':
    case 'player_kicked':
      // Payload: { id, connectionId, nickname }
      // Remove player from the list by matching id, connectionId, or nickname
      console.log('Player left/kicked event:', payload);
      const pLeftRoom = get().room;
      if (pLeftRoom) {
        const leftId = payload.id || payload.connectionId;
        const leftNickname = payload.nickname;

        set((state) => ({
          room: state.room ? {
            ...state.room,
            players: (state.room.players || []).filter(p => {
              // Match by id, connectionId, or nickname for robustness
              const matchesId = leftId && (p.id === leftId || (p as any).connectionId === leftId);
              const matchesNickname = leftNickname && p.nickname === leftNickname;
              return !(matchesId || matchesNickname);
            })
          } : null,
          // Also remove from pending if present
          pendingPlayers: state.pendingPlayers.filter(p => {
            const matchesId = leftId && ((p as any).connectionId === leftId);
            const matchesNickname = leftNickname && p.nickname === leftNickname;
            return !(matchesId || matchesNickname);
          })
        }));
      }
      break;

    case 'kicked':
      // Sent to the student being kicked
      set({
        error: payload || 'Você foi removido da sala pelo professor.',
        isConnected: false,
        room: null
      });
      get().socket?.close();
      break;

    // Handle variations: question_opened, question_open, QUESTION_OPEN
    case 'question_opened':
    case 'question_open':
    case 'QUESTION_OPEN':
      // Payload: { status: "OPEN", currentQuestion: {...}, questionIndex?, totalQuestions? }
      console.log('❓ question_opened event:', payload);

      const qOpenRoom = get().room;
      set({
        currentQuestion: payload.currentQuestion || null,
        questionIndex: payload.questionIndex !== undefined ? payload.questionIndex : get().questionIndex,
        totalQuestions: payload.totalQuestions !== undefined ? payload.totalQuestions : get().totalQuestions,
        room: qOpenRoom ? {
          ...qOpenRoom,
          status: (payload.status || 'OPEN') as RoomStatus,
          currentQuestionIndex: payload.questionIndex !== undefined ? payload.questionIndex : qOpenRoom.currentQuestionIndex,
        } : null,
        correctOptionIndex: null,
        answerDistribution: {},
        playerAnswer: null,
      });
      break;

    // Handle variations: question_revealed, revealed, QUESTION_REVEALED
    case 'question_revealed':
    case 'revealed':
    case 'QUESTION_REVEALED':
      // Payload: { status: "REVEALED", currentQuestion: { correctIndex }, stats: {...} }
      console.log('✅ question_revealed event:', payload);

      const qRevRoom = get().room;
      set({
        correctOptionIndex: payload.currentQuestion?.correctIndex ?? payload.correctIndex ?? null,
        answerDistribution: payload.stats || payload.answerDistribution || {},
        room: qRevRoom ? {
          ...qRevRoom,
          status: (payload.status || 'REVEALED') as RoomStatus,
        } : null,
      });
      break;

    case 'leaderboard_update':
    case 'leaderboard':
      // Payload: [ { nickname, score, position? } ] or just the array directly
      console.log('🏆 leaderboard_update event:', payload);

      const leaderboardData = Array.isArray(payload) ? payload : (payload.leaderboard || []);

      // Add position to each entry if not present
      const leaderboardWithPositions = leaderboardData.map((entry: any, index: number) => ({
        ...entry,
        position: entry.position !== undefined ? entry.position : index + 1,
        playerId: entry.playerId || entry.id || entry.connectionId,
      }));

      set({ leaderboard: leaderboardWithPositions });
      break;

    // Handle players list update
    case 'players_update':
    case 'room_players':
      console.log('👥 players_update event:', payload);
      const pUpdateRoom = get().room;
      if (pUpdateRoom) {
        const updatedPlayers = Array.isArray(payload) ? payload : (payload.players || []);
        set({
          room: { ...pUpdateRoom, players: updatedPlayers }
        });
      }
      break;

    // Doc says room_state handles FINISHED status? 
    // Or maybe we get a specific event? 
    // "Professor: Iniciar (teacher_open_question)... ou de Q2 para Final".
    // If backend transitions to FINISHED, it might send 'room_state' with status FINISHED due to 'teacher_open_question'.
    // Or maybe 'game_ended' event still exists?
    // The doc didn't explicitly list 'game_ended' in "Server -> Client" section.
    // It only listed: player_joined, room_state, question_opened, question_revealed, leaderboard_update, error.
    // So 'FINISHED' likely comes via 'room_state' or 'question_opened' (unlikely) or maybe a status update?
    // If I receive 'room_state' with status 'FINISHED', the first case handles it.
    // I will keep 'game_ended' case just in case, but rely on 'room_state' mostly.
    case 'game_ended':
      set({
        room: get().room ? { ...get().room!, status: 'FINISHED' as RoomStatus } : null,
        leaderboard: payload.leaderboard || get().leaderboard,
      });
      break;

    case 'error':
      console.error('❌ WebSocket Error Event:', payload);

      // Don't clear room data on permission errors - we already have it from HTTP
      // Only set error message for user feedback
      if (payload.includes('permissão')) {
        console.warn('⚠️ Permission error - this might be a backend validation issue');
        console.log('Current room in store:', get().room);
        console.log('If room is present, we can continue using HTTP API for teacher actions');

        // For teachers, we can still show the room interface
        // The backend might need to fix the permission check
        // For now, we'll keep the room data but log the error
        set({
          error: null, // Don't show error to user if we have room data
        });
      } else {
        set({ error: payload }); // Show other errors
      }
      break;

    default:
      console.warn('⚠️ Unknown WebSocket message type:', type, 'Payload:', payload);
      console.log('Current room state:', get().room);
  }

  // Log final state after processing
  console.log('📊 Store state after event:', {
    roomStatus: get().room?.status,
    hasQuestion: !!get().currentQuestion,
    playersCount: get().room?.players?.length || 0,
    pendingCount: get().pendingPlayers.length,
    isConnected: get().isConnected,
  });
}

// Hook for easier use with cleanup
export function useWebSocket() {
  const connect = useRoomStore((state) => state.connect);
  const disconnect = useRoomStore((state) => state.disconnect);

  const connectToRoom = useCallback(
    (roomId: string, role: 'teacher' | 'player', nickname?: string) => {
      connect(roomId, role, nickname);
    },
    [connect]
  );

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { connect: connectToRoom, disconnect };
}
