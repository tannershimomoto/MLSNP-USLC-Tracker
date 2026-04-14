import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import LogMatch from '../components/LogMatch'
import PlayerTracker from '../components/PlayerTracker'
import PlayerProfiles from '../components/PlayerProfiles'
import MatchLog from '../components/MatchLog'
import ClubComparison from '../components/ClubComparison'
import ExportButton from '../components/ExportButton'

const TABS = ['+ Log match', 'Player tracker', 'Club minutes', 'Player profiles', 'Match log']

export default function Home() {
  const [league, setLeague] = useState('mnp')
  const [tab, setTab] = useState(0)
  const [players, setPlayers] = useState([])
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [sortState, setSortState] = useState({ key: 'mins', dir: -1, search: '', filterTeam: '', filterPos: '', filterBy: '' })

  const accent = league === 'mnp' ? '#1a6b3c' : '#1a3a6b'

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [pRes, mRes] = await Promise.all([
      fetch(`/api/get-players?league=${league}`),
      fetch(`/api/get-matches?league=${league}`)
    ])
    const [pData, mData] = await Promise.all([pRes.json(), mRes.json()])
    setPlayers(pData.players || [])
    setMatches(mData.matches || [])
    setLoading(false)
  }, [league])

  useEffect(() => {
    fetchData()
    setSelectedPlayer(null)
    setTab(0)
    setSortState({ key: 'mins', dir: -1, search: '', filterTeam: '', filterPos: '', filterBy: '' })
  }, [league])

  function handlePlayerClick(player) {
    setSelectedPlayer(player)
    setTab(3)
  }

  function handleBack() {
    setSelectedPlayer(null)
  }

  return (
    <>
      <Head>
        <title>Youth Tracker — MLS NEXT Pro & USL Championship</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{ minHeight: '100vh', background: '#f9f9f8' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 1rem' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.25rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 500, color: '#1a1a1a' }}>
                {league === 'mnp' ? 'MLS NEXT Pro' : 'USL Championship'} Youth Tracker
              </h1>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Born 2008–2012 · 2026–27 Season</div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <ExportButton league={league} sortState={sortState} />
            </div>
          </div>

          {/* League switcher */}
          <div style={{ display: 'flex', marginBottom: '1.5rem', border: '0.5px solid #d1d5db', borderRadius: 8, overflow: 'hidden', width: 'fit-content' }}>
            {[['mnp', 'MLS NEXT Pro'], ['usl', 'USL Championship']].map(([key, label], i) => (
              <span key={key} style={{ display: 'contents' }}>
                {i > 0 && <div style={{ width: '0.5px', background: '#d1d5db' }} />}
                <button onClick={() => setLeague(key)} style={{
                  padding: '8px 20px', fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer',
                  background: league === key ? accent : 'white',
                  color: league === key ? 'white' : '#6b7280'
                }}>{label}</button>
              </span>
            ))}
          </div>

          {/* Main card */}
          <div style={{ background: 'white', borderRadius: 12, border: '0.5px solid #e5e7eb', padding: '1.25rem 1.5rem' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: '1.5rem', borderBottom: '0.5px solid #e5e7eb', overflowX: 'auto' }}>
              {TABS.map((t, i) => (
                <button key={i} onClick={() => { setTab(i); if (i !== 3) setSelectedPlayer(null) }} style={{
                  padding: '8px 16px', fontSize: 14, border: 'none', background: 'none', cursor: 'pointer',
                  borderBottom: tab === i ? `2px solid ${accent}` : '2px solid transparent',
                  color: tab === i ? accent : '#6b7280',
                  fontWeight: tab === i ? 500 : 400,
                  marginBottom: -1, whiteSpace: 'nowrap'
                }}>{t}</button>
              ))}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280', fontSize: 13 }}>Loading...</div>
            ) : (
              <>
                {tab === 0 && <LogMatch league={league} existingPlayers={players} onSaved={fetchData} />}
                {tab === 1 && (
                  <PlayerTracker
                    players={players}
                    league={league}
                    onPlayerClick={handlePlayerClick}
                    onSortChange={setSortState}
                  />
                )}
                {tab === 2 && <ClubComparison players={players} league={league} />}
                {tab === 3 && (
                  <PlayerProfiles
                    players={players}
                    league={league}
                    selectedPlayer={selectedPlayer}
                    onPlayerClick={handlePlayerClick}
                    onBack={handleBack}
                  />
                )}
                {tab === 4 && (
                  <MatchLog
                    matches={matches}
                    league={league}
                    existingPlayers={players}
                    onRefresh={fetchData}
                  />
                )}
              </>
            )}
          </div>

        </div>
      </div>
    </>
  )
}
