'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SoccerField } from '@/components/field/soccer-field';
import { TokenMarket } from '@/components/market/token-market';
import { type TokenMarketData } from '@/data/expanded-tokens';
import { type Player } from '@/types/teams';
import { validateTokens } from '@/lib/valid-tokens';
import { LocalizedLink } from '@/components/ui/localized-link';

import { 
  Users, 
  Trophy, 
  Target, 
  Settings,
  Save,
  RotateCcw,
  Zap,
  Crown,
  AlertCircle,
  CheckCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';

// Mock data para ligas
const mockLeagues = [
  { id: 'main', name: 'Time Principal', type: 'main' },
  { id: '1', name: 'Liga Principal', type: 'league' },
  { id: '2', name: 'Liga de Ações Tokenizadas', type: 'xstocks' },
  { id: '3', name: 'Liga DeFi', type: 'defi' },
  { id: '4', name: 'Liga Meme', type: 'meme' },
  { id: '5', name: 'Liga Gaming', type: 'gaming' }
];

export function TeamsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { publicKey, connected } = useWallet();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  console.log('DEBUG TeamsContent: Estado inicial', {
    connected,
    publicKey: publicKey?.toString(),
    user,
    userExists: !!user,
    userName: user?.name,
    mounted
  });
  
  // Inicializar selectedLeagueId com o valor da URL ou 'main' como fallback
  const getInitialLeagueId = () => {
    if (searchParams) {
      const urlLeagueId = searchParams.get('league');
      if (urlLeagueId && mockLeagues.find(league => league.id === urlLeagueId)) {
        return urlLeagueId;
      }
    }
    return 'main';
  };
  
  // Estados principais
  const [formation, setFormation] = useState<'433' | '442' | '352'>('433');
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [selectedToken, setSelectedToken] = useState<TokenMarketData | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>(getInitialLeagueId());
  const [isEditingMainTeam, setIsEditingMainTeam] = useState(getInitialLeagueId() === 'main');
  
  // Estados para verificação de pagamento e carregamento
  const [hasValidEntry, setHasValidEntry] = useState<boolean | null>(null);
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);
  const [isSavingTeam, setIsSavingTeam] = useState(false);
  const [existingTeam, setExistingTeam] = useState<any>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 🛡️ SAFEGUARD: Prevent duplicate calls
  const lastCheckRef = useRef<string | null>(null);
  const checkInProgressRef = useRef<boolean>(false);
  
  // Obter o nome do time a partir do nome do usuário
  const teamName = user?.name || 'Meu Time';

  // Função para verificar status de pagamento e carregar time existente
  const checkPaymentAndLoadTeam = useCallback(async () => {
    // 🛡️ SAFEGUARD 1: Prevent duplicate calls
    const checkKey = `${publicKey?.toString()}-${selectedLeagueId}`;
    if (checkInProgressRef.current || lastCheckRef.current === checkKey) {
      console.log('🛡️ SAFEGUARD: Chamada duplicada bloqueada', { checkKey, inProgress: checkInProgressRef.current });
      return;
    }

    console.log('🔍 checkPaymentAndLoadTeam: Verificando entrada na liga', {
      timestamp: new Date().toISOString(),
      connected,
      publicKey: publicKey?.toString(),
      selectedLeagueId
    });

    if (!connected || !publicKey) {
      console.log('DEBUG checkPaymentAndLoadTeam: Carteira não conectada');
      setHasValidEntry(null);
      checkInProgressRef.current = false;
      return;
    }

    // 🛡️ SAFEGUARD 2: Mark as in progress
    checkInProgressRef.current = true;
    lastCheckRef.current = checkKey;

    setIsLoadingTeam(true);
    setPaymentError(null);

    try {
      // Primeiro, verificar se o usuário pagou a taxa de entrada
      console.log('DEBUG checkPaymentAndLoadTeam: Verificando entrada na liga');
      const entryResponse = await fetch('/api/league/check-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userWallet: publicKey.toString(),
          leagueId: selectedLeagueId === 'main' ? undefined : selectedLeagueId
        })
      });

      let hasValidPayment = false;
      if (entryResponse.ok) {
        const entryData = await entryResponse.json();
        hasValidPayment = entryData.hasPaid;
        console.log('DEBUG checkPaymentAndLoadTeam: Status de pagamento:', hasValidPayment);
      } else {
        console.log('DEBUG checkPaymentAndLoadTeam: Erro ao verificar entrada na liga');
      }

      // Depois, verificar se há time existente
      console.log('DEBUG checkPaymentAndLoadTeam: Buscando time existente');
      const teamResponse = await fetch(
        `/api/team?userWallet=${publicKey.toString()}&leagueId=${selectedLeagueId === 'main' ? '' : selectedLeagueId}`
      );

      console.log('DEBUG checkPaymentAndLoadTeam: Resposta da busca de time:', {
        status: teamResponse.status,
        ok: teamResponse.ok
      });

      if (teamResponse.ok) {
        const teamData = await teamResponse.json();
        console.log('DEBUG checkPaymentAndLoadTeam: Dados do time:', teamData);
        
        if (teamData.hasTeam) {
          console.log('DEBUG checkPaymentAndLoadTeam: Time existente encontrado');
          setExistingTeam(teamData.team);
          setHasValidEntry(hasValidPayment); // Usar o status de pagamento real
          
          // Carregar jogadores do time existente
          if (teamData.tokenDetails && teamData.team.tokens) {
            console.log('DEBUG checkPaymentAndLoadTeam: Carregando players do time existente');
            const loadedPlayers: Player[] = teamData.team.tokens.map((symbol: string, index: number) => {
              const tokenDetail = teamData.tokenDetails.find((t: any) => t.symbol === symbol);
              return {
                id: symbol, // Usar símbolo como ID para consistência
                position: index + 1,
                name: tokenDetail?.name || symbol,
                token: symbol,
                image: tokenDetail?.logoUrl || '',
                price: tokenDetail?.currentPrice || 0,
                points: 0,
                rarity: 'common' as const,
                change_24h: tokenDetail?.priceChange24h || 0,
                change_7d: tokenDetail?.priceChange7d || 0
              };
            });
            console.log('DEBUG checkPaymentAndLoadTeam: Players carregados:', loadedPlayers);
            setPlayers(loadedPlayers);
          }
        } else {
          console.log('DEBUG checkPaymentAndLoadTeam: Nenhum time existente encontrado');
          // Mesmo sem time, usar o status de pagamento real
          setHasValidEntry(hasValidPayment);
          setExistingTeam(null);
        }
      } else if (teamResponse.status === 402) {
        // Payment required
        const errorData = await teamResponse.json();
        setHasValidEntry(false);
        setPaymentError(errorData.error);
      } else {
        // Se houve erro ao verificar time, mas o pagamento foi feito, permitir criação
        setHasValidEntry(hasValidPayment);
        setExistingTeam(null);
      }
    } catch (error) {
      console.error('DEBUG checkPaymentAndLoadTeam: Erro capturado:', error);
      setPaymentError('Erro ao verificar status do time');
      setHasValidEntry(false);
    } finally {
      console.log('DEBUG checkPaymentAndLoadTeam: Finalizando verificação');
      setIsLoadingTeam(false);
      // 🛡️ SAFEGUARD 3: Release lock after completion
      checkInProgressRef.current = false;
    }
  }, [connected, publicKey, selectedLeagueId]);

  // Atualizar liga quando parâmetros da URL mudarem
  useEffect(() => {
    if (searchParams) {
      const urlLeagueId = searchParams.get('league');
      if (urlLeagueId && mockLeagues.find(league => league.id === urlLeagueId)) {
        // Só atualizar se for diferente do estado atual
        if (urlLeagueId !== selectedLeagueId) {
          setSelectedLeagueId(urlLeagueId);
          setIsEditingMainTeam(urlLeagueId === 'main');
        }
      }
    }
  }, [searchParams, selectedLeagueId]);

  // Verificar pagamento quando conectar carteira ou mudar liga
  useEffect(() => {
    if (connected && publicKey) {
      checkPaymentAndLoadTeam();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, publicKey, selectedLeagueId]);

  // Função para obter filtro fixo baseado no tipo de liga
  const getFixedFilter = (leagueType: string) => {
    switch (leagueType) {
      case 'xstocks':
        return { type: 'xstocks' as const, label: 'xStocks Elite' };
      case 'defi':
        return { type: 'defi' as const, label: 'DeFi Tokens' };
      case 'meme':
        return { type: 'meme' as const, label: 'Meme Tokens' };
      case 'gaming':
        return { type: 'gaming' as const, label: 'Gaming Tokens' };
      default:
        return undefined;
    }
  };

  // Obter liga atual e filtro
  const currentLeague = mockLeagues.find(league => league.id === selectedLeagueId);
  const fixedFilter = currentLeague ? getFixedFilter(currentLeague.type) : undefined;

  // Função para lidar com mudança de liga
  const handleLeagueChange = (newLeagueId: string) => {
    console.log('DEBUG handleLeagueChange: Mudando liga para:', newLeagueId);
    
    // Atualizar estado local
    setSelectedLeagueId(newLeagueId);
    setIsEditingMainTeam(newLeagueId === 'main');
    
    // Limpar jogadores quando mudar de liga
    setPlayers([]);
    setExistingTeam(null);
    setHasValidEntry(null);
    setPaymentError(null);
    setSuccessMessage(null);
    
    // Atualizar URL
    const newUrl = newLeagueId === 'main' ? '/teams' : `/teams?league=${newLeagueId}`;
    router.push(newUrl);
  };

  // Função para adicionar jogador
  const handleAddPlayer = (position: number) => {
    setSelectedPosition(position);
  };

  // Função para remover jogador
  const handleRemovePlayer = (position: number) => {
    setPlayers(prev => prev.filter(p => p.position !== position));
  };

  // Função para adicionar token ao campo
  const handleTokenAdd = (token: TokenMarketData, position: number) => {
    console.log('🎯 Adicionando token ao campo:', { token: token.symbol, position });
    
    // Verificar se o token já está sendo usado em outra posição
    const isTokenAlreadyUsed = players.some(p => p.token === token.symbol && p.position !== position);
    if (isTokenAlreadyUsed) {
      setPaymentError(`O token ${token.symbol} já está sendo usado em outra posição.`);
      setTimeout(() => setPaymentError(null), 3000);
      return;
    }
    
    const newPlayer: Player = {
      id: token.symbol, // Usar o símbolo como ID para consistência
      position,
      name: token.name,
      token: token.symbol,
      image: token.image,
      price: token.price || 0,
      points: 0,
      rarity: 'common',
      change_24h: token.change_24h
    };

    setPlayers(prev => {
      const filtered = prev.filter(p => p.position !== position);
      const newTeam = [...filtered, newPlayer];
      console.log('👥 Time atualizado:', newTeam.length, 'jogadores');
      return newTeam;
    });

    setSelectedToken(null);
    setSelectedPosition(null);
    console.log('✅ Token adicionado com sucesso!');
  };

  // Função para selecionar token
  const handleTokenSelect = (token: TokenMarketData | null) => {
    setSelectedToken(token);
  };

  // Função para encontrar a menor posição livre
  const findSmallestFreePosition = (): number | null => {
    const occupiedPositions = players.map(p => p.position);
    for (let i = 1; i <= 10; i++) {
      if (!occupiedPositions.includes(i)) {
        return i;
      }
    }
    return null; // Todas as posições estão ocupadas
  };

  // Função para posicionamento automático
  const handleAutoPosition = (token: TokenMarketData) => {
    const freePosition = findSmallestFreePosition();
    if (freePosition) {
      handleTokenAdd(token, freePosition);
    }
  };

  // Função para salvar escalação
  const handleSaveTeam = async () => {
    console.log('🚀 handleSaveTeam: Iniciando salvamento...', {
      connected,
      publicKey: publicKey?.toString(),
      playersLength: players.length,
      teamName,
      user
    });

    if (!connected || !publicKey) {
      setPaymentError('Conecte sua carteira para salvar o time');
      return;
    }

    if (players.length !== 10) {
      setPaymentError('O time deve ter exatamente 10 jogadores');
      return;
    }

    setIsSavingTeam(true);
    setPaymentError(null);
    setSuccessMessage(null);

    try {
      const tokens = players
        .sort((a, b) => a.position - b.position)
        .map(player => player.token);

      console.log('📋 handleSaveTeam: Tokens preparados:', tokens);

      // Verificar se há tokens duplicados
      const uniqueTokens = [...new Set(tokens)];
      if (uniqueTokens.length !== tokens.length) {
        console.log('❌ handleSaveTeam: Tokens duplicados encontrados');
        setPaymentError('Há tokens duplicados no time. Cada posição deve ter um token diferente.');
        return;
      }

      const requestBody = {
        userWallet: publicKey.toString(),
        leagueId: selectedLeagueId === 'main' ? undefined : selectedLeagueId,
        teamName: teamName,
        tokens: tokens
      };

      console.log('📤 handleSaveTeam: Enviando requisição:', requestBody);

      const response = await fetch('/api/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 handleSaveTeam: Resposta recebida:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      const data = await response.json();
      console.log('📊 handleSaveTeam: Dados da resposta:', data);

      if (response.ok) {
        console.log('✅ handleSaveTeam: Salvamento bem-sucedido');
        
        setExistingTeam(data.team);
        setHasValidEntry(true);
        setPaymentError(null);
        
        // Atualizar os players com os dados retornados da API, preservando as imagens existentes
        if (data.tokenDetails && data.team.tokens) {
          console.log('🔄 handleSaveTeam: Atualizando players com dados da API');
          
          const updatedPlayers: Player[] = data.team.tokens.map((symbol: string, index: number) => {
            const tokenDetail = data.tokenDetails.find((t: any) => t.symbol === symbol);
            const existingPlayer = players.find(p => p.token === symbol);
            
            return {
              id: symbol, // Usar símbolo como ID para consistência
              position: index + 1,
              name: tokenDetail?.name || existingPlayer?.name || symbol,
              token: symbol,
              image: existingPlayer?.image || tokenDetail?.logoUrl || '', // Preservar imagem existente
              price: existingPlayer?.price || 0,
              points: existingPlayer?.points || 0,
              rarity: (existingPlayer?.rarity as 'common' | 'rare' | 'epic' | 'legendary') || 'common',
              change_24h: existingPlayer?.change_24h || 0
            };
          });
          
          console.log('👥 handleSaveTeam: Players atualizados:', updatedPlayers);
          setPlayers(updatedPlayers);
        }
        
        const successMsg = data.message || 'Time salvo com sucesso!';
        setSuccessMessage(successMsg);
        
        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);
        
      } else if (response.status === 402) {
        setHasValidEntry(false);
        setPaymentError(data.error);
      } else if (response.status === 400 && data.invalidTokens) {
        const invalidTokensList = data.invalidTokens.join(', ');
        setPaymentError(`Tokens inválidos encontrados: ${invalidTokensList}. Estes tokens não estão no top 100 do mercado. Por favor, substitua-os por tokens válidos do Token Market e tente novamente.`);
      } else {
        console.log('❌ handleSaveTeam: Erro no salvamento:', data.error);
        throw new Error(data.error || 'Erro ao salvar time');
      }
    } catch (error) {
      console.error('💥 handleSaveTeam: Erro capturado:', error);
      setPaymentError(error instanceof Error ? error.message : 'Erro ao salvar time');
    } finally {
      console.log('🏁 handleSaveTeam: Finalizando salvamento');
      setIsSavingTeam(false);
    }
  };

  // Função para resetar escalação
  const handleResetTeam = () => {
    setPlayers([]);
    setSelectedToken(null);
    setSelectedPosition(null);
  };

  // Obter tokens já utilizados
  const usedTokens = players.map(p => p.token);

  // Renderização durante hidratação
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Carregando escalação...</h2>
          <p className="text-gray-500">Preparando seu time</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Escalação de Times
            </h1>
            <p className="text-gray-600">
              Monte sua escalação estratégica para {currentLeague?.name || 'Liga Selecionada'}
            </p>
            {existingTeam && (
              <div className="flex items-center gap-2 mt-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600">Time salvo: {existingTeam.name}</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Seletor de Liga */}
            <Select value={selectedLeagueId} onValueChange={handleLeagueChange}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Selecionar Liga" />
              </SelectTrigger>
              <SelectContent>
                {mockLeagues.map(league => (
                  <SelectItem key={league.id} value={league.id}>
                    {league.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Seletor de Formação */}
            <Select value={formation} onValueChange={(value: '433' | '442' | '352') => setFormation(value)}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="433">4-3-3</SelectItem>
                <SelectItem value="442">4-4-2</SelectItem>
                <SelectItem value="352">3-5-2</SelectItem>
              </SelectContent>
            </Select>

            {/* Indicador de Time Principal */}
            {isEditingMainTeam && (
              <Badge variant="default" className="bg-yellow-500 text-white flex items-center gap-1">
                <Crown className="w-3 h-3" />
                Time Principal
              </Badge>
            )}
          </div>
        </div>

        {/* Mensagem de Sucesso */}
        {successMessage && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Status de Conexão e Pagamento */}
        {!connected && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Conecte sua carteira Solana para criar ou editar seu time.
            </AlertDescription>
          </Alert>
        )}

        {connected && isLoadingTeam && (
          <Alert className="mb-6">
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Verificando status do pagamento e carregando time...
            </AlertDescription>
          </Alert>
        )}

        {connected && hasValidEntry === false && paymentError && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <div className="flex flex-col gap-2">
                <span>{paymentError}</span>
                {selectedLeagueId === 'main' && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Pague a taxa de entrada na Liga Principal:</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      asChild
                      className="text-orange-600 border-orange-300 hover:bg-orange-100"
                    >
                      <LocalizedLink href="/ligas" className="flex items-center gap-1">
                        Ir para Liga Principal
                        <ExternalLink className="w-3 h-3" />
                      </LocalizedLink>
                    </Button>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Nome do Time */}
        {connected && hasValidEntry !== false && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Nome do Time
                  </label>
                  <div className="w-full px-3 py-2 border border-border rounded-md bg-muted text-muted-foreground">
                    {teamName}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    O nome do time é baseado no seu nome de usuário. Você pode alterá-lo na página de perfil.
                  </p>
                </div>
                {hasValidEntry && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Pagamento confirmado</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informações da Liga */}
        {fixedFilter && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {fixedFilter.label}
                </Badge>
                <span className="text-sm text-gray-600">
                  Esta liga permite apenas tokens da categoria {fixedFilter.label}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Layout Principal */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Overlay para bloquear interação quando pagamento não confirmado */}
          {connected && hasValidEntry === false && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
              <Card className="max-w-md mx-4">
                <CardContent className="p-6 text-center">
                  <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Pagamento Necessário</h3>
                  <p className="text-gray-600 mb-4">
                    {currentLeague?.type === 'main' 
                      ? 'Você precisa pagar a taxa de entrada da Liga Principal para criar seu time.'
                      : `Você precisa pagar a taxa de entrada da ${currentLeague?.name} para criar seu time.`
                    }
                  </p>
                  <Button asChild>
                    <LocalizedLink href={currentLeague?.type === 'main' ? "/ligas" : `/ligas?highlight=${selectedLeagueId}`}>
                      {currentLeague?.type === 'main' 
                        ? 'Ir para Liga Principal'
                        : `Pagar ${currentLeague?.name}`
                      }
                    </LocalizedLink>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
          {/* Campo de Futebol */}
          <div>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Campo de Escalação
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResetTeam}
                      className="flex items-center gap-1"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Resetar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveTeam}
                      disabled={!connected || isSavingTeam || players.length !== 10}
                      className="flex items-center gap-1"
                    >
                      {isSavingTeam ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Salvar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <SoccerField
                  players={players}
                  onAddPlayer={handleAddPlayer}
                  onRemovePlayer={handleRemovePlayer}
                  formation={formation}
                  selectedToken={selectedToken}
                  onTokenAdd={handleTokenAdd}
                  selectedPosition={selectedPosition}
                />
              </CardContent>
            </Card>

            {/* Estatísticas da Escalação */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Estatísticas da Escalação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{players.length}/10</div>
                    <div className="text-sm text-gray-600">Jogadores</div>
                  </div>
                  <div className="text-center">
                    {(() => {
                      const performance7d = players.length > 0
                        ? (players.reduce((sum, p) => sum + (p.change_7d || 0), 0) / players.length)
                        : 0;
                      const getPerformanceColor = (value: number) => {
                        if (value > 5) return 'text-green-600';
                        if (value > 0) return 'text-green-500';
                        if (value < -5) return 'text-red-600';
                        return 'text-red-500';
                      };
                      return (
                        <>
                          <div className={`text-2xl font-bold ${getPerformanceColor(performance7d)}`}>
                            {performance7d > 0 ? '+' : ''}{performance7d.toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-600">Performance 7d</div>
                        </>
                      );
                    })()}
                  </div>
                  <div className="text-center">
                    {(() => {
                      const performance24h = players.length > 0
                        ? (players.reduce((sum, p) => sum + (p.change_24h || 0), 0) / players.length)
                        : 0;
                      const getPerformanceColor = (value: number) => {
                        if (value > 5) return 'text-green-600';
                        if (value > 0) return 'text-green-500';
                        if (value < -5) return 'text-red-600';
                        return 'text-red-500';
                      };
                      return (
                        <>
                          <div className={`text-2xl font-bold ${getPerformanceColor(performance24h)}`}>
                            {performance24h > 0 ? '+' : ''}{performance24h.toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-600">Performance 24h</div>
                        </>
                      );
                    })()}
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {players.reduce((sum, p) => sum + p.points, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Pontos Totais</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Market de Tokens */}
          <div className="xl:col-span-1">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Token Market
                  {selectedPosition && (
                    <Badge variant="outline">
                      Posição {selectedPosition}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <TokenMarket
                  selectedToken={selectedToken}
                  onTokenSelect={handleTokenSelect}
                  onSelectToken={selectedPosition ? (token) => handleTokenAdd(token, selectedPosition) : undefined}
                  usedTokens={usedTokens}
                  fixedFilter={fixedFilter}
                  onAutoPosition={handleAutoPosition}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}