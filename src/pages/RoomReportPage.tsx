import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import type { RoomDetailReport } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Users,
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
  Crown,
  Medal,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RoomReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<RoomDetailReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      const data = await api.getRoomReport(id!);
      setReport(data);
    } catch (error) {
      navigate('/dashboard/reports');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!report) return null;

  const { room, quiz, players, questionStats } = report;
  const topPlayers = [...players].sort((a, b) => b.score - a.score).slice(0, 10);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <Button
        variant="ghost"
        onClick={() => navigate('/dashboard/reports')}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar aos relatórios
      </Button>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-2xl">{quiz.title}</CardTitle>
          <CardDescription>
            Sala realizada em {new Date(room.createdAt).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-xl bg-primary/10">
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-3xl font-bold font-heading">{players.length}</p>
              <p className="text-sm text-muted-foreground">Participantes</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-accent/10">
              <CheckCircle className="h-8 w-8 text-accent mx-auto mb-2" />
              <p className="text-3xl font-bold font-heading">
                {Math.round(
                  (players.reduce((acc, p) => acc + p.correctAnswers, 0) /
                    (players.length * quiz.questions.length)) *
                    100
                ) || 0}%
              </p>
              <p className="text-sm text-muted-foreground">Taxa de acerto</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-secondary/10">
              <Clock className="h-8 w-8 text-secondary mx-auto mb-2" />
              <p className="text-3xl font-bold font-heading">
                {Math.round(
                  players.reduce((acc, p) => acc + p.averageResponseTime, 0) /
                    players.length
                ) || 0}s
              </p>
              <p className="text-sm text-muted-foreground">Tempo médio</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <Trophy className="h-5 w-5 text-warning" />
            Ranking Final
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topPlayers.map((player, index) => (
              <div
                key={player.id}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl',
                  index === 0 && 'rank-card-gold',
                  index === 1 && 'rank-card-silver',
                  index === 2 && 'rank-card-bronze',
                  index > 2 && 'bg-muted/50'
                )}
              >
                <div className="w-10 text-center">
                  {index === 0 && <Crown className="h-6 w-6 text-warning mx-auto" />}
                  {index === 1 && <Medal className="h-6 w-6 text-muted-foreground mx-auto" />}
                  {index === 2 && <Award className="h-6 w-6 text-orange-600 mx-auto" />}
                  {index > 2 && <span className="font-bold">{index + 1}º</span>}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{player.nickname}</p>
                  <p className="text-sm text-muted-foreground">
                    {player.correctAnswers}/{player.totalAnswers} corretas
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-primary">{player.score} pts</p>
                  <p className="text-sm text-muted-foreground">
                    {player.averageResponseTime.toFixed(1)}s média
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Question Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Desempenho por Pergunta</CardTitle>
          <CardDescription>Veja como cada pergunta foi respondida</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {questionStats.map((stat, index) => (
            <div key={stat.questionId} className="p-4 rounded-xl bg-muted/50">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    Pergunta {index + 1}
                  </span>
                  <p className="font-medium">{stat.questionText}</p>
                </div>
                <div className="flex items-center gap-2">
                  {stat.correctPercentage >= 70 ? (
                    <CheckCircle className="h-5 w-5 text-accent" />
                  ) : stat.correctPercentage >= 40 ? (
                    <CheckCircle className="h-5 w-5 text-warning" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                  <span className="font-bold">{stat.correctPercentage}%</span>
                </div>
              </div>
              <Progress value={stat.correctPercentage} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                Tempo médio: {stat.averageResponseTime.toFixed(1)}s
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
