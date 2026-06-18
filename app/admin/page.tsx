import { redirect } from 'next/navigation'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { AdminDashboard } from '@/components/admin/admin-dashboard'

export default async function AdminPage() {
  if (!isSupabaseConfigured()) {
    redirect('/auth/login')
  }

  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Fetch user's raffles
  const { data: raffles } = await supabase
    .from('raffles')
    .select('*, bingo_cards(count)')
    .eq('admin_id', user.id)
    .order('created_at', { ascending: false })

  return <AdminDashboard user={user} initialRaffles={raffles || []} />
}
