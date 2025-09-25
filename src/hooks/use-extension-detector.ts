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

      // Aggressively suppress MetaMask errors and prevent auto-connection
      if (typeof window !== 'undefined') {
        // Disable MetaMask auto-detection for Solana apps
        if ((window as any).ethereum?.isMetaMask) {
          try {
            // Prevent MetaMask from auto-connecting
            (window as any).ethereum.autoRefreshOnNetworkChange = false;
            (window as any).ethereum._metamask = { ...((window as any).ethereum._metamask || {}), isUnlocked: false };
          } catch (e) {
            // Silently ignore if we can't modify MetaMask
          }
        }

        // Override console methods to filter MetaMask errors
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
            message.includes('wallet connection failed') ||
            message.includes('Object.connect') ||
            message.includes('async o') ||
            message.includes('scripts/inpage.js')
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
            message.includes('ethereum') ||
            message.includes('inpage.js')
          ) {
            // Silently ignore MetaMask warnings
            return;
          }
          originalWarn.apply(console, args);
        };
        
        // Block unhandled promise rejections from MetaMask
        const handleRejection = (event: PromiseRejectionEvent) => {
          const reason = String(event.reason || '');
          if (
            reason.includes('MetaMask') ||
            reason.includes('chrome-extension') ||
            reason.includes('Failed to connect') ||
            reason.includes('inpage.js') ||
            reason.includes('Object.connect') ||
            reason.includes('ethereum.request')
          ) {
            event.preventDefault();
            return false;
          }
        };

        window.addEventListener('unhandledrejection', handleRejection);
        
        // Also handle errors that might bubble up
        window.addEventListener('error', (event) => {
          const message = event.message || '';
          if (
            message.includes('MetaMask') ||
            message.includes('chrome-extension') ||
            message.includes('inpage.js')
          ) {
            event.preventDefault();
            return false;
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