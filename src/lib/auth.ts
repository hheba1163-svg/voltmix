import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import prisma from "@/lib/prisma";

export const COOKIE_NAME = "voltmix_admin";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "voltmix-dev-secret-change-me"
);

export type SessionUser = {
  id: string;
  email: string;
};

export async function createAdminSession(user: SessionUser) {
  const cookieStore = await cookies();
  const token = await new SignJWT({
    sub: user.id,
    email: user.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  cookieStore.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentAdmin(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const admin = await prisma.admin.findUnique({
      where: { id: String(payload.sub) },
      select: { id: true, email: true },
    });

    if (!admin) {
      return null;
    }

    return { id: admin.id, email: admin.email };
  } catch {
    return null;
  }
}

export async function requireAdminSession() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    throw new Error("UNAUTHORIZED");
  }
  return admin;
}
