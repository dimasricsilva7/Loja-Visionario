import { cookies } from "next/headers";
import { createSessionHelpers } from "./session-core";

export const ADMIN_COOKIE_NAME = "admin_session";

const helpers = createSessionHelpers("ADMIN_SESSION_SECRET", 8 * 60 * 60); // 8 horas

export const createSessionToken = helpers.createToken;
export const verifySessionToken = helpers.verifyToken;
export const SESSION_MAX_AGE = helpers.maxAge;

export async function getAdminSession() {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}
