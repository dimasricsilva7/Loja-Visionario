export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidCPF(rawCpf: string): boolean {
  const cpf = onlyDigits(rawCpf);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const calcDigit = (base: string, factorStart: number): number => {
    let sum = 0;
    for (let i = 0; i < base.length; i++) {
      sum += parseInt(base[i], 10) * (factorStart - i);
    }
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  const base9 = cpf.slice(0, 9);
  const digit1 = calcDigit(base9, 10);
  const digit2 = calcDigit(base9 + digit1, 11);

  return cpf === base9 + String(digit1) + String(digit2);
}

export function isValidBRPhone(rawPhone: string): boolean {
  const phone = onlyDigits(rawPhone);
  if (phone.length !== 10 && phone.length !== 11) return false;
  const ddd = parseInt(phone.slice(0, 2), 10);
  if (ddd < 11 || ddd > 99) return false;
  return true;
}

export function formatCPF(rawCpf: string): string {
  const cpf = onlyDigits(rawCpf).slice(0, 11);
  return cpf
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function formatBRPhone(rawPhone: string): string {
  const phone = onlyDigits(rawPhone).slice(0, 11);
  if (phone.length <= 10) {
    return phone
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  }
  return phone
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

export function isValidCEP(rawCep: string): boolean {
  return onlyDigits(rawCep).length === 8;
}

export function formatCEP(rawCep: string): string {
  const cep = onlyDigits(rawCep).slice(0, 8);
  return cep.replace(/(\d{5})(\d{1,3})$/, "$1-$2");
}

export const PRODUCT_SIZES = ["P", "M", "G", "GG", "G1"] as const;
export type ProductSize = (typeof PRODUCT_SIZES)[number];

export function maskCPF(rawCpf: string): string {
  const cpf = onlyDigits(rawCpf);
  if (cpf.length !== 11) return rawCpf;
  return `${cpf.slice(0, 3)}.***.***-${cpf.slice(9, 11)}`;
}
