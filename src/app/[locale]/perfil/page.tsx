'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/auth-context';
import { useLocaleNavigation } from '@/hooks/useLocaleNavigation';
import { MascotImagePreview } from '@/components/mascot/mascot-image-preview';
import { MascotCustomizationForm, MascotFormData } from '@/components/mascot/mascot-customization-form';
import { LocalizedLink } from '@/components/ui/localized-link';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

// Interface para o mascote gerado via API
interface GeneratedMascot {
  id: string;
  imageUrl: string;
  prompt: string;
  character: string;
  uniformStyle: string;
  accessory?: string;
  createdAt: string;
  formData?: MascotFormData;
}

export default function PerfilPage() {
  const { user, updateUserProfile, isAuthenticated, isLoading } = useAuth();
  const { push } = useLocaleNavigation();
  const t = useTranslations('ProfilePage');

  const [name, setName] = useState<string>('');
  const [twitter, setTwitter] = useState<string>('');
  const [discord, setDiscord] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [generatedMascot, setGeneratedMascot] = useState<GeneratedMascot | null>(null);
  const [isGeneratingMascot, setIsGeneratingMascot] = useState<boolean>(false);
  const [mascotError, setMascotError] = useState<string | null>(null);
  const [saved, setSaved] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'mascot'>('profile');
  const [savedMascot, setSavedMascot] = useState<GeneratedMascot | null>(null);

  // Proteção de rota - redireciona para login se não autenticado
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      push('/login?redirect=/perfil');
    }
  }, [isAuthenticated, isLoading, push]);

  useEffect(() => {
    // 🔍 LOGS DE DEBUG
    console.log('🔍 [PERFIL] useEffect executado');
    console.log('🔍 [PERFIL] User completo:', JSON.stringify(user, null, 2));
    console.log('🔍 [PERFIL] user.twitter:', user?.twitter);
    console.log('🔍 [PERFIL] user.discord:', user?.discord);
    console.log('🔍 [PERFIL] user.bio:', user?.bio);
    console.log('🔍 [PERFIL] user.avatar:', user?.avatar?.substring(0, 50) + '...');

    // Carregar dados do perfil se usuário autenticado
    if (user) {
      setName(user.name || '');
      setTwitter(user.twitter || '');
      setDiscord(user.discord || '');
      setBio(user.bio || '');

      console.log('✅ [PERFIL] Estados setados:', {
        name: user.name,
        twitter: user.twitter,
        discord: user.discord,
        bio: user.bio
      });
    }

    // Carregar mascote - PRIORIDADE: user.avatar do banco > localStorage
    if (typeof window !== 'undefined') {
      // 1️⃣ PRIMEIRO: Verificar se existe avatar no banco de dados
      if (user?.avatar) {
        console.log('✅ [PERFIL] Avatar encontrado no banco de dados');

        // Criar objeto de mascote baseado no avatar do banco
        const mascotFromDatabase: GeneratedMascot = {
          id: `db_${user.id}`,
          imageUrl: user.avatar,
          prompt: 'Mascote salvo no banco de dados',
          character: 'Mascote Personalizado',
          uniformStyle: 'Personalizado',
          createdAt: new Date().toISOString()
        };

        setSavedMascot(mascotFromDatabase);
        console.log('✅ [PERFIL] Mascote do banco carregado');
      }
      // 2️⃣ FALLBACK: Se não tem no banco, usar localStorage
      else {
        console.log('⚠️ [PERFIL] Avatar não encontrado no banco, tentando localStorage');
        const userId = user?.id || 'user-1';
        const key = `savedMascot_${userId}`;

        const savedMascotData = localStorage.getItem(key);

        if (savedMascotData) {
          try {
            const mascot = JSON.parse(savedMascotData);
            setSavedMascot(mascot);
            console.log('✅ [PERFIL] Mascote do localStorage carregado');
          } catch (error) {
            console.error('❌ [PERFIL] Erro ao carregar mascote do localStorage:', error);
          }
        } else {
          console.log('⚠️ [PERFIL] Nenhum mascote encontrado (nem banco nem localStorage)');
        }
      }
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // 🔍 LOGS CRÍTICOS
    console.log('🔍 [PROFILE-FRONTEND] ===================');
    console.log('🔍 [PROFILE-FRONTEND] User completo:', JSON.stringify(user, null, 2));
    console.log('🔍 [PROFILE-FRONTEND] user.id:', user?.id);
    console.log('🔍 [PROFILE-FRONTEND] Tipo:', typeof user?.id);
    console.log('🔍 [PROFILE-FRONTEND] FormData:', { name, twitter, discord, bio });
    console.log('🔍 [PROFILE-FRONTEND] ===================');
    
    try {
      // Salva dados do perfil e mascote gerado (se houver)
      const profileData: any = { name, twitter, discord, bio };
      if (generatedMascot) {
        profileData.generatedMascot = generatedMascot;
      }
      
      console.log('📡 [PROFILE-FRONTEND] ProfileData:', JSON.stringify(profileData, null, 2));
      
      await updateUserProfile(profileData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      console.error('❌ [PROFILE-FRONTEND] Erro:', error);
      // Você pode adicionar um estado de erro aqui se quiser mostrar uma mensagem de erro
      alert('Erro ao salvar perfil. Tente novamente.');
    }
  };

  const handleGenerateMascot = async (formData: MascotFormData) => {
    setIsGeneratingMascot(true);
    setMascotError(null);
    
    try {
      // Fazer chamada POST para a API Route
      const response = await fetch('/api/generate-mascot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          character: formData.character,
          uniformStyle: formData.uniformStyle,
          accessory: formData.accessory,
        }),
      });

      // Verificar se a resposta foi bem-sucedida
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao gerar mascote');
      }

      // Parse da resposta JSON
      const result = await response.json();
      
      if (result.success && result.data) {
        setGeneratedMascot(result.data);
        setMascotError(null);
      } else {
        throw new Error(result.message || 'Erro inesperado ao gerar mascote');
      }
      
    } catch (error) {
      console.error('Erro ao gerar mascote:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao gerar mascote. Tente novamente.';
      setMascotError(errorMessage);
    } finally {
      setIsGeneratingMascot(false);
    }
  };

  const handleSaveMascot = async () => {
    if (generatedMascot && user) {
      try {
        // 1. Salvar no banco de dados via API
        const response = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            avatar: generatedMascot.imageUrl
          })
        });

        if (!response.ok) {
          throw new Error('Erro ao salvar mascote no banco');
        }

        // 2. Salvar no localStorage também
        const key = `savedMascot_${user.id}`;
        localStorage.setItem(key, JSON.stringify(generatedMascot));
        
        // 3. Atualizar estado local
        setSavedMascot(generatedMascot);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        
        console.log('✅ Mascote salvo no banco e localStorage');
      } catch (error) {
        console.error('Erro ao salvar mascote:', error);
        alert('Erro ao salvar mascote. Tente novamente.');
      }
    }
  };

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">{t('loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Se não autenticado, não renderizar nada (redirecionamento já foi feito)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <LocalizedLink href="/dashboard" prefetch={false} className="text-sm text-orange-700 hover:underline">{t('backToDashboard')}</LocalizedLink>
      </div>

      {saved && (
        <Alert className="mb-6">
          <AlertTitle>{t('profileUpdated')}</AlertTitle>
          <AlertDescription>
            {t('profileUpdatedDesc')}
          </AlertDescription>
        </Alert>
      )}

      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
          <Button
            variant={activeTab === 'profile' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('profile')}
          >
            📝 {t('infoTab')}
          </Button>
          <Button
            variant={activeTab === 'mascot' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('mascot')}
          >
            🎨 {t('mascotTab')}
          </Button>
        </div>
      </div>

      {/* Content Area */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Exibição do Mascote Salvo */}
          {!isLoading && savedMascot && (
            <Card>
              <CardHeader>
                <CardTitle>{t('yourMascot')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-64 h-64 relative">
                    <Image
                      src={savedMascot.imageUrl}
                      alt={t('yourMascot')}
                      fill
                      className="object-cover rounded-lg border-2 border-orange-200"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      <strong>{t('character')}:</strong> {savedMascot.character}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>{t('uniform')}:</strong> {savedMascot.uniformStyle}
                    </p>
                    {savedMascot.accessory && (
                      <p className="text-sm text-muted-foreground">
                        <strong>{t('accessory')}:</strong> {savedMascot.accessory}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{t('publicInfoTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('nameLabel')}</Label>
                  <Input
                    id="name"
                    key={`name-${user?.id}`}
                    defaultValue={user?.name || ''}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome ou nome do time"
                    required
                  />
                  <p className="text-xs text-muted-foreground">{t('nameHelp')}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twitter">{t('twitterLabel')}</Label>
                  <Input
                    id="twitter"
                    key={`twitter-${user?.id}`}
                    defaultValue={user?.twitter || ''}
                    onChange={(e) => setTwitter(e.target.value)}
                    placeholder="@seuusuario ou URL do perfil"
                  />
                  <p className="text-xs text-muted-foreground">{t('twitterHelp')}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discord">{t('discordLabel')}</Label>
                  <Input
                    id="discord"
                    key={`discord-${user?.id}`}
                    defaultValue={user?.discord || ''}
                    onChange={(e) => setDiscord(e.target.value)}
                    placeholder="usuario#1234 ou nome do servidor"
                  />
                  <p className="text-xs text-muted-foreground">{t('discordHelp')}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">{t('bioLabel')}</Label>
                  <textarea
                    id="bio"
                    key={`bio-${user?.id}`}
                    defaultValue={user?.bio || ''}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Conte sobre você, seu time e sua jornada cripto..."
                    className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                  <p className="text-xs text-muted-foreground">{t('bioHelp')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700">{t('saveChanges')}</Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={(e) => {
                    // Resetar formulário para valores padrão
                    const form = e.currentTarget.closest('form');
                    if (form) {
                      form.reset();
                    }
                    // Resetar estados também
                    setName(user?.name || '');
                    setTwitter(user?.twitter || '');
                    setDiscord(user?.discord || '');
                    setBio(user?.bio || '');
                  }}
                >
                  {t('cancel')}
                </Button>
              </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'mascot' && (
        <div className="max-w-2xl mx-auto">
          {/* Seção Personalizar Mascote */}
          <Card>
            <CardHeader>
              <CardTitle>
                <h2 className="text-2xl font-bold">{t('mascotTitle')}</h2>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Layout de Coluna Única */}

              {/* Exibição de Erro */}
              {mascotError && (
                <Alert variant="destructive">
                  <AlertTitle>{t('errorGenerating')}</AlertTitle>
                  <AlertDescription>{mascotError}</AlertDescription>
                </Alert>
              )}

              {/* Pré-visualização da Imagem no Topo */}
              <div className="flex justify-center">
                <MascotImagePreview
                  imageUrl={generatedMascot?.imageUrl}
                  isGenerating={isGeneratingMascot}
                  className="w-full max-w-md"
                />
              </div>

              {/* Formulário de Personalização Abaixo */}
              <div>
                <MascotCustomizationForm
                  onGenerate={handleGenerateMascot}
                  isGenerating={isGeneratingMascot}
                  initialData={generatedMascot?.formData}
                />
              </div>

              {/* Botão Salvar Alterações */}
              {generatedMascot && !isGeneratingMascot && (
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={handleSaveMascot}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-2"
                  >
                    ✨ {t('saveMascot')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}