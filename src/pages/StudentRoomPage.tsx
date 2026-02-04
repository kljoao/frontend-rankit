import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoomStore, useWebSocket } from '@/stores/roomStore';
import { api } from '@/services/api';
import { RankItLogo } from '@/components/RankItLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Trophy,
  Check,
  X,
  Clock,
  Crown,
  Medal,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StudentRoomPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { connect, disconnect } = useWebSocket();

  const [nickname, setNickname] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const {
    room,
    currentQuestion,
    questionIndex,
    totalQuestions,
    leaderboard,
    correctOptionId,
    playerAnswer,
    isConnected,
    submitAnswer,
  } = useRoomStore();

  useEffect(() => {
    // Validate room code on mount
    const validateRoom = async () => {
      try {
        const roomData = await api.getRoomByCode(roomCode!);
        setRoomId(roomData.id);
      } catch (error) {
        toast({
          title: 'Sala não encontrada',
          description: 'Verifique o código e tente novamente.',
          variant: 'destructive',
        });
        navigate('/');
      }
    };

    if (roomCode) {
      validateRoom();
    }

    return () => disconnect();
  }, [roomCode]);

  useEffect(() => {
    if (room?.status === 'OPEN' && currentQuestion) {
      setTimeLeft(currentQuestion.timeLimit);
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [room?.status, currentQuestion?.id]);

  const handleJoin = () => {
    if (!nickname.trim()) {
      toast({
        title: 'Digite seu apelido',
        variant: 'destructive',
      });
      return;
    }

    if (nickname.length > 20) {
      toast({
        title: 'Apelido muito longo',
        description: 'Máximo de 20 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    if (roomId) {
      setIsJoining(true);
      connect(roomId, 'player', nickname);
      setHasJoined(true);
      setIsJoining(false);
    }
  };

  const handleSelectOption = (optionId: string) => {
    if (room?.status === 'OPEN' && !playerAnswer) {
      submitAnswer(optionId);
    }
  };

  const optionColors = [
    'game-option-a',
    'game-option-b',
    'game-option-c',
    'game-option-d',
  ];

  const optionLabels = ['A', 'B', 'C', 'D'];

  // Entry Screen
  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <RankItLogo className="h-10" />
            </div>
            <CardTitle className="font-heading text-2xl">Entrar na Sala</CardTitle>
            <CardDescription>
              Código: <span className="font-bold text-foreground">{roomCode}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Input
                  placeholder="Digite seu apelido"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                  maxLength={20}
                  className="h-14 text-lg text-center"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground text-right mt-1">
                  {nickname.length}/20
                </p>
              </div>
              <Button
                onClick={handleJoin}
                disabled={isJoining}
                className="w-full h-14 text-lg btn-gradient-primary"
              >
                {isJoining ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Entrar!'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Connecting
  if (!isConnected || !room) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center">
        <div className="text-white text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-xl">Entrando na sala...</p>
        </div>
      </div>
    );
  }

  // Lobby - Waiting
  if (room.status === 'LOBBY') {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <div className="text-white text-center">
          <div className="animate-float">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="h-10 w-10" />
            </div>
          </div>
          <h1 className="text-3xl font-heading font-bold mb-2">
            Você está dentro! 🎮
          </h1>
          <p className="text-xl text-white/80 mb-4">{nickname}</p>
          <p className="text-white/60">Aguardando o professor iniciar...</p>
          <div className="mt-8 animate-pulse">
            <div className="flex justify-center gap-1">
              <div className="w-3 h-3 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-3 h-3 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-3 h-3 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Question Open
  if (room.status === 'OPEN' && currentQuestion) {
    return (
      <div className="min-h-screen bg-background p-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold">
            {questionIndex + 1}/{totalQuestions}
          </span>
          <div className={cn(
            'flex items-center gap-2 px-3 py-1 rounded-full font-bold',
            timeLeft <= 5 ? 'bg-destructive text-white animate-pulse' : 'bg-muted'
          )}>
            <Clock className="h-4 w-4" />
            {timeLeft}s
          </div>
        </div>

        {/* Question */}
        <Card className="mb-4">
          <CardContent className="pt-6">
            <p className="text-lg font-medium text-center">
              {currentQuestion.text}
            </p>
          </CardContent>
        </Card>

        {/* Options */}
        <div className="flex-1 grid grid-cols-1 gap-3">
          {currentQuestion.options?.map((option, index) => (
            <button
              key={option.id}
              onClick={() => handleSelectOption(option.id)}
              disabled={!!playerAnswer}
              className={cn(
                'game-option',
                optionColors[index],
                playerAnswer === option.id && 'ring-4 ring-white scale-105',
                playerAnswer && playerAnswer !== option.id && 'opacity-50'
              )}
            >
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-xl font-bold">
                {optionLabels[index]}
              </div>
              <span className="flex-1 text-left">{option.text}</span>
              {playerAnswer === option.id && (
                <Check className="h-6 w-6" />
              )}
            </button>
          ))}
        </div>

        {playerAnswer && (
          <div className="mt-4 text-center text-muted-foreground">
            Resposta enviada! Aguardando resultado...
          </div>
        )}
      </div>
    );
  }

  // Revealed
  if (room.status === 'REVEALED' && currentQuestion) {
    const isCorrect = playerAnswer === correctOptionId;
    const playerEntry = leaderboard.find(e => e.nickname === nickname);

    return (
      <div className={cn(
        'min-h-screen flex flex-col items-center justify-center p-4 transition-colors',
        isCorrect ? 'bg-accent' : 'bg-destructive'
      )}>
        <div className="text-white text-center animate-bounce-in">
          {isCorrect ? (
            <>
              <Check className="h-24 w-24 mx-auto mb-4" />
              <h1 className="text-4xl font-heading font-bold mb-2">
                Correto! 🎉
              </h1>
              <p className="text-2xl">+10 pontos</p>
            </>
          ) : (
            <>
              <X className="h-24 w-24 mx-auto mb-4" />
              <h1 className="text-4xl font-heading font-bold mb-2">
                Errou! 😅
              </h1>
              <p className="text-xl text-white/80">
                A resposta era: {currentQuestion.options?.find(o => o.id === correctOptionId)?.text}
              </p>
            </>
          )}

          {playerEntry && (
            <div className="mt-8 bg-white/20 rounded-2xl p-6">
              <p className="text-lg mb-2">Sua posição</p>
              <p className="text-5xl font-heading font-bold">
                {playerEntry.position}º
              </p>
              <p className="mt-2">{playerEntry.score} pontos</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Finished
  if (room.status === 'FINISHED') {
    const playerEntry = leaderboard.find(e => e.nickname === nickname);
    const position = playerEntry?.position || leaderboard.length;

    return (
      <div className="min-h-screen bg-gradient-hero text-white p-4 flex flex-col items-center justify-center">
        <div className="text-center animate-bounce-in">
          {position <= 3 ? (
            <div className="mb-6">
              {position === 1 && <Crown className="h-20 w-20 text-warning mx-auto" />}
              {position === 2 && <Medal className="h-20 w-20 text-white/80 mx-auto" />}
              {position === 3 && <Award className="h-20 w-20 text-orange-400 mx-auto" />}
            </div>
          ) : (
            <Trophy className="h-16 w-16 mx-auto mb-6 text-white/60" />
          )}

          <h1 className="text-4xl font-heading font-bold mb-2">
            {position <= 3 ? 'Parabéns! 🏆' : 'Fim de Jogo!'}
          </h1>

          <p className="text-6xl font-heading font-bold my-6">
            {position}º lugar
          </p>

          <p className="text-2xl mb-2">{nickname}</p>
          <p className="text-xl text-white/80">
            {playerEntry?.score || 0} pontos
          </p>
        </div>

        <div className="mt-12">
          <RankItLogo className="h-8" variant="white" />
        </div>
      </div>
    );
  }

  return null;
}
