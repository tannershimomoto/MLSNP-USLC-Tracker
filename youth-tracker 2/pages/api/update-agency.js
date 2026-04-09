import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'PATCH') return res.status(405).end()
  const { player_id, agency } = req.body
  if (!player_id) return res.status(400).json({ error: 'player_id required' })

  const { error } = await supabase
    .from('players')
    .update({ agency })
    .eq('id', player_id)

  if (error) return res.status(500).json({ error: error.message })
  res.status(200).json({ success: true })
}
