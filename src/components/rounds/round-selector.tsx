'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Users, CheckCircle2, Clock, Trophy, Wallet } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'sonner';
import { payRoundEntryFee } from '@/lib/solana/program';

interface Competition {
  id: string;
  name: string;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'PENDING';
  startDate: string;
  endDate: string;
  participantCount?: number;
  isEnrolled?: boolean;
}

interface RoundSelectorProps {
  leagueId: string;
  onEnrollmentChange?: () => void;
}

export function RoundSelector({ leagueId, onEnrollmentChange }: RoundSelectorProps) {
  const { user, isAuthenticated } = useAuth();
  const wallet = useWallet();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);

  // Fetch competitions and enrollment status
  const fetchCompetitions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/competitions?leagueId=${leagueId}`);

      if (!response.ok) {
        throw new Error('Erro ao buscar competições');
      }

      const data = await response.json();

      // Fetch participant count and enrollment status for each competition
      const competitionsWithData = await Promise.all(
        data.competitions.map(async (comp: Competition) => {
          try {
            const teamsResponse = await fetch(`/api/teams?competitionId=${comp.id}`);
            const teamsData = await teamsResponse.json();

            return {
              ...comp,
              participantCount: teamsData.teams?.length || 0,
              isEnrolled: teamsData.teams?.some((team: any) =>
                team.user?.email === user?.email
              ) || false
            };
          } catch (error) {
            console.error(`Erro ao buscar dados da competição ${comp.id}:`, error);
            return {
              ...comp,
              participantCount: 0,
              isEnrolled: false
            };
          }
        })
      );

      setCompetitions(competitionsWithData);
    } catch (error) {
      console.error('Erro ao carregar rodadas:', error);
      toast.error('Erro ao carregar rodadas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user && leagueId) {
      fetchCompetitions();
    }
  }, [isAuthenticated, user, leagueId]);

  const handleEnroll = async (competitionId: string) => {
    if (!isAuthenticated || !user) {
      toast.error('Você precisa estar logado');
      return;
    }

    if (!wallet.connected || !wallet.publicKey) {
      toast.error('Conecte sua carteira Solana para pagar a taxa de inscrição');
      return;
    }

    try {
      setEnrolling(competitionId);

      // Step 1: Pay the entry fee (0.025 SOL) via smart contract
      toast.info('Processando pagamento de 0.025 SOL...');

      const paymentTxHash = await payRoundEntryFee(wallet, undefined, 'medium');

      toast.success('Pagamento confirmado! Finalizando inscrição...');

      // Step 2: Register enrollment in database with payment proof
      const response = await fetch('/api/user/enroll-round', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitionId,
          paymentTxHash
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao registrar inscrição');
      }

      toast.success('Inscrição realizada com sucesso!');
      await fetchCompetitions();
      if (onEnrollmentChange) {
        onEnrollmentChange();
      }
    } catch (error: any) {
      console.error('Erro ao inscrever:', error);

      // User-friendly error messages
      if (error.message?.includes('Carteira não conectada')) {
        toast.error('Conecte sua carteira para continuar');
      } else if (error.message?.includes('Saldo insuficiente')) {
        toast.error('Saldo insuficiente. Você precisa de pelo menos 0.025 SOL');
      } else if (error.message?.includes('cancelada pelo usuário')) {
        toast.error('Transação cancelada');
      } else {
        toast.error(error.message || 'Erro ao inscrever. Tente novamente');
      }
    } finally {
      setEnrolling(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <Clock className="w-3 h-3 mr-1" />
          Em Breve
        </Badge>;
      case 'ACTIVE':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <Trophy className="w-3 h-3 mr-1" />
          Em Andamento
        </Badge>;
      case 'COMPLETED':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Concluída
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short'
    });
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Carregando rodadas...</p>
      </div>
    );
  }

  if (competitions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Nenhuma rodada disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Rodadas Disponíveis</h3>
        <p className="text-sm text-muted-foreground">
          Taxa de inscrição: <span className="font-semibold text-primary">0.025 SOL</span> por rodada
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {competitions.map((comp) => (
          <Card
            key={comp.id}
            className={`transition-all hover:shadow-md ${
              comp.isEnrolled ? 'border-green-500 border-2 bg-green-50/50' : ''
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">
                  {comp.name || 'Rodada'}
                </CardTitle>
                {getStatusBadge(comp.status)}
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Enrollment Status */}
              {comp.isEnrolled && (
                <div className="flex items-center gap-2 text-green-700 bg-green-100 px-3 py-2 rounded-md">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Você está inscrito</span>
                </div>
              )}

              {/* Participant Count */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{comp.participantCount || 0} participantes</span>
              </div>

              {/* Dates */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>
                  {formatDate(comp.startDate)} - {formatDate(comp.endDate)}
                </span>
              </div>

              {/* Enroll Button */}
              {comp.status === 'UPCOMING' && !comp.isEnrolled && (
                <Button
                  onClick={() => handleEnroll(comp.id)}
                  disabled={enrolling === comp.id}
                  className="w-full mt-2"
                  size="sm"
                >
                  {enrolling === comp.id ? (
                    'Inscrevendo...'
                  ) : (
                    <>
                      <Wallet className="w-4 h-4 mr-2" />
                      Pagar e Inscrever (0.025 SOL)
                    </>
                  )}
                </Button>
              )}

              {/* Info for active/completed rounds */}
              {comp.status === 'ACTIVE' && !comp.isEnrolled && (
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Rodada em andamento
                </p>
              )}

              {comp.status === 'COMPLETED' && (
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Rodada finalizada
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
