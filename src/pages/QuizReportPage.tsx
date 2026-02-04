import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import type { QuizSummary } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Users,
  Trophy,
  BarChart3,
  CheckCircle,
  XCircle,
  TrendingUp,
} from 'lucide-react';

export default function QuizReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<QuizSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) fetchSummary();
  }, [id]);

  const fetchSummary = async () => {
    try {
      const data = await api.getQuizSummary(id!);
      setSummary(data);
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

  if (!summary) return null;

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
          <CardTitle className="font-heading text-2xl">{summary.title}</CardTitle>
          <CardDescription>
            Estatísticas consolidadas de todas as sessões
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-xl bg-primary/10">
              <BarChart3 className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-3xl font-bold font-heading">{summary.totalSessions}</p>
              <p className="text-sm text-muted-foreground">Sessões realizadas</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-secondary/10">
              <Users className="h-8 w-8 text-secondary mx-auto mb-2" />
              <p className="text-3xl font-bold font-heading">{summary.totalPlayers}</p>
              <p className="text-sm text-muted-foreground">Total de participantes</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-accent/10">
              <Trophy className="h-8 w-8 text-accent mx-auto mb-2" />
              <p className="text-3xl font-bold font-heading">
                {summary.averageScore.toFixed(0)}
              </p>
              <p className="text-sm text-muted-foreground">Pontuação média</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Desempenho por Pergunta
          </CardTitle>
          <CardDescription>
            Média de todas as sessões realizadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {summary.questionPerformance.map((stat, index) => (
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
                  <span className="font-bold">{stat.correctPercentage.toFixed(0)}%</span>
                </div>
              </div>
              <Progress value={stat.correctPercentage} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                Tempo médio de resposta: {stat.averageResponseTime.toFixed(1)}s
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-3">💡 Dicas de melhoria</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {summary.questionPerformance.some((q) => q.correctPercentage < 40) && (
              <li>
                • Algumas perguntas têm taxa de acerto baixa. Considere revisar o
                conteúdo ou simplificar a redação.
              </li>
            )}
            {summary.questionPerformance.some((q) => q.averageResponseTime > 45) && (
              <li>
                • Perguntas com tempo de resposta alto podem precisar de textos mais
                curtos.
              </li>
            )}
            {summary.averageScore < 50 && (
              <li>
                • A pontuação média está baixa. Experimente criar uma revisão do
                conteúdo antes do quiz.
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
