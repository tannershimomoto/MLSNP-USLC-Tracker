import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { league, home_team, away_team, score, match_date, players } = req.body

  // Insert match
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .insert({ league, home_team, away_team, score, match_date })
    .select()
    .single()

  if (matchError) return res.status(500).json({ error: matchError.message })

  // Upsert players and insert appearances
  for (const p of players) {
    // Upsert player (insert if new, return existing if already there)
    const { data: player, error: playerError } = await supabase
      .from('players')
      .upsert(
        { league, name: p.name, team: p.team, position: p.position, birth_year: p.birth_year },
        { onConflict: 'league,name,team' }
      )
      .select()
      .single()

    if (playerError) return res.status(500).json({ error: playerError.message })

    // Insert appearance
    const { error: appError } = await supabase
      .from('appearances')
      .insert({
        match_id: match.id,
        player_id: player.id,
        minutes: p.minutes,
        goals: p.goals || 0,
        assists: p.assists || 0
      })

    if (appError) return res.status(500).json({ error: appError.message })
  }

  res.status(200).json({ success: true, match_id: match.id })
}
