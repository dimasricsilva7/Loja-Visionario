import { NextResponse } from "next/server";
import { getCurrentCustomer } from "./customer-session";

export async function requireCustomerApi() {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return { customer: null, response: NextResponse.json({ error: "Não autenticado" }, { status: 401 }) };
  }
  return { customer, response: null };
}
