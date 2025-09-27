import { requireAuth } from '@/lib/auth'
import AttorneysManagement from '@/components/AttorneysManagement'

export default async function AttorneysPage() {
  await requireAuth()

  return <AttorneysManagement />
}
