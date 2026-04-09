import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  const { league } = req.query
  if (!league) return res.status(400).json({ error: 'league required' })

  const { data: matches, error } = await supabase
    .from('matches')
    .select(`
      id, home_team, away_team, score, match_date,
      appearances(
        minutes, goals, assists,
        players(name, team, birth_year, position)
      )
    `)
    .eq('league', league)
    .order('match_date', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })

  res.status(200).json({ matches })
}
