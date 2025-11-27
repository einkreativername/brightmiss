import { auth, signOut } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

// Define types locally since we can't import the JSON types directly from Prisma Client easily in this context
// without generating the client. But we know the structure.
interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

interface SocialMedia {
  platform: string;
  link: string;
}

export default async function ProfilePage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { profile: true },
  })

  // If user is not found in DB, redirect to login (e.g., deleted account)
  if (!user) {
    redirect("/login")
  }

  const profile = user.profile

  // Cast JSON fields
  const emergencyContacts = (profile?.emergencyContacts as unknown as EmergencyContact[]) || []
  const socialMedia = (profile?.socialMedia as unknown as SocialMedia[]) || []

  return (
    <div className="min-h-screen bg-background pb-12 text-foreground">
      {/* Navigation */}
      <nav className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-primary">BrightMiss</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/profile"
                className="text-foreground hover:text-primary transition-colors font-medium"
              >
                Profile
              </Link>
              {session.user.role === "ADMIN" && (
                <Link
                  href="/admin/dashboard"
                  className="text-foreground hover:text-primary transition-colors font-medium"
                >
                  Admin
                </Link>
              )}
              <form
                action={async () => {
                  "use server"
                  await signOut()
                }}
              >
                <button
                  type="submit"
                  className="text-foreground hover:text-primary transition-colors font-medium"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      {/* Profile Header with Cover Image */}
      <div className="relative h-64 md:h-80 w-full bg-muted">
        {profile?.coverImage ? (
            <Image 
                src={profile.coverImage} 
                alt="Cover" 
                fill 
                className="object-cover opacity-80"
                priority
            />
        ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No Cover Image
            </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10">
        {/* Profile Image and Basic Info Header */}
        <div className="flex flex-col md:flex-row items-end gap-6 mb-8">
            <div className="relative w-48 h-48 rounded-full border-4 border-background shadow-2xl overflow-hidden bg-card">
                {profile?.profileImage ? (
                    <Image 
                        src={profile.profileImage} 
                        alt="Profile" 
                        fill 
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-4xl">
                        👤
                    </div>
                )}
            </div>
            <div className="flex-1 pb-4 flex justify-between items-end w-full">
                <div>
                    <h1 className="text-4xl font-bold text-primary drop-shadow-lg">
                        {profile?.firstName || profile?.lastName
                        ? `${profile.firstName || ""} ${profile.lastName || ""}`
                        : user.name}
                    </h1>
                    <p className="text-muted-foreground">{user.email}</p>
                    {profile?.workPlace && (
                        <p className="text-foreground mt-1 font-medium">Works at {profile.workPlace}</p>
                    )}
                </div>
                <Link
                    href="/profile/edit"
                    className="bg-primary text-primary-foreground px-6 py-2 rounded-full hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-semibold"
                >
                    Edit Profile
                </Link>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Info */}
            <div className="lg:col-span-1 space-y-6">
                {/* About */}
                <div className="bg-card border border-border shadow-lg rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-primary mb-4 border-b border-border pb-2">About</h3>
                    <div className="space-y-4">
                         {profile?.dateOfBirth && (
                            <div>
                                <span className="text-xs uppercase tracking-wider text-muted-foreground block mb-1">Date of Birth</span>
                                <span className="text-foreground font-medium">{new Date(profile.dateOfBirth).toLocaleDateString()}</span>
                            </div>
                        )}
                         {profile?.bio && (
                            <div>
                                <span className="text-xs uppercase tracking-wider text-muted-foreground block mb-1">Bio</span>
                                <p className="text-foreground whitespace-pre-wrap leading-relaxed">{profile.bio}</p>
                            </div>
                        )}
                        <div>
                            <span className="text-xs uppercase tracking-wider text-muted-foreground block mb-1">Role</span>
                            <span className="text-foreground font-medium">{user.role}</span>
                        </div>
                    </div>
                </div>

                {/* Contact */}
                <div className="bg-card border border-border shadow-lg rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-primary mb-4 border-b border-border pb-2">Contact Info</h3>
                    <div className="space-y-4">
                        {profile?.phone && (
                            <div>
                                <span className="text-xs uppercase tracking-wider text-muted-foreground block mb-1">Phone</span>
                                <span className="text-foreground font-medium">{profile.phone}</span>
                            </div>
                        )}
                        {(profile?.address || profile?.city || profile?.country) && (
                            <div>
                                <span className="text-xs uppercase tracking-wider text-muted-foreground block mb-1">Address</span>
                                <p className="text-foreground">
                                    {profile.address && <span className="block">{profile.address}</span>}
                                    {profile.city && <span>{profile.city}</span>}
                                    {profile.postalCode && <span>, {profile.postalCode}</span>}
                                    {profile.country && <span className="block">{profile.country}</span>}
                                </p>
                            </div>
                        )}
                         {socialMedia.length > 0 && (
                            <div>
                                <span className="text-xs uppercase tracking-wider text-muted-foreground block mb-2">Social Media</span>
                                <div className="space-y-2">
                                    {socialMedia.map((social, idx) => (
                                        <div key={idx} className="text-sm">
                                            <span className="font-medium text-foreground mr-2">{social.platform}:</span>
                                            <a href={social.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors">
                                                {social.link}
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                 {/* Emergency Contacts */}
                 {emergencyContacts.length > 0 && (
                    <div className="bg-card border border-border shadow-lg rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-primary mb-4 border-b border-border pb-2">Emergency Contacts</h3>
                        <div className="space-y-4">
                            {emergencyContacts.map((contact, idx) => (
                                <div key={idx} className="border-b border-border last:border-0 pb-3 last:pb-0">
                                    <p className="font-medium text-foreground">{contact.name}</p>
                                    <p className="text-sm text-muted-foreground">{contact.relationship}</p>
                                    <p className="text-sm text-muted-foreground">{contact.phone}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                 )}
            </div>

            {/* Right Column: Media */}
            <div className="lg:col-span-2 space-y-8">
                 {/* Gallery */}
                 <div className="bg-card border border-border shadow-lg rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-primary mb-4 border-b border-border pb-2">Gallery</h3>
                    {profile?.galleryImages && profile.galleryImages.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {profile.galleryImages.map((img, idx) => (
                                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
                                    <Image 
                                        src={img} 
                                        alt={`Gallery ${idx + 1}`} 
                                        fill 
                                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground italic">No images in gallery.</p>
                    )}
                 </div>

                 {/* Videos */}
                 <div className="bg-card border border-border shadow-lg rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-primary mb-4 border-b border-border pb-2">Videos</h3>
                    {profile?.videos && profile.videos.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {profile.videos.map((vid, idx) => (
                                <div key={idx} className="relative aspect-video rounded-lg overflow-hidden bg-black border border-border shadow-md">
                                    <video src={vid} controls className="w-full h-full" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground italic">No videos uploaded.</p>
                    )}
                 </div>
            </div>
        </div>
      </div>
    </div>
  )
}
