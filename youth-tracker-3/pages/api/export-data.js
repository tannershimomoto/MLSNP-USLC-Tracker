import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  const { league } = req.query
  if (!league) return res.status(400).json({ error: 'league required' })

  const [pRes, mRes] = await Promise.all([
    supabase.from('appearances').select(`
      minutes, goals, assists,
      players!inner(id, name, team, position, birth_year, league),
      matches!inner(id, home_team, away_team, score, match_date, league)
    `).eq('players.league', league).eq('matches.league', league),
    supabase.from('matches').select('id').eq('league', league)
  ])

  if (pRes.error) return res.status(500).json({ error: pRes.error.message })

  const playerMap = {}
  for (const row of pRes.data) {
    const p = row.players
    const key = p.id
    if (!playerMap[key]) {
      playerMap[key] = { id: p.id, name: p.name, team: p.team, position: p.position, birth_year: p.birth_year, apps: 0, mins: 0, goals: 0, assists: 0 }
    }
    playerMap[key].apps++
    playerMap[key].mins += row.minutes
    playerMap[key].goals += row.goals
    playerMap[key].assists += row.assists
  }

  const allPlayers = Object.values(playerMap)

  const clubMap = {}
  allPlayers.forEach(p => {
    if (!clubMap[p.team]) clubMap[p.team] = { team: p.team, total: 0, players: 0, byYear: {} }
    clubMap[p.team].total += p.mins
    clubMap[p.team].players++
    clubMap[p.team].byYear[p.birth_year] = (clubMap[p.team].byYear[p.birth_year] || 0) + p.mins
  })
  const clubs = Object.values(clubMap).sort((a, b) => b.total - a.total)

  res.status(200).json({ allPlayers, clubs, matchCount: mRes.data?.length || 0 })
}
