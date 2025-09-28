import { requireAuth } from '@/lib/auth'
import UsersManagement from '@/components/UsersManagement'

export default async function UsersManagementPage() {
  await requireAuth()
  
  return <UsersManagement />
}
