import { useState } from 'react'

const BY_COLORS = {
  2008: { bg: '#dbeafe', color: '#1e40af' },
  2009: { bg: '#d1fae5', color: '#065f46' },
  2010: { bg: '#fef3c7', color: '#92400e' },
  2011: { bg: '#fce7f3', color: '#9d174d' },
  2012: { bg: '#ede9fe', color: '#5b21b6' },
}

// Agency color palette — distinct enough to tell apart
const AGENCY_PALETTE = [
  { bg: '#fef9c3', color: '#854d0e', border: '#fde047' },
  { bg: '#fce7f3', color: '#831843', border: '#f9a8d4' },
  { bg: '#e0f2fe', color: '#0c4a6e', border: '#7dd3fc' },
  { bg: '#dcfce7', color: '#14532d', border: '#86efac' },
  { bg: '#f3e8ff', color: '#581c87', border: '#d8b4fe' },
  { bg: '#fff7ed', color: '#7c2d12', border: '#fdba74' },
  { bg: '#f0fdf4', color: '#166534', border: '#4ade80' },
  { bg: '#fdf2f8', color: '#701a75', border: '#e879f9' },
  { bg: '#eff6ff', color: '#1e3a5f', border: '#93c5fd' },
  { bg: '#fefce8', color: '#713f12', border: '#fcd34d' },
]

function buildAgencyColorMap(players) {
  const agencies = [...new Set(players.map(p => p.agency).filter(Boolean))].sort()
  const map = {}
  agencies.forEach((agency, i) => {
    map[agency] = AGENCY_PALETTE[i % AGENCY_PALETTE.length]
  })
  return map
}

function ByBadge({ year }) {
  const c = BY_COLORS[year] || { bg: '#f3f4f6', color: '#374151' }
  return <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 10, fontWeight: 500, background: c.bg, color: c.color }}>{year}</span>
}

function AgencyBadge({ agency, colorMap }) {
  if (!agency) return null
  const c = colorMap[agency] || { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' }
  return (
    <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 10, fontWeight: 500, background: c.bg, color: c.color, border: `1px solid ${c.border}`, display: 'inline-block' }}>
      {agency}
    </span>
  )
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

function PlayerDetail({ player, league, colorMap, onBack, onAgencyUpdate }) {
  const [editingAgency, setEditingAgency] = useState(false)
  const [agencyInput, setAgencyInput] = useState(player.agency || '')
  const [saving, setSaving] = useState(false)
  const avgMins = player.apps > 0 ? Math.round(player.mins / player.apps) : 0
  const accent = league === 'mnp' ? '#1a6b3c' : '#1a3a6b'

  async function saveAgency() {
    setSaving(true)
    await fetch('/api/update-agency', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id: player.id, agency: agencyInput.trim() || null })
    })
    setSaving(false)
    setEditingAgency(false)
    onAgencyUpdate(player.id, agencyInput.trim() || null)
  }

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

      {/* Agency section */}
      <div style={{ border: '0.5px solid #e5e7eb', borderRadius: 10, padding: '0.85rem 1rem', marginBottom: '1.25rem', background: 'white' }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Agency</div>
        {!editingAgency ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {player.agency
              ? <AgencyBadge agency={player.agency} colorMap={colorMap} />
              : <span style={{ fontSize: 13, color: '#9ca3af' }}>No agency set</span>
            }
            <button onClick={() => setEditingAgency(true)}
              style={{ fontSize: 12, color: accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              {player.agency ? 'Edit' : '+ Add agency'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input value={agencyInput} onChange={e => setAgencyInput(e.target.value)}
              placeholder="Agency name..." autoFocus
              style={{ fontSize: 13, padding: '6px 10px', borderRadius: 8, border: '0.5px solid #d1d5db', background: 'white', flex: 1 }} />
            <button onClick={saveAgency} disabled={saving}
              style={{ fontSize: 13, fontWeight: 500, padding: '6px 14px', borderRadius: 8, border: 'none', background: accent, color: 'white', cursor: 'pointer' }}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => { setEditingAgency(false); setAgencyInput(player.agency || '') }}
              style={{ fontSize: 13, padding: '6px 14px', borderRadius: 8, border: '0.5px solid #d1d5db', background: 'none', color: '#6b7280', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10, marginBottom: '1rem' }}>
        {[['Appearances', player.apps],['Total minutes', player.mins],['Goals', player.goals],['Assists', player.assists]].map(([label, value]) => (
          <div key={label} style={statCard}>
            <div style={statLabel}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 500 }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10, marginBottom: '1.5rem' }}>
        {[['Avg min / game', avgMins],['Goals + assists', player.goals + player.assists],['Birth year', player.birth_year]].map(([label, value]) => (
          <div key={label} style={statCard}>
            <div style={statLabel}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 500 }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, fontWeight: 500, color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Match history</div>
      {(player.matchLog || []).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280', fontSize: 13 }}>No match history yet.</div>
      ) : (player.matchLog || []).map((m, i) => (
        <div key={i} style={{ border: '0.5px solid #e5e7eb', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: 7, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
          <div>
            <div style={{ fontWeight: 500 }}>{m.home} {m.score || 'vs'} {m.away}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{m.date}</div>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {[["min", m.minutes + "'"], ["G", m.goals], ["A", m.assists]].map(([lbl, val]) => (
              <div key={lbl} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{val}</div>
                <div style={{ fontSize: 10, color: '#6b7280' }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function PlayerProfiles({ players, league, selectedPlayer, onPlayerClick, onBack, onAgencyUpdate }) {
  const [search, setSearch] = useState('')
  const [filterTeam, setFilterTeam] = useState('')
  const [filterBy, setFilterBy] = useState('')
  const [filterAgency, setFilterAgency] = useState('')

  const colorMap = buildAgencyColorMap(players)
  const teams = [...new Set(players.map(p => p.team))].sort()
  const agencies = [...new Set(players.map(p => p.agency).filter(Boolean))].sort()

  if (selectedPlayer) {
    return <PlayerDetail player={selectedPlayer} league={league} colorMap={colorMap} onBack={onBack} onAgencyUpdate={onAgencyUpdate} />
  }

  const filtered = players.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    (!filterTeam || p.team === filterTeam) &&
    (!filterBy || p.birth_year === parseInt(filterBy)) &&
    (!filterAgency || p.agency === filterAgency)
  ).sort((a, b) => b.mins - a.mins)

  return (
    <div>
      {/* Agency legend */}
      {agencies.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#6b7280' }}>Agencies:</span>
          {agencies.map(agency => (
            <span key={agency} onClick={() => setFilterAgency(filterAgency === agency ? '' : agency)}
              style={{ cursor: 'pointer', opacity: filterAgency && filterAgency !== agency ? 0.4 : 1 }}>
              <AgencyBadge agency={agency} colorMap={colorMap} />
            </span>
          ))}
          {filterAgency && (
            <button onClick={() => setFilterAgency('')} style={{ fontSize: 11, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              Clear filter
            </button>
          )}
        </div>
      )}

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
        {agencies.length > 0 && (
          <select value={filterAgency} onChange={e => setFilterAgency(e.target.value)} style={filterInput}>
            <option value="">All agencies</option>
            {agencies.map(a => <option key={a}>{a}</option>)}
          </select>
        )}
      </div>

      {players.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280', fontSize: 13 }}>No players logged yet.</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280', fontSize: 13 }}>No players match your filters.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 10 }}>
          {filtered.map(p => (
            <div key={p.id} onClick={() => onPlayerClick(p)}
              style={{ border: '0.5px solid #e5e7eb', borderRadius: 12, padding: '1rem', cursor: 'pointer', background: 'white' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <Avatar name={p.name} league={league} />
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{p.team}</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: p.agency ? 8 : 0 }}>
                <ByBadge year={p.birth_year} />
                <span style={{ fontSize: 12, color: '#6b7280' }}>{p.position} · {p.apps} apps · {p.mins} min</span>
              </div>
              {p.agency && (
                <div style={{ marginTop: 8 }}>
                  <AgencyBadge agency={p.agency} colorMap={colorMap} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const statCard = { background: '#f3f4f6', borderRadius: 8, padding: '0.85rem 1rem' }
const statLabel = { fontSize: 11, color: '#6b7280', marginBottom: 4 }
const filterInput = { fontSize: 13, padding: '6px 10px', borderRadius: 8, border: '0.5px solid #d1d5db', background: 'white' }
