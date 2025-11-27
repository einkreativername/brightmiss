import { auth, signOut } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

// Define types locally
interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

interface SocialMedia {
  platform: string;
  link: string;
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  // If user is not an ADMIN, redirect to profile
  if (session.user.role !== "ADMIN") {
    redirect("/profile")
  }

  const { userId } = await params

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      inviteTokens: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  })

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary">User not found</h2>
          <Link
            href="/admin/dashboard"
            className="mt-4 inline-block text-foreground hover:text-primary transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const profile = user.profile
  const emergencyContacts = (profile?.emergencyContacts as unknown as EmergencyContact[]) || []
  const socialMedia = (profile?.socialMedia as unknown as SocialMedia[]) || []

  return (
    <div className="min-h-screen bg-background pb-12 text-foreground">
      {/* Navigation */}
      <nav className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-primary">BrightMiss Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/dashboard"
                className="text-foreground hover:text-primary transition-colors font-medium"
              >
                Dashboard
              </Link>
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

      {/* User Details */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-primary">User Details: {user.name}</h2>
            <Link
              href="/admin/dashboard"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Account & Basic Info */}
            <div className="lg:col-span-1 space-y-6">
               {/* Account Info */}
               <div className="bg-card border border-border shadow-lg rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-primary mb-4 border-b border-border pb-2">Account</h3>
                  <div className="space-y-4">
                    <div>
                        <span className="text-xs uppercase tracking-wider text-muted-foreground block mb-1">Email</span>
                        <span className="text-foreground font-medium">{user.email}</span>
                    </div>
                    <div>
                        <span className="text-xs uppercase tracking-wider text-muted-foreground block mb-1">Role</span>
                        <span
                        className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === "ADMIN"
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                        >
                        {user.role}
                        </span>
                    </div>
                    <div>
                        <span className="text-xs uppercase tracking-wider text-muted-foreground block mb-1">Status</span>
                         {user.isInvited ? (
                            <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-500/20 text-yellow-500">
                                Invited
                            </span>
                            ) : (
                            <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-500/20 text-green-500">
                                Active
                            </span>
                        )}
                    </div>
                    <div>
                        <span className="text-xs uppercase tracking-wider text-muted-foreground block mb-1">Joined</span>
                        <span className="text-foreground text-sm">{new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
               </div>

                {/* Profile Images */}
                <div className="bg-card border border-border shadow-lg rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-primary mb-4 border-b border-border pb-2">Images</h3>
                    <div className="space-y-4">
                        <div>
                            <span className="text-xs uppercase tracking-wider text-muted-foreground block mb-2">Profile</span>
                            {profile?.profileImage ? (
                                <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-primary/20">
                                    <Image src={profile.profileImage} alt="Profile" fill className="object-cover" />
                                </div>
                            ) : (
                                <span className="text-muted-foreground text-sm italic">None</span>
                            )}
                        </div>
                        <div>
                            <span className="text-xs uppercase tracking-wider text-muted-foreground block mb-2">Cover</span>
                             {profile?.coverImage ? (
                                <div className="relative w-full h-32 rounded-lg overflow-hidden border border-border">
                                    <Image src={profile.coverImage} alt="Cover" fill className="object-cover" />
                                </div>
                            ) : (
                                <span className="text-muted-foreground text-sm italic">None</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Detailed Profile */}
            <div className="lg:col-span-2 space-y-6">
                {/* Personal & Contact */}
                <div className="bg-card border border-border shadow-lg rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-primary mb-4 border-b border-border pb-2">Profile Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <span className="text-xs uppercase tracking-wider text-muted-foreground block mb-1">Full Name</span>
                            <span className="text-foreground font-medium">
                                {profile?.firstName || profile?.lastName
                                ? `${profile.firstName || ""} ${profile.lastName || ""}`
                                : "N/A"}
                            </span>
                        </div>
                        <div>
                            <span className="text-xs uppercase tracking-wider text-muted-foreground block mb-1">Date of Birth</span>
                            <span className="text-foreground">
                                {profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : "N/A"}
                            </span>
                        </div>
                        <div>
                            <span className="text-xs uppercase tracking-wider text-muted-foreground block mb-1">Phone</span>
                            <span className="text-foreground">{profile?.phone || "N/A"}</span>
                        </div>
                        <div>
                            <span className="text-xs uppercase tracking-wider text-muted-foreground block mb-1">Work Place</span>
                            <span className="text-foreground">{profile?.workPlace || "N/A"}</span>
                        </div>
                        <div className="md:col-span-2">
                            <span className="text-xs uppercase tracking-wider text-muted-foreground block mb-1">Address</span>
                            <p className="text-foreground">
                                {profile?.address && <span className="block">{profile.address}</span>}
                                {profile?.city && <span>{profile.city}</span>}
                                {profile?.postalCode && <span>, {profile.postalCode}</span>}
                                {profile?.country && <span className="block">{profile.country}</span>}
                                {!profile?.address && !profile?.city && "N/A"}
                            </p>
                        </div>
                        <div className="md:col-span-2">
                            <span className="text-xs uppercase tracking-wider text-muted-foreground block mb-1">Bio</span>
                            <p className="text-foreground whitespace-pre-wrap">{profile?.bio || "N/A"}</p>
                        </div>
                    </div>
                </div>

                {/* Additional Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Emergency Contacts */}
                    <div className="bg-card border border-border shadow-lg rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-primary mb-4 border-b border-border pb-2">Emergency Contacts</h3>
                        {emergencyContacts.length > 0 ? (
                            <div className="space-y-4">
                                {emergencyContacts.map((contact, idx) => (
                                    <div key={idx} className="border-b border-border last:border-0 pb-2 last:pb-0">
                                        <p className="font-medium text-foreground">{contact.name}</p>
                                        <p className="text-xs text-muted-foreground">{contact.relationship} • {contact.phone}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground italic text-sm">None</p>
                        )}
                    </div>

                    {/* Social Media */}
                    <div className="bg-card border border-border shadow-lg rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-primary mb-4 border-b border-border pb-2">Social Media</h3>
                        {socialMedia.length > 0 ? (
                            <div className="space-y-2">
                                {socialMedia.map((social, idx) => (
                                    <div key={idx} className="text-sm">
                                        <span className="font-medium text-foreground mr-2">{social.platform}:</span>
                                        <a href={social.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate inline-block max-w-[200px] align-bottom">
                                            {social.link}
                                        </a>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground italic text-sm">None</p>
                        )}
                    </div>
                </div>

                {/* Media */}
                <div className="bg-card border border-border shadow-lg rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-primary mb-4 border-b border-border pb-2">Media Gallery</h3>
                    
                    <div className="space-y-6">
                        <div>
                            <h4 className="text-sm font-medium text-foreground mb-3">Photos</h4>
                            {profile?.galleryImages && profile.galleryImages.length > 0 ? (
                                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                                    {profile.galleryImages.map((img, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                                            <Image src={img} alt={`Gallery ${idx}`} fill className="object-cover" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground italic text-sm">No photos</p>
                            )}
                        </div>

                        <div>
                            <h4 className="text-sm font-medium text-foreground mb-3">Videos</h4>
                            {profile?.videos && profile.videos.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {profile.videos.map((vid, idx) => (
                                        <div key={idx} className="relative aspect-video rounded-lg overflow-hidden bg-black border border-border">
                                            <video src={vid} controls className="w-full h-full" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground italic text-sm">No videos</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Invite History (Existing) */}
                {user.inviteTokens.length > 0 && (
                    <div className="bg-card border border-border shadow-lg rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-primary mb-4 border-b border-border pb-2">Invite History</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-border">
                                <thead>
                                    <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Created</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Expires</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {user.inviteTokens.map((token) => (
                                    <tr key={token.id}>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-foreground">{new Date(token.createdAt).toLocaleDateString()}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-foreground">{new Date(token.expiresAt).toLocaleDateString()}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                                        {token.used ? (
                                            <span className="text-green-500">Used</span>
                                        ) : new Date() > token.expiresAt ? (
                                            <span className="text-destructive">Expired</span>
                                        ) : (
                                            <span className="text-yellow-500">Pending</span>
                                        )}
                                        </td>
                                    </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
