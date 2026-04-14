import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  const { league } = req.query
  if (!league) return res.status(400).json({ error: 'league required' })

  const { data, error } = await supabase
    .from('appearances')
    .select(`
      minutes, goals, assists,
      players!inner(id, name, team, position, birth_year, league),
      matches!inner(id, home_team, away_team, score, match_date, league)
    `)
    .eq('players.league', league)
    .eq('matches.league', league)

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
    playerMap[key].matchLog.push({
      match_id: row.matches.id,
      home: row.matches.home_team,
      away: row.matches.away_team,
      score: row.matches.score,
      date: row.matches.match_date,
      minutes: row.minutes,
      goals: row.goals,
      assists: row.assists
    })
  }

  const players = Object.values(playerMap).map(p => ({
    ...p,
    matchLog: p.matchLog.sort((a, b) => new Date(b.date) - new Date(a.date))
  }))

  res.status(200).json({ players })
}
