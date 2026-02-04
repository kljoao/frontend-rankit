import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '@/services/api';
import { useRoomStore, useWebSocket } from '@/stores/roomStore';
import type { Quiz, Room } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Play,
  Users,
  Loader2,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PlayQuizPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { connect } = useWebSocket();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [copied, setCopied] = useState(false);

  const roomState = useRoomStore();

  useEffect(() => {
    if (quizId) fetchQuiz();
  }, [quizId]);

  const fetchQuiz = async () => {
    try {
      const data = await api.getQuiz(quizId!);
      setQuiz(data);
      
      if (!data.isPublished || !data.questions?.length) {
        toast({
          title: 'Quiz não disponível',
          description: 'O quiz precisa estar publicado e ter perguntas.',
          variant: 'destructive',
        });
        navigate('/dashboard/quizzes');
      }
    } catch (error) {
      toast({
        title: 'Erro ao carregar quiz',
        variant: 'destructive',
      });
      navigate('/dashboard/quizzes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    setIsCreatingRoom(true);
    try {
      const newRoom = await api.createRoom({ quizId: quizId! });
      setRoom(newRoom);
      connect(newRoom.id, 'teacher');
      toast({
        title: 'Sala criada! 🎮',
        description: 'Compartilhe o QR Code com seus alunos.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao criar sala',
        description: error.response?.data?.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const copyRoomCode = () => {
    if (room?.code) {
      navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: 'Código copiado!' });
    }
  };

  const openProjectorView = () => {
    if (room) {
      window.open(`/room/projector/${room.id}`, '_blank');
    }
  };

  const roomUrl = room ? `${window.location.origin}/room/${room.code}` : '';
  const currentRoom = roomState.room || room;
  const players = currentRoom?.players || [];

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!quiz) return null;

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
        {room && (
          <Button onClick={openProjectorView} variant="outline" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Abrir Projetor
          </Button>
        )}
      </div>

      {/* Quiz Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-heading text-2xl">{quiz.title}</CardTitle>
              <CardDescription>{quiz.questions?.length} perguntas</CardDescription>
            </div>
            <Badge variant="default" className="bg-accent">Publicado</Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Room Section */}
      {!room ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Play className="h-10 w-10 text-white" />
            </div>
            <h2 className="font-heading text-2xl font-bold mb-2">
              Iniciar Sala ao Vivo
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Crie uma sala para que seus alunos possam participar em tempo real.
            </p>
            <Button
              onClick={handleCreateRoom}
              disabled={isCreatingRoom}
              size="lg"
              className="btn-gradient-primary"
            >
              {isCreatingRoom ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Criando sala...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Criar Sala
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* QR Code */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="font-heading">QR Code da Sala</CardTitle>
              <CardDescription>
                Alunos escaneiam para entrar
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="qr-container mb-6">
                <QRCodeSVG
                  value={roomUrl}
                  size={200}
                  level="H"
                  includeMargin
                />
              </div>
              
              <div className="flex items-center gap-2 mb-4">
                <span className="text-3xl font-heading font-bold tracking-wider">
                  {room.code}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyRoomCode}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-accent" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground text-center">
                ou acesse: <span className="font-medium">{roomUrl}</span>
              </p>
            </CardContent>
          </Card>

          {/* Players */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-heading flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Participantes
                </CardTitle>
                <Badge variant="secondary">{players.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {players.length === 0 ? (
                <div className="text-center py-8">
                  <div className="animate-pulse mb-4">
                    <div className="w-12 h-12 bg-muted rounded-full mx-auto flex items-center justify-center">
                      <Users className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    Aguardando alunos entrarem...
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {players.map((player, index) => (
                    <div
                      key={player.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl animate-slide-up',
                        index === 0 ? 'bg-primary/10' : 'bg-muted/50'
                      )}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-sm">
                        {player.nickname.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{player.nickname}</span>
                    </div>
                  ))}
                </div>
              )}

              {players.length > 0 && (
                <Button
                  onClick={openProjectorView}
                  className="w-full mt-4 btn-gradient-success"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Iniciar Game Show
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
