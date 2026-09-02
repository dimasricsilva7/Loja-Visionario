import { z } from "zod";
import { isValidBRPhone, isValidCEP, isValidCPF, onlyDigits, PRODUCT_SIZES } from "./br-validators";

export const utmSchema = z.object({
  source: z.string().max(200).optional().nullable(),
  medium: z.string().max(200).optional().nullable(),
  campaign: z.string().max(200).optional().nullable(),
  content: z.string().max(200).optional().nullable(),
  term: z.string().max(200).optional().nullable(),
  fbclid: z.string().max(500).optional().nullable(),
  ttclid: z.string().max(500).optional().nullable(),
  gclid: z.string().max(500).optional().nullable(),
});

export const shippingAddressSchema = z.object({
  cep: z
    .string()
    .transform(onlyDigits)
    .refine(isValidCEP, "CEP inválido"),
  address: z.string().trim().min(3, "Endereço muito curto").max(200),
  number: z.string().trim().min(1, "Informe o número").max(20),
  complement: z.string().trim().max(100).optional().nullable(),
  neighborhood: z.string().trim().min(1, "Informe o bairro").max(120),
  city: z.string().trim().min(1, "Informe a cidade").max(120),
  state: z
    .string()
    .trim()
    .length(2, "Use a sigla do estado (ex: SP)")
    .transform((s) => s.toUpperCase()),
});

export const checkoutSchema = z.object({
  productSlug: z.string().min(1),
  size: z.enum(PRODUCT_SIZES).optional().nullable(),
  paymentPlan: z.enum(["AVISTA", "PARCELADO"]).default("AVISTA"),
  customer: z.object({
    name: z.string().trim().min(3, "Nome muito curto").max(150),
    email: z.string().trim().email("E-mail inválido").max(150),
    phone: z
      .string()
      .transform(onlyDigits)
      .refine(isValidBRPhone, "Telefone inválido"),
    cpf: z
      .string()
      .transform(onlyDigits)
      .refine(isValidCPF, "CPF inválido"),
  }),
  shipping: shippingAddressSchema,
  utm: utmSchema.optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const adminLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
});

export const customerRegisterSchema = z.object({
  name: z.string().trim().min(3, "Nome muito curto").max(150),
  email: z.string().trim().toLowerCase().email("E-mail inválido").max(150),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres").max(100),
  cpf: z.string().transform(onlyDigits).refine(isValidCPF, "CPF inválido"),
  phone: z.string().transform(onlyDigits).refine(isValidBRPhone, "Telefone inválido"),
  cep: z.string().transform(onlyDigits).refine(isValidCEP, "CEP inválido").optional().or(z.literal("")),
  address: z.string().trim().max(200).optional(),
  number: z.string().trim().max(20).optional(),
  complement: z.string().trim().max(100).optional(),
  neighborhood: z.string().trim().max(120).optional(),
  city: z.string().trim().max(120).optional(),
  state: z.string().trim().max(2).optional(),
});

export const customerLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const productSchema = z.object({
  name: z.string().trim().min(2).max(150),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(150)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
  description: z.string().trim().min(1),
  priceCents: z.number().int().positive(),
  compareAtPriceCents: z.number().int().positive().nullable().optional(),
  image: z.string().trim().min(1),
  images: z.array(z.string().trim().min(1)).default([]),
  badge: z.string().trim().max(40).nullable().optional(),
  badgeColor: z.string().trim().max(30).nullable().optional(),
  stock: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  category: z.string().trim().min(1).max(60).default("Geral"),
  installments: z.number().int().min(1).max(24).default(1),
  productIdBravoPay: z.string().trim().max(150).nullable().optional(),
  relatedProductIds: z.array(z.string()).max(4).optional(),
});

export type ProductInput = z.infer<typeof productSchema>;
