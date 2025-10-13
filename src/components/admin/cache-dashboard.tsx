'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RefreshCw, 
  Trash2, 
  Thermometer, 
  BarChart3, 
  Clock, 
  Database,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface CacheStats {
  totalEntries: number;
  hits: number;
  misses: number;
  lastCleanup: string;
  hitRate?: number;
  memoryUsageEstimateKB?: number;
}

interface CacheHealth {
  status: 'healthy' | 'empty' | 'error';
  lastCleanup: string;
  uptime: number;
  nodeEnv: string;
}

interface CacheData {
  cache: {
    stats: CacheStats;
    health: CacheHealth;
    configuration: {
      ttls: Array<{ type: string; ttlSeconds: number; ttlMinutes: number }>;
      rateLimits: Array<{ service: string; requestsPerMinute: number; burstLimit: number }>;
    };
  };
  timestamp: string;
}

export default function CacheDashboard() {
  const [cacheData, setCacheData] = useState<CacheData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchCacheStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cache/stats');
      if (!response.ok) throw new Error('Falha ao buscar estatísticas');
      const data = await response.json();
      setCacheData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const handleCacheAction = async (action: string, type: string, options: any = {}) => {
    try {
      setActionLoading(action);
      
      let endpoint = '';
      let body: any = { type };
      
      if (action === 'invalidate') {
        endpoint = '/api/cache/invalidate';
        body = { ...body, ...options };
      } else if (action === 'warm') {
        endpoint = '/api/cache/warm';
        body = { ...body, force: true, ...options };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) throw new Error(`Falha na ação: ${response.status}`);
      
      // Atualizar estatísticas após a ação
      await fetchCacheStats();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na ação');
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchCacheStats();
    // Auto-refresh a cada 30 segundos
    const interval = setInterval(fetchCacheStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !cacheData) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Carregando estatísticas do cache...
      </div>
    );
  }

  if (error && !cacheData) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const stats = cacheData?.cache.stats;
  const health = cacheData?.cache.health;
  const config = cacheData?.cache.configuration;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard de Cache</h2>
          <p className="text-muted-foreground">
            Monitoramento e gerenciamento do sistema de cache
          </p>
        </div>
        <Button 
          onClick={fetchCacheStats} 
          disabled={loading}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status do Cache</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge 
                variant={health?.status === 'healthy' ? 'default' : 
                        health?.status === 'empty' ? 'secondary' : 'destructive'}
              >
                {health?.status === 'healthy' && <CheckCircle className="h-3 w-3 mr-1" />}
                {health?.status || 'Desconhecido'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ambiente: {health?.nodeEnv}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entradas Totais</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalEntries || 0}</div>
            <p className="text-xs text-muted-foreground">
              ~{stats?.memoryUsageEstimateKB || 0} KB
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Acerto</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.hitRate ? `${stats.hitRate}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.hits || 0} hits / {stats?.misses || 0} misses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {health?.uptime ? `${Math.floor(health.uptime / 3600)}h` : '0h'}
            </div>
            <p className="text-xs text-muted-foreground">
              Última limpeza: {health?.lastCleanup ? 
                new Date(health.lastCleanup).toLocaleTimeString() : 'Nunca'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="actions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="actions">Ações</TabsTrigger>
          <TabsTrigger value="config">Configuração</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="actions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cache Warming */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Thermometer className="h-5 w-5 mr-2" />
                  Aquecimento de Cache
                </CardTitle>
                <CardDescription>
                  Pré-carregue dados frequentemente acessados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={() => handleCacheAction('warm', 'popular')}
                  disabled={actionLoading === 'warm-popular'}
                  className="w-full"
                  variant="outline"
                >
                  {actionLoading === 'warm-popular' && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  Tokens Populares
                </Button>
                <Button 
                  onClick={() => handleCacheAction('warm', 'main-league')}
                  disabled={actionLoading === 'warm-main-league'}
                  className="w-full"
                  variant="outline"
                >
                  {actionLoading === 'warm-main-league' && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  Liga Principal
                </Button>
                <Button 
                  onClick={() => handleCacheAction('warm', 'all')}
                  disabled={actionLoading === 'warm-all'}
                  className="w-full"
                >
                  {actionLoading === 'warm-all' && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  Aquecer Tudo
                </Button>
              </CardContent>
            </Card>

            {/* Cache Invalidation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trash2 className="h-5 w-5 mr-2" />
                  Invalidação de Cache
                </CardTitle>
                <CardDescription>
                  Limpe dados em cache para forçar atualização
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={() => handleCacheAction('invalidate', 'prices', { warmAfterInvalidation: true })}
                  disabled={actionLoading === 'invalidate-prices'}
                  className="w-full"
                  variant="outline"
                >
                  {actionLoading === 'invalidate-prices' && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  Preços (+ Reaquecer)
                </Button>
                <Button 
                  onClick={() => handleCacheAction('invalidate', 'cleanup')}
                  disabled={actionLoading === 'invalidate-cleanup'}
                  className="w-full"
                  variant="outline"
                >
                  {actionLoading === 'invalidate-cleanup' && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  Limpeza Expirados
                </Button>
                <Button 
                  onClick={() => handleCacheAction('invalidate', 'all', { warmAfterInvalidation: true })}
                  disabled={actionLoading === 'invalidate-all'}
                  className="w-full"
                  variant="destructive"
                >
                  {actionLoading === 'invalidate-all' && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  Invalidar Tudo
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* TTL Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Configuração de TTL</CardTitle>
                <CardDescription>Tempo de vida dos dados em cache</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {config?.ttls.map((ttl, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm font-medium">{ttl.type}</span>
                      <Badge variant="secondary">
                        {ttl.ttlMinutes}min
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Rate Limits */}
            <Card>
              <CardHeader>
                <CardTitle>Rate Limits</CardTitle>
                <CardDescription>Limites de requisições por serviço</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {config?.rateLimits.map((limit, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium capitalize">{limit.service}</span>
                        <Badge variant="outline">
                          {limit.requestsPerMinute}/min
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Burst: {limit.burstLimit}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas Detalhadas</CardTitle>
              <CardDescription>
                Última atualização: {cacheData?.timestamp ? 
                  new Date(cacheData.timestamp).toLocaleString() : 'Nunca'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-2xl font-bold">{stats?.totalEntries || 0}</div>
                  <div className="text-sm text-muted-foreground">Total de Entradas</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats?.hits || 0}</div>
                  <div className="text-sm text-muted-foreground">Cache Hits</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{stats?.misses || 0}</div>
                  <div className="text-sm text-muted-foreground">Cache Misses</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats?.memoryUsageEstimateKB || 0} KB</div>
                  <div className="text-sm text-muted-foreground">Uso de Memória</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}