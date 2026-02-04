import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/layouts/DashboardLayout";

// Public Pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import StudentRoomPage from "./pages/StudentRoomPage";
import ProjectorPage from "./pages/ProjectorPage";

// Protected Pages
import DashboardPage from "./pages/DashboardPage";
import QuizzesPage from "./pages/QuizzesPage";
import NewQuizPage from "./pages/NewQuizPage";
import EditQuizPage from "./pages/EditQuizPage";
import PlayQuizPage from "./pages/PlayQuizPage";
import ReportsPage from "./pages/ReportsPage";
import RoomReportPage from "./pages/RoomReportPage";
import QuizReportPage from "./pages/QuizReportPage";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/room/:roomCode" element={<StudentRoomPage />} />
          <Route path="/room/projector/:roomId" element={<ProjectorPage />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="dashboard/quizzes" element={<QuizzesPage />} />
            <Route path="dashboard/quizzes/new" element={<NewQuizPage />} />
            <Route path="dashboard/quizzes/:id" element={<EditQuizPage />} />
            <Route path="dashboard/quizzes/:id/edit" element={<EditQuizPage />} />
            <Route path="dashboard/play/:quizId" element={<PlayQuizPage />} />
            <Route path="dashboard/reports" element={<ReportsPage />} />
            <Route path="dashboard/reports/rooms/:id" element={<RoomReportPage />} />
            <Route path="dashboard/reports/quizzes/:id" element={<QuizReportPage />} />
            <Route path="dashboard/profile" element={<ProfilePage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
