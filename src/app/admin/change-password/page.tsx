import { requireAuth } from '@/lib/auth'
import ChangePasswordForm from '@/components/ChangePasswordForm'

export default async function ChangePasswordPage() {
  await requireAuth()
  
  return <ChangePasswordForm />
}
