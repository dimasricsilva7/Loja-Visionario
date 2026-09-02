export function generateOrderNumber(): string {
  const digits = 100000 + Math.floor(Math.random() * 900000); // 6 dígitos, nunca "baixo"
  return `VIS${digits}`;
}
