import { describe, expect, it } from "vitest";
import { checkoutSchema, productSchema } from "./schemas";

describe("checkoutSchema", () => {
  const validCustomer = {
    name: "Maria da Silva",
    email: "maria@example.com",
    phone: "(11) 99999-9999",
    cpf: "529.982.247-25",
  };

  const validShipping = {
    cep: "01310-100",
    address: "Av. Paulista",
    number: "1000",
    neighborhood: "Bela Vista",
    city: "São Paulo",
    state: "sp",
  };

  it("accepts a valid checkout payload", () => {
    const result = checkoutSchema.safeParse({
      productSlug: "camiseta-oversized-preta",
      size: "M",
      customer: validCustomer,
      shipping: validShipping,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid CPF", () => {
    const result = checkoutSchema.safeParse({
      productSlug: "camiseta-oversized-preta",
      customer: { ...validCustomer, cpf: "111.111.111-11" },
      shipping: validShipping,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid phone", () => {
    const result = checkoutSchema.safeParse({
      productSlug: "camiseta-oversized-preta",
      customer: { ...validCustomer, phone: "123" },
      shipping: validShipping,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid CEP", () => {
    const result = checkoutSchema.safeParse({
      productSlug: "camiseta-oversized-preta",
      customer: validCustomer,
      shipping: { ...validShipping, cep: "123" },
    });
    expect(result.success).toBe(false);
  });

  it("never accepts a client-supplied price field (price must come from the database)", () => {
    expect("priceCents" in checkoutSchema.shape).toBe(false);
    expect("amountCents" in checkoutSchema.shape).toBe(false);
  });
});

describe("productSchema", () => {
  it("accepts a valid slug", () => {
    const result = productSchema.safeParse({
      name: "Camiseta",
      slug: "camiseta-preta",
      description: "desc",
      priceCents: 1000,
      image: "https://example.com/a.png",
      images: [],
      stock: 1,
    });
    expect(result.success).toBe(true);
  });

  it("rejects slugs with uppercase letters or spaces", () => {
    const result = productSchema.safeParse({
      name: "Camiseta",
      slug: "Camiseta Preta",
      description: "desc",
      priceCents: 1000,
      image: "https://example.com/a.png",
      images: [],
      stock: 1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-positive price", () => {
    const result = productSchema.safeParse({
      name: "Camiseta",
      slug: "camiseta-preta",
      description: "desc",
      priceCents: 0,
      image: "https://example.com/a.png",
      images: [],
      stock: 1,
    });
    expect(result.success).toBe(false);
  });
});
