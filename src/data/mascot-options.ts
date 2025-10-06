// Opções disponíveis para customização do mascote

export const MASCOT_ANIMALS = [
  { id: 'dog', name: 'Cachorro', emoji: '🐕' },
  { id: 'cat', name: 'Gato', emoji: '🐱' },
  { id: 'lion', name: 'Leão', emoji: '🦁' },
  { id: 'eagle', name: 'Águia', emoji: '🦅' },
  { id: 'bear', name: 'Urso', emoji: '🐻' },
  { id: 'wolf', name: 'Lobo', emoji: '🐺' },
  { id: 'tiger', name: 'Tigre', emoji: '🐅' },
  { id: 'panda', name: 'Panda', emoji: '🐼' },
] as const;

export const MASCOT_COLORS = [
  { id: 'blue', name: 'Azul', hex: '#3B82F6' },
  { id: 'red', name: 'Vermelho', hex: '#EF4444' },
  { id: 'green', name: 'Verde', hex: '#10B981' },
  { id: 'yellow', name: 'Amarelo', hex: '#F59E0B' },
  { id: 'purple', name: 'Roxo', hex: '#8B5CF6' },
  { id: 'orange', name: 'Laranja', hex: '#F97316' },
  { id: 'pink', name: 'Rosa', hex: '#EC4899' },
  { id: 'gray', name: 'Cinza', hex: '#6B7280' },
  { id: 'black', name: 'Preto', hex: '#1F2937' },
  { id: 'white', name: 'Branco', hex: '#F9FAFB' },
] as const;

export const MASCOT_ACCESSORIES = {
  hats: [
    { id: 'none', name: 'Nenhum', emoji: '' },
    { id: 'cap', name: 'Boné', emoji: '🧢' },
    { id: 'crown', name: 'Coroa', emoji: '👑' },
    { id: 'helmet', name: 'Capacete', emoji: '⛑️' },
    { id: 'hat', name: 'Chapéu', emoji: '🎩' },
  ],
  glasses: [
    { id: 'none', name: 'Nenhum', emoji: '' },
    { id: 'sunglasses', name: 'Óculos de Sol', emoji: '🕶️' },
    { id: 'glasses', name: 'Óculos', emoji: '👓' },
    { id: 'goggles', name: 'Óculos Proteção', emoji: '🥽' },
  ],
  shoes: [
    { id: 'none', name: 'Nenhum', emoji: '' },
    { id: 'sneakers', name: 'Tênis', emoji: '👟' },
    { id: 'boots', name: 'Chuteiras', emoji: '🥾' },
    { id: 'cleats', name: 'Chuteiras Pro', emoji: '⚽' },
  ],
  extras: [
    { id: 'none', name: 'Nenhum', emoji: '' },
    { id: 'scarf', name: 'Cachecol', emoji: '🧣' },
    { id: 'medal', name: 'Medalha', emoji: '🏅' },
    { id: 'whistle', name: 'Apito', emoji: '🔔' },
  ],
} as const;

export const MASCOT_POSES = [
  { id: 'default', name: 'Padrão', description: 'Pose normal' },
  { id: 'celebrating', name: 'Comemorando', description: 'Braços para cima' },
  { id: 'playing', name: 'Jogando', description: 'Chutando a bola' },
  { id: 'thinking', name: 'Pensando', description: 'Mão no queixo' },
  { id: 'strong', name: 'Forte', description: 'Mostrando músculos' },
] as const;

export const DEFAULT_MASCOT = {
  animal: 'dog',
  colors: {
    primary: '#3B82F6',
    secondary: '#1E40AF',
    accent: '#F59E0B',
  },
  accessories: {
    hat: 'none',
    glasses: 'none',
    shoes: 'cleats',
    extra: 'none',
  },
  shirt: 'football',
  pose: 'default',
  ball: true,
} as const;