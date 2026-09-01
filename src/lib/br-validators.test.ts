import { describe, expect, it } from "vitest";
import { formatBRPhone, formatCPF, isValidBRPhone, isValidCPF, maskCPF } from "./br-validators";

describe("isValidCPF", () => {
  it("accepts a valid CPF", () => {
    expect(isValidCPF("529.982.247-25")).toBe(true);
  });

  it("rejects CPFs with all repeated digits", () => {
    expect(isValidCPF("111.111.111-11")).toBe(false);
  });

  it("rejects CPFs with wrong check digits", () => {
    expect(isValidCPF("529.982.247-26")).toBe(false);
  });

  it("rejects CPFs with wrong length", () => {
    expect(isValidCPF("123456")).toBe(false);
  });
});

describe("isValidBRPhone", () => {
  it("accepts an 11-digit mobile number", () => {
    expect(isValidBRPhone("(11) 99999-9999")).toBe(true);
  });

  it("accepts a 10-digit landline number", () => {
    expect(isValidBRPhone("(11) 3333-4444")).toBe(true);
  });

  it("rejects an invalid DDD", () => {
    expect(isValidBRPhone("(00) 99999-9999")).toBe(false);
  });

  it("rejects numbers with wrong length", () => {
    expect(isValidBRPhone("12345")).toBe(false);
  });
});

describe("formatting helpers", () => {
  it("formats CPF with mask", () => {
    expect(formatCPF("52998224725")).toBe("529.982.247-25");
  });

  it("formats an 11-digit phone with mask", () => {
    expect(formatBRPhone("11999999999")).toBe("(11) 99999-9999");
  });

  it("masks a CPF for display, keeping only first 3 and last 2 digits", () => {
    expect(maskCPF("52998224725")).toBe("529.***.***-25");
  });
});
