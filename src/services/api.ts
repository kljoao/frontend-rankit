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

    // Handle auth errors and text/plain JSON responses
    this.client.interceptors.response.use(
      (response) => {
        // Handle potential text/plain response that contains JSON
        if (typeof response.data === 'string') {
          try {
            const parsed = JSON.parse(response.data);
            response.data = parsed;
          } catch (e) {
            // Not JSON, leave as is
          }
        }
        return response;
      },
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
    const response = await this.client.put<Quiz>(`/quizzes/${id}`, data);
    return response.data;
  }

  async deleteQuiz(id: string): Promise<void> {
    await this.client.delete(`/quizzes/${id}`);
  }

  async publishQuiz(id: string): Promise<Quiz> {
    const response = await this.client.post<Quiz>(`/quizzes/${id}/publish`);
    return response.data;
  }

  // Questions
  async addQuestion(quizId: string, data: CreateQuestionRequest): Promise<Question> {
    const response = await this.client.post<Question>(`/quizzes/${quizId}/questions`, data);
    return response.data;
  }

  async updateQuestion(quizId: string, questionId: string, data: Partial<CreateQuestionRequest>): Promise<Question> {
    const response = await this.client.put<Question>(`/quizzes/${quizId}/questions/${questionId}`, data);
    return response.data;
  }

  async deleteQuestion(quizId: string, questionId: string): Promise<void> {
    await this.client.delete(`/quizzes/${quizId}/questions/${questionId}`);
  }

  async reorderQuestions(quizId: string, questionIds: string[]): Promise<void> {
    await this.client.post(`/quizzes/${quizId}/questions/reorder`, { order: questionIds });
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
    const response = await this.client.get<Room>(`/rooms/${code}`);
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
    // Note: The user list didn't explicitly show a GET /reports/quizzes endpoint for listing, 
    // but showed GET /reports/quizzes/{id}. 
    // The user list was: 
    // GET /reports/rooms
    // GET /reports/rooms/{id}
    // GET /reports/quizzes/{id}
    // usage of getQuizReports (plural) seems unrelated to the specific requested changes but I'll leave it 
    // if it wasn't explicitly forbidden, to avoid breaking existing unseen code.
    // However, I MUST fix getQuizSummary which maps to GET /reports/quizzes/{id}
    const response = await this.client.get<Quiz[]>('/reports/quizzes');
    return response.data;
  }

  async getQuizSummary(id: string): Promise<QuizSummary> {
    const response = await this.client.get<QuizSummary>(`/reports/quizzes/${id}`);
    return response.data;
  }
}

export const api = new ApiService();
