import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import type { Quiz } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Search,
  MoreVertical,
  Play,
  Edit,
  Trash2,
  FileQuestion,
  Clock,
} from 'lucide-react';

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteQuiz, setDeleteQuiz] = useState<Quiz | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchQuizzes();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      setFilteredQuizzes(
        quizzes.filter((q) =>
          q.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredQuizzes(quizzes);
    }
  }, [searchQuery, quizzes]);

  const fetchQuizzes = async () => {
    try {
      const data = await api.getQuizzes();
      setQuizzes(data);
      setFilteredQuizzes(data);
    } catch (error) {
      toast({
        title: 'Erro ao carregar quizzes',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteQuiz) return;

    try {
      await api.deleteQuiz(deleteQuiz.id);
      setQuizzes(quizzes.filter((q) => q.id !== deleteQuiz.id));
      toast({
        title: 'Quiz excluído',
        description: 'O quiz foi removido com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o quiz.',
        variant: 'destructive',
      });
    } finally {
      setDeleteQuiz(null);
    }
  };

  const handleStartRoom = async (quizId: string) => {
    navigate(`/dashboard/play/${quizId}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Meus Quizzes</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie e inicie seus quizzes
          </p>
        </div>
        <Button asChild className="btn-gradient-primary">
          <Link to="/dashboard/quizzes/new">
            <Plus className="h-4 w-4 mr-2" />
            Novo Quiz
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar quizzes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Quiz List */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <FileQuestion className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h2 className="font-heading text-xl font-semibold mb-2">
              {searchQuery ? 'Nenhum quiz encontrado' : 'Nenhum quiz criado ainda'}
            </h2>
            <p className="text-muted-foreground mb-6 max-w-sm">
              {searchQuery
                ? 'Tente buscar com outros termos'
                : 'Crie seu primeiro quiz para começar a gamificar suas aulas!'}
            </p>
            {!searchQuery && (
              <Button asChild className="btn-gradient-primary">
                <Link to="/dashboard/quizzes/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar meu primeiro quiz
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredQuizzes.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              onStart={() => handleStartRoom(quiz.id)}
              onEdit={() => navigate(`/dashboard/quizzes/${quiz.id}/edit`)}
              onDelete={() => setDeleteQuiz(quiz)}
              onClick={() => navigate(`/dashboard/quizzes/${quiz.id}`)}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteQuiz} onOpenChange={() => setDeleteQuiz(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O quiz "{deleteQuiz?.title}" e todas as suas
              perguntas serão permanentemente excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface QuizCardProps {
  quiz: Quiz;
  onStart: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onClick: () => void;
}

function QuizCard({ quiz, onStart, onEdit, onDelete, onClick }: QuizCardProps) {
  const questionCount = quiz.questions?.length || 0;
  const canStart = quiz.isPublished && questionCount > 0;

  return (
    <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group" onClick={onClick}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1 flex-1 min-w-0">
          <CardTitle className="font-heading text-lg line-clamp-1">{quiz.title}</CardTitle>
          <CardDescription className="line-clamp-2">
            {quiz.description || 'Sem descrição'}
          </CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            {canStart && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStart(); }}>
                <Play className="h-4 w-4 mr-2" />
                Iniciar Sala
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileQuestion className="h-4 w-4" />
              {questionCount} {questionCount === 1 ? 'pergunta' : 'perguntas'}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {new Date(quiz.createdAt).toLocaleDateString('pt-BR')}
            </span>
          </div>
          <Badge variant={quiz.isPublished ? 'default' : 'secondary'}>
            {quiz.isPublished ? 'Publicado' : 'Rascunho'}
          </Badge>
        </div>
        {canStart && (
          <Button
            onClick={(e) => { e.stopPropagation(); onStart(); }}
            className="w-full mt-4 btn-gradient-success"
          >
            <Play className="h-4 w-4 mr-2" />
            Iniciar Sala ao Vivo
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
