import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  Quiz,
  CreateQuizRequest,
  UpdateQuizRequest,
  Question,
  CreateQuestionRequest,
  Room,
  CreateRoomRequest,
  RoomReport,
  RoomDetailReport,
  QuizSummary,
} from '@/types/api';

// Configure base URL - can be overridden via environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('rankit_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle auth errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('rankit_token');
          localStorage.removeItem('rankit_user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/login', data);
    return response.data;
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/register', data);
    return response.data;
  }

  async getMe(): Promise<User> {
    const response = await this.client.get<User>('/auth/me');
    return response.data;
  }

  // Quizzes
  async getQuizzes(): Promise<Quiz[]> {
    const response = await this.client.get<Quiz[]>('/quizzes');
    return response.data;
  }

  async getQuiz(id: string): Promise<Quiz> {
    const response = await this.client.get<Quiz>(`/quizzes/${id}`);
    return response.data;
  }

  async createQuiz(data: CreateQuizRequest): Promise<Quiz> {
    const response = await this.client.post<Quiz>('/quizzes', data);
    return response.data;
  }

  async updateQuiz(id: string, data: UpdateQuizRequest): Promise<Quiz> {
    const response = await this.client.patch<Quiz>(`/quizzes/${id}`, data);
    return response.data;
  }

  async deleteQuiz(id: string): Promise<void> {
    await this.client.delete(`/quizzes/${id}`);
  }

  async publishQuiz(id: string): Promise<Quiz> {
    const response = await this.client.patch<Quiz>(`/quizzes/${id}`, { isPublished: true });
    return response.data;
  }

  // Questions
  async addQuestion(quizId: string, data: CreateQuestionRequest): Promise<Question> {
    const response = await this.client.post<Question>(`/quizzes/${quizId}/questions`, data);
    return response.data;
  }

  async updateQuestion(quizId: string, questionId: string, data: Partial<CreateQuestionRequest>): Promise<Question> {
    const response = await this.client.patch<Question>(`/quizzes/${quizId}/questions/${questionId}`, data);
    return response.data;
  }

  async deleteQuestion(quizId: string, questionId: string): Promise<void> {
    await this.client.delete(`/quizzes/${quizId}/questions/${questionId}`);
  }

  async reorderQuestions(quizId: string, questionIds: string[]): Promise<void> {
    await this.client.put(`/quizzes/${quizId}/questions/reorder`, { questionIds });
  }

  // Rooms
  async createRoom(data: CreateRoomRequest): Promise<Room> {
    const response = await this.client.post<Room>('/rooms', data);
    return response.data;
  }

  async getRoom(id: string): Promise<Room> {
    const response = await this.client.get<Room>(`/rooms/${id}`);
    return response.data;
  }

  async getRoomByCode(code: string): Promise<Room> {
    const response = await this.client.get<Room>(`/rooms/code/${code}`);
    return response.data;
  }

  // Reports
  async getRoomReports(): Promise<RoomReport[]> {
    const response = await this.client.get<RoomReport[]>('/reports/rooms');
    return response.data;
  }

  async getRoomReport(id: string): Promise<RoomDetailReport> {
    const response = await this.client.get<RoomDetailReport>(`/reports/rooms/${id}`);
    return response.data;
  }

  async getQuizReports(): Promise<Quiz[]> {
    const response = await this.client.get<Quiz[]>('/reports/quizzes');
    return response.data;
  }

  async getQuizSummary(id: string): Promise<QuizSummary> {
    const response = await this.client.get<QuizSummary>(`/reports/quizzes/${id}/summary`);
    return response.data;
  }
}

export const api = new ApiService();
