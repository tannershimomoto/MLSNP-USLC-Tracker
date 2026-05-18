import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  const { league } = req.query
  if (!league) return res.status(400).json({ error: 'league required' })

  const { data, error } = await supabase.rpc('get_players_by_league', { p_league: league })

  if (error) return res.status(500).json({ error: error.message })

  const players = (data || []).map(p => ({
    ...p,
    apps: Number(p.apps),
    mins: Number(p.mins),
    goals: Number(p.goals),
    assists: Number(p.assists),
    matchLog: p.match_log || []
  }))

  res.status(200).json({ players })
}
