import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trophy, Zap, Users } from 'lucide-react';
import { RankItLogo } from '@/components/RankItLogo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast({
        title: 'Bem-vindo de volta! 🎮',
        description: 'Login realizado com sucesso.',
      });
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Erro ao entrar',
        description: error.response?.data?.message || 'Verifique suas credenciais e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          <div className="animate-float mb-8">
            <RankItLogo className="h-20 w-auto" variant="white" />
          </div>
          <h1 className="font-heading text-4xl font-bold mb-4 text-center">
            Gamifique suas aulas!
          </h1>
          <p className="text-xl text-white/90 text-center mb-12 max-w-md">
            Transforme o aprendizado em uma experiência competitiva e divertida para seus alunos.
          </p>
          
          <div className="grid grid-cols-3 gap-8 mt-8">
            <FeatureCard 
              icon={<Trophy className="h-8 w-8" />}
              title="Rankings"
              description="Motivação através da competição"
            />
            <FeatureCard 
              icon={<Zap className="h-8 w-8" />}
              title="Tempo Real"
              description="Resultados instantâneos"
            />
            <FeatureCard 
              icon={<Users className="h-8 w-8" />}
              title="Multiplayer"
              description="Toda a turma participando"
            />
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-8">
            <RankItLogo className="h-12 w-auto" />
          </div>
          
          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="font-heading text-2xl">Entrar</CardTitle>
              <CardDescription>
                Use seu email e senha para acessar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="professor@escola.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-12"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 btn-gradient-primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    'Entrar'
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground text-center">
                Ainda não tem conta?{' '}
                <Link 
                  to="/register" 
                  className="text-primary font-semibold hover:underline"
                >
                  Cadastre-se grátis
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="bg-white/20 rounded-xl p-4 mb-3 backdrop-blur-sm">
        {icon}
      </div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-white/80">{description}</p>
    </div>
  );
}
