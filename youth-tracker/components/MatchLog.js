const BY_COLORS = {
  2008: { bg: '#dbeafe', color: '#1e40af' },
  2009: { bg: '#d1fae5', color: '#065f46' },
  2010: { bg: '#fef3c7', color: '#92400e' },
  2011: { bg: '#fce7f3', color: '#9d174d' },
  2012: { bg: '#ede9fe', color: '#5b21b6' },
}

export default function MatchLog({ matches }) {
  if (!matches || matches.length === 0) {
    return <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280', fontSize: 13 }}>No matches logged yet.</div>
  }

  return (
    <div>
      {matches.map(m => {
        const players = (m.appearances || []).filter(a => a.players)
        return (
          <div key={m.id} style={{ border: '0.5px solid #e5e7eb', borderRadius: 12, padding: '0.85rem 1rem', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontWeight: 500, fontSize: 14 }}>{m.home_team} {m.score || 'vs'} {m.away_team}</span>
              <span style={{ fontSize: 12, color: '#6b7280' }}>{m.match_date}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 7 }}>
              {players.length === 0 ? (
                <span style={{ fontSize: 12, color: '#6b7280' }}>No eligible players</span>
              ) : players.map((a, i) => {
                const c = BY_COLORS[a.players.birth_year] || { bg: '#f3f4f6', color: '#374151' }
                return (
                  <span key={i} style={{ fontSize: 12, padding: '2px 8px', borderRadius: 10, background: '#f3f4f6', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 11, padding: '1px 5px', borderRadius: 8, background: c.bg, color: c.color, fontWeight: 500 }}>{a.players.birth_year}</span>
                    {a.players.name} · {a.minutes}'{a.goals ? ` · ${a.goals}G` : ''}{a.assists ? ` · ${a.assists}A` : ''}
                  </span>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
