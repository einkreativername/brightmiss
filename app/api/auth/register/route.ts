import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { signIn } from "@/lib/auth"

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = registerSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0].message },
        { status: 400 }
      )
    }

    const { name, email, password } = validated.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user and profile
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "SUB",
        profile: {
          create: {},
        },
      },
      include: {
        profile: true,
      },
    })

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Registration error:", error);
    let errorMessage = "Internal server error";
    if (error.code === 'P2002') { // Unique constraint violation
      errorMessage = "User with this email already exists.";
      return NextResponse.json({ error: errorMessage }, { status: 409 }); // Conflict
    } else if (error.name === 'PrismaClientInitializationError') {
      errorMessage = "Database connection error. Please try again later.";
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
