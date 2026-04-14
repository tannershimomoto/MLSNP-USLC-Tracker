import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).end()
  const { match_id } = req.body
  if (!match_id) return res.status(400).json({ error: 'match_id required' })

  // appearances are cascade deleted automatically
  const { error } = await supabase.from('matches').delete().eq('id', match_id)
  if (error) return res.status(500).json({ error: error.message })

  res.status(200).json({ success: true })
}
