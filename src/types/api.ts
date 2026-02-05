// API Types for RankIt Backend

// Auth Types
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

// Quiz Types
export interface Quiz {
  id: string;
  title: string;
  description?: string;
  status: 'DRAFT' | 'PUBLISHED';
  createdAt: string;
  updatedAt?: string;
  questions?: Question[];
}

export interface Question {
  id: string;
  statement: string;
  prompt: string;
  order: number;
  timeLimit?: number;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctIndex: number; // Index 0-3
}

export interface CreateQuizRequest {
  title: string;
  description?: string;
}

export interface UpdateQuizRequest {
  title?: string;
  description?: string;
}

export interface CreateQuestionRequest {
  prompt: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctIndex: number;
}

// Room Types
export interface Room {
  id: string;
  ID?: string; // Backend PascalCase fallback
  Status?: RoomStatus; // Backend PascalCase fallback
  code?: string; // Fallback if backend returns code
  shortCode?: string;
  // Actually docs say: Response (201) { id: "ABC123", ... }
  // Yet GET /rooms/{id} says id: "ABC123".
  // So "id" is the code.
  teacherId?: string;
  quizId?: string;
  status: RoomStatus;
  currentQuestionIndex?: number;
  createdAt?: string;
  quiz?: { title: string }; // Partial quiz info often sent
  players?: Player[];
  totalQuestions?: number;
  playersCount?: number;
}

export type RoomStatus = 'LOBBY' | 'OPEN' | 'REVEALED' | 'FINISHED';

export interface Player {
  id?: string; // WebSocket might send ID
  nickname: string;
  score: number;
  // ... other fields
}

export interface CreateRoomRequest {
  quizId: string;
}

export interface PendingPlayer {
  connectionId: string;
  nickname: string;
}

export type ModerateEntryAction = 'ACCEPT' | 'REJECT';

// WebSocket Events
export interface WSRoomState {
  room: Room;
  currentQuestion?: Question;
  leaderboard: LeaderboardEntry[];
}

export interface LeaderboardEntry {
  playerId: string;
  nickname: string;
  score: number;
  position: number;
}

export interface WSQuestionOpen {
  question: Question;
  questionIndex: number; // Current index
  totalQuestions: number;
}

export interface WSQuestionRevealed {
  question: Question;
  correctOptionIndex: number;
  answerDistribution: Record<string, number>;
}

export interface WSPlayersUpdate {
  players: Player[];
  count: number;
}

export interface WSLeaderboardUpdate {
  leaderboard: LeaderboardEntry[];
}

// Reports Types
export interface RoomReport {
  id: string; // uuid-historico
  roomId: string; // ABC123 (Room Code Snapshot)
  quizTitleSnapshot: string;
  finishedAt: string;
  totalQuestions: number;
  status: RoomStatus;
}

export interface RoomDetailReport {
  id: string;
  quizTitleSnapshot: string;
  startedAt?: string;
  finishedAt: string;
  players: PlayerReport[];
  questions: QuestionStats[];
}

export interface PlayerReport {
  nickname: string;
  score: number;
  correctCount: number;
  wrongCount: number;
}

export interface QuestionStats {
  questionIndex: number;
  correctCount: number;
  countA: number;
  countB: number;
  countC: number;
  countD: number;
}

export interface QuizSummary {
  quizId: string;
  totalRooms: number;
  avgParticipants: number;
}
