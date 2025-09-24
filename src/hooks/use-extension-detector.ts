'use client';

import { useEffect, useState } from 'react';

interface ExtensionDetection {
  hasMetaMask: boolean;
  hasPhantom: boolean;
  hasSolflare: boolean;
  conflictDetected: boolean;
}

export function useExtensionDetector(): ExtensionDetection {
  const [detection, setDetection] = useState<ExtensionDetection>({
    hasMetaMask: false,
    hasPhantom: false,
    hasSolflare: false,
    conflictDetected: false,
  });

  useEffect(() => {
    const detectExtensions = () => {
      const hasMetaMask = typeof window !== 'undefined' && 
        (window as any).ethereum?.isMetaMask;
      
      const hasPhantom = typeof window !== 'undefined' && 
        (window as any).solana?.isPhantom;
      
      const hasSolflare = typeof window !== 'undefined' && 
        (window as any).solflare?.isSolflare;

      // Detect potential conflicts
      const conflictDetected = hasMetaMask && (hasPhantom || hasSolflare);

      setDetection({
        hasMetaMask,
        hasPhantom,
        hasSolflare,
        conflictDetected,
      });

      // Aggressively suppress MetaMask errors
      if (hasMetaMask) {
        // Override console.error to filter MetaMask errors
        const originalError = console.error;
        const originalWarn = console.warn;
        
        console.error = (...args: any[]) => {
          const message = args.join(' ');
          if (
            message.includes('MetaMask') ||
            message.includes('chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn') ||
            message.includes('Failed to connect to MetaMask') ||
            message.includes('inpage.js') ||
            message.includes('injected.js') ||
            message.includes('ethereum.request') ||
            message.includes('wallet connection failed')
          ) {
            // Silently ignore MetaMask errors
            return;
          }
          originalError.apply(console, args);
        };
        
        console.warn = (...args: any[]) => {
          const message = args.join(' ');
          if (
            message.includes('MetaMask') ||
            message.includes('chrome-extension') ||
            message.includes('ethereum')
          ) {
            // Silently ignore MetaMask warnings
            return;
          }
          originalWarn.apply(console, args);
        };
        
        // Block unhandled promise rejections from MetaMask
        window.addEventListener('unhandledrejection', (event) => {
          if (event.reason && 
              (String(event.reason).includes('MetaMask') ||
               String(event.reason).includes('chrome-extension') ||
               String(event.reason).includes('Failed to connect'))) {
            event.preventDefault();
          }
        });
      }
    };

    // Run detection immediately
    detectExtensions();

    // Run detection after a short delay to catch late-loading extensions
    const timer = setTimeout(detectExtensions, 1000);

    return () => clearTimeout(timer);
  }, []);

  return detection;
}