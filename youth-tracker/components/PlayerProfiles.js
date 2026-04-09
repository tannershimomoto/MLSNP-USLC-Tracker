import { useState } from 'react'

const BY_COLORS = {
  2008: { bg: '#dbeafe', color: '#1e40af' },
  2009: { bg: '#d1fae5', color: '#065f46' },
  2010: { bg: '#fef3c7', color: '#92400e' },
  2011: { bg: '#fce7f3', color: '#9d174d' },
  2012: { bg: '#ede9fe', color: '#5b21b6' },
}

function ByBadge({ year }) {
  const c = BY_COLORS[year] || { bg: '#f3f4f6', color: '#374151' }
  return <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 10, fontWeight: 500, background: c.bg, color: c.color }}>{year}</span>
}

function Avatar({ name, league }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const bg = league === 'mnp' ? '#d1fae5' : '#dbeafe'
  const color = league === 'mnp' ? '#065f46' : '#1e40af'
  return (
    <div style={{ width: 44, height: 44, borderRadius: '50%', background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 500, flexShrink: 0 }}>
      {initials}
    </div>
  )
}

function PlayerDetail({ player, league, onBack }) {
  const avgMins = player.apps > 0 ? Math.round(player.mins / player.apps) : 0
  return (
    <div>
      <button onClick={onBack} style={{ fontSize: 13, color: '#6b7280', cursor: 'pointer', marginBottom: '1.25rem', display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', background: 'none', padding: 0 }}>
        ← Back to profiles
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: '1.5rem' }}>
        <Avatar name={player.name} league={league} />
        <div>
          <div style={{ fontSize: 20, fontWeight: 500 }}>{player.name}</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 3, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span>{player.team}</span>
            <span>·</span>
            <ByBadge year={player.birth_year} />
            <span>·</span>
            <span>{player.position}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10, marginBottom: '1rem' }}>
        {[['Appearances', player.apps],['Total minutes', player.mins],['Goals', player.goals],['Assists', player.assists]].map(([label, value]) => (
          <div key={label} style={statCard}>
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 500 }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10, marginBottom: '1.5rem' }}>
        {[['Avg min / game', avgMins],['Goals + assists', player.goals + player.assists],['Birth year', player.birth_year]].map(([label, value]) => (
          <div key={label} style={statCard}>
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 500 }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, fontWeight: 500, color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Match history</div>
      {(player.matchLog || []).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280', fontSize: 13 }}>No match history yet.</div>
      ) : (
        (player.matchLog || []).map((m, i) => (
          <div key={i} style={{ border: '0.5px solid #e5e7eb', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: 7, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
            <div>
              <div style={{ fontWeight: 500 }}>{m.home} {m.score || 'vs'} {m.away}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{m.date}</div>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              {[["min", m.minutes + "'"],["G", m.goals],["A", m.assists]].map(([lbl, val]) => (
                <div key={lbl} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 500 }}>{val}</div>
                  <div style={{ fontSize: 10, color: '#6b7280' }}>{lbl}</div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default function PlayerProfiles({ players, league, selectedPlayer, onPlayerClick, onBack }) {
  const [search, setSearch] = useState('')
  const [filterTeam, setFilterTeam] = useState('')
  const [filterBy, setFilterBy] = useState('')

  const teams = [...new Set(players.map(p => p.team))].sort()

  if (selectedPlayer) {
    return <PlayerDetail player={selectedPlayer} league={league} onBack={onBack} />
  }

  const filtered = players.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    (!filterTeam || p.team === filterTeam) &&
    (!filterBy || p.birth_year === parseInt(filterBy))
  ).sort((a, b) => b.mins - a.mins)

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search player..."
          style={{ ...filterInput, flex: 1, minWidth: 140 }} />
        <select value={filterTeam} onChange={e => setFilterTeam(e.target.value)} style={filterInput}>
          <option value="">All teams</option>
          {teams.map(t => <option key={t}>{t}</option>)}
        </select>
        <select value={filterBy} onChange={e => setFilterBy(e.target.value)} style={filterInput}>
          <option value="">All birth years</option>
          {[2008,2009,2010,2011,2012].map(y => <option key={y}>{y}</option>)}
        </select>
      </div>

      {players.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280', fontSize: 13 }}>No players logged yet.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 10 }}>
          {filtered.map(p => (
            <div key={p.id} onClick={() => onPlayerClick(p)}
              style={{ border: '0.5px solid #e5e7eb', borderRadius: 12, padding: '1rem', cursor: 'pointer', background: 'white', transition: 'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <Avatar name={p.name} league={league} />
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{p.team}</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <ByBadge year={p.birth_year} />
                <span style={{ fontSize: 12, color: '#6b7280' }}>{p.position} · {p.apps} apps · {p.mins} min</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const statCard = { background: '#f3f4f6', borderRadius: 8, padding: '0.85rem 1rem' }
const filterInput = { fontSize: 13, padding: '6px 10px', borderRadius: 8, border: '0.5px solid #d1d5db', background: 'white' }
