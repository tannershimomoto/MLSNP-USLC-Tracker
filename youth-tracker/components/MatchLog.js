import { useState } from 'react'
import { TEAMS, BIRTH_YEARS, POSITIONS } from '../lib/constants'
import Autocomplete from './Autocomplete'

const BY_COLORS = {
  2008: { bg: '#dbeafe', color: '#1e40af' },
  2009: { bg: '#d1fae5', color: '#065f46' },
  2010: { bg: '#fef3c7', color: '#92400e' },
  2011: { bg: '#fce7f3', color: '#9d174d' },
  2012: { bg: '#ede9fe', color: '#5b21b6' },
}

const emptyRow = () => ({ name: '', team: '', position: 'MID', birth_year: 2009, minutes: '', goals: '', assists: '' })

export default function MatchLog({ matches, league, existingPlayers, onRefresh }) {
  const [expandedMatch, setExpandedMatch] = useState(null)
  const [deletingMatch, setDeletingMatch] = useState(null)
  const [addingTo, setAddingTo] = useState(null)
  const [newRows, setNewRows] = useState([emptyRow()])
  const [saving, setSaving] = useState(false)

  const accent = league === 'mnp' ? '#1a6b3c' : '#1a3a6b'
  const teams = TEAMS[league]

  const playerSuggestions = (existingPlayers || []).map(p => ({
    label: p.name, sub: `${p.team} · ${p.birth_year}`,
    team: p.team, position: p.position, birth_year: p.birth_year
  }))

  async function deleteMatch(matchId) {
    if (!confirm('Delete this match and all its appearances?')) return
    setDeletingMatch(matchId)
    await fetch('/api/delete-match', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match_id: matchId })
    })
    setDeletingMatch(null)
    onRefresh()
  }

  async function deleteAppearance(appearanceId) {
    if (!confirm('Remove this player from the match?')) return
    await fetch('/api/delete-appearance', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appearance_id: appearanceId })
    })
    onRefresh()
  }

  function updateRow(i, field, val) {
    setNewRows(rows => rows.map((r, idx) => idx === i ? { ...r, [field]: val } : r))
  }

  function selectPlayer(i, item) {
    setNewRows(rows => rows.map((r, idx) => idx === i ? {
      ...r, name: item.label, team: item.team, position: item.position, birth_year: item.birth_year
    } : r))
  }

  async function saveNewPlayers(matchId) {
    const players = newRows.filter(r => r.name && r.minutes > 0).map(r => ({
      name: r.name, team: r.team, position: r.position,
      birth_year: parseInt(r.birth_year),
      minutes: parseInt(r.minutes),
      goals: parseInt(r.goals) || 0,
      assists: parseInt(r.assists) || 0
    }))
    if (!players.length) return
    setSaving(true)
    await fetch('/api/edit-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match_id: matchId, league, players })
    })
    setSaving(false)
    setAddingTo(null)
    setNewRows([emptyRow()])
    onRefresh()
  }

  if (!matches || matches.length === 0) {
    return <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280', fontSize: 13 }}>No matches logged yet.</div>
  }

  return (
    <div>
      {matches.map(m => {
        const appearances = m.appearances || []
        const isExpanded = expandedMatch === m.id
        const isAddingHere = addingTo === m.id

        return (
          <div key={m.id} style={{ border: '0.5px solid #e5e7eb', borderRadius: 12, padding: '0.85rem 1rem', marginBottom: 8, background: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontWeight: 500, fontSize: 14 }}>{m.home_team} {m.score || 'vs'} {m.away_team}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, color: '#6b7280' }}>{m.match_date}</span>
                <button onClick={() => setExpandedMatch(isExpanded ? null : m.id)}
                  style={{ fontSize: 12, color: accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  {isExpanded ? 'Collapse' : 'Edit'}
                </button>
                <button onClick={() => deleteMatch(m.id)}
                  style={{ fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  {deletingMatch === m.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {appearances.length === 0 ? (
                <span style={{ fontSize: 12, color: '#6b7280' }}>No eligible players</span>
              ) : appearances.map((a, i) => {
                if (!a.players) return null
                const c = BY_COLORS[a.players.birth_year] || { bg: '#f3f4f6', color: '#374151' }
                return (
                  <span key={i} style={{ fontSize: 12, padding: '2px 8px', borderRadius: 10, background: '#f3f4f6', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 11, padding: '1px 5px', borderRadius: 8, background: c.bg, color: c.color, fontWeight: 500 }}>{a.players.birth_year}</span>
                    {a.players.name} · {a.minutes}'{a.goals ? ` · ${a.goals}G` : ''}{a.assists ? ` · ${a.assists}A` : ''}
                    {isExpanded && (
                      <button onClick={() => deleteAppearance(a.id)}
                        style={{ marginLeft: 2, fontSize: 14, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, padding: 0 }}>×</button>
                    )}
                  </span>
                )
              })}
            </div>

            {isExpanded && (
              <div style={{ marginTop: 12, borderTop: '0.5px solid #e5e7eb', paddingTop: 12 }}>
                {!isAddingHere ? (
                  <button onClick={() => { setAddingTo(m.id); setNewRows([emptyRow()]) }}
                    style={{ fontSize: 13, padding: '6px 14px', borderRadius: 8, border: `0.5px dashed ${accent}`, background: 'none', color: accent, cursor: 'pointer' }}>
                    + Add player to this match
                  </button>
                ) : (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Add players</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 80px 80px 70px 56px 56px 32px', gap: 6, marginBottom: 4 }}>
                      {['Player','Team','Pos','Birth yr','Min','G','A',''].map((h,i) => (
                        <span key={i} style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>{h}</span>
                      ))}
                    </div>
                    {newRows.map((row, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 80px 80px 70px 56px 56px 32px', gap: 6, marginBottom: 6, alignItems: 'start' }}>
                        <Autocomplete value={row.name} onChange={v => updateRow(i,'name',v)}
                          suggestions={playerSuggestions} placeholder="Player name..." onSelect={item => selectPlayer(i, item)} />
                        <Autocomplete value={row.team} onChange={v => updateRow(i,'team',v)} suggestions={teams} placeholder="Team..." />
                        <select value={row.position} onChange={e => updateRow(i,'position',e.target.value)} style={inputStyle}>
                          {POSITIONS.map(p => <option key={p}>{p}</option>)}
                        </select>
                        <select value={row.birth_year} onChange={e => updateRow(i,'birth_year',e.target.value)} style={inputStyle}>
                          {BIRTH_YEARS.map(y => <option key={y}>{y}</option>)}
                        </select>
                        <div>
                          <input type="number" value={row.minutes} onChange={e => updateRow(i,'minutes',e.target.value)}
                            placeholder="min" style={{ ...inputStyle, textAlign: 'center' }} />
                          <div style={{ display: 'flex', gap: 3, marginTop: 3 }}>
                            {[90,45,60].map(mins => (
                              <button key={mins} onMouseDown={() => updateRow(i,'minutes',mins)}
                                style={{ fontSize: 11, padding: '2px 5px', borderRadius: 4, border: '0.5px solid #d1d5db', background: 'none', color: '#6b7280', cursor: 'pointer' }}>{mins}</button>
                            ))}
                          </div>
                        </div>
                        <input type="number" value={row.goals} onChange={e => updateRow(i,'goals',e.target.value)} placeholder="0" style={{ ...inputStyle, textAlign: 'center' }} />
                        <input type="number" value={row.assists} onChange={e => updateRow(i,'assists',e.target.value)} placeholder="0" style={{ ...inputStyle, textAlign: 'center' }} />
                        <button onClick={() => setNewRows(r => r.filter((_,idx) => idx !== i))}
                          style={{ width: 28, height: 28, borderRadius: 6, border: '0.5px solid #d1d5db', background: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 16 }}>×</button>
                      </div>
                    ))}
                    <button onClick={() => setNewRows(r => [...r, emptyRow()])}
                      style={{ fontSize: 13, padding: '6px 14px', borderRadius: 8, border: '0.5px dashed #d1d5db', background: 'none', color: '#6b7280', cursor: 'pointer', marginBottom: 10, display: 'block' }}>
                      + Add row
                    </button>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => saveNewPlayers(m.id)} disabled={saving}
                        style={{ fontSize: 13, fontWeight: 500, padding: '7px 16px', borderRadius: 8, border: 'none', background: accent, color: 'white', cursor: 'pointer' }}>
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button onClick={() => { setAddingTo(null); setNewRows([emptyRow()]) }}
                        style={{ fontSize: 13, padding: '7px 16px', borderRadius: 8, border: '0.5px solid #d1d5db', background: 'none', color: '#6b7280', cursor: 'pointer' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

const inputStyle = { width: '100%', padding: '6px 8px', fontSize: 13, border: '0.5px solid #d1d5db', borderRadius: 8, background: 'white' }
