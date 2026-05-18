// v3 - two-step query to avoid PostgREST join deduplication
import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  const { league } = req.query
  if (!league) return res.status(400).json({ error: 'league required' })

  // Step 1: get all match IDs for this league
  const { data: matchData, error: matchError } = await supabase
    .from('matches')
    .select('id, home_team, away_team, score, match_date')
    .eq('league', league)

  if (matchError) return res.status(500).json({ error: matchError.message })

  const matchIds = matchData.map(m => m.id)
  const matchMap = {}
  for (const m of matchData) matchMap[m.id] = m

  if (matchIds.length === 0) return res.status(200).json({ players: [] })

  // Step 2: get all appearances for those matches, with player info
  const { data, error } = await supabase
    .from('appearances')
    .select(`
      minutes, goals, assists, match_id,
      players!inner(id, name, team, position, birth_year)
    `)
    .in('match_id', matchIds)

  if (error) return res.status(500).json({ error: error.message })

  // Aggregate by player
  const playerMap = {}
  for (const row of data) {
    const p = row.players
    const key = p.id
    if (!playerMap[key]) {
      playerMap[key] = {
        id: p.id,
        name: p.name,
        team: p.team,
        position: p.position,
        birth_year: p.birth_year,
        apps: 0,
        mins: 0,
        goals: 0,
        assists: 0,
        matchLog: []
      }
    }
    playerMap[key].apps++
    playerMap[key].mins += row.minutes
    playerMap[key].goals += row.goals
    playerMap[key].assists += row.assists
    const m = matchMap[row.match_id]
    if (m) {
      playerMap[key].matchLog.push({
        match_id: row.match_id,
        home: m.home_team,
        away: m.away_team,
        score: m.score,
        date: m.match_date,
        minutes: row.minutes,
        goals: row.goals,
        assists: row.assists
      })
    }
  }

  const players = Object.values(playerMap).map(p => ({
    ...p,
    matchLog: p.matchLog.sort((a, b) => new Date(b.date) - new Date(a.date))
  }))

  res.status(200).json({ players })
}
