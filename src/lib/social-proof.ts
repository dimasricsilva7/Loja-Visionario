// Números e nomes usados apenas para efeito visual de urgência/prova social,
// a pedido explícito do lojista — não representam dados reais de clientes.

const FIRST_NAMES = [
  "João", "Maria", "Pedro", "Ana", "Lucas", "Beatriz", "Gabriel", "Larissa",
  "Rafael", "Camila", "Thiago", "Fernanda", "Bruno", "Juliana", "Marcos",
  "Amanda", "Felipe", "Patrícia", "Gustavo", "Carla",
];

const CITIES = [
  "São Paulo, SP", "Rio de Janeiro, RJ", "Belo Horizonte, MG", "Curitiba, PR",
  "Porto Alegre, RS", "Salvador, BA", "Fortaleza, CE", "Recife, PE",
  "Sorocaba, SP", "Campinas, SP", "Goiânia, GO", "Florianópolis, SC",
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Número pseudo-estável de "pessoas vendo agora" para um produto, varia pouco por dia. */
export function getViewingNowCount(productId: string): number {
  const day = new Date().toISOString().slice(0, 10);
  const seed = hashString(productId + day);
  return 8000 + (seed % 55000);
}

/** Número pseudo-estável de "vendidos recentemente" para um produto. */
export function getRecentlySoldCount(productId: string): number {
  const day = new Date().toISOString().slice(0, 10);
  const seed = hashString(productId + day + "sold");
  return 300 + (seed % 3000);
}

export function getFakeRating(productId: string): { rating: number; reviews: number } {
  const seed = hashString(productId + "rating");
  const rating = 4.6 + (seed % 4) / 10; // 4.6 a 4.9
  const reviews = 12 + (seed % 220);
  return { rating: Math.round(rating * 10) / 10, reviews };
}

export interface FakePurchaseEvent {
  name: string;
  city: string;
  minutesAgo: number;
}

export function generateFakePurchaseEvent(seed: number): FakePurchaseEvent {
  const name = FIRST_NAMES[seed % FIRST_NAMES.length];
  const city = CITIES[(seed * 7) % CITIES.length];
  const minutesAgo = 1 + (seed % 12);
  return { name, city, minutesAgo };
}
