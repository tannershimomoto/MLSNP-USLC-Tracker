import { useState } from 'react'
import Autocomplete from './Autocomplete'
import { TEAMS, BIRTH_YEARS, POSITIONS } from '../lib/constants'

const emptyRow = () => ({ name: '', team: '', position: 'MID', birth_year: 2009, minutes: '', goals: '', assists: '' })

export default function LogMatch({ league, existingPlayers, onSaved }) {
  const [date, setDate] = useState('')
  const [home, setHome] = useState('')
  const [score, setScore] = useState('')
  const [away, setAway] = useState('')
  const [rows, setRows] = useState([emptyRow()])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const accent = league === 'mnp' ? '#1a6b3c' : '#1a3a6b'
  const teams = TEAMS[league]

  const playerSuggestions = existingPlayers.map(p => ({
    label: p.name, sub: `${p.team} · ${p.birth_year}`,
    team: p.team, position: p.position, birth_year: p.birth_year
  }))

  function updateRow(i, field, val) {
    setRows(rows => rows.map((r, idx) => idx === i ? { ...r, [field]: val } : r))
  }

  function selectPlayer(i, item) {
    setRows(rows => rows.map((r, idx) => idx === i ? {
      ...r, name: item.label, team: item.team,
      position: item.position, birth_year: item.birth_year
    } : r))
  }

  function setMins(i, val) { updateRow(i, 'minutes', val) }

  function addRow() { setRows(r => [...r, emptyRow()]) }
  function removeRow(i) { setRows(r => r.filter((_, idx) => idx !== i)) }

  async function handleSave() {
    if (!date || !home || !away) { setError('Please fill in date and both team names.'); return }
    const players = rows.filter(r => r.name && r.minutes > 0).map(r => ({
      name: r.name, team: r.team, position: r.position,
      birth_year: parseInt(r.birth_year),
      minutes: parseInt(r.minutes),
      goals: parseInt(r.goals) || 0,
      assists: parseInt(r.assists) || 0
    }))
    setSaving(true); setError('')
    const res = await fetch('/api/save-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ league, home_team: home, away_team: away, score, match_date: date, players })
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error || 'Something went wrong'); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    setDate(''); setHome(''); setScore(''); setAway('')
    setRows([emptyRow()])
    onSaved && onSaved()
  }

  return (
    <div>
      {/* Match details */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={sectionTitle}>Match details</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ ...formGroup, maxWidth: 150 }}>
            <label style={labelStyle}>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
          </div>
          <div style={formGroup}>
            <label style={labelStyle}>Home team</label>
            <Autocomplete value={home} onChange={setHome} suggestions={teams} placeholder="Type or select..." />
          </div>
          <div style={{ ...formGroup, maxWidth: 72 }}>
            <label style={labelStyle}>Score</label>
            <input value={score} onChange={e => setScore(e.target.value)} placeholder="2-1" style={{ ...inputStyle, textAlign: 'center' }} />
          </div>
          <div style={formGroup}>
            <label style={labelStyle}>Away team</label>
            <Autocomplete value={away} onChange={setAway} suggestions={teams} placeholder="Type or select..." />
          </div>
        </div>
      </div>

      {/* Player rows */}
      <div>
        <div style={sectionTitle}>Eligible players who appeared (born 2008–2012)</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 80px 80px 70px 56px 56px 32px', gap: 6, marginBottom: 4 }}>
          {['Player name','Team','Position','Birth year','Minutes','G','A',''].map((h,i) => (
            <span key={i} style={{ fontSize: 11, color: '#6b7280', fontWeight: 500, textAlign: i >= 5 ? 'center' : 'left' }}>{h}</span>
          ))}
        </div>
        {rows.map((row, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 80px 80px 70px 56px 56px 32px', gap: 6, marginBottom: 6, alignItems: 'start' }}>
            <Autocomplete value={row.name} onChange={v => updateRow(i,'name',v)}
              suggestions={playerSuggestions} placeholder="Player name..."
              onSelect={item => selectPlayer(i, item)} />
            <Autocomplete value={row.team} onChange={v => updateRow(i,'team',v)}
              suggestions={teams} placeholder="Team..." />
            <select value={row.position} onChange={e => updateRow(i,'position',e.target.value)} style={inputStyle}>
              {POSITIONS.map(p => <option key={p}>{p}</option>)}
            </select>
            <select value={row.birth_year} onChange={e => updateRow(i,'birth_year',e.target.value)} style={inputStyle}>
              {BIRTH_YEARS.map(y => <option key={y}>{y}</option>)}
            </select>
            <div>
              <input type="number" value={row.minutes} onChange={e => updateRow(i,'minutes',e.target.value)}
                placeholder="min" min={1} max={120} style={{ ...inputStyle, textAlign: 'center' }} />
              <div style={{ display: 'flex', gap: 3, marginTop: 3 }}>
                {[90,45,60].map(m => (
                  <button key={m} onMouseDown={() => setMins(i,m)} style={qBtn}>{m}</button>
                ))}
              </div>
            </div>
            <input type="number" value={row.goals} onChange={e => updateRow(i,'goals',e.target.value)}
              placeholder="0" min={0} style={{ ...inputStyle, textAlign: 'center' }} />
            <input type="number" value={row.assists} onChange={e => updateRow(i,'assists',e.target.value)}
              placeholder="0" min={0} style={{ ...inputStyle, textAlign: 'center' }} />
            <button onClick={() => removeRow(i)} style={rmBtn}>×</button>
          </div>
        ))}
        <button onClick={addRow} style={addRowBtn}>+ Add player</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={handleSave} disabled={saving} style={{ ...submitBtn, background: accent }}>
          {saving ? 'Saving...' : 'Save match'}
        </button>
        {saved && <span style={{ fontSize: 13, color: '#065f46', background: '#d1fae5', borderRadius: 8, padding: '8px 14px' }}>Match saved!</span>}
        {error && <span style={{ fontSize: 13, color: '#991b1b', background: '#fee2e2', borderRadius: 8, padding: '8px 14px' }}>{error}</span>}
      </div>
    </div>
  )
}

const sectionTitle = { fontSize: 11, fontWeight: 500, color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }
const formGroup = { display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 120 }
const labelStyle = { fontSize: 12, color: '#6b7280' }
const inputStyle = { width: '100%', padding: '7px 10px', fontSize: 13, border: '0.5px solid #d1d5db', borderRadius: 8, outline: 'none', background: 'white' }
const qBtn = { fontSize: 11, padding: '2px 5px', borderRadius: 4, border: '0.5px solid #d1d5db', background: 'none', color: '#6b7280', cursor: 'pointer' }
const rmBtn = { width: 28, height: 28, borderRadius: 6, border: '0.5px solid #d1d5db', background: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }
const addRowBtn = { width: '100%', padding: '7px 14px', fontSize: 13, borderRadius: 8, border: '0.5px dashed #d1d5db', background: 'none', color: '#6b7280', cursor: 'pointer', textAlign: 'center', marginBottom: 14 }
const submitBtn = { fontSize: 13, fontWeight: 500, padding: '9px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', color: 'white' }
