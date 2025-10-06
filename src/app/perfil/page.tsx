'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/auth-context';
import { MascotImagePreview } from '@/components/mascot/mascot-image-preview';
import { MascotCustomizationForm, MascotFormData } from '@/components/mascot/mascot-customization-form';
import Link from 'next/link';
import Image from 'next/image';

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
  const { user, updateUserProfile } = useAuth();

  const [twitter, setTwitter] = useState<string>('');
  const [discord, setDiscord] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [generatedMascot, setGeneratedMascot] = useState<GeneratedMascot | null>(null);
  const [isGeneratingMascot, setIsGeneratingMascot] = useState<boolean>(false);
  const [mascotError, setMascotError] = useState<string | null>(null);
  const [saved, setSaved] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'mascot'>('profile');
  const [savedMascot, setSavedMascot] = useState<GeneratedMascot | null>(null);

  useEffect(() => {
    if (user) {
      setTwitter(user.twitter || '');
      setDiscord(user.discord || '');
      setBio(user.bio || '');
      // Carregar mascote salvo do localStorage
      const savedMascotData = localStorage.getItem(`savedMascot_${user.id}`);
      if (savedMascotData) {
        try {
          const mascot = JSON.parse(savedMascotData);
          setSavedMascot(mascot);
        } catch (error) {
          console.error('Erro ao carregar mascote salvo:', error);
        }
      }
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Salva dados do perfil e mascote gerado (se houver)
    const profileData: any = { twitter, discord, bio };
    if (generatedMascot) {
      profileData.generatedMascot = generatedMascot;
    }
    
    updateUserProfile(profileData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
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

  const handleSaveMascot = () => {
    if (generatedMascot && user) {
      // Salvar no localStorage
      localStorage.setItem(`savedMascot_${user.id}`, JSON.stringify(generatedMascot));
      setSavedMascot(generatedMascot);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Editar Perfil</h1>
        <Link href="/dashboard" prefetch={false} className="text-sm text-orange-700 hover:underline">Voltar ao Dashboard</Link>
      </div>

      {saved && (
        <Alert className="mb-6">
          <AlertTitle>Perfil atualizado</AlertTitle>
          <AlertDescription>
            Suas informações foram salvas com sucesso.
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
            📝 Informações
          </Button>
          <Button
            variant={activeTab === 'mascot' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('mascot')}
          >
            🎨 Personalizar Mascote
          </Button>
        </div>
      </div>

      {/* Content Area */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Exibição do Mascote Salvo */}
          {savedMascot && (
            <Card>
              <CardHeader>
                <CardTitle>Seu Mascote da Sorte</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-64 h-64 relative">
                    <Image
                      src={savedMascot.imageUrl}
                      alt="Seu Mascote da Sorte"
                      fill
                      className="object-cover rounded-lg border-2 border-orange-200"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      <strong>Personagem:</strong> {savedMascot.character}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Uniforme:</strong> {savedMascot.uniformStyle}
                    </p>
                    {savedMascot.accessory && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Acessório:</strong> {savedMascot.accessory}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Informações Públicas</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="twitter">X (Twitter)</Label>
                  <Input 
                    id="twitter" 
                    value={twitter} 
                    onChange={(e) => setTwitter(e.target.value)} 
                    placeholder="@seuusuario ou URL do perfil"
                  />
                  <p className="text-xs text-muted-foreground">Opcional. Ex.: @cryptofan ou https://x.com/cryptofan</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discord">Discord</Label>
                  <Input 
                    id="discord" 
                    value={discord} 
                    onChange={(e) => setDiscord(e.target.value)} 
                    placeholder="usuario#1234 ou nome do servidor"
                  />
                  <p className="text-xs text-muted-foreground">Opcional. Seu usuário ou link de servidor.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Biografia</Label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Conte sobre você, seu time e sua jornada cripto..."
                    className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                  <p className="text-xs text-muted-foreground">Máximo recomendado: 300 caracteres.</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700">Salvar alterações</Button>
                <Button type="button" variant="secondary" onClick={() => {
                  setTwitter(user?.twitter || '');
                  setDiscord(user?.discord || '');
                  setBio(user?.bio || '');
                }}>Cancelar</Button>
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
                <h2 className="text-2xl font-bold">Personalize seu Mascote da Sorte</h2>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Layout de Coluna Única */}
              
              {/* Exibição de Erro */}
              {mascotError && (
                <Alert variant="destructive">
                  <AlertTitle>Erro na Geração do Mascote</AlertTitle>
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
                    ✨ Salvar Alterações
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