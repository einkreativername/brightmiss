"use client"

import dynamic from "next/dynamic"

const AdminRequestsPage = dynamic(() => import("./page"), { ssr: false })

export default function ClientAdminRequestsPage() {
  return <AdminRequestsPage />
}
