import { useState } from 'react'

const BY_COLORS = {
  2008: '#3b82f6',
  2009: '#10b981',
  2010: '#f59e0b',
  2011: '#ec4899',
  2012: '#8b5cf6',
}

const BY_LABELS = {
  2008: { bg: '#dbeafe', color: '#1e40af' },
  2009: { bg: '#d1fae5', color: '#065f46' },
  2010: { bg: '#fef3c7', color: '#92400e' },
  2011: { bg: '#fce7f3', color: '#9d174d' },
  2012: { bg: '#ede9fe', color: '#5b21b6' },
}

export default function ClubComparison({ players, league }) {
  const [sortBy, setSortBy] = useState('total')
  const [filterBy, setFilterBy] = useState('')
  const accent = league === 'mnp' ? '#1a6b3c' : '#1a3a6b'

  // Build club stats
  const clubMap = {}
  players.forEach(p => {
    if (!clubMap[p.team]) {
      clubMap[p.team] = { team: p.team, total: 0, players: 0, byYear: {}, playerList: [] }
    }
    clubMap[p.team].total += p.mins
    clubMap[p.team].players++
    clubMap[p.team].playerList.push(p)
    const yr = p.birth_year
    clubMap[p.team].byYear[yr] = (clubMap[p.team].byYear[yr] || 0) + p.mins
  })

  let clubs = Object.values(clubMap)

  if (filterBy) {
    clubs = clubs.filter(c => c.byYear[parseInt(filterBy)] > 0)
  }

  clubs.sort((a, b) => {
    if (sortBy === 'total') return b.total - a.total
    if (sortBy === 'players') return b.players - a.players
    if (sortBy === 'team') return a.team.localeCompare(b.team)
    const yr = parseInt(sortBy)
    return (b.byYear[yr] || 0) - (a.byYear[yr] || 0)
  })

  const maxTotal = Math.max(...clubs.map(c => c.total), 1)

  if (players.length === 0) {
    return <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280', fontSize: 13 }}>No data yet. Log matches to see club comparisons.</div>
  }

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10, marginBottom: '1.5rem' }}>
        <div style={statCard}>
          <div style={statLabel}>Clubs giving minutes</div>
          <div style={statVal}>{clubs.length}</div>
          <div style={statSub}>to 2008–2012 players</div>
        </div>
        <div style={statCard}>
          <div style={statLabel}>Total minutes logged</div>
          <div style={statVal}>{clubs.reduce((s,c)=>s+c.total,0).toLocaleString()}</div>
          <div style={statSub}>across all clubs</div>
        </div>
        <div style={statCard}>
          <div style={statLabel}>Most committed club</div>
          <div style={{ ...statVal, fontSize: 14, paddingTop: 3 }}>{clubs[0]?.team || '—'}</div>
          <div style={statSub}>{clubs[0] ? clubs[0].total + ' min' : '—'}</div>
        </div>
        <div style={statCard}>
          <div style={statLabel}>Most players used</div>
          <div style={{ ...statVal, fontSize: 14, paddingTop: 3 }}>{[...clubs].sort((a,b)=>b.players-a.players)[0]?.team || '—'}</div>
          <div style={statSub}>{[...clubs].sort((a,b)=>b.players-a.players)[0]?.players || 0} unique players</div>
        </div>
      </div>

      {/* Birth year legend */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center', fontSize: 12, color: '#6b7280' }}>
        <span>Birth year breakdown:</span>
        {[2008,2009,2010,2011,2012].map(y => (
          <span key={y} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: BY_COLORS[y], display: 'inline-block' }} />
            <span style={{ fontSize: 11 }}>{y}</span>
          </span>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#6b7280' }}>Sort by:</span>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={filterInput}>
          <option value="total">Total minutes</option>
          <option value="players">Players used</option>
          <option value="team">Club name</option>
          <option value="2008">2008 minutes</option>
          <option value="2009">2009 minutes</option>
          <option value="2010">2010 minutes</option>
          <option value="2011">2011 minutes</option>
          <option value="2012">2012 minutes</option>
        </select>
        <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 8 }}>Filter:</span>
        <select value={filterBy} onChange={e => setFilterBy(e.target.value)} style={filterInput}>
          <option value="">All birth years</option>
          <option value="2008">Has 2008 minutes</option>
          <option value="2009">Has 2009 minutes</option>
          <option value="2010">Has 2010 minutes</option>
          <option value="2011">Has 2011 minutes</option>
          <option value="2012">Has 2012 minutes</option>
        </select>
      </div>

      {/* Club bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {clubs.map(club => {
          const years = [2008,2009,2010,2011,2012].filter(y => club.byYear[y] > 0)
          return (
            <div key={club.team} style={{ border: '0.5px solid #e5e7eb', borderRadius: 10, padding: '0.85rem 1rem', background: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <span style={{ fontWeight: 500, fontSize: 14 }}>{club.team}</span>
                  <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 8 }}>{club.players} player{club.players !== 1 ? 's' : ''}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: accent }}>{club.total.toLocaleString()} min</span>
              </div>

              {/* Stacked bar */}
              <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', background: '#f3f4f6', marginBottom: 8 }}>
                {[2008,2009,2010,2011,2012].map(y => {
                  const mins = club.byYear[y] || 0
                  const pct = (mins / maxTotal) * 100
                  if (!mins) return null
                  return <div key={y} style={{ width: pct + '%', background: BY_COLORS[y], minWidth: mins > 0 ? 2 : 0 }} title={`${y}: ${mins} min`} />
                })}
              </div>

              {/* Year breakdown chips */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {years.map(y => {
                  const c = BY_LABELS[y]
                  return (
                    <span key={y} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: c.bg, color: c.color, fontWeight: 500 }}>
                      {y}: {club.byYear[y]} min
                    </span>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const statCard = { background: '#f3f4f6', borderRadius: 8, padding: '0.85rem 1rem' }
const statLabel = { fontSize: 11, color: '#6b7280', marginBottom: 3 }
const statVal = { fontSize: 20, fontWeight: 500 }
const statSub = { fontSize: 11, color: '#6b7280', marginTop: 2 }
const filterInput = { fontSize: 13, padding: '6px 10px', borderRadius: 8, border: '0.5px solid #d1d5db', background: 'white' }
