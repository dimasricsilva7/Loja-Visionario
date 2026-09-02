import { NextResponse } from "next/server";
import { CUSTOMER_COOKIE_NAME } from "@/lib/customer-session";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(CUSTOMER_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return response;
}
