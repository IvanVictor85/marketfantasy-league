// Global MetaMask error handling script
// This script runs before React loads to handle MetaMask errors gracefully

(function() {
  'use strict';
  
  // Store original console methods
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;
  
  // MetaMask error patterns to handle - expanded to catch more patterns
  const metamaskPatterns = [
    'MetaMask',
    'chrome-extension://',
    'Failed to connect',
    'inpage.js',
    'injected.js',
    'ethereum',
    'Object.connect',
    'async o',
    'scripts/inpage',
    'wallet connection',
    'provider',
    'web3',
    'nkbihfbeogaeaoehlefnkodbefgpgknn',
    'Call Stack',
    'Cannot redefine property'
  ];
  
  // Function to check if message contains MetaMask patterns
  function isMetaMaskError(message) {
    return metamaskPatterns.some(pattern => 
      String(message).toLowerCase().includes(pattern.toLowerCase())
    );
  }

  // Create a global variable to track if we've shown the error notification
  window.__metamaskErrorShown = false;

  // Function to show a user-friendly error notification
  function showMetaMaskErrorNotification() {
    // Only show the notification once
    if (window.__metamaskErrorShown) return;
    window.__metamaskErrorShown = true;

    // Create notification element
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.backgroundColor = '#f8f9fa';
    notification.style.color = '#212529';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '8px';
    notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    notification.style.zIndex = '9999';
    notification.style.maxWidth = '350px';
    notification.style.display = 'flex';
    notification.style.flexDirection = 'column';
    notification.style.gap = '10px';
    notification.style.fontSize = '14px';
    notification.style.border = '1px solid #dee2e6';

    // Add content
    notification.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px;">
        <strong style="font-size: 16px;">Aviso de Carteira</strong>
        <button id="close-metamask-notification" style="background: none; border: none; cursor: pointer; font-size: 18px;">&times;</button>
      </div>
      <p style="margin: 0;">Este aplicativo usa a blockchain <strong>Solana</strong> e não é compatível com MetaMask.</p>
      <p style="margin: 0;">Por favor, use a carteira <strong>Phantom</strong> para interagir com este aplicativo.</p>
      <a href="https://phantom.app/" target="_blank" style="display: inline-block; background: linear-gradient(to right, #9945FF, #14F195); color: white; padding: 8px 12px; border-radius: 6px; text-decoration: none; margin-top: 5px; text-align: center;">Instalar Phantom</a>
    `;

    // Add to document
    document.body.appendChild(notification);

    // Add close button functionality
    document.getElementById('close-metamask-notification').addEventListener('click', function() {
      notification.remove();
    });

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.remove();
      }
    }, 10000);
  }
  
  // Override console.error
  console.error = function(...args) {
    const message = args.join(' ');
    if (isMetaMaskError(message)) {
      // Show user-friendly notification instead of console error
      if (document.body) {
        showMetaMaskErrorNotification();
      } else {
        // If document.body is not ready yet, wait for it
        window.addEventListener('DOMContentLoaded', showMetaMaskErrorNotification);
      }
      return;
    }
    originalError.apply(console, args);
  };
  
  // Override console.warn
  console.warn = function(...args) {
    const message = args.join(' ');
    if (isMetaMaskError(message)) {
      return;
    }
    originalWarn.apply(console, args);
  };
  
  // Override console.log to catch MetaMask errors that might be logged
  console.log = function(...args) {
    const message = args.join(' ');
    if (isMetaMaskError(message)) {
      return;
    }
    originalLog.apply(console, args);
  };
  
  // Handle unhandled promise rejections - captura mais agressivamente
  window.addEventListener('unhandledrejection', function(event) {
    const reason = String(event.reason || '');
    const stack = event.reason?.stack || '';
    
    if (isMetaMaskError(reason) || isMetaMaskError(stack)) {
      event.preventDefault();
      event.stopPropagation();
      // Show user-friendly notification
      if (document.body) {
        showMetaMaskErrorNotification();
      } else {
        window.addEventListener('DOMContentLoaded', showMetaMaskErrorNotification);
      }
      return false;
    }
  }, true);
  
  // Handle general errors
  window.addEventListener('error', function(event) {
    const message = event.message || '';
    const stack = event.error?.stack || '';
    if (isMetaMaskError(message) || isMetaMaskError(stack)) {
      event.preventDefault();
      event.stopPropagation();
      // Show user-friendly notification
      if (document.body) {
        showMetaMaskErrorNotification();
      } else {
        window.addEventListener('DOMContentLoaded', showMetaMaskErrorNotification);
      }
      return false;
    }
  }, true);
  
  // Interceptar e bloquear scripts do MetaMask
  const originalCreateElement = document.createElement;
  document.createElement = function(tagName) {
    const element = originalCreateElement.call(document, tagName);
    
    if (tagName.toLowerCase() === 'script') {
      const originalSetAttribute = element.setAttribute;
      element.setAttribute = function(name, value) {
        if (name === 'src' && isMetaMaskError(value)) {
          // Bloquear carregamento de scripts do MetaMask
          return;
        }
        return originalSetAttribute.call(this, name, value);
      };
    }
    
    return element;
  };
  
  // Prevenir detecção de MetaMask pelo WalletModalProvider
  if (typeof window !== 'undefined') {
    // Interceptar Object.defineProperty para prevenir definição de ethereum
    const originalDefineProperty = Object.defineProperty;
    Object.defineProperty = function(obj, prop, descriptor) {
      // Se tentando definir 'ethereum' com MetaMask, ignorar
      if (obj === window && prop === 'ethereum' && descriptor.value?.isMetaMask) {
        console.log('🚫 Blocked MetaMask ethereum injection');
        return obj;
      }
      return originalDefineProperty.call(this, obj, prop, descriptor);
    };

    // Se ethereum já existe e é MetaMask, tentar mascarar
    if (window.ethereum?.isMetaMask) {
      try {
        // Redefinir como propriedade configurável
        delete window.ethereum;

        // Definir um ethereum falso somente Phantom
        Object.defineProperty(window, 'ethereum', {
          get: function() {
            return window.solana || {
              isPhantom: false,
              request: () => Promise.resolve(null),
              on: () => {},
              removeListener: () => {},
            };
          },
          configurable: true
        });
      } catch (e) {
        console.warn('Could not override window.ethereum:', e);
      }
    }
  }

})();