import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).end()
  const { appearance_id } = req.body
  if (!appearance_id) return res.status(400).json({ error: 'appearance_id required' })

  const { error } = await supabase.from('appearances').delete().eq('id', appearance_id)
  if (error) return res.status(500).json({ error: error.message })

  res.status(200).json({ success: true })
}
