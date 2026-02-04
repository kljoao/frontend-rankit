import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';

export default function NewQuizPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: 'Título obrigatório',
        description: 'Digite um título para o quiz.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const quiz = await api.createQuiz({ title, description });
      toast({
        title: 'Quiz criado! 🎉',
        description: 'Agora adicione perguntas ao seu quiz.',
      });
      navigate(`/dashboard/quizzes/${quiz.id}/edit`);
    } catch (error: any) {
      toast({
        title: 'Erro ao criar quiz',
        description: error.response?.data?.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate('/dashboard/quizzes')}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para quizzes
      </Button>

      {/* Form Card */}
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="font-heading text-2xl">Criar Novo Quiz</CardTitle>
          <CardDescription>
            Dê um nome ao seu quiz e adicione uma descrição opcional
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Título do Quiz *</Label>
              <Input
                id="title"
                placeholder="Ex: Revisão de História - Cap. 5"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isLoading}
                className="h-12"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground text-right">
                {title.length}/100 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Descreva o conteúdo do quiz para organização..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {description.length}/500 caracteres
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard/quizzes')}
                disabled={isLoading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 btn-gradient-primary"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Quiz'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-3">💡 Dicas para um bom quiz:</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Use títulos claros que identifiquem o conteúdo</li>
            <li>• Adicione 5-15 perguntas para manter o engajamento</li>
            <li>• Varie a dificuldade das perguntas</li>
            <li>• Use o tempo limite para criar urgência</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
