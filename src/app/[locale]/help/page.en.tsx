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

export default function HelpPageEN() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 mb-4">
          <Trophy className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
          How to Play Crypto Fantasy League
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Complete guide to master the crypto fantasy game.
          Learn the rules, strategies, and how to maximize your earnings!
        </p>
      </div>

      <div className="space-y-8">
        {/* What is it */}
        <Card className="border-2 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Zap className="w-6 h-6 text-blue-600" />
              What is Crypto Fantasy League?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              It's a <strong>crypto-based fantasy game</strong> where you build teams with real tokens
              and compete against other players. The better your tokens perform in the market,
              the more points you accumulate!
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950">
                <Target className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Objective</h4>
                  <p className="text-sm text-muted-foreground">
                    Build the best token team and accumulate maximum points
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950">
                <Coins className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Real Prizes</h4>
                  <p className="text-sm text-muted-foreground">
                    Win real SOL by finishing in the TOP 3
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-purple-50 dark:bg-purple-950">
                <BarChart3 className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Skill & Luck</h4>
                  <p className="text-sm text-muted-foreground">
                    Combine market analysis with strategy to win
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Game Structure */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Calendar className="w-6 h-6 text-purple-600" />
              Structure: Seasons and Rounds
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-600" />
                🏆 Season
              </h3>
              <p className="text-muted-foreground mb-4">
                A season is composed of <strong>multiple rounds</strong> (usually 4-10).
                Your performance is accumulated throughout ALL rounds.
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                  💡 Example: Season 1
                </p>
                <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                  <li>• 4 rounds (Round 1, 2, 3, 4)</li>
                  <li>• Total prize: 1.0 SOL</li>
                  <li>• Duration: 1 month (1 round per week)</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                🔄 Round (Competition)
              </h3>
              <p className="text-muted-foreground mb-4">
                Each round has a fixed duration (e.g., 7 days). You build a team of <strong>5 tokens</strong>
                and accumulate points based on price variation during the round.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Round Start
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Select 5 tokens</li>
                    <li>• Pay entry fee (e.g., 0.01 SOL)</li>
                    <li>• Initial prices are recorded</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg border">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Award className="w-4 h-4 text-yellow-600" />
                    Round End
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Scores are calculated</li>
                    <li>• Ranking is defined</li>
                    <li>• TOP 3 receive prizes (if any)</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scoring System */}
        <Card className="border-2 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <TrendingUp className="w-6 h-6 text-green-600" />
              How Scoring Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-3">📊 Points Formula</h3>
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 p-6 rounded-lg border">
                <p className="text-center font-mono text-lg mb-4">
                  <strong>Points = Σ (% Change of each token)</strong>
                </p>
                <p className="text-sm text-center text-muted-foreground">
                  % Change = ((Final Price - Initial Price) / Initial Price) × 100
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">💡 Practical Example</h3>
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="font-semibold mb-2">Your Team:</p>
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
                    <span className="text-2xl font-bold text-green-600">+12.0 points</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <p className="font-semibold text-blue-900 dark:text-blue-100">Important:</p>
              </div>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 ml-7">
                <li>• Each token contributes INDIVIDUALLY to your score</li>
                <li>• Falling tokens reduce your score (negative points)</li>
                <li>• Diversification can reduce risks</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* PARTICIPATION MULTIPLIER - HIGHLIGHT */}
        <Card className="border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50/50 to-yellow-50/50 dark:from-orange-950/30 dark:to-yellow-950/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Percent className="w-6 h-6 text-orange-600" />
              ⭐ Participation Multiplier (NEW!)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-white dark:bg-gray-900 p-5 rounded-lg border-2 border-orange-300 dark:border-orange-700">
              <h3 className="font-bold text-lg mb-3 text-orange-900 dark:text-orange-100">
                🎯 Why does it exist?
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                To <strong>encourage consistent participation</strong> and prevent players from winning
                the season by playing just 1-2 rounds with lots of luck. The more rounds you play,
                the higher your multiplier!
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">📐 How It's Calculated</h3>
              <div className="bg-gradient-to-r from-orange-100 to-yellow-100 dark:from-orange-950 dark:to-yellow-950 p-6 rounded-lg border-2 border-orange-300 dark:border-orange-700">
                <p className="text-center font-mono text-lg mb-2">
                  <strong>Multiplier = Rounds Played ÷ Total Rounds</strong>
                </p>
                <p className="text-center font-mono text-xl mb-4 text-orange-700 dark:text-orange-300">
                  <strong>Final Score = Raw Points × Multiplier</strong>
                </p>
                <div className="grid md:grid-cols-3 gap-3 mt-4">
                  <div className="bg-green-100 dark:bg-green-900 p-3 rounded text-center">
                    <div className="font-bold text-2xl text-green-700 dark:text-green-300">1.00x</div>
                    <div className="text-xs text-green-600 dark:text-green-400">100% participation</div>
                  </div>
                  <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded text-center">
                    <div className="font-bold text-2xl text-yellow-700 dark:text-yellow-300">0.50x</div>
                    <div className="text-xs text-yellow-600 dark:text-yellow-400">50% participation</div>
                  </div>
                  <div className="bg-red-100 dark:bg-red-900 p-3 rounded text-center">
                    <div className="font-bold text-2xl text-red-700 dark:text-red-300">0.25x</div>
                    <div className="text-xs text-red-600 dark:text-red-400">25% participation</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">💡 Comparative Example</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-5 rounded-lg border-2 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-red-600" />
                    <h4 className="font-bold">Player A (Tourist)</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Raw Points:</span>
                      <strong>200 pts</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Rounds Played:</span>
                      <strong className="text-red-600">2/10</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Multiplier:</span>
                      <Badge className="bg-red-600">0.20x</Badge>
                    </div>
                    <div className="pt-3 border-t border-red-300 dark:border-red-700 flex justify-between items-center">
                      <span className="font-bold">Final Score:</span>
                      <span className="text-2xl font-bold">40 pts</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-lg border-2 border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-5 h-5 text-green-600" />
                    <h4 className="font-bold">Player B (Consistent)</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Raw Points:</span>
                      <strong>150 pts</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Rounds Played:</span>
                      <strong className="text-green-600">10/10</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Multiplier:</span>
                      <Badge className="bg-green-600">1.00x</Badge>
                    </div>
                    <div className="pt-3 border-t border-green-300 dark:border-green-700 flex justify-between items-center">
                      <span className="font-bold">Final Score:</span>
                      <span className="text-2xl font-bold text-green-600">150 pts</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-green-100 dark:bg-green-900 rounded-lg text-center">
                <p className="font-bold text-green-900 dark:text-green-100">
                  🏆 Player B wins! Consistent participation was rewarded.
                </p>
              </div>
            </div>

            <div className="bg-orange-100 dark:bg-orange-950 p-4 rounded-lg border border-orange-300 dark:border-orange-700">
              <div className="flex gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                <p className="font-semibold text-orange-900 dark:text-orange-100">Strategic Tip:</p>
              </div>
              <p className="text-sm text-orange-800 dark:text-orange-200 ml-7">
                Even if you're not doing well in a round, <strong>PLAY ANYWAY</strong>!
                Each round increases your multiplier and can make the difference at the end of the season.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Prize System */}
        <Card className="border-2 border-yellow-200 dark:border-yellow-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Gift className="w-6 h-6 text-yellow-600" />
              Prize System
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-3">🏆 Prize Pool Distribution</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-6 rounded-lg bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900 dark:to-yellow-800 text-center border-2 border-yellow-400">
                  <Trophy className="w-12 h-12 mx-auto mb-3 text-yellow-700" />
                  <div className="text-3xl font-bold mb-2">1st Place</div>
                  <div className="text-2xl font-bold text-yellow-700">50%</div>
                  <div className="text-sm mt-2 text-yellow-800">of Prize Pool</div>
                </div>
                <div className="p-6 rounded-lg bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-700 dark:to-gray-600 text-center border-2 border-gray-400">
                  <Award className="w-12 h-12 mx-auto mb-3 text-gray-700 dark:text-gray-200" />
                  <div className="text-3xl font-bold mb-2">2nd Place</div>
                  <div className="text-2xl font-bold text-gray-700 dark:text-gray-200">30%</div>
                  <div className="text-sm mt-2 text-gray-800 dark:text-gray-300">of Prize Pool</div>
                </div>
                <div className="p-6 rounded-lg bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800 text-center border-2 border-orange-400">
                  <Award className="w-12 h-12 mx-auto mb-3 text-orange-700" />
                  <div className="text-3xl font-bold mb-2">3rd Place</div>
                  <div className="text-2xl font-bold text-orange-700">20%</div>
                  <div className="text-sm mt-2 text-orange-800">of Prize Pool</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">💰 Prize Example</h3>
              <div className="bg-muted p-4 rounded-lg">
                <p className="mb-3">If the season's Prize Pool is <strong>1.0 SOL</strong>:</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between p-2 rounded bg-yellow-100 dark:bg-yellow-900">
                    <span>🥇 1st Place</span>
                    <strong>0.5 SOL</strong>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-gray-100 dark:bg-gray-800">
                    <span>🥈 2nd Place</span>
                    <strong>0.3 SOL</strong>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-orange-100 dark:bg-orange-900">
                    <span>🥉 3rd Place</span>
                    <strong>0.2 SOL</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <p className="font-semibold text-blue-900 dark:text-blue-100">How the Prize Pool is formed:</p>
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-200 ml-7">
                The season's Prize Pool is formed by the <strong>sum of entry fees</strong> from all rounds
                in the season. The more players, the bigger the prize!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Strategic Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Star className="w-6 h-6 text-purple-600" />
              Tips to Win
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  ✅ Do This
                </h4>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• <strong>Play ALL rounds</strong> - maximize your multiplier</li>
                  <li>• <strong>Diversify</strong> - don't put all eggs in one basket</li>
                  <li>• <strong>Study the market</strong> - follow news and analysis</li>
                  <li>• <strong>Balance risk/return</strong> - mix stable and volatile tokens</li>
                  <li>• <strong>Check the ranking</strong> - compare strategies with other players</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg border bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  ❌ Avoid This
                </h4>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• <strong>Skipping rounds</strong> - you lose multiplier!</li>
                  <li>• <strong>All-in on one sector</strong> - if the sector drops, you sink</li>
                  <li>• <strong>FOMO</strong> - don't choose tokens just because they're "pumping"</li>
                  <li>• <strong>Ignoring fundamentals</strong> - luck helps, but knowledge wins</li>
                  <li>• <strong>Giving up early</strong> - one bad round doesn't define the season</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick FAQ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <AlertCircle className="w-6 h-6 text-indigo-600" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <h4 className="font-semibold mb-1">Can I change my team during the round?</h4>
              <p className="text-sm text-muted-foreground">
                No. Once the round starts, your team is <strong>locked</strong> until the end.
              </p>
            </div>
            <div className="border-l-4 border-green-500 pl-4 py-2">
              <h4 className="font-semibold mb-1">Can I play only some rounds of the season?</h4>
              <p className="text-sm text-muted-foreground">
                Yes, but your multiplier will be reduced! For example, playing 2/10 rounds = 0.20x multiplier.
              </p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4 py-2">
              <h4 className="font-semibold mb-1">What happens if I get negative points?</h4>
              <p className="text-sm text-muted-foreground">
                Your negative points are added normally. It's possible to finish a round with a negative score.
              </p>
            </div>
            <div className="border-l-4 border-orange-500 pl-4 py-2">
              <h4 className="font-semibold mb-1">When do I receive my prize?</h4>
              <p className="text-sm text-muted-foreground">
                At the end of the <strong>complete season</strong>, after all rounds are finalized.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
          <CardContent className="py-8 text-center">
            <Trophy className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-3">Ready to Start?</h2>
            <p className="text-lg mb-6 opacity-90">
              Now that you know the rules, build your team and start competing!
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <a
                href="/en/teams"
                className="px-6 py-3 bg-white text-orange-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
              >
                <Users className="w-5 h-5" />
                Build My Team
              </a>
              <a
                href="/en/ranking"
                className="px-6 py-3 bg-white/20 backdrop-blur text-white rounded-lg font-semibold hover:bg-white/30 transition-colors inline-flex items-center gap-2 border-2 border-white"
              >
                <Trophy className="w-5 h-5" />
                View Ranking
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
