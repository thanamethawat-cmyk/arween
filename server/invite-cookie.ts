"use server";

import { cookies } from "next/headers";
import { INVITE_COOKIE_NAME, INVITE_EXPIRY_DAYS } from "@/types/schemas";

export async function setInviteCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set(INVITE_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: INVITE_EXPIRY_DAYS * 24 * 60 * 60,
  });
}

export async function clearInviteCookie() {
  const cookieStore = cookies();
  cookieStore.delete(INVITE_COOKIE_NAME);
}
