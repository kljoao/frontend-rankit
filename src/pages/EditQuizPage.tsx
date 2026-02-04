import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import type { Quiz, Question, CreateQuestionRequest, CreateOptionRequest } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  ArrowLeft,
  Plus,
  Save,
  Loader2,
  Trash2,
  GripVertical,
  Check,
  X,
  Clock,
  Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EditQuizPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Question dialog state
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [questionTimeLimit, setQuestionTimeLimit] = useState(30);
  const [options, setOptions] = useState<CreateOptionRequest[]>([
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]);
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);

  // Delete dialog
  const [deleteQuestion, setDeleteQuestion] = useState<Question | null>(null);

  useEffect(() => {
    if (id) fetchQuiz();
  }, [id]);

  const fetchQuiz = async () => {
    try {
      const data = await api.getQuiz(id!);
      setQuiz(data);
      setTitle(data.title);
      setDescription(data.description || '');
    } catch (error) {
      toast({
        title: 'Erro ao carregar quiz',
        description: 'Quiz não encontrado.',
        variant: 'destructive',
      });
      navigate('/dashboard/quizzes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDetails = async () => {
    if (!title.trim()) {
      toast({
        title: 'Título obrigatório',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const updated = await api.updateQuiz(id!, { title, description });
      setQuiz(updated);
      toast({ title: 'Quiz salvo!' });
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!quiz?.questions?.length) {
      toast({
        title: 'Adicione perguntas',
        description: 'O quiz precisa ter pelo menos uma pergunta para ser publicado.',
        variant: 'destructive',
      });
      return;
    }

    setIsPublishing(true);
    try {
      const updated = await api.publishQuiz(id!);
      setQuiz(updated);
      toast({
        title: 'Quiz publicado! 🎉',
        description: 'Agora você pode iniciar salas ao vivo.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao publicar',
        variant: 'destructive',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const openAddQuestion = () => {
    setEditingQuestion(null);
    setQuestionText('');
    setQuestionTimeLimit(30);
    setOptions([
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ]);
    setQuestionDialogOpen(true);
  };

  const openEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setQuestionText(question.text);
    setQuestionTimeLimit(question.timeLimit);
    setOptions(
      question.options.map((o) => ({
        text: o.text,
        isCorrect: o.isCorrect,
      }))
    );
    setQuestionDialogOpen(true);
  };

  const handleSaveQuestion = async () => {
    if (!questionText.trim()) {
      toast({
        title: 'Pergunta obrigatória',
        variant: 'destructive',
      });
      return;
    }

    const filledOptions = options.filter((o) => o.text.trim());
    if (filledOptions.length < 2) {
      toast({
        title: 'Mínimo 2 alternativas',
        description: 'Preencha pelo menos 2 alternativas.',
        variant: 'destructive',
      });
      return;
    }

    const hasCorrect = filledOptions.some((o) => o.isCorrect);
    if (!hasCorrect) {
      toast({
        title: 'Marque a correta',
        description: 'Selecione qual alternativa está correta.',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingQuestion(true);
    try {
      const questionData: CreateQuestionRequest = {
        text: questionText,
        timeLimit: questionTimeLimit,
        options: filledOptions,
      };

      if (editingQuestion) {
        await api.updateQuestion(id!, editingQuestion.id, questionData);
        toast({ title: 'Pergunta atualizada!' });
      } else {
        await api.addQuestion(id!, questionData);
        toast({ title: 'Pergunta adicionada!' });
      }

      await fetchQuiz();
      setQuestionDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Erro ao salvar pergunta',
        variant: 'destructive',
      });
    } finally {
      setIsSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!deleteQuestion) return;

    try {
      await api.deleteQuestion(id!, deleteQuestion.id);
      await fetchQuiz();
      toast({ title: 'Pergunta excluída!' });
    } catch (error) {
      toast({
        title: 'Erro ao excluir',
        variant: 'destructive',
      });
    } finally {
      setDeleteQuestion(null);
    }
  };

  const setCorrectOption = (index: number) => {
    setOptions(
      options.map((o, i) => ({
        ...o,
        isCorrect: i === index,
      }))
    );
  };

  const updateOptionText = (index: number, text: string) => {
    setOptions(
      options.map((o, i) => (i === index ? { ...o, text } : o))
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!quiz) return null;

  const optionColors = [
    'bg-option-a',
    'bg-option-b',
    'bg-option-c',
    'bg-option-d',
  ];

  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard/quizzes')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div className="flex items-center gap-3">
          <Badge variant={quiz.isPublished ? 'default' : 'secondary'}>
            {quiz.isPublished ? 'Publicado' : 'Rascunho'}
          </Badge>
          {quiz.isPublished && quiz.questions?.length > 0 && (
            <Button
              onClick={() => navigate(`/dashboard/play/${quiz.id}`)}
              className="btn-gradient-success"
            >
              <Play className="h-4 w-4 mr-2" />
              Iniciar Sala
            </Button>
          )}
        </div>
      </div>

      {/* Quiz Details */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Detalhes do Quiz</CardTitle>
          <CardDescription>Edite as informações básicas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título do quiz"
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição opcional"
              rows={3}
            />
          </div>
          <div className="flex gap-4">
            <Button
              onClick={handleSaveDetails}
              disabled={isSaving}
              variant="outline"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Alterações
            </Button>
            {!quiz.isPublished && (
              <Button
                onClick={handlePublish}
                disabled={isPublishing || !quiz.questions?.length}
                className="btn-gradient-primary"
              >
                {isPublishing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Publicar Quiz
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-heading">Perguntas</CardTitle>
            <CardDescription>
              {quiz.questions?.length || 0} perguntas adicionadas
            </CardDescription>
          </div>
          <Button onClick={openAddQuestion} className="btn-gradient-primary">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </CardHeader>
        <CardContent>
          {!quiz.questions?.length ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-4">
                Nenhuma pergunta adicionada ainda
              </p>
              <Button onClick={openAddQuestion} variant="outline">
                Adicionar primeira pergunta
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {quiz.questions
                .sort((a, b) => a.order - b.order)
                .map((question, index) => (
                  <div
                    key={question.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GripVertical className="h-4 w-4" />
                      <span className="font-semibold">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{question.text}</p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {question.timeLimit}s
                        </span>
                        <span>{question.options?.length || 0} alternativas</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditQuestion(question)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteQuestion(question)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Question Dialog */}
      <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editingQuestion ? 'Editar Pergunta' : 'Nova Pergunta'}
            </DialogTitle>
            <DialogDescription>
              Preencha a pergunta e as alternativas
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Pergunta *</Label>
              <Textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Digite a pergunta..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Tempo limite (segundos)</Label>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  min={5}
                  max={120}
                  value={questionTimeLimit}
                  onChange={(e) => setQuestionTimeLimit(Number(e.target.value))}
                  className="w-24"
                />
                <div className="flex gap-2">
                  {[15, 30, 45, 60].map((t) => (
                    <Button
                      key={t}
                      type="button"
                      variant={questionTimeLimit === t ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setQuestionTimeLimit(t)}
                    >
                      {t}s
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Alternativas (clique para marcar a correta)</Label>
              {options.map((option, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer',
                    option.isCorrect
                      ? 'border-accent bg-accent/10'
                      : 'border-transparent bg-muted/50 hover:border-muted-foreground/20'
                  )}
                  onClick={() => setCorrectOption(index)}
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold',
                      optionColors[index]
                    )}
                  >
                    {optionLabels[index]}
                  </div>
                  <Input
                    value={option.text}
                    onChange={(e) => updateOptionText(index, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder={`Alternativa ${optionLabels[index]}`}
                    className="flex-1"
                  />
                  {option.isCorrect && (
                    <Check className="h-5 w-5 text-accent flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setQuestionDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveQuestion}
              disabled={isSavingQuestion}
              className="btn-gradient-primary"
            >
              {isSavingQuestion ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Pergunta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteQuestion} onOpenChange={() => setDeleteQuestion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pergunta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteQuestion}
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
