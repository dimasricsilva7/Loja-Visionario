export function generateOrderNumber(storeName: string): string {
  const prefix = (storeName.replace(/[^a-zA-Z]/g, "").slice(0, 5) || "PED").toUpperCase();
  const digits = 10000 + Math.floor(Math.random() * 90000); // 5 dígitos, nunca "baixo"
  return `${prefix}${digits}`;
}
