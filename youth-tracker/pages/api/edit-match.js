import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { match_id, league, players } = req.body
  if (!match_id || !players) return res.status(400).json({ error: 'match_id and players required' })

  for (const p of players) {
    const { data: player, error: playerError } = await supabase
      .from('players')
      .upsert(
        { league, name: p.name, team: p.team, position: p.position, birth_year: p.birth_year },
        { onConflict: 'league,name,team' }
      )
      .select()
      .single()

    if (playerError) return res.status(500).json({ error: playerError.message })

    const { error: appError } = await supabase
      .from('appearances')
      .insert({
        match_id,
        player_id: player.id,
        minutes: p.minutes,
        goals: p.goals || 0,
        assists: p.assists || 0
      })

    if (appError) return res.status(500).json({ error: appError.message })
  }

  res.status(200).json({ success: true })
}
