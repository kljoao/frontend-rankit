import { useEffect, useRef, useCallback } from 'react';
import { create } from 'zustand';
import type { Room, Player, Question, LeaderboardEntry, RoomStatus } from '@/types/api';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

interface RoomState {
  socket: WebSocket | null;
  isConnected: boolean;
  room: Room | null;
  currentQuestion: Question | null;
  questionIndex: number;
  totalQuestions: number;
  leaderboard: LeaderboardEntry[];
  answerDistribution: Record<string, number>;
  correctOptionId: string | null;
  playerAnswer: string | null;
  error: string | null;

  connect: (roomId: string, role: 'teacher' | 'player', nickname?: string) => void;
  disconnect: () => void;
  
  // Teacher actions
  openQuestion: () => void;
  revealAnswer: () => void;
  nextQuestion: () => void;
  endGame: () => void;
  
  // Player actions
  submitAnswer: (optionId: string) => void;

  // Internal setters
  setRoom: (room: Room) => void;
  setPlayers: (players: Player[]) => void;
  setQuestionOpen: (question: Question, index: number, total: number) => void;
  setQuestionRevealed: (correctOptionId: string, distribution: Record<string, number>) => void;
  setLeaderboard: (leaderboard: LeaderboardEntry[]) => void;
  setPlayerAnswer: (optionId: string | null) => void;
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
  correctOptionId: null,
  playerAnswer: null,
  error: null,

  connect: (roomId: string, role: 'teacher' | 'player', nickname?: string) => {
    const { socket } = get();
    if (socket) {
      socket.close();
    }

    const wsUrl = `${WS_URL}/ws?roomId=${roomId}&role=${role}${nickname ? `&nickname=${encodeURIComponent(nickname)}` : ''}`;
    const newSocket = new WebSocket(wsUrl);

    newSocket.onopen = () => {
      set({ isConnected: true, error: null });
      console.log('WebSocket connected');
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
        const message = JSON.parse(event.data);
        handleMessage(message, get, set);
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
      correctOptionId: null,
      playerAnswer: null,
    });
  },

  openQuestion: () => {
    const { socket } = get();
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'teacher_open_question' }));
    }
  },

  revealAnswer: () => {
    const { socket } = get();
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'teacher_reveal' }));
    }
  },

  nextQuestion: () => {
    const { socket } = get();
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'teacher_next' }));
      set({ playerAnswer: null, correctOptionId: null, answerDistribution: {} });
    }
  },

  endGame: () => {
    const { socket } = get();
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'teacher_end' }));
    }
  },

  submitAnswer: (optionId: string) => {
    const { socket, room } = get();
    if (socket?.readyState === WebSocket.OPEN && room?.status === 'OPEN') {
      socket.send(JSON.stringify({ type: 'submit_answer', optionId }));
      set({ playerAnswer: optionId });
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
    correctOptionId: null,
    answerDistribution: {},
    playerAnswer: null,
  }),
  setQuestionRevealed: (correctOptionId, distribution) => set({
    correctOptionId,
    answerDistribution: distribution,
  }),
  setLeaderboard: (leaderboard) => set({ leaderboard }),
  setPlayerAnswer: (optionId) => set({ playerAnswer: optionId }),
  setError: (error) => set({ error }),
}));

function handleMessage(
  message: any,
  get: () => RoomState,
  set: (state: Partial<RoomState>) => void
) {
  switch (message.type) {
    case 'room_state':
      set({
        room: message.room,
        currentQuestion: message.currentQuestion,
        leaderboard: message.leaderboard || [],
      });
      break;

    case 'players_update':
      const currentRoom = get().room;
      if (currentRoom) {
        set({
          room: { ...currentRoom, players: message.players }
        });
      }
      break;

    case 'question_open':
      set({
        currentQuestion: message.question,
        questionIndex: message.questionIndex,
        totalQuestions: message.totalQuestions,
        correctOptionId: null,
        answerDistribution: {},
        playerAnswer: null,
        room: get().room ? { ...get().room!, status: 'OPEN' as RoomStatus } : null,
      });
      break;

    case 'question_revealed':
      set({
        correctOptionId: message.correctOptionId,
        answerDistribution: message.answerDistribution,
        room: get().room ? { ...get().room!, status: 'REVEALED' as RoomStatus } : null,
      });
      break;

    case 'leaderboard_update':
      set({ leaderboard: message.leaderboard });
      break;

    case 'game_ended':
      set({
        room: get().room ? { ...get().room!, status: 'FINISHED' as RoomStatus } : null,
        leaderboard: message.leaderboard || get().leaderboard,
      });
      break;

    case 'error':
      set({ error: message.message });
      break;

    default:
      console.log('Unknown message type:', message.type);
  }
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
