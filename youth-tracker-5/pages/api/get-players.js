import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  const { league } = req.query
  if (!league) return res.status(400).json({ error: 'league required' })

  const { data, error } = await supabase.rpc('get_players_by_league', { p_league: league })

  if (error) return res.status(500).json({ error: error.message })

  // Now fetch match logs separately
  const { data: matchData, error: matchError } = await supabase
    .from('matches')
    .select('id, home_team, away_team, score, match_date')
    .eq('league', league)

  if (matchError) return res.status(500).json({ error: matchError.message })

  const matchMap = {}
  for (const m of matchData) matchMap[m.id] = m

  const matchIds = matchData.map(m => m.id)

  const { data: appData, error: appError } = await supabase
    .from('appearances')
    .select('player_id, match_id, minutes, goals, assists')
    .in('match_id', matchIds)

  if (appError) return res.status(500).json({ error: appError.message })

  // Build match logs per player
  const matchLogMap = {}
  for (const a of appData) {
    if (!matchLogMap[a.player_id]) matchLogMap[a.player_id] = []
    const m = matchMap[a.match_id]
    if (m) {
      matchLogMap[a.player_id].push({
        match_id: a.match_id,
        home: m.home_team,
        away: m.away_team,
        score: m.score,
        date: m.match_date,
        minutes: a.minutes,
        goals: a.goals,
        assists: a.assists
      })
    }
  }

  const players = (data || []).map(p => ({
    ...p,
    apps: Number(p.apps),
    mins: Number(p.mins),
    goals: Number(p.goals),
    assists: Number(p.assists),
    matchLog: (matchLogMap[p.id] || []).sort((a, b) => new Date(b.date) - new Date(a.date))
  }))

  res.status(200).json({ players })
}
