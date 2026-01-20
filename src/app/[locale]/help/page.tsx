'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Trophy,
  Target,
  TrendingUp,
  Users,
  Coins,
  Calendar,
  Award,
  AlertCircle,
  CheckCircle,
  Zap,
  BarChart3,
  Clock,
  Percent,
  Star,
  Gift
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function HelpPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 mb-4">
          <Trophy className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
          Como Jogar Crypto Fantasy League
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Guia completo para dominar o jogo de fantasy de criptomoedas.
          Aprenda as regras, estratégias e como maximizar seus ganhos!
        </p>
      </div>

      <div className="space-y-8">
        {/* O que é */}
        <Card className="border-2 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Zap className="w-6 h-6 text-blue-600" />
              O que é Crypto Fantasy League?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              É um jogo de <strong>fantasy baseado em criptomoedas</strong> onde você monta times com tokens reais
              e compete contra outros jogadores. Quanto melhor o desempenho dos seus tokens no mercado,
              mais pontos você acumula!
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950">
                <Target className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Objetivo</h4>
                  <p className="text-sm text-muted-foreground">
                    Montar o melhor time de tokens e acumular o máximo de pontos
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950">
                <Coins className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Prêmios Reais</h4>
                  <p className="text-sm text-muted-foreground">
                    Ganhe SOL de verdade ao terminar no TOP 3
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-purple-50 dark:bg-purple-950">
                <BarChart3 className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Skill & Sorte</h4>
                  <p className="text-sm text-muted-foreground">
                    Combine análise de mercado com estratégia para vencer
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estrutura do Jogo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Calendar className="w-6 h-6 text-purple-600" />
              Estrutura: Temporadas e Rodadas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-600" />
                🏆 Temporada (Season)
              </h3>
              <p className="text-muted-foreground mb-4">
                Uma temporada é composta por <strong>múltiplas rodadas</strong> (geralmente 4-10).
                Seu desempenho é acumulado ao longo de TODAS as rodadas.
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                  💡 Exemplo: Temporada 1
                </p>
                <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                  <li>• 4 rodadas (Rodada 1, 2, 3, 4)</li>
                  <li>• Prêmio total: 1.0 SOL</li>
                  <li>• Duração: 1 mês (1 rodada por semana)</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                🔄 Rodada (Round/Competition)
              </h3>
              <p className="text-muted-foreground mb-4">
                Cada rodada tem duração fixa (ex: 7 dias). Você monta um time de <strong>5 tokens</strong>
                e acumula pontos baseado na variação de preço durante a rodada.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Início da Rodada
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Selecione 5 tokens</li>
                    <li>• Pague a entry fee (ex: 0.01 SOL)</li>
                    <li>• Preços iniciais são registrados</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg border">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Award className="w-4 h-4 text-yellow-600" />
                    Fim da Rodada
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Pontuação é calculada</li>
                    <li>• Ranking é definido</li>
                    <li>• TOP 3 recebem prêmios (se houver)</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sistema de Pontuação */}
        <Card className="border-2 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <TrendingUp className="w-6 h-6 text-green-600" />
              Como Funciona a Pontuação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-3">📊 Fórmula de Pontos</h3>
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 p-6 rounded-lg border">
                <p className="text-center font-mono text-lg mb-4">
                  <strong>Pontos = Σ (Variação % de cada token)</strong>
                </p>
                <p className="text-sm text-center text-muted-foreground">
                  Variação % = ((Preço Final - Preço Inicial) / Preço Inicial) × 100
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">💡 Exemplo Prático</h3>
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="font-semibold mb-2">Seu Time:</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>BTC: $50,000 → $52,000</span>
                      <Badge className="bg-green-600">+4.0%</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>ETH: $3,000 → $3,150</span>
                      <Badge className="bg-green-600">+5.0%</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>SOL: $100 → $98</span>
                      <Badge className="bg-red-600">-2.0%</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>AVAX: $40 → $44</span>
                      <Badge className="bg-green-600">+10.0%</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>LINK: $20 → $19</span>
                      <Badge className="bg-red-600">-5.0%</Badge>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <span className="font-bold">Total:</span>
                    <span className="text-2xl font-bold text-green-600">+12.0 pontos</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <p className="font-semibold text-blue-900 dark:text-blue-100">Importante:</p>
              </div>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 ml-7">
                <li>• Cada token contribui INDIVIDUALMENTE para sua pontuação</li>
                <li>• Tokens em queda reduzem sua pontuação (pontos negativos)</li>
                <li>• Diversificação pode reduzir riscos</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* MULTIPLICADOR DE PARTICIPAÇÃO - DESTAQUE */}
        <Card className="border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50/50 to-yellow-50/50 dark:from-orange-950/30 dark:to-yellow-950/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Percent className="w-6 h-6 text-orange-600" />
              ⭐ Multiplicador de Participação (NOVO!)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-white dark:bg-gray-900 p-5 rounded-lg border-2 border-orange-300 dark:border-orange-700">
              <h3 className="font-bold text-lg mb-3 text-orange-900 dark:text-orange-100">
                🎯 Por que existe?
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Para <strong>incentivar participação consistente</strong> e evitar que jogadores vençam
                a temporada jogando apenas 1-2 rodadas com muita sorte. Quanto mais rodadas você jogar,
                maior será seu multiplicador!
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">📐 Como é Calculado</h3>
              <div className="bg-gradient-to-r from-orange-100 to-yellow-100 dark:from-orange-950 dark:to-yellow-950 p-6 rounded-lg border-2 border-orange-300 dark:border-orange-700">
                <p className="text-center font-mono text-lg mb-2">
                  <strong>Multiplicador = Rodadas Jogadas ÷ Total de Rodadas</strong>
                </p>
                <p className="text-center font-mono text-xl mb-4 text-orange-700 dark:text-orange-300">
                  <strong>Pontuação Final = Pontos Brutos × Multiplicador</strong>
                </p>
                <div className="grid md:grid-cols-3 gap-3 mt-4">
                  <div className="bg-green-100 dark:bg-green-900 p-3 rounded text-center">
                    <div className="font-bold text-2xl text-green-700 dark:text-green-300">1.00x</div>
                    <div className="text-xs text-green-600 dark:text-green-400">100% de participação</div>
                  </div>
                  <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded text-center">
                    <div className="font-bold text-2xl text-yellow-700 dark:text-yellow-300">0.50x</div>
                    <div className="text-xs text-yellow-600 dark:text-yellow-400">50% de participação</div>
                  </div>
                  <div className="bg-red-100 dark:bg-red-900 p-3 rounded text-center">
                    <div className="font-bold text-2xl text-red-700 dark:text-red-300">0.25x</div>
                    <div className="text-xs text-red-600 dark:text-red-400">25% de participação</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">💡 Exemplo Comparativo</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-5 rounded-lg border-2 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-red-600" />
                    <h4 className="font-bold">Jogador A (Turista)</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Pontos Brutos:</span>
                      <strong>200 pts</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Rodadas Jogadas:</span>
                      <strong className="text-red-600">2/10</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Multiplicador:</span>
                      <Badge className="bg-red-600">0.20x</Badge>
                    </div>
                    <div className="pt-3 border-t border-red-300 dark:border-red-700 flex justify-between items-center">
                      <span className="font-bold">Pontuação Final:</span>
                      <span className="text-2xl font-bold">40 pts</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-lg border-2 border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-5 h-5 text-green-600" />
                    <h4 className="font-bold">Jogador B (Consistente)</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Pontos Brutos:</span>
                      <strong>150 pts</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Rodadas Jogadas:</span>
                      <strong className="text-green-600">10/10</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Multiplicador:</span>
                      <Badge className="bg-green-600">1.00x</Badge>
                    </div>
                    <div className="pt-3 border-t border-green-300 dark:border-green-700 flex justify-between items-center">
                      <span className="font-bold">Pontuação Final:</span>
                      <span className="text-2xl font-bold text-green-600">150 pts</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-green-100 dark:bg-green-900 rounded-lg text-center">
                <p className="font-bold text-green-900 dark:text-green-100">
                  🏆 Jogador B vence! A participação consistente foi recompensada.
                </p>
              </div>
            </div>

            <div className="bg-orange-100 dark:bg-orange-950 p-4 rounded-lg border border-orange-300 dark:border-orange-700">
              <div className="flex gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                <p className="font-semibold text-orange-900 dark:text-orange-100">Dica Estratégica:</p>
              </div>
              <p className="text-sm text-orange-800 dark:text-orange-200 ml-7">
                Mesmo que você não esteja indo bem em uma rodada, <strong>JOGUE MESMO ASSIM</strong>!
                Cada rodada aumenta seu multiplicador e pode fazer a diferença no final da temporada.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Prêmios */}
        <Card className="border-2 border-yellow-200 dark:border-yellow-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Gift className="w-6 h-6 text-yellow-600" />
              Sistema de Prêmios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-3">🏆 Distribuição do Prize Pool</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-6 rounded-lg bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900 dark:to-yellow-800 text-center border-2 border-yellow-400">
                  <Trophy className="w-12 h-12 mx-auto mb-3 text-yellow-700" />
                  <div className="text-3xl font-bold mb-2">1º Lugar</div>
                  <div className="text-2xl font-bold text-yellow-700">50%</div>
                  <div className="text-sm mt-2 text-yellow-800">do Prize Pool</div>
                </div>
                <div className="p-6 rounded-lg bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-700 dark:to-gray-600 text-center border-2 border-gray-400">
                  <Award className="w-12 h-12 mx-auto mb-3 text-gray-700 dark:text-gray-200" />
                  <div className="text-3xl font-bold mb-2">2º Lugar</div>
                  <div className="text-2xl font-bold text-gray-700 dark:text-gray-200">30%</div>
                  <div className="text-sm mt-2 text-gray-800 dark:text-gray-300">do Prize Pool</div>
                </div>
                <div className="p-6 rounded-lg bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800 text-center border-2 border-orange-400">
                  <Award className="w-12 h-12 mx-auto mb-3 text-orange-700" />
                  <div className="text-3xl font-bold mb-2">3º Lugar</div>
                  <div className="text-2xl font-bold text-orange-700">20%</div>
                  <div className="text-sm mt-2 text-orange-800">do Prize Pool</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">💰 Exemplo de Prêmios</h3>
              <div className="bg-muted p-4 rounded-lg">
                <p className="mb-3">Se o Prize Pool da temporada for <strong>1.0 SOL</strong>:</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between p-2 rounded bg-yellow-100 dark:bg-yellow-900">
                    <span>🥇 1º Lugar</span>
                    <strong>0.5 SOL</strong>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-gray-100 dark:bg-gray-800">
                    <span>🥈 2º Lugar</span>
                    <strong>0.3 SOL</strong>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-orange-100 dark:bg-orange-900">
                    <span>🥉 3º Lugar</span>
                    <strong>0.2 SOL</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <p className="font-semibold text-blue-900 dark:text-blue-100">Como formar o Prize Pool:</p>
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-200 ml-7">
                O Prize Pool da temporada é formado pela <strong>soma das entry fees</strong> de todas as rodadas
                da temporada. Quanto mais jogadores, maior o prêmio!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Dicas Estratégicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Star className="w-6 h-6 text-purple-600" />
              Dicas para Vencer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  ✅ Faça Isso
                </h4>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• <strong>Jogue TODAS as rodadas</strong> - maximize seu multiplicador</li>
                  <li>• <strong>Diversifique</strong> - não coloque todos os ovos na mesma cesta</li>
                  <li>• <strong>Estude o mercado</strong> - acompanhe notícias e análises</li>
                  <li>• <strong>Balance risco/retorno</strong> - mix de tokens estáveis e voláteis</li>
                  <li>• <strong>Veja o ranking</strong> - compare estratégias com outros jogadores</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg border bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  ❌ Evite Isso
                </h4>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• <strong>Pular rodadas</strong> - você perde multiplicador!</li>
                  <li>• <strong>All-in em um setor</strong> - se o setor cair, você afunda</li>
                  <li>• <strong>FOMO</strong> - não escolha tokens só porque estão "bombando"</li>
                  <li>• <strong>Ignorar fundamentals</strong> - sorte ajuda, mas conhecimento vence</li>
                  <li>• <strong>Desistir cedo</strong> - uma rodada ruim não define a temporada</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Rápido */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <AlertCircle className="w-6 h-6 text-indigo-600" />
              Perguntas Frequentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <h4 className="font-semibold mb-1">Posso trocar meu time durante a rodada?</h4>
              <p className="text-sm text-muted-foreground">
                Não. Uma vez que a rodada começou, seu time fica <strong>travado</strong> até o fim.
              </p>
            </div>
            <div className="border-l-4 border-green-500 pl-4 py-2">
              <h4 className="font-semibold mb-1">Posso jogar só algumas rodadas da temporada?</h4>
              <p className="text-sm text-muted-foreground">
                Sim, mas seu multiplicador será reduzido! Por exemplo, jogar 2/10 rodadas = 0.20x multiplicador.
              </p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4 py-2">
              <h4 className="font-semibold mb-1">O que acontece se eu ficar com pontos negativos?</h4>
              <p className="text-sm text-muted-foreground">
                Seus pontos negativos são somados normalmente. É possível terminar uma rodada com pontuação negativa.
              </p>
            </div>
            <div className="border-l-4 border-orange-500 pl-4 py-2">
              <h4 className="font-semibold mb-1">Quando recebo meu prêmio?</h4>
              <p className="text-sm text-muted-foreground">
                Ao final da <strong>temporada completa</strong>, após todas as rodadas serem finalizadas.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
          <CardContent className="py-8 text-center">
            <Trophy className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-3">Pronto para Começar?</h2>
            <p className="text-lg mb-6 opacity-90">
              Agora que você conhece as regras, monte seu time e comece a competir!
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <a
                href="/pt/teams"
                className="px-6 py-3 bg-white text-orange-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
              >
                <Users className="w-5 h-5" />
                Montar Meu Time
              </a>
              <a
                href="/pt/ranking"
                className="px-6 py-3 bg-white/20 backdrop-blur text-white rounded-lg font-semibold hover:bg-white/30 transition-colors inline-flex items-center gap-2 border-2 border-white"
              >
                <Trophy className="w-5 h-5" />
                Ver Ranking
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
