// Global MetaMask error suppression script
// This script runs before React loads to prevent MetaMask errors from appearing

(function() {
  'use strict';
  
  // Store original console methods
  const originalError = console.error;
  const originalWarn = console.warn;
  
  // MetaMask error patterns to suppress
  const metamaskPatterns = [
    'MetaMask',
    'chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn',
    'Failed to connect to MetaMask',
    'inpage.js',
    'injected.js',
    'ethereum.request',
    'Object.connect',
    'async o',
    'scripts/inpage.js',
    'wallet connection failed'
  ];
  
  // Function to check if message contains MetaMask patterns
  function isMetaMaskError(message) {
    return metamaskPatterns.some(pattern => 
      String(message).toLowerCase().includes(pattern.toLowerCase())
    );
  }
  
  // Override console.error
  console.error = function(...args) {
    const message = args.join(' ');
    if (!isMetaMaskError(message)) {
      originalError.apply(console, args);
    }
  };
  
  // Override console.warn
  console.warn = function(...args) {
    const message = args.join(' ');
    if (!isMetaMaskError(message)) {
      originalWarn.apply(console, args);
    }
  };
  
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    const reason = String(event.reason || '');
    if (isMetaMaskError(reason)) {
      event.preventDefault();
      return false;
    }
  });
  
  // Handle general errors
  window.addEventListener('error', function(event) {
    const message = event.message || '';
    if (isMetaMaskError(message)) {
      event.preventDefault();
      return false;
    }
  });
  
  // Disable MetaMask auto-refresh on network change if present
  if (typeof window !== 'undefined' && window.ethereum?.isMetaMask) {
    try {
      window.ethereum.autoRefreshOnNetworkChange = false;
    } catch (e) {
      // Silently ignore
    }
  }
  
})();