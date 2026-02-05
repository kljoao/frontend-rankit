import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/services/api';
import type { Quiz, RoomReport } from '@/types/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileQuestion,
  Users,
  Trophy,
  TrendingUp,
  Plus,
  Play,
  ArrowRight,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [recentRooms, setRecentRooms] = useState<RoomReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [quizzesData, roomsData] = await Promise.all([
          api.getQuizzes().catch(() => []) as Promise<Quiz[]>,
          api.getRoomReports().catch(() => []) as Promise<RoomReport[]>,
        ]);
        setQuizzes(Array.isArray(quizzesData) ? quizzesData : []);
        setRecentRooms(Array.isArray(roomsData) ? roomsData.slice(0, 5) : []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setQuizzes([]);
        setRecentRooms([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = [
    {
      title: 'Total de Quizzes',
      value: quizzes?.length || 0,
      icon: FileQuestion,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Quizzes Publicados',
      value: (quizzes || []).filter((q) => q.status === 'PUBLISHED').length,
      icon: Play,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Salas Realizadas',
      value: recentRooms.length,
      icon: Users,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      title: 'Perguntas Criadas',
      value: quizzes.reduce((acc, q) => acc + (q.questions?.length || 0), 0),
      icon: Trophy,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">
            Olá, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Pronto para gamificar mais uma aula?
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link to="/dashboard/quizzes/new">
              <Plus className="h-4 w-4 mr-2" />
              Novo Quiz
            </Link>
          </Button>
          <Button asChild className="btn-gradient-primary">
            <Link to="/dashboard/quizzes">
              <Play className="h-4 w-4 mr-2" />
              Iniciar Sala
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-3xl font-bold font-heading">{stat.value}</p>
                  )}
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Quizzes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-heading">Meus Quizzes</CardTitle>
              <CardDescription>Quizzes criados recentemente</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard/quizzes">
                Ver todos
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : quizzes.length === 0 ? (
              <div className="text-center py-8">
                <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground mb-4">
                  Você ainda não criou nenhum quiz
                </p>
                <Button asChild variant="outline">
                  <Link to="/dashboard/quizzes/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar primeiro quiz
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {quizzes.slice(0, 5).map((quiz) => (
                  <Link
                    key={quiz.id}
                    to={`/dashboard/quizzes/${quiz.id}`}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${quiz.status === 'PUBLISHED' ? 'bg-accent' : 'bg-warning'}`} />
                      <div>
                        <p className="font-medium">{quiz.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {quiz.questions?.length || 0} perguntas
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Tips */}
        <Card className="bg-gradient-primary text-white">
          <CardHeader>
            <CardTitle className="font-heading text-white">Dicas Rápidas 💡</CardTitle>
            <CardDescription className="text-white/80">
              Maximize o engajamento da sua turma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <TipItem
                icon={<TrendingUp className="h-5 w-5" />}
                title="Use tempo limitado"
                description="Perguntas com 15-30 segundos mantêm a energia alta"
              />
              <TipItem
                icon={<Trophy className="h-5 w-5" />}
                title="Comemore os vencedores"
                description="Destaque os top 3 ao final de cada rodada"
              />
              <TipItem
                icon={<Users className="h-5 w-5" />}
                title="Projete o ranking"
                description="Use a tela do projetor para mostrar o placar em tempo real"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TipItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm">
      <div className="flex-shrink-0">{icon}</div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-white/80">{description}</p>
      </div>
    </div>
  );
}
