import { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: "ADMIN" | "SUB"
    } & DefaultSession["user"]
  }

  interface User {
    role: "ADMIN" | "SUB"
  }

  interface AdapterUser {
    role: "ADMIN" | "SUB"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: "ADMIN" | "SUB"
  }
}
