'use client';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

interface MascotImagePreviewProps {
  imageUrl?: string;
  isGenerating: boolean;
  className?: string;
}

export function MascotImagePreview({ 
  imageUrl, 
  isGenerating, 
  className = "" 
}: MascotImagePreviewProps) {
  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        {/* Área de Imagem */}
        <div className="relative w-64 h-64 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 flex items-center justify-center overflow-hidden">
          {isGenerating ? (
            // Estado de Loading
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                {/* Spinner animado */}
                <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">
                  Gerando sua nova obra de arte...
                </p>
                <div className="flex justify-center mt-2">
                  <Skeleton className="h-2 w-32" />
                </div>
              </div>
            </div>
          ) : imageUrl ? (
            // Imagem Atual
            <div className="relative w-full h-full">
              <Image
                src={imageUrl}
                alt="Mascote personalizado"
                fill
                className="object-cover rounded-lg"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              {/* Overlay com informações */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 rounded-b-lg">
                <p className="text-white text-xs font-medium">
                  Seu Mascote da Sorte
                </p>
              </div>
            </div>
          ) : (
            // Placeholder
            <div className="flex flex-col items-center space-y-3 text-center">
              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                <svg 
                  className="w-8 h-8 text-orange-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Nenhum mascote criado ainda
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Preencha o formulário abaixo para gerar seu mascote
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Informações adicionais */}
        {imageUrl && !isGenerating && (
          <div className="text-center space-y-1">
            <p className="text-xs text-muted-foreground">
              ✨ Mascote gerado com IA
            </p>
            <p className="text-xs text-orange-600 font-medium">
              Clique em "Salvar Alterações" para confirmar
            </p>
          </div>
        )}

        {isGenerating && (
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Isso pode levar alguns segundos...
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}