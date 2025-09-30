import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="pt-BR">
      <Head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Bloqueio simplificado do MetaMask
              (function() {
                // Interceptar console.error, console.warn e console.log
                const originalError = console.error;
                const originalWarn = console.warn;
                const originalLog = console.log;

                // Padrões de erro do MetaMask para bloquear
                const metamaskPatterns = [
                  'MetaMask',
                  'metamask',
                  'ethereum',
                  'Failed to connect',
                  'Cannot redefine property',
                  'inpage.js',
                  'chrome-extension'
                ];

                // Função para verificar se a mensagem contém padrões do MetaMask
                function containsMetaMaskPattern(args) {
                  if (!args || args.length === 0) return false;
                  
                  return args.some(arg => {
                    if (arg === null || arg === undefined) return false;
                    const argStr = typeof arg === 'string' ? arg : String(arg);
                    return metamaskPatterns.some(pattern => argStr.includes(pattern));
                  });
                }

                // Sobrescrever console.error
                console.error = function() {
                  if (!containsMetaMaskPattern(Array.from(arguments))) {
                    originalError.apply(console, arguments);
                  }
                };

                // Sobrescrever console.warn
                console.warn = function() {
                  if (!containsMetaMaskPattern(Array.from(arguments))) {
                    originalWarn.apply(console, arguments);
                  }
                };

                // Sobrescrever console.log
                console.log = function() {
                  if (!containsMetaMaskPattern(Array.from(arguments))) {
                    originalLog.apply(console, arguments);
                  }
                };

                // Criar um objeto ethereum simples para evitar erros
                if (typeof window !== 'undefined' && !window.ethereum) {
                  window.ethereum = {
                    isMetaMask: false,
                    request: () => Promise.reject(new Error('MetaMask não disponível')),
                    on: () => {},
                    removeListener: () => {}
                  };
                }
              })();
            `,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}