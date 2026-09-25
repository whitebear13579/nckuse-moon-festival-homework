import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AccountScreen } from '@/components/account-screen'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect('/login')
  const client = await createClient()
  const { data } = await client.auth.getClaims()
  if (!data?.claims?.sub) redirect('/login?next=/account')
  return <AccountScreen />
}
