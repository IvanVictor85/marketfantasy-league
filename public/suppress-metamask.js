// Global MetaMask error handling script
// This script runs before React loads to handle MetaMask errors gracefully

(function() {
  'use strict';
  
  // Store original console methods
  const originalError = console.error;
  const originalWarn = console.warn;
  
  // MetaMask error patterns to handle
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
  
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    const reason = String(event.reason || '');
    if (isMetaMaskError(reason)) {
      event.preventDefault();
      // Show user-friendly notification
      if (document.body) {
        showMetaMaskErrorNotification();
      } else {
        window.addEventListener('DOMContentLoaded', showMetaMaskErrorNotification);
      }
      return false;
    }
  });
  
  // Handle general errors
  window.addEventListener('error', function(event) {
    const message = event.message || '';
    if (isMetaMaskError(message)) {
      event.preventDefault();
      // Show user-friendly notification
      if (document.body) {
        showMetaMaskErrorNotification();
      } else {
        window.addEventListener('DOMContentLoaded', showMetaMaskErrorNotification);
      }
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