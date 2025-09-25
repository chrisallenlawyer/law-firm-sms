import { redirect } from 'next/navigation'

export default function AdminDashboard() {
  // Redirect directly to enhanced dashboard
  redirect('/admin/enhanced-dashboard')
}
