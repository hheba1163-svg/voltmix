import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createAdminSession, getCurrentAdmin } from "@/lib/auth";
import { ensureSeedData, syncConfiguredAdmin } from "@/lib/seed";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({ email: "", password: "" }));
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!email || !password) {
    return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
  }

  try {
    await ensureSeedData();
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "ADMIN_PASSWORD must be configured before the production admin account is created."
    ) {
      return NextResponse.json(
        { message: "Admin login is not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD in the production environment." },
        { status: 503 }
      );
    }
    throw error;
  }

  let admin = await prisma.admin.findUnique({ where: { email } });
  let valid = admin ? await compare(password, admin.passwordHash) : false;

  if (!valid) {
    const configuredAdmin = await syncConfiguredAdmin(email, password);
    if (configuredAdmin) {
      admin = configuredAdmin;
      valid = true;
    }
  }

  if (!admin || !valid) {
    return NextResponse.json({ message: "Invalid username or password." }, { status: 401 });
  }

  await createAdminSession({ id: admin.id, email: admin.email });
  return NextResponse.json({ message: "Login successful." });
}

export async function GET() {
  const admin = await getCurrentAdmin();
  return NextResponse.json({ authenticated: !!admin });
}
