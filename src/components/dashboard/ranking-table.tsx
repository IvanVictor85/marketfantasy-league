'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Team {
  id: string;
  teamName: string;
  totalScore: number | null;
  rank: number | null;
  tokens: string[];
  user: {
    name: string;
    email: string;
  };
}

interface RankingTableProps {
  teams: Team[];
  currentUserId?: string;
  currentUserEmail?: string;
}

export function RankingTable({ teams, currentUserId, currentUserEmail }: RankingTableProps) {
  const t = useTranslations('RankingPage');

  const getRankIcon = (rank: number | null) => {
    if (!rank) return <Users className="h-4 w-4" />;

    switch (rank) {
      case 1:
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 2:
        return <Medal className="h-4 w-4 text-gray-400" />;
      case 3:
        return <Award className="h-4 w-4 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-gray-600">#{rank}</span>;
    }
  };

  const getRankBadgeVariant = (rank: number | null) => {
    if (!rank) return 'secondary';

    switch (rank) {
      case 1:
        return 'default';
      case 2:
        return 'secondary';
      case 3:
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          {t('standingsTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {teams.map((team, index) => {
            // CORREÇÃO: Comparar email do time com email do usuário logado
            const isCurrentUser = currentUserEmail && team.user.email === currentUserEmail;
            const hasScore = team.totalScore !== null;
            
            return (
              <div
                key={team.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  isCurrentUser 
                    ? 'bg-primary/10 border-primary/20' 
                    : 'bg-card hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8">
                    {getRankIcon(team.rank)}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{team.teamName}</h3>
                      {isCurrentUser && (
                        <Badge variant="default" className="text-xs">
                          {t('yourTeamBadge')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {team.user.name}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  {hasScore ? (
                    <>
                      <div className="text-lg font-bold">
                        {team.totalScore?.toFixed(2)} pts
                      </div>
                      <Badge variant={getRankBadgeVariant(team.rank)}>
                        {team.rank ? `#${team.rank}` : 'N/A'}
                      </Badge>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      N/A
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {teams.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('noTeamsInLeague')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
