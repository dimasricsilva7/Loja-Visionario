import { cookies } from "next/headers";
import { createSessionHelpers } from "./session-core";
import { prisma } from "./prisma";

export const CUSTOMER_COOKIE_NAME = "customer_session";

const helpers = createSessionHelpers("ADMIN_SESSION_SECRET", 30 * 24 * 60 * 60); // 30 dias

export const createCustomerSessionToken = helpers.createToken;
export const verifyCustomerSessionToken = helpers.verifyToken;
export const CUSTOMER_SESSION_MAX_AGE = helpers.maxAge;

export async function getCustomerSession() {
  const store = await cookies();
  const token = store.get(CUSTOMER_COOKIE_NAME)?.value;
  return verifyCustomerSessionToken(token);
}

export async function getCurrentCustomer() {
  const session = await getCustomerSession();
  if (!session) return null;
  return prisma.customer.findUnique({ where: { id: session.sub } });
}
