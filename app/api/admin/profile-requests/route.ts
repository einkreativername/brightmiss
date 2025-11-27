import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { UserProfile } from "@prisma/client"

const requestUpdateSchema = z.object({
  userId: z.string(),
  fieldName: z.enum(["firstName", "lastName", "phone", "address", "workPlace"]),
  action: z.enum(["approve", "reject"]),
  comment: z.string().optional(),
})

// GET - Fetch all pending profile change requests
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    // Only allow admins to access this route
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const pendingRequests = await prisma.userProfile.findMany({
      where: {
        changeRequested: true,
        OR: [
          { firstNamePending: { not: null } },
          { lastNamePending: { not: null } },
          { phonePending: { not: null } },
          { addressPending: { not: null } },
          { workPlacePending: { not: null } },
        ],
      } as any, // Cast to any to bypass type error for pending fields in where clause
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Format the requests for easier consumption
    const formattedRequests = pendingRequests.flatMap((profileWithUser) => {
      const requests = []
      const fieldsToLock = [
        "firstName",
        "lastName",
        "phone",
        "address",
        "workPlace",
      ] as const; // Use 'as const' for literal types

      for (const fieldName of fieldsToLock) {
        const pendingField = `${fieldName}Pending`
        const approvedField = `${fieldName}Approved`
        const lockedField = `${fieldName}Locked`

        // Cast profileWithUser to Record<string, any> to allow access to dynamic properties
        const profile = profileWithUser as Record<string, any>

        if (profile[pendingField] !== null && profile[pendingField] !== undefined) {
          requests.push({
            requestId: `${profileWithUser.userId}-${fieldName}`, // Unique ID for the request
            userId: profileWithUser.userId,
            userName: profileWithUser.user?.name,
            userEmail: profileWithUser.user?.email,
            fieldName: fieldName,
            oldValue: profile[fieldName],
            newValue: profile[pendingField],
            isApproved: profile[approvedField],
            isLocked: profile[lockedField],
            // Add timestamp or reason if stored elsewhere
          })
        }
      }
      return requests
    })

    return NextResponse.json({ requests: formattedRequests })
  } catch (error) {
    console.error("Get profile change requests error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH - Approve or reject a profile change request
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()

    // Only allow admins to access this route
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validated = requestUpdateSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0].message },
        { status: 400 }
      )
    }

    const { userId, fieldName, action, comment } = validated.data

    const approvedField = `${fieldName}Approved` as keyof UserProfile
    const lockedField = `${fieldName}Locked` as keyof UserProfile
    const pendingField = `${fieldName}Pending` as keyof UserProfile

    const profile = await prisma.userProfile.findUnique({
      where: { userId },
    })

    if (!profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    const updateData: { [key: string]: any } = {}

    if (action === "approve") {
      // Move pending value to main field, set approved and locked to true, clear pending
      updateData[fieldName] = profile[pendingField]
      updateData[approvedField] = true
      updateData[lockedField] = true
      updateData[pendingField] = null
    } else if (action === "reject") {
      // Clear pending value
      updateData[pendingField] = null
      // Optionally, send comment to user
      console.log(`Admin rejected change for ${fieldName} for user ${userId}. Comment: ${comment}`)
    }

    // Update the profile
    await prisma.userProfile.update({
      where: { userId },
      data: updateData,
    })

    // Check if there are any other pending requests for this user
    const remainingPendingRequests = await prisma.userProfile.findUnique({
      where: { userId },
      select: {
        firstNamePending: true,
        lastNamePending: true,
        phonePending: true,
        addressPending: true,
        workPlacePending: true,
      } as any, // Cast to any to bypass type error for pending fields in select clause
    })

    const hasOtherPending = Object.values(remainingPendingRequests || {}).some(
      (value) => value !== null && value !== undefined
    )

    // If no more pending requests, set changeRequested to false
    if (!hasOtherPending) {
      await prisma.userProfile.update({
        where: { userId },
        data: { changeRequested: false } as any, // Cast to any to bypass type error
      })
    }

    return NextResponse.json({ message: `Request ${action}ed successfully` })
  } catch (error) {
    console.error("Patch profile change request error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
