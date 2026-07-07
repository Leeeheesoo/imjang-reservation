import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "session_user_id";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get(COOKIE_NAME)?.value;
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function setSessionUser(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
