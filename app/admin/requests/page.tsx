"use client"

import dynamic from "next/dynamic"

const AdminRequestsContent = dynamic(() => import("./AdminRequestsContent"), { ssr: false })

export default function AdminRequestsPage() {
  return <AdminRequestsContent />
}
