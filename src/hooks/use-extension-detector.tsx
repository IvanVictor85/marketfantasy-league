'use client';

import { useState, useEffect } from 'react';

interface ExtensionDetectorResult {
  conflictDetected: boolean;
  hasMetaMask: boolean;
  hasPhantom: boolean;
  hasSolflare: boolean;
}

export function useExtensionDetector(): ExtensionDetectorResult {
  const [detectionResult, setDetectionResult] = useState<ExtensionDetectorResult>({
    conflictDetected: false,
    hasMetaMask: false,
    hasPhantom: false,
    hasSolflare: false,
  });

  useEffect(() => {
    // Check for browser extensions
    const checkExtensions = () => {
      const hasMetaMask = typeof window !== 'undefined' && 
        (window as any).ethereum && 
        (window as any).ethereum.isMetaMask;
      
      const hasPhantom = typeof window !== 'undefined' && 
        (window as any).solana && 
        (window as any).solana.isPhantom;
      
      const hasSolflare = typeof window !== 'undefined' && 
        (window as any).solflare && 
        (window as any).solflare.isSolflare;

      // Detect potential conflicts (having both Ethereum and Solana wallets)
      const conflictDetected = hasMetaMask && (hasPhantom || hasSolflare);

      setDetectionResult({
        conflictDetected,
        hasMetaMask,
        hasPhantom,
        hasSolflare,
      });
    };

    // Check immediately
    checkExtensions();

    // Check again after a short delay to catch late-loading extensions
    const timer = setTimeout(checkExtensions, 1000);

    return () => clearTimeout(timer);
  }, []);

  return detectionResult;
}