import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const profileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  workPlace: z.string().optional(),
  dateOfBirth: z.string().nullable().optional(),
  bio: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  emergencyContacts: z.array(z.any()).optional(),
  socialMedia: z.array(z.any()).optional(),
  profileImage: z.string().optional(),
  coverImage: z.string().optional(),
  galleryImages: z.array(z.string()).optional(),
  videos: z.array(z.string()).optional(),

  // Phase 1 - Identity
  fullLegalName: z.string().optional(),
  secondaryPhone: z.string().optional(),
  privateEmail: z.string().optional(),
  cloudEmail: z.string().optional(),
  idNumber: z.string().optional(),
  licensePlate: z.string().optional(),

  // Phase 2 - Digital & Financial
  paymentDetails: z.string().optional(),
  amazonWishlist: z.string().optional(),
  remoteControlId: z.string().optional(),
  streamingAccounts: z.any().optional(), // Json
  mobileDevice: z.string().optional(),

  // Phase 3 - Vault
  vaultImages: z.array(z.string()).optional(),
  vaultVideos: z.array(z.string()).optional(),
  idCardImages: z.array(z.string()).optional(),
  declarationImage: z.string().optional(),
  declarationFaceImage: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error("[PROFILE_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const validatedData = profileSchema.parse(body);

    const currentProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!currentProfile) {
      return new NextResponse("Profile not found", { status: 404 });
    }

    const updates: any = {};
    const pendingUpdates: any = {};
    let changeRequested = false;

    // Helper function to handle field updates
    const handleFieldUpdate = (
      fieldName: string,
      newValue: string | undefined | null,
      currentValue: any,
      isApproved: boolean,
      isLocked: boolean
    ) => {
      if (newValue === undefined) return; // No change sent

      if (isApproved && isLocked) {
        // Field is locked, save to pending if different
        if (newValue !== currentValue) {
          pendingUpdates[`${fieldName}Pending`] = newValue;
          changeRequested = true;
        }
      } else {
        // Field is not locked, update directly
        updates[fieldName] = newValue;
      }
    };

    // Handle locked fields
    handleFieldUpdate(
      "firstName",
      validatedData.firstName,
      currentProfile.firstName,
      currentProfile.firstNameApproved,
      currentProfile.firstNameLocked
    );

    handleFieldUpdate(
      "lastName",
      validatedData.lastName,
      currentProfile.lastName,
      currentProfile.lastNameApproved,
      currentProfile.lastNameLocked
    );

    handleFieldUpdate(
      "phone",
      validatedData.phone,
      currentProfile.phone,
      currentProfile.phoneApproved,
      currentProfile.phoneLocked
    );

    handleFieldUpdate(
      "address",
      validatedData.address,
      currentProfile.address,
      currentProfile.addressApproved,
      currentProfile.addressLocked
    );

    handleFieldUpdate(
      "workPlace",
      validatedData.workPlace,
      currentProfile.workPlace,
      currentProfile.workPlaceApproved,
      currentProfile.workPlaceLocked
    );

    // Handle non-locked fields
    if (validatedData.dateOfBirth !== undefined) updates.dateOfBirth = validatedData.dateOfBirth;
    if (validatedData.bio !== undefined) updates.bio = validatedData.bio;
    if (validatedData.city !== undefined) updates.city = validatedData.city;
    if (validatedData.postalCode !== undefined) updates.postalCode = validatedData.postalCode;
    if (validatedData.country !== undefined) updates.country = validatedData.country;
    if (validatedData.emergencyContacts !== undefined) updates.emergencyContacts = validatedData.emergencyContacts;
    if (validatedData.socialMedia !== undefined) updates.socialMedia = validatedData.socialMedia;
    if (validatedData.profileImage !== undefined) updates.profileImage = validatedData.profileImage;
    if (validatedData.coverImage !== undefined) updates.coverImage = validatedData.coverImage;
    if (validatedData.galleryImages !== undefined) updates.galleryImages = validatedData.galleryImages;
    if (validatedData.videos !== undefined) updates.videos = validatedData.videos;

    // Phase 1 - Identity
    if (validatedData.fullLegalName !== undefined) updates.fullLegalName = validatedData.fullLegalName;
    if (validatedData.secondaryPhone !== undefined) updates.secondaryPhone = validatedData.secondaryPhone;
    if (validatedData.privateEmail !== undefined) updates.privateEmail = validatedData.privateEmail;
    if (validatedData.cloudEmail !== undefined) updates.cloudEmail = validatedData.cloudEmail;
    if (validatedData.idNumber !== undefined) updates.idNumber = validatedData.idNumber;
    if (validatedData.licensePlate !== undefined) updates.licensePlate = validatedData.licensePlate;

    // Phase 2 - Digital & Financial
    if (validatedData.paymentDetails !== undefined) updates.paymentDetails = validatedData.paymentDetails;
    if (validatedData.amazonWishlist !== undefined) updates.amazonWishlist = validatedData.amazonWishlist;
    if (validatedData.remoteControlId !== undefined) updates.remoteControlId = validatedData.remoteControlId;
    if (validatedData.streamingAccounts !== undefined) updates.streamingAccounts = validatedData.streamingAccounts;
    if (validatedData.mobileDevice !== undefined) updates.mobileDevice = validatedData.mobileDevice;

    // Phase 3 - Vault
    if (validatedData.vaultImages !== undefined) updates.vaultImages = validatedData.vaultImages;
    if (validatedData.vaultVideos !== undefined) updates.vaultVideos = validatedData.vaultVideos;
    if (validatedData.idCardImages !== undefined) updates.idCardImages = validatedData.idCardImages;
    if (validatedData.declarationImage !== undefined) updates.declarationImage = validatedData.declarationImage;
    if (validatedData.declarationFaceImage !== undefined) updates.declarationFaceImage = validatedData.declarationFaceImage;

    // Perform updates
    if (Object.keys(updates).length > 0 || Object.keys(pendingUpdates).length > 0) {
      await prisma.userProfile.update({
        where: { userId: session.user.id },
        data: {
          ...updates,
          ...pendingUpdates,
          changeRequested: changeRequested || currentProfile.changeRequested,
        },
      });
    }

    // Notify admin if change requested (Placeholder)
    if (changeRequested) {
      console.log(`User ${session.user.id} requested changes to locked fields.`);
      // Here you would implement admin notification logic
    }

    return NextResponse.json({ success: true, changeRequested });
  } catch (error) {
    console.error("[PROFILE_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
