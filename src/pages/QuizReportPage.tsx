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
  const [quiz, setQuiz] = useState<any | null>(null); // Using any or importing Quiz type would be better, but assuming it matches getQuiz response
  const [summary, setSummary] = useState<QuizSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [quizData, summaryData] = await Promise.all([
        api.getQuiz(id!),
        api.getQuizSummary(id!)
      ]);
      setQuiz(quizData);
      setSummary(summaryData);
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
      </div>
    );
  }

  if (!summary || !quiz) return null;

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
            Estatísticas consolidadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 rounded-xl bg-primary/10">
              <BarChart3 className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-3xl font-bold font-heading">{summary.totalRooms}</p>
              <p className="text-sm text-muted-foreground">Sessões realizadas</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-secondary/10">
              <Users className="h-8 w-8 text-secondary mx-auto mb-2" />
              <p className="text-3xl font-bold font-heading">{summary.avgParticipants.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">Média de participantes por sala</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Mais métricas detalhadas estarão disponíveis em breve.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
