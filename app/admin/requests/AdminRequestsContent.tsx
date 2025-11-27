"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface ChangeRequest {
  requestId: string
  userId: string
  userName: string
  userEmail: string
  fieldName: string
  oldValue: string | null
  newValue: string | null
  isApproved: boolean
  isLocked: boolean
}

export default function AdminRequestsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [requests, setRequests] = useState<ChangeRequest[]>([])
  const [isFetchingRequests, setIsFetchingRequests] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [comment, setComment] = useState("")
  const [selectedRequest, setSelectedRequest] = useState<ChangeRequest | null>(null)
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false)

  useEffect(() => {
    if (status === "loading") return

    if (!session || session.user?.role !== "ADMIN") {
      router.push("/login") // Redirect non-admins or unauthenticated users
      return
    }
    fetchRequests()
  }, [session, status, router])

  const fetchRequests = async () => {
    setIsFetchingRequests(true)
    try {
      const response = await fetch("/api/admin/profile-requests")
      const data = await response.json()
      if (response.ok) {
        setRequests(data.requests)
      } else {
        toast.error(data.error || "Failed to fetch change requests.")
      }
    } catch (error) {
      console.error("Error fetching requests:", error)
      toast.error("Error fetching change requests.")
    } finally {
      setIsFetchingRequests(false)
    }
  }

  const handleAction = async (
    request: ChangeRequest,
    action: "approve" | "reject"
  ) => {
    if (action === "reject") {
      setSelectedRequest(request)
      setIsCommentModalOpen(true)
      return
    }
    await submitAction(request, action)
  }

  const submitAction = async (
    request: ChangeRequest,
    action: "approve" | "reject"
  ) => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/admin/profile-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.requestId, // Pass requestId for specific action
          action,
          comment: action === "reject" ? comment : undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        fetchRequests() // Refresh the list
        setIsCommentModalOpen(false)
        setComment("")
        setSelectedRequest(null)
      } else {
        toast.error(data.error || `Failed to ${action} request.`)
      }
    } catch (error) {
      console.error(`Error ${action}ing request:`, error)
      toast.error(`Error ${action}ing request.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render a loading skeleton or null initially to avoid hydration mismatches
  if (status === "loading" || isFetchingRequests) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    )
  }

  if (!session || session.user?.role !== "ADMIN") {
    // This should ideally be handled by middleware or a higher-order component
    // but for immediate redirection, returning null here prevents hydration issues
    // as the redirect will happen before the component fully renders on the client.
    return null
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Profile Change Requests</h1>

      {requests.length === 0 ? (
        <p>No pending change requests.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Field</TableHead>
                <TableHead>Old Value</TableHead>
                <TableHead>New Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.requestId}>
                  <TableCell>
                    <p className="font-medium">{request.userName}</p>
                    <p className="text-sm text-gray-500">({request.userEmail})</p>
                  </TableCell>
                  <TableCell>{request.fieldName}</TableCell>
                  <TableCell>{request.oldValue || "N/A"}</TableCell>
                  <TableCell>{request.newValue || "N/A"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">Pending</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleAction(request, "approve")}
                      disabled={isSubmitting}
                      className="mr-2"
                    >
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleAction(request, "reject")}
                      disabled={isSubmitting}
                    >
                      Reject
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Comment Modal for Reject Action */}
      <Dialog open={isCommentModalOpen} onOpenChange={setIsCommentModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reject Change Request</DialogTitle>
            <DialogDescription>
              Please provide a comment for rejecting the change request for "
              {selectedRequest?.fieldName}" from "{selectedRequest?.userName}".
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rejectComment" className="text-right">
                Comment
              </Label>
              <Textarea
                id="rejectComment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="col-span-3"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCommentModalOpen(false)
                setComment("")
                setSelectedRequest(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                selectedRequest && submitAction(selectedRequest, "reject")
              }
              disabled={isSubmitting || !comment.trim()}
            >
              {isSubmitting ? "Rejecting..." : "Confirm Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
