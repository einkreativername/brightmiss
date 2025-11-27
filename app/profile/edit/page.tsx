"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";
import { UploadButton } from "@/components/uploadthing";
import { Trash2, Plus, Lock, Shield, CreditCard, UserCheck } from "lucide-react";
import Image from "next/image";

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

interface SocialMedia {
  platform: string;
  link: string;
}

interface StreamingAccount {
  service: string;
  username: string;
}

interface ProfileData {
  firstName: string | null;
  firstNameApproved: boolean;
  firstNameLocked: boolean;
  lastName: string | null;
  lastNameApproved: boolean;
  lastNameLocked: boolean;
  phone: string | null;
  phoneApproved: boolean;
  phoneLocked: boolean;
  address: string | null;
  addressApproved: boolean;
  addressLocked: boolean;
  workPlace: string | null;
  workPlaceApproved: boolean;
  workPlaceLocked: boolean;
  dateOfBirth: string | null;
  bio: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  emergencyContacts: EmergencyContact[] | null;
  socialMedia: SocialMedia[] | null;
  profileImage: string | null;
  coverImage: string | null;
  galleryImages: string[];
  videos: string[];

  // Phase 1
  fullLegalName: string | null;
  secondaryPhone: string | null;
  privateEmail: string | null;
  cloudEmail: string | null;
  idNumber: string | null;
  licensePlate: string | null;

  // Phase 2
  paymentDetails: string | null;
  amazonWishlist: string | null;
  remoteControlId: string | null;
  streamingAccounts: StreamingAccount[] | null;
  mobileDevice: string | null;

  // Phase 3
  vaultImages: string[];
  vaultVideos: string[];
  idCardImages: string[];
  declarationImage: string | null;
  declarationFaceImage: string | null;
}

export default function EditProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    bio: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
    workPlace: "",
    emergencyContacts: [] as EmergencyContact[],
    socialMedia: [] as SocialMedia[],
    profileImage: "",
    coverImage: "",
    galleryImages: [] as string[],
    videos: [] as string[],

    // Phase 1
    fullLegalName: "",
    secondaryPhone: "",
    privateEmail: "",
    cloudEmail: "",
    idNumber: "",
    licensePlate: "",

    // Phase 2
    paymentDetails: "",
    amazonWishlist: "",
    remoteControlId: "",
    streamingAccounts: [] as StreamingAccount[],
    mobileDevice: "",

    // Phase 3
    vaultImages: [] as string[],
    vaultVideos: [] as string[],
    idCardImages: [] as string[],
    declarationImage: "",
    declarationFaceImage: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
          setFormData({
            firstName: data?.firstName || "",
            lastName: data?.lastName || "",
            dateOfBirth: data?.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : "",
            bio: data?.bio || "",
            phone: data?.phone || "",
            address: data?.address || "",
            city: data?.city || "",
            postalCode: data?.postalCode || "",
            country: data?.country || "",
            workPlace: data?.workPlace || "",
            emergencyContacts: (data?.emergencyContacts as EmergencyContact[]) || [],
            socialMedia: (data?.socialMedia as SocialMedia[]) || [],
            profileImage: data?.profileImage || "",
            coverImage: data?.coverImage || "",
            galleryImages: data?.galleryImages || [],
            videos: data?.videos || [],

            // Phase 1
            fullLegalName: data?.fullLegalName || "",
            secondaryPhone: data?.secondaryPhone || "",
            privateEmail: data?.privateEmail || "",
            cloudEmail: data?.cloudEmail || "",
            idNumber: data?.idNumber || "",
            licensePlate: data?.licensePlate || "",

            // Phase 2
            paymentDetails: data?.paymentDetails || "",
            amazonWishlist: data?.amazonWishlist || "",
            remoteControlId: data?.remoteControlId || "",
            streamingAccounts: (data?.streamingAccounts as StreamingAccount[]) || [],
            mobileDevice: data?.mobileDevice || "",

            // Phase 3
            vaultImages: data?.vaultImages || [],
            vaultVideos: data?.vaultVideos || [],
            idCardImages: data?.idCardImages || [],
            declarationImage: data?.declarationImage || "",
            declarationFaceImage: data?.declarationFaceImage || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    }

    if (session?.user) {
      fetchProfile();
    }
  }, [session]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            ...formData,
            dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      if (data.changeRequested) {
        toast.success("Profile updated. Some changes require admin approval.");
      } else {
        toast.success("Profile updated successfully");
      }

      router.push("/profile");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  const isFieldLocked = (fieldName: keyof ProfileData) => {
    if (!profile) return false;
    const approvedKey = `${fieldName}Approved` as keyof ProfileData;
    const lockedKey = `${fieldName}Locked` as keyof ProfileData;
    // Check if the property exists on profile before accessing
    if (approvedKey in profile && lockedKey in profile) {
        return (profile as any)[approvedKey] && (profile as any)[lockedKey];
    }
    return false;
  };

  const addEmergencyContact = () => {
    setFormData({
      ...formData,
      emergencyContacts: [...formData.emergencyContacts, { name: "", relationship: "", phone: "" }],
    });
  };

  const removeEmergencyContact = (index: number) => {
    const newContacts = [...formData.emergencyContacts];
    newContacts.splice(index, 1);
    setFormData({ ...formData, emergencyContacts: newContacts });
  };

  const updateEmergencyContact = (index: number, field: keyof EmergencyContact, value: string) => {
    const newContacts = [...formData.emergencyContacts];
    newContacts[index] = { ...newContacts[index], [field]: value };
    setFormData({ ...formData, emergencyContacts: newContacts });
  };

  const addSocialMedia = () => {
    setFormData({
      ...formData,
      socialMedia: [...formData.socialMedia, { platform: "", link: "" }],
    });
  };

  const removeSocialMedia = (index: number) => {
    const newSocials = [...formData.socialMedia];
    newSocials.splice(index, 1);
    setFormData({ ...formData, socialMedia: newSocials });
  };

  const updateSocialMedia = (index: number, field: keyof SocialMedia, value: string) => {
    const newSocials = [...formData.socialMedia];
    newSocials[index] = { ...newSocials[index], [field]: value };
    setFormData({ ...formData, socialMedia: newSocials });
  };

  const addStreamingAccount = () => {
    setFormData({
      ...formData,
      streamingAccounts: [...formData.streamingAccounts, { service: "", username: "" }],
    });
  };

  const removeStreamingAccount = (index: number) => {
    const newAccounts = [...formData.streamingAccounts];
    newAccounts.splice(index, 1);
    setFormData({ ...formData, streamingAccounts: newAccounts });
  };

  const updateStreamingAccount = (index: number, field: keyof StreamingAccount, value: string) => {
    const newAccounts = [...formData.streamingAccounts];
    newAccounts[index] = { ...newAccounts[index], [field]: value };
    setFormData({ ...formData, streamingAccounts: newAccounts });
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-background text-foreground">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Edit Profile</h1>
          <Link href="/profile">
            <Button variant="outline" className="border-primary/20 hover:bg-primary/10 hover:text-primary">Cancel</Button>
          </Link>
        </div>

        <form onSubmit={onSubmit} className="space-y-12 bg-card border border-border rounded-xl shadow-lg p-8">
            
            {/* --- CORE PROFILE --- */}
            <div className="space-y-8">
                <h2 className="text-2xl font-bold text-primary border-b border-primary/30 pb-4">Public Profile</h2>
                
                {/* Images Section */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-primary/80">Profile Images</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Profile Image */}
                        <div className="space-y-4">
                            <Label>Profile Image</Label>
                            <div className="flex flex-col items-center gap-4 border border-border rounded-lg p-4 bg-background/50">
                                {formData.profileImage ? (
                                    <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-primary/50">
                                        <Image 
                                            src={formData.profileImage} 
                                            alt="Profile" 
                                            fill 
                                            className="object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                        No Image
                                    </div>
                                )}
                                <UploadButton
                                    endpoint="imageUploader"
                                    appearance={{
                                        button: "bg-primary text-primary-foreground hover:bg-primary/90",
                                        allowedContent: "text-muted-foreground"
                                    }}
                                    onClientUploadComplete={(res) => {
                                        if (res && res[0]) {
                                            setFormData({ ...formData, profileImage: res[0].url });
                                            toast.success("Profile image uploaded");
                                        }
                                    }}
                                    onUploadError={(error: Error) => {
                                        toast.error(`ERROR! ${error.message}`);
                                    }}
                                />
                            </div>
                        </div>

                        {/* Cover Image */}
                        <div className="space-y-4">
                            <Label>Cover Image</Label>
                            <div className="flex flex-col items-center gap-4 border border-border rounded-lg p-4 bg-background/50">
                                {formData.coverImage ? (
                                    <div className="relative w-full h-32 rounded-lg overflow-hidden border border-primary/30">
                                        <Image 
                                            src={formData.coverImage} 
                                            alt="Cover" 
                                            fill 
                                            className="object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-full h-32 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                                        No Cover Image
                                    </div>
                                )}
                                <UploadButton
                                    endpoint="imageUploader"
                                    appearance={{
                                        button: "bg-primary text-primary-foreground hover:bg-primary/90",
                                        allowedContent: "text-muted-foreground"
                                    }}
                                    onClientUploadComplete={(res) => {
                                        if (res && res[0]) {
                                            setFormData({ ...formData, coverImage: res[0].url });
                                            toast.success("Cover image uploaded");
                                        }
                                    }}
                                    onUploadError={(error: Error) => {
                                        toast.error(`ERROR! ${error.message}`);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Personal Information */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-primary/80">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                            <Label htmlFor="firstName">First Name</Label>
                            {isFieldLocked("firstName") && (
                                <Badge variant="secondary" className="bg-muted text-muted-foreground">Locked</Badge>
                            )}
                            </div>
                            <Input
                            id="firstName"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            {isFieldLocked("lastName") && (
                                <Badge variant="secondary" className="bg-muted text-muted-foreground">Locked</Badge>
                            )}
                            </div>
                            <Input
                            id="lastName"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dateOfBirth">Date of Birth</Label>
                            <Input
                            id="dateOfBirth"
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                            disabled={isLoading}
                            className="dark:[color-scheme:dark]" 
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        disabled={isLoading}
                        rows={4}
                        />
                    </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-primary/80">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                            <Label htmlFor="phone">Phone</Label>
                            {isFieldLocked("phone") && (
                                <Badge variant="secondary" className="bg-muted text-muted-foreground">Locked</Badge>
                            )}
                            </div>
                            <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                        <Label htmlFor="address">Address</Label>
                        {isFieldLocked("address") && (
                            <Badge variant="secondary" className="bg-muted text-muted-foreground">Locked</Badge>
                        )}
                        </div>
                        <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        disabled={isLoading}
                        placeholder="Street Address"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                            id="city"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="postalCode">Postal Code</Label>
                            <Input
                            id="postalCode"
                            value={formData.postalCode}
                            onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                            disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="country">Country</Label>
                            <Input
                            id="country"
                            value={formData.country}
                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                            disabled={isLoading}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* --- PHASE 1: IDENTITY --- */}
            <div className="space-y-8 pt-8 border-t border-border">
                <div className="flex items-center gap-3 mb-4">
                    <UserCheck className="w-8 h-8 text-primary" />
                    <div>
                        <h2 className="text-2xl font-bold text-primary">Identity Verification</h2>
                        <p className="text-muted-foreground">Phase 1: Establish trust and confirm identity.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Label htmlFor="fullLegalName">Full Legal Name (as on ID)</Label>
                        <Input
                        id="fullLegalName"
                        value={formData.fullLegalName}
                        onChange={(e) => setFormData({ ...formData, fullLegalName: e.target.value })}
                        disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="idNumber">ID / Driver License Number</Label>
                        <Input
                        id="idNumber"
                        value={formData.idNumber}
                        onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                        disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="secondaryPhone">Secondary Phone (Parent/Friend/Work)</Label>
                        <Input
                        id="secondaryPhone"
                        value={formData.secondaryPhone}
                        onChange={(e) => setFormData({ ...formData, secondaryPhone: e.target.value })}
                        disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="licensePlate">License Plate (KFZ-Kennzeichen)</Label>
                        <Input
                        id="licensePlate"
                        value={formData.licensePlate}
                        onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                        disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="privateEmail">Private E-Mail (Legacy/Personal)</Label>
                        <Input
                        id="privateEmail"
                        type="email"
                        value={formData.privateEmail}
                        onChange={(e) => setFormData({ ...formData, privateEmail: e.target.value })}
                        disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="cloudEmail">Apple ID / Google Account Email</Label>
                        <Input
                        id="cloudEmail"
                        type="email"
                        value={formData.cloudEmail}
                        onChange={(e) => setFormData({ ...formData, cloudEmail: e.target.value })}
                        disabled={isLoading}
                        />
                    </div>
                </div>
            </div>

            {/* --- PHASE 2: DIGITAL & FINANCIAL --- */}
            <div className="space-y-8 pt-8 border-t border-border">
                <div className="flex items-center gap-3 mb-4">
                    <CreditCard className="w-8 h-8 text-primary" />
                    <div>
                        <h2 className="text-2xl font-bold text-primary">Digital & Financial</h2>
                        <p className="text-muted-foreground">Phase 2: Financial and digital asset control.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="paymentDetails">IBAN / PayPal Email</Label>
                        <Input
                        id="paymentDetails"
                        value={formData.paymentDetails}
                        onChange={(e) => setFormData({ ...formData, paymentDetails: e.target.value })}
                        disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="amazonWishlist">Amazon Wishlist Link (Public)</Label>
                        <Input
                        id="amazonWishlist"
                        value={formData.amazonWishlist}
                        onChange={(e) => setFormData({ ...formData, amazonWishlist: e.target.value })}
                        disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="remoteControlId">TeamViewer / AnyDesk ID (+ Password)</Label>
                        <Input
                        id="remoteControlId"
                        value={formData.remoteControlId}
                        onChange={(e) => setFormData({ ...formData, remoteControlId: e.target.value })}
                        disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="mobileDevice">Current Mobile Model + IMEI</Label>
                        <Input
                        id="mobileDevice"
                        value={formData.mobileDevice}
                        onChange={(e) => setFormData({ ...formData, mobileDevice: e.target.value })}
                        disabled={isLoading}
                        />
                    </div>
                </div>

                {/* Streaming Accounts */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <Label>Streaming Accounts (Spotify, Netflix, OF)</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addStreamingAccount} className="border-primary/50 text-primary hover:bg-primary/10">
                            <Plus className="w-4 h-4 mr-2" /> Add Account
                        </Button>
                    </div>
                    {formData.streamingAccounts.map((account, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-border rounded-lg relative bg-background/50">
                             <div className="space-y-2">
                                <Label>Service</Label>
                                <Input
                                    value={account.service}
                                    onChange={(e) => updateStreamingAccount(index, 'service', e.target.value)}
                                    placeholder="e.g. Netflix"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Username/Account Name</Label>
                                <Input
                                    value={account.username}
                                    onChange={(e) => updateStreamingAccount(index, 'username', e.target.value)}
                                    placeholder="Username"
                                />
                            </div>
                             <Button 
                                type="button" 
                                variant="destructive" 
                                size="icon" 
                                className="absolute -top-2 -right-2 h-8 w-8 rounded-full shadow-lg"
                                onClick={() => removeStreamingAccount(index)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                    {formData.streamingAccounts.length === 0 && (
                        <p className="text-muted-foreground text-sm italic">No streaming accounts added.</p>
                    )}
                </div>
            </div>

             {/* --- PHASE 3: VAULT --- */}
             <div className="space-y-8 pt-8 border-t border-border">
                <div className="flex items-center gap-3 mb-4">
                    <Lock className="w-8 h-8 text-destructive" />
                    <div>
                        <h2 className="text-2xl font-bold text-destructive">Blackmail Vault</h2>
                        <p className="text-muted-foreground">Phase 3: Secure submission of sensitive material.</p>
                    </div>
                </div>

                {/* ID Card Images */}
                <div className="space-y-4">
                    <Label className="text-lg">ID Card (Front & Back)</Label>
                    <div className="grid grid-cols-2 gap-4">
                        {formData.idCardImages.map((img, index) => (
                            <div key={index} className="relative aspect-video border border-border rounded-lg overflow-hidden group">
                                <Image 
                                    src={img} 
                                    alt={`ID Card ${index + 1}`} 
                                    fill 
                                    className="object-cover"
                                />
                                <Button 
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => {
                                        const newImages = [...formData.idCardImages];
                                        newImages.splice(index, 1);
                                        setFormData({ ...formData, idCardImages: newImages });
                                    }}
                                >
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            </div>
                        ))}
                        <div className="aspect-video border-2 border-dashed border-border rounded-lg flex items-center justify-center p-4 bg-background/30 hover:bg-background/50 transition-colors">
                            <UploadButton
                                endpoint="imageUploader"
                                appearance={{
                                    button: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                                    allowedContent: "text-muted-foreground"
                                }}
                                onClientUploadComplete={(res) => {
                                    if (res) {
                                        const newImages = res.map(r => r.url);
                                        setFormData({ ...formData, idCardImages: [...formData.idCardImages, ...newImages] });
                                        toast.success("ID Card uploaded");
                                    }
                                }}
                                onUploadError={(error: Error) => {
                                    toast.error(`ERROR! ${error.message}`);
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Vault Images */}
                <div className="space-y-4">
                    <Label className="text-lg">Compromising Photos (Face + Timestamp + Note)</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {formData.vaultImages.map((img, index) => (
                            <div key={index} className="relative aspect-square border border-border rounded-lg overflow-hidden group">
                                <Image 
                                    src={img} 
                                    alt={`Vault Image ${index + 1}`} 
                                    fill 
                                    className="object-cover blur-sm hover:blur-none transition-all duration-300"
                                />
                                <Button 
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => {
                                        const newImages = [...formData.vaultImages];
                                        newImages.splice(index, 1);
                                        setFormData({ ...formData, vaultImages: newImages });
                                    }}
                                >
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            </div>
                        ))}
                        <div className="aspect-square border-2 border-dashed border-border rounded-lg flex items-center justify-center p-4 bg-background/30 hover:bg-background/50 transition-colors">
                            <UploadButton
                                endpoint="galleryUploader"
                                appearance={{
                                    button: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                                    allowedContent: "text-muted-foreground"
                                }}
                                onClientUploadComplete={(res) => {
                                    if (res) {
                                        const newImages = res.map(r => r.url);
                                        setFormData({ ...formData, vaultImages: [...formData.vaultImages, ...newImages] });
                                        toast.success("Vault images uploaded");
                                    }
                                }}
                                onUploadError={(error: Error) => {
                                    toast.error(`ERROR! ${error.message}`);
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Vault Videos */}
                <div className="space-y-4">
                    <Label className="text-lg">Compromising Videos (min. 30s)</Label>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {formData.vaultVideos.map((vid, index) => (
                            <div key={index} className="relative aspect-video border border-border rounded-lg overflow-hidden bg-black group">
                                <video src={vid} controls className="w-full h-full" />
                                <Button 
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => {
                                        const newVideos = [...formData.vaultVideos];
                                        newVideos.splice(index, 1);
                                        setFormData({ ...formData, vaultVideos: newVideos });
                                    }}
                                >
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            </div>
                        ))}
                        <div className="aspect-video border-2 border-dashed border-border rounded-lg flex items-center justify-center p-4 bg-background/30 hover:bg-background/50 transition-colors">
                             <UploadButton
                                endpoint="videoUploader"
                                appearance={{
                                    button: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                                    allowedContent: "text-muted-foreground"
                                }}
                                onClientUploadComplete={(res) => {
                                    if (res) {
                                        const newVideos = res.map(r => r.url);
                                        setFormData({ ...formData, vaultVideos: [...formData.vaultVideos, ...newVideos] });
                                        toast.success("Vault videos uploaded");
                                    }
                                }}
                                 onUploadError={(error: Error) => {
                                    toast.error(`ERROR! ${error.message}`);
                                }}
                            />
                        </div>
                     </div>
                </div>

                {/* Declarations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {/* Declaration Document */}
                    <div className="space-y-4">
                        <Label>Signed Declaration (Photo)</Label>
                        <div className="flex flex-col items-center gap-4 border border-border rounded-lg p-4 bg-background/50">
                            {formData.declarationImage ? (
                                <div className="relative w-full h-48 rounded-lg overflow-hidden border border-destructive/30">
                                    <Image 
                                        src={formData.declarationImage} 
                                        alt="Declaration" 
                                        fill 
                                        className="object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="w-full h-48 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-center p-4">
                                    Upload signed declaration
                                </div>
                            )}
                            <UploadButton
                                endpoint="imageUploader"
                                appearance={{
                                    button: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                                    allowedContent: "text-muted-foreground"
                                }}
                                onClientUploadComplete={(res) => {
                                    if (res && res[0]) {
                                        setFormData({ ...formData, declarationImage: res[0].url });
                                        toast.success("Declaration uploaded");
                                    }
                                }}
                                onUploadError={(error: Error) => {
                                    toast.error(`ERROR! ${error.message}`);
                                }}
                            />
                        </div>
                    </div>

                    {/* Declaration with Face */}
                    <div className="space-y-4">
                        <Label>Selfie with Signed Declaration</Label>
                        <div className="flex flex-col items-center gap-4 border border-border rounded-lg p-4 bg-background/50">
                            {formData.declarationFaceImage ? (
                                <div className="relative w-full h-48 rounded-lg overflow-hidden border border-destructive/30">
                                    <Image 
                                        src={formData.declarationFaceImage} 
                                        alt="Declaration with Face" 
                                        fill 
                                        className="object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="w-full h-48 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-center p-4">
                                    Upload selfie with declaration
                                </div>
                            )}
                            <UploadButton
                                endpoint="imageUploader"
                                appearance={{
                                    button: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                                    allowedContent: "text-muted-foreground"
                                }}
                                onClientUploadComplete={(res) => {
                                    if (res && res[0]) {
                                        setFormData({ ...formData, declarationFaceImage: res[0].url });
                                        toast.success("Evidence uploaded");
                                    }
                                }}
                                onUploadError={(error: Error) => {
                                    toast.error(`ERROR! ${error.message}`);
                                }}
                            />
                        </div>
                    </div>
                </div>

             </div>

          <Button type="submit" className="w-full text-lg py-6 font-semibold shadow-lg shadow-primary/20 mt-8" disabled={isLoading}>
            {isLoading ? "Saving Changes..." : "Save All Changes"}
          </Button>
        </form>
      </div>
    </div>
  );
}
