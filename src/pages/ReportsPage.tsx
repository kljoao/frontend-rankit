import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import type { RoomReport, Quiz } from '@/types/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart3,
  Users,
  Clock,
  ArrowRight,
  FileQuestion,
  Trophy,
} from 'lucide-react';

export default function ReportsPage() {
  const [rooms, setRooms] = useState<RoomReport[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roomsData, quizzesData] = await Promise.all([
          api.getRoomReports().catch(() => []),
          api.getQuizReports().catch(() => []),
        ]);
        setRooms(roomsData);
        setQuizzes(quizzesData);
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'FINISHED':
        return <Badge className="bg-accent">Finalizada</Badge>;
      case 'OPEN':
      case 'REVEALED':
        return <Badge className="bg-warning text-foreground">Em andamento</Badge>;
      default:
        return <Badge variant="secondary">Lobby</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl font-bold">Relatórios</h1>
        <p className="text-muted-foreground mt-1">
          Analise o desempenho das suas salas e quizzes
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="rooms" className="space-y-6">
        <TabsList>
          <TabsTrigger value="rooms" className="gap-2">
            <Users className="h-4 w-4" />
            Salas
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="gap-2">
            <FileQuestion className="h-4 w-4" />
            Quizzes
          </TabsTrigger>
        </TabsList>

        {/* Rooms Tab */}
        <TabsContent value="rooms" className="space-y-4">
          {rooms.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center">
                <Users className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                <h2 className="font-heading text-xl font-semibold mb-2">
                  Nenhuma sala realizada
                </h2>
                <p className="text-muted-foreground">
                  As salas aparecerão aqui após serem finalizadas
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {rooms.map((room) => (
                <Link
                  key={room.id}
                  to={`/dashboard/reports/rooms/${room.id}`}
                  className="block"
                >
                  <Card className="hover:shadow-md transition-all cursor-pointer group">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                            <BarChart3 className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{room.quizTitle}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {room.playerCount} participantes
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {new Date(room.createdAt).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {getStatusBadge(room.status)}
                          <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Quizzes Tab */}
        <TabsContent value="quizzes" className="space-y-4">
          {quizzes.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center">
                <FileQuestion className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                <h2 className="font-heading text-xl font-semibold mb-2">
                  Nenhum quiz com estatísticas
                </h2>
                <p className="text-muted-foreground">
                  Realize salas para gerar estatísticas dos seus quizzes
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quizzes.map((quiz) => (
                <Link
                  key={quiz.id}
                  to={`/dashboard/reports/quizzes/${quiz.id}`}
                >
                  <Card className="h-full hover:shadow-md transition-all cursor-pointer group">
                    <CardHeader>
                      <CardTitle className="font-heading text-lg line-clamp-1">
                        {quiz.title}
                      </CardTitle>
                      <CardDescription>
                        {quiz.questions?.length || 0} perguntas
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Trophy className="h-4 w-4" />
                          <span className="text-sm">Ver estatísticas</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
