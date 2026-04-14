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

export default function PlayerTracker({ players, league, onPlayerClick, onSortChange }) {
  const [search, setSearch] = useState('')
  const [filterTeam, setFilterTeam] = useState('')
  const [filterPos, setFilterPos] = useState('')
  const [filterBy, setFilterBy] = useState('')
  const [sort, setSort] = useState({ key: 'mins', dir: -1 })

  const accent = league === 'mnp' ? '#1a6b3c' : '#1a3a6b'
  const teams = [...new Set(players.map(p => p.team))].sort()

  const filtered = players.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    (!filterTeam || p.team === filterTeam) &&
    (!filterPos || p.position === filterPos) &&
    (!filterBy || p.birth_year === parseInt(filterBy))
  ).sort((a, b) => {
    const av = a[sort.key], bv = b[sort.key]
    return typeof av === 'string' ? sort.dir * av.localeCompare(bv) : sort.dir * (av - bv)
  })

  function toggleSort(key) {
    const newSort = { key, dir: sort.key === key ? sort.dir * -1 : (key === 'birth_year' ? 1 : -1) }
    setSort(newSort)
    onSortChange && onSortChange({ ...newSort, search, filterTeam, filterPos, filterBy })
  }

  function handleFilterChange(field, value) {
    const updates = { search, filterTeam, filterPos, filterBy, [field]: value }
    if (field === 'search') setSearch(value)
    if (field === 'filterTeam') setFilterTeam(value)
    if (field === 'filterPos') setFilterPos(value)
    if (field === 'filterBy') setFilterBy(value)
    onSortChange && onSortChange({ ...sort, ...updates })
  }

  const maxMins = Math.max(...players.map(p => p.mins), 1)
  const top = [...players].sort((a, b) => b.mins - a.mins)[0]
  const youngest = [...players].sort((a, b) => b.birth_year - a.birth_year)[0]
  const clubs = new Set(players.map(p => p.team))

  const cols = [
    ['name', 'Player'],
    ['team', 'Club'],
    ['position', 'Pos'],
    ['birth_year', 'Birth year'],
    ['apps', 'Apps'],
    ['mins', 'Minutes'],
    ['goals', 'G'],
    ['assists', 'A'],
  ]

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10, marginBottom: '1.5rem' }}>
        {[
          { label: 'Players tracked', value: players.length, sub: 'Born 2008–2012' },
          { label: 'Clubs', value: clubs.size, sub: 'with eligible players' },
          { label: 'Most minutes', value: top?.name || '—', sub: top ? `${top.team} · ${top.mins} min` : '—', sm: true },
          { label: 'Youngest active', value: youngest?.name || '—', sub: youngest ? `${youngest.team} · Born ${youngest.birth_year}` : '—', sm: true },
        ].map((c, i) => (
          <div key={i} style={{ background: '#f3f4f6', borderRadius: 8, padding: '0.85rem 1rem' }}>
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 3 }}>{c.label}</div>
            <div style={{ fontSize: c.sm ? 14 : 20, fontWeight: 500, paddingTop: c.sm ? 3 : 0 }}>{c.value}</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center', fontSize: 12, color: '#6b7280' }}>
        <span>Birth year:</span>
        {[2008, 2009, 2010, 2011, 2012].map(y => <ByBadge key={y} year={y} />)}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input value={search} onChange={e => handleFilterChange('search', e.target.value)} placeholder="Search player..."
          style={{ ...fi, flex: 1, minWidth: 140 }} />
        <select value={filterTeam} onChange={e => handleFilterChange('filterTeam', e.target.value)} style={fi}>
          <option value="">All teams</option>
          {teams.map(t => <option key={t}>{t}</option>)}
        </select>
        <select value={filterPos} onChange={e => handleFilterChange('filterPos', e.target.value)} style={fi}>
          <option value="">All positions</option>
          {['GK', 'DEF', 'MID', 'FWD'].map(p => <option key={p}>{p}</option>)}
        </select>
        <select value={filterBy} onChange={e => handleFilterChange('filterBy', e.target.value)} style={fi}>
          <option value="">All birth years</option>
          {[2008, 2009, 2010, 2011, 2012].map(y => <option key={y}>{y}</option>)}
        </select>
      </div>

      {players.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280', fontSize: 13 }}>No players logged yet. Use Log match to get started.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {cols.map(([key, label]) => (
                <th key={key} onClick={() => toggleSort(key)} style={th}>
                  {label} <span style={{ opacity: 0.5, fontSize: 10 }}>{sort.key === key ? (sort.dir === 1 ? '↑' : '↓') : '↕'}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id}
                onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                <td style={td}>
                  <span onClick={() => onPlayerClick(p)} style={{ fontWeight: 500, textDecoration: 'underline', textDecorationColor: '#d1d5db', cursor: 'pointer' }}
                    onMouseEnter={e => e.target.style.color = '#2563eb'}
                    onMouseLeave={e => e.target.style.color = 'inherit'}>
                    {p.name}
                  </span>
                </td>
                <td style={{ ...td, fontSize: 12, color: '#6b7280' }}>{p.team}</td>
                <td style={td}>{p.position}</td>
                <td style={td}><ByBadge year={p.birth_year} /></td>
                <td style={td}>{p.apps}</td>
                <td style={td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ height: 5, borderRadius: 3, background: accent, width: Math.round(p.mins / maxMins * 70), minWidth: 2 }} />
                    <span style={{ fontSize: 12, color: '#6b7280', minWidth: 30 }}>{p.mins}</span>
                  </div>
                </td>
                <td style={td}>{p.goals}</td>
                <td style={td}>{p.assists}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

const fi = { fontSize: 13, padding: '6px 10px', borderRadius: 8, border: '0.5px solid #d1d5db', background: 'white' }
const th = { textAlign: 'left', padding: '7px 10px', color: '#6b7280', fontWeight: 500, fontSize: 11, borderBottom: '0.5px solid #e5e7eb', cursor: 'pointer', whiteSpace: 'nowrap' }
const td = { padding: '8px 10px', borderBottom: '0.5px solid #e5e7eb', verticalAlign: 'middle' }
