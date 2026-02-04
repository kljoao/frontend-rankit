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
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  questions: Question[];
}

export interface Question {
  id: string;
  quizId: string;
  text: string;
  order: number;
  timeLimit: number;
  options: Option[];
}

export interface Option {
  id: string;
  questionId: string;
  text: string;
  isCorrect: boolean;
  order: number;
}

export interface CreateQuizRequest {
  title: string;
  description?: string;
}

export interface UpdateQuizRequest {
  title?: string;
  description?: string;
  isPublished?: boolean;
}

export interface CreateQuestionRequest {
  text: string;
  timeLimit?: number;
  options: CreateOptionRequest[];
}

export interface CreateOptionRequest {
  text: string;
  isCorrect: boolean;
}

// Room Types
export interface Room {
  id: string;
  code: string;
  quizId: string;
  status: RoomStatus;
  currentQuestionIndex: number;
  createdAt: string;
  quiz?: Quiz;
  players: Player[];
}

export type RoomStatus = 'LOBBY' | 'OPEN' | 'REVEALED' | 'FINISHED';

export interface Player {
  id: string;
  nickname: string;
  score: number;
  roomId: string;
}

export interface CreateRoomRequest {
  quizId: string;
}

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
  questionIndex: number;
  totalQuestions: number;
}

export interface WSQuestionRevealed {
  question: Question;
  correctOptionId: string;
  answerDistribution: Record<string, number>;
}

export interface WSPlayersUpdate {
  players: Player[];
}

export interface WSLeaderboardUpdate {
  leaderboard: LeaderboardEntry[];
}

// Reports Types
export interface RoomReport {
  id: string;
  code: string;
  quizTitle: string;
  status: RoomStatus;
  playerCount: number;
  createdAt: string;
  finishedAt?: string;
}

export interface RoomDetailReport {
  room: Room;
  quiz: Quiz;
  players: PlayerReport[];
  questionStats: QuestionStats[];
}

export interface PlayerReport {
  id: string;
  nickname: string;
  score: number;
  correctAnswers: number;
  totalAnswers: number;
  averageResponseTime: number;
}

export interface QuestionStats {
  questionId: string;
  questionText: string;
  correctPercentage: number;
  averageResponseTime: number;
  answerDistribution: Record<string, number>;
}

export interface QuizSummary {
  quizId: string;
  title: string;
  totalSessions: number;
  totalPlayers: number;
  averageScore: number;
  questionPerformance: QuestionStats[];
}
