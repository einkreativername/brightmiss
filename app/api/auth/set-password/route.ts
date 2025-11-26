import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const setPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = setPasswordSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      )
    }

    const { token, password } = validated.data

    // Find the invite token
    const inviteToken = await prisma.inviteToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!inviteToken) {
      return NextResponse.json(
        { error: "Invalid or expired invite token" },
        { status: 400 }
      )
    }

    // Check if token is already used
    if (inviteToken.used) {
      return NextResponse.json(
        { error: "This invite has already been used" },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (new Date() > inviteToken.expiresAt) {
      return NextResponse.json(
        { error: "This invite has expired" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update user password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: inviteToken.userId },
        data: {
          password: hashedPassword,
          isInvited: false,
        },
      }),
      prisma.inviteToken.update({
        where: { id: inviteToken.id },
        data: { used: true },
      }),
    ])

    return NextResponse.json(
      { message: "Password set successfully. You can now log in." },
      { status: 200 }
    )
  } catch (error) {
    console.error("Set password error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
