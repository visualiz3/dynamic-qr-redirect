import { NextResponse } from "next/server";
import { verifyPassword, createSession, logout } from "@/lib/auth";

export async function POST(request: Request) {
  const { password } = await request.json();

  if (!verifyPassword(password)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  await createSession();
  return NextResponse.json({ success: true });
}

export async function DELETE() {
  await logout();
  return NextResponse.json({ success: true });
}
