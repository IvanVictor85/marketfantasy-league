import {prisma} from './src/lib/prisma.js';
const r = await prisma.priceHistory.deleteMany({where:{tokenSymbol:'COINGECKO_CACHE'}});
console.log('Cache limpo:', r.count);
await prisma.$disconnect();
