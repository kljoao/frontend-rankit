import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useRoomStore, useWebSocket } from '@/stores/roomStore';
import { RankItLogo } from '@/components/RankItLogo';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Play,
  Users,
  Eye,
  ArrowRight,
  Trophy,
  Check,
  X,
  Crown,
  Medal,
  Award,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProjectorPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { connect, disconnect } = useWebSocket();
  const {
    room,
    currentQuestion,
    questionIndex,
    totalQuestions,
    leaderboard,
    answerDistribution,
    correctOptionId,
    isConnected,
    openQuestion,
    revealAnswer,
    nextQuestion,
    endGame,
  } = useRoomStore();

  const [timeLeft, setTimeLeft] = useState(0);
  const [answersCount, setAnswersCount] = useState(0);

  useEffect(() => {
    if (roomId) {
      connect(roomId, 'teacher');
    }
    return () => disconnect();
  }, [roomId]);

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

  useEffect(() => {
    const total = Object.values(answerDistribution).reduce((a, b) => a + b, 0);
    setAnswersCount(total);
  }, [answerDistribution]);

  const players = room?.players || [];
  const roomUrl = room ? `${window.location.origin}/room/${room.code}` : '';

  const optionColors = [
    'bg-option-a',
    'bg-option-b',
    'bg-option-c',
    'bg-option-d',
  ];

  const optionLabels = ['A', 'B', 'C', 'D'];

  if (!isConnected || !room) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin w-16 h-16 border-4 border-white border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-xl">Conectando à sala...</p>
        </div>
      </div>
    );
  }

  // LOBBY State
  if (room.status === 'LOBBY') {
    return (
      <div className="min-h-screen bg-gradient-hero text-white p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-12">
            <RankItLogo className="h-12" variant="white" />
            <div className="text-right">
              <p className="text-white/70">Código da sala</p>
              <p className="text-4xl font-heading font-bold tracking-widest">
                {room.code}
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* QR Code */}
            <div className="flex flex-col items-center">
              <div className="bg-white p-8 rounded-3xl shadow-2xl animate-float">
                <QRCodeSVG
                  value={roomUrl}
                  size={300}
                  level="H"
                  includeMargin
                />
              </div>
              <p className="mt-6 text-xl text-white/80">
                Escaneie para entrar
              </p>
            </div>

            {/* Players List */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Users className="h-8 w-8" />
                <h2 className="text-3xl font-heading font-bold">
                  {players.length} participantes
                </h2>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-h-96 overflow-y-auto">
                {players.length === 0 ? (
                  <p className="text-center text-white/60 py-8">
                    Aguardando participantes...
                  </p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {players.map((player, index) => (
                      <div
                        key={player.id}
                        className="bg-white/20 rounded-xl p-3 flex items-center gap-3 animate-scale-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center font-bold">
                          {player.nickname.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium truncate">
                          {player.nickname}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {players.length > 0 && (
                <Button
                  onClick={openQuestion}
                  size="lg"
                  className="w-full mt-8 h-16 text-xl font-bold bg-white text-primary hover:bg-white/90"
                >
                  <Play className="h-6 w-6 mr-3" />
                  Começar!
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // OPEN State - Question displayed
  if (room.status === 'OPEN' && currentQuestion) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <span className="text-2xl font-heading font-bold">
                Pergunta {questionIndex + 1}/{totalQuestions}
              </span>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-5 w-5" />
                <span>{answersCount} respostas</span>
              </div>
              <div className={cn(
                'flex items-center gap-2 text-3xl font-bold font-heading',
                timeLeft <= 5 ? 'text-destructive animate-pulse' : 'text-foreground'
              )}>
                <Clock className="h-8 w-8" />
                {timeLeft}s
              </div>
            </div>
          </div>

          {/* Progress */}
          <Progress 
            value={(answersCount / players.length) * 100} 
            className="h-3 mb-8"
          />

          {/* Question */}
          <div className="bg-card rounded-3xl p-8 shadow-lg mb-8">
            <h1 className="text-4xl font-heading font-bold text-center">
              {currentQuestion.text}
            </h1>
          </div>

          {/* Options Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {currentQuestion.options?.map((option, index) => (
              <div
                key={option.id}
                className={cn(
                  'game-option text-xl',
                  index === 0 && 'game-option-a',
                  index === 1 && 'game-option-b',
                  index === 2 && 'game-option-c',
                  index === 3 && 'game-option-d',
                )}
              >
                <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center text-2xl font-bold">
                  {optionLabels[index]}
                </div>
                <span className="flex-1">{option.text}</span>
              </div>
            ))}
          </div>

          {/* Teacher Controls */}
          <div className="fixed bottom-8 right-8">
            <Button
              onClick={revealAnswer}
              size="lg"
              className="h-14 px-8 btn-gradient-primary"
            >
              <Eye className="h-5 w-5 mr-2" />
              Revelar Resposta
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // REVEALED State
  if (room.status === 'REVEALED' && currentQuestion) {
    const correctOption = currentQuestion.options?.find(o => o.id === correctOptionId);
    const totalResponses = Object.values(answerDistribution).reduce((a, b) => a + b, 0);

    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <span className="text-2xl font-heading font-bold">
              Resultado - Pergunta {questionIndex + 1}
            </span>
            <div className="flex items-center gap-2">
              <Check className="h-6 w-6 text-accent" />
              <span className="text-xl font-semibold">
                Resposta correta: {correctOption?.text}
              </span>
            </div>
          </div>

          {/* Options with Results */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {currentQuestion.options?.map((option, index) => {
              const count = answerDistribution[option.id] || 0;
              const percentage = totalResponses > 0 ? (count / totalResponses) * 100 : 0;
              const isCorrect = option.id === correctOptionId;

              return (
                <div
                  key={option.id}
                  className={cn(
                    'relative overflow-hidden rounded-xl p-6 transition-all',
                    isCorrect
                      ? 'bg-accent text-white ring-4 ring-accent/50'
                      : 'bg-muted'
                  )}
                >
                  <div
                    className={cn(
                      'absolute inset-0 transition-all',
                      isCorrect ? 'bg-accent/20' : 'bg-muted-foreground/10'
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold',
                        isCorrect ? 'bg-white/20' : optionColors[index],
                        !isCorrect && 'text-white'
                      )}>
                        {optionLabels[index]}
                      </div>
                      <span className={cn(
                        'font-medium text-lg',
                        isCorrect ? 'text-white' : 'text-foreground'
                      )}>
                        {option.text}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        'text-2xl font-bold',
                        isCorrect ? 'text-white' : 'text-foreground'
                      )}>
                        {percentage.toFixed(0)}%
                      </span>
                      {isCorrect && <Check className="h-6 w-6" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Top 5 Leaderboard */}
          <div className="bg-card rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-heading font-bold mb-4 flex items-center gap-2">
              <Trophy className="h-6 w-6 text-warning" />
              Ranking
            </h3>
            <div className="space-y-3">
              {leaderboard.slice(0, 5).map((entry, index) => (
                <div
                  key={entry.playerId}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-xl',
                    index === 0 && 'rank-card-gold',
                    index === 1 && 'rank-card-silver',
                    index === 2 && 'rank-card-bronze',
                    index > 2 && 'bg-muted/50'
                  )}
                >
                  <div className="w-10 text-center font-bold text-xl">
                    {index === 0 && <Crown className="h-6 w-6 text-warning mx-auto" />}
                    {index === 1 && <Medal className="h-6 w-6 text-muted-foreground mx-auto" />}
                    {index === 2 && <Award className="h-6 w-6 text-orange-600 mx-auto" />}
                    {index > 2 && <span>{index + 1}º</span>}
                  </div>
                  <span className="flex-1 font-medium text-lg">{entry.nickname}</span>
                  <span className="text-2xl font-bold text-primary">{entry.score} pts</span>
                </div>
              ))}
            </div>
          </div>

          {/* Teacher Controls */}
          <div className="fixed bottom-8 right-8 flex gap-4">
            {questionIndex < totalQuestions - 1 ? (
              <Button
                onClick={nextQuestion}
                size="lg"
                className="h-14 px-8 btn-gradient-primary"
              >
                Próxima Pergunta
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={endGame}
                size="lg"
                className="h-14 px-8 btn-gradient-success"
              >
                <Trophy className="h-5 w-5 mr-2" />
                Finalizar
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // FINISHED State
  if (room.status === 'FINISHED') {
    return (
      <div className="min-h-screen bg-gradient-hero text-white p-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-bounce-in mb-8">
            <Trophy className="h-24 w-24 text-warning mx-auto mb-4" />
            <h1 className="text-5xl font-heading font-bold mb-2">
              Fim de Jogo! 🎉
            </h1>
            <p className="text-xl text-white/80">
              Confira o ranking final
            </p>
          </div>

          <div className="space-y-4 mt-12">
            {leaderboard.slice(0, 10).map((entry, index) => (
              <div
                key={entry.playerId}
                className={cn(
                  'flex items-center gap-4 p-6 rounded-2xl backdrop-blur-sm animate-slide-up',
                  index === 0 && 'bg-warning/30 text-2xl',
                  index === 1 && 'bg-white/20 text-xl',
                  index === 2 && 'bg-orange-500/20 text-xl',
                  index > 2 && 'bg-white/10'
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 text-center font-bold">
                  {index === 0 && <Crown className="h-8 w-8 text-warning mx-auto" />}
                  {index === 1 && <Medal className="h-7 w-7 text-white/80 mx-auto" />}
                  {index === 2 && <Award className="h-7 w-7 text-orange-400 mx-auto" />}
                  {index > 2 && <span>{index + 1}º</span>}
                </div>
                <span className="flex-1 font-medium">{entry.nickname}</span>
                <span className="font-bold">{entry.score} pontos</span>
              </div>
            ))}
          </div>

          <div className="mt-12">
            <RankItLogo className="h-8 mx-auto" variant="white" />
          </div>
        </div>
      </div>
    );
  }

  return null;
}
