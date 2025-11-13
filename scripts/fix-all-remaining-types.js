const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo todos os tipos restantes...\n');

// ============================================================
// FIX 1: useTeamData.ts - Padronizar TeamPlayer
// ============================================================
console.log('📋 FIX 1: Padronizando TeamPlayer em useTeamData.ts...');
const useTeamDataPath = path.join(__dirname, '..', 'src/hooks/useTeamData.ts');
let useTeamDataContent = fs.readFileSync(useTeamDataPath, 'utf8');

const oldTeamPlayer = `export interface TeamPlayer {
  id: string;
  position: number;
  name: string;
  token: string;
  symbol?: string; // NEW standardized field
  image: string;
  // NEW standardized field names
  currentPrice?: number;
  priceChange24h?: number;
  priceChange7d?: number;
  // OLD field names (for compatibility)
  price: number;
  points: number;
  rarity: string;
  change_24h: number;
  change_7d: number;
}`;

const newTeamPlayer = `export interface TeamPlayer {
  id: string;
  position: number;
  name: string;
  symbol: string; // ✅ Símbolo do token (ex: BTC, ETH, SOL)
  image: string;
  // Campos de preço e mercado (padronizados)
  currentPrice: number;
  priceChange24h: number;
  priceChange7d: number;
  marketCap: number;
  marketCapRank: number | null;
  // Campos do jogo
  points: number;
  rarity: string;
}`;

useTeamDataContent = useTeamDataContent.replace(oldTeamPlayer, newTeamPlayer);

// Atualizar o mapeamento de campos no useEffect
const oldMapping = `          const mappedPlayers = (data.tokenDetails || data.team.tokenDetails || []).map((token: any) => ({
            ...token,
            // Ensure new standardized field names
            symbol: token.symbol || token.token,
            currentPrice: token.currentPrice || token.price || 0,
            priceChange24h: token.priceChange24h || token.change_24h || 0,
            priceChange7d: token.priceChange7d || token.change_7d || 0,
            // Ensure old field names for backward compatibility
            token: token.token || token.symbol,
            price: token.price || token.currentPrice || 0,
            change_24h: token.change_24h || token.priceChange24h || 0,
            change_7d: token.change_7d || token.priceChange7d || 0,
          }));`;

const newMapping = `          const mappedPlayers = (data.tokenDetails || data.team.tokenDetails || []).map((token: any) => ({
            ...token,
            symbol: token.symbol || token.token,
            currentPrice: token.currentPrice || token.price || 0,
            priceChange24h: token.priceChange24h || token.change_24h || 0,
            priceChange7d: token.priceChange7d || token.change_7d || 0,
            marketCap: token.marketCap || token.market_cap || 0,
            marketCapRank: token.marketCapRank || token.market_cap_rank || null,
          }));`;

useTeamDataContent = useTeamDataContent.replace(oldMapping, newMapping);

fs.writeFileSync(useTeamDataPath, useTeamDataContent, 'utf8');
console.log('✅ TeamPlayer padronizado');

// ============================================================
// FIX 2: teams-content.tsx - Remover campos antigos
// ============================================================
console.log('\n📋 FIX 2: Corrigindo teams-content.tsx...');
const teamsContentPath = path.join(__dirname, '..', 'src/app/[locale]/teams/teams-content.tsx');
let teamsContent = fs.readFileSync(teamsContentPath, 'utf8');

// Remover referências a player.price
teamsContent = teamsContent.replace(/player\.price/g, 'player.currentPrice');

// Remover referências a player.change_24h
teamsContent = teamsContent.replace(/player\.change_24h/g, 'player.priceChange24h');

// Remover referências a player.change_7d
teamsContent = teamsContent.replace(/player\.change_7d/g, 'player.priceChange7d');

// Remover campo "price:" dos objetos Player
teamsContent = teamsContent.replace(/price: tokenData\.(price|currentPrice)[^,]*,?\s*/g, '');

// Remover campos change_24h e change_7d dos objetos Player
teamsContent = teamsContent.replace(/change_24h: [^,\n]*,?\s*/g, '');
teamsContent = teamsContent.replace(/change_7d: [^,\n]*,?\s*/g, '');

fs.writeFileSync(teamsContentPath, teamsContent, 'utf8');
console.log('✅ teams-content.tsx corrigido (substituído .price, .change_24h, .change_7d)');

console.log('\n✨ Todos os tipos padronizados!');
console.log('\n📋 Alterações:');
console.log('   ✅ TeamPlayer agora usa campos padronizados');
console.log('   ✅ teams-content.tsx usa currentPrice, priceChange24h, priceChange7d');
console.log('   ✅ Removidos campos antigos: token, price, change_24h, change_7d');
