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

  const { quizTitleSnapshot, finishedAt, players, questions } = report;
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
          <CardTitle className="font-heading text-2xl">{quizTitleSnapshot}</CardTitle>
          <CardDescription>
            Sala realizada em {new Date(finishedAt).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 rounded-xl bg-primary/10">
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-3xl font-bold font-heading">{players.length}</p>
              <p className="text-sm text-muted-foreground">Participantes</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-accent/10">
              <CheckCircle className="h-8 w-8 text-accent mx-auto mb-2" />
              <p className="text-3xl font-bold font-heading">
                {Math.round(
                  (players.reduce((acc, p) => acc + p.correctCount, 0) /
                    (players.reduce((acc, p) => acc + p.correctCount + p.wrongCount, 0) || 1)) *
                  100
                )}%
              </p>
              <p className="text-sm text-muted-foreground">Taxa de acerto geral</p>
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
                key={index}
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
                    {player.correctCount}/{player.correctCount + player.wrongCount} corretas
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-primary">{player.score} pts</p>
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
          {questions.map((stat, index) => {
            const totalResponses = stat.countA + stat.countB + stat.countC + stat.countD;
            const correctPercentage = totalResponses > 0 ? Math.round((stat.correctCount / totalResponses) * 100) : 0;

            return (
              <div key={index} className="p-4 rounded-xl bg-muted/50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <span className="text-sm font-medium text-muted-foreground">
                      Pergunta {stat.questionIndex + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {correctPercentage >= 70 ? (
                      <CheckCircle className="h-5 w-5 text-accent" />
                    ) : correctPercentage >= 40 ? (
                      <CheckCircle className="h-5 w-5 text-warning" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                    <span className="font-bold">{correctPercentage}%</span>
                  </div>
                </div>
                <Progress value={correctPercentage} className="h-2" />
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  );
}
