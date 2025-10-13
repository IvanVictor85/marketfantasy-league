import React, { Suspense } from 'react';
import { TeamsContent } from './teams-content';

function LoadingFallback() {
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

export default function TeamsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TeamsContent />
    </Suspense>
  );
}