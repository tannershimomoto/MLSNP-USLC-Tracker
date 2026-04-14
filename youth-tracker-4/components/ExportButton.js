import { useState } from 'react'

const BY_COLORS_HEX = {
  2008: { bg: [219, 234, 254], text: [30, 64, 175] },
  2009: { bg: [209, 250, 229], text: [6, 95, 70] },
  2010: { bg: [254, 243, 199], text: [146, 64, 14] },
  2011: { bg: [252, 231, 243], text: [157, 23, 77] },
  2012: { bg: [237, 233, 254], text: [91, 33, 182] },
}

const YEARS = [2008, 2009, 2010, 2011, 2012]

export default function ExportButton({ league, sortState }) {
  const [loading, setLoading] = useState(false)
  const accent = league === 'mnp' ? '#1a6b3c' : '#1a3a6b'
  const accentRGB = league === 'mnp' ? [26, 107, 60] : [26, 58, 107]
  const leagueLabel = league === 'mnp' ? 'MLS NEXT Pro' : 'USL Championship'

  async function handleExport() {
    setLoading(true)
    try {
      const { jsPDF } = await import('jspdf')
      await import('jspdf-autotable')

      const res = await fetch(`/api/export-data?league=${league}`)
      const { allPlayers, clubs, matchCount } = await res.json()

      // Apply current sort/filter from tracker
      const ss = sortState || { key: 'mins', dir: -1, search: '', filterTeam: '', filterPos: '', filterBy: '' }
      const players = allPlayers.filter(p =>
        p.name.toLowerCase().includes((ss.search || '').toLowerCase()) &&
        (!ss.filterTeam || p.team === ss.filterTeam) &&
        (!ss.filterPos || p.position === ss.filterPos) &&
        (!ss.filterBy || p.birth_year === parseInt(ss.filterBy))
      ).sort((a, b) => {
        const av = a[ss.key], bv = b[ss.key]
        return typeof av === 'string' ? ss.dir * av.localeCompare(bv) : ss.dir * (av - bv)
      })

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const pageW = doc.internal.pageSize.getWidth()
      const pageH = doc.internal.pageSize.getHeight()
      const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      const M = 12

      function drawHeader(pageNum, totalPages) {
        doc.setFillColor(...accentRGB)
        doc.rect(0, 0, pageW, 22, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text(`${leagueLabel} — Youth Scouting Report`, M, 10)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.text(`Born 2008–2012  ·  2026–27 Season  ·  ${today}`, M, 17)
        doc.text(`Page ${pageNum} of ${totalPages}`, pageW - M, 17, { align: 'right' })
      }

      function drawFooter() {
        doc.setTextColor(160, 160, 160)
        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        doc.text('Confidential — internal scouting report', M, pageH - 5)
        doc.text(`${leagueLabel} Youth Tracker · 2026–27`, pageW - M, pageH - 5, { align: 'right' })
      }

      // ── PAGE 1: Player Tracker ─────────────────────────────────────
      drawHeader(1, 2)

      // Stat boxes — always reflect the filtered/sorted view shown in the table
      const filteredMins = players.reduce((s, p) => s + p.mins, 0)
      const filteredClubs = new Set(players.map(p => p.team)).size
      const statBoxes = [
        { label: 'Players in view', value: String(players.length) },
        { label: 'Clubs represented', value: String(filteredClubs) },
        { label: 'Total minutes', value: filteredMins.toLocaleString() },
        { label: 'Matches recorded', value: String(matchCount) },
      ]
      const bw = (pageW - M * 2 - 9) / 4
      statBoxes.forEach((box, i) => {
        const bx = M + i * (bw + 3)
        const by = 26
        doc.setFillColor(245, 246, 247)
        doc.roundedRect(bx, by, bw, 14, 2, 2, 'F')
        doc.setTextColor(110, 110, 110)
        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        doc.text(box.label, bx + bw / 2, by + 4.5, { align: 'center' })
        doc.setTextColor(20, 20, 20)
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text(box.value, bx + bw / 2, by + 11, { align: 'center' })
      })

      // Sort/filter descriptor
      const sortLabels = {
        mins: 'total minutes', name: 'player name', team: 'club',
        birth_year: 'birth year', apps: 'appearances', goals: 'goals',
        assists: 'assists', position: 'position'
      }
      const filterParts = []
      if (ss.filterTeam) filterParts.push(ss.filterTeam)
      if (ss.filterPos) filterParts.push(ss.filterPos)
      if (ss.filterBy) filterParts.push(String(ss.filterBy))
      if (ss.search) filterParts.push(`"${ss.search}"`)
      const filterDesc = filterParts.length ? `  ·  Filtered: ${filterParts.join(', ')}` : ''

      doc.setTextColor(...accentRGB)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text(`Player tracker — sorted by ${sortLabels[ss.key] || ss.key}${filterDesc}`, M, 47)
      doc.setDrawColor(...accentRGB)
      doc.setLineWidth(0.4)
      doc.line(M, 49, pageW - M, 49)

      // Player table
      // Landscape A4 = 297mm wide. With M=12 each side: 273mm usable.
      // Column widths must sum to exactly 273:
      // # = 14, Player = 58, Club = 65, Pos = 14, Birth year = 24, Apps = 16, Minutes = 22, G = 14, A = 14 → total = 241... 
      // Distribute remainder to Player + Club → Player=68, Club=75 = 273 ✓
      const tableRows = players.map((p, i) => [
        i + 1,
        p.name,
        p.team,
        p.position,
        p.birth_year,
        p.apps,
        p.mins,
        p.goals,
        p.assists,
      ])

      doc.autoTable({
        startY: 52,
        head: [['#', 'Player', 'Club', 'Pos', 'Birth year', 'Apps', 'Minutes', 'G', 'A']],
        body: tableRows,
        margin: { left: M, right: M },
        tableWidth: pageW - M * 2,
        styles: {
          fontSize: 8,
          cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
          lineColor: [230, 230, 230],
          lineWidth: 0.25,
          overflow: 'ellipsize',
          valign: 'middle',
        },
        headStyles: {
          fillColor: accentRGB,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'left',
          cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
        },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: {
          0: { cellWidth: 14, halign: 'center', overflow: 'visible' },
          1: { cellWidth: 68, fontStyle: 'bold' },
          2: { cellWidth: 75 },
          3: { cellWidth: 14, halign: 'center' },
          4: { cellWidth: 24, halign: 'center' },
          5: { cellWidth: 16, halign: 'center' },
          6: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
          7: { cellWidth: 20, halign: 'center' },
          8: { cellWidth: 20, halign: 'center' },
        },
        didParseCell: (data) => {
          // Color birth year cells
          if (data.column.index === 4 && data.section === 'body') {
            const yr = data.cell.raw
            const c = BY_COLORS_HEX[yr]
            if (c) {
              data.cell.styles.fillColor = c.bg
              data.cell.styles.textColor = c.text
              data.cell.styles.fontStyle = 'bold'
              data.cell.styles.halign = 'center'
            }
          }
          // Keep row numbers on one line — never wrap
          if (data.column.index === 0) {
            data.cell.styles.overflow = 'visible'
            data.cell.styles.halign = 'center'
          }
        },
      })

      drawFooter()

      // ── PAGE 2: Club Minutes ───────────────────────────────────────
      doc.addPage()
      drawHeader(2, 2)

      doc.setTextColor(...accentRGB)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('Club minutes breakdown — total minutes given to 2008–2012 players, sorted by total', M, 30)
      doc.setDrawColor(...accentRGB)
      doc.setLineWidth(0.4)
      doc.line(M, 32, pageW - M, 32)

      // Birth year legend
      let lx = M
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(90, 90, 90)
      doc.text('Birth year key:', lx, 38)
      lx += 22
      YEARS.forEach(y => {
        const c = BY_COLORS_HEX[y]
        doc.setFillColor(...c.bg)
        doc.setDrawColor(...c.text)
        doc.setLineWidth(0.3)
        doc.roundedRect(lx, 34.5, 16, 5, 1, 1, 'FD')
        doc.setTextColor(...c.text)
        doc.setFont('helvetica', 'bold')
        doc.text(String(y), lx + 8, 38.2, { align: 'center' })
        lx += 19
      })

      // Club bars
      const maxTotal = Math.max(...clubs.map(c => c.total), 1)
      const barAreaW = pageW - M * 2
      const labelColW = 72
      const barColW = barAreaW - labelColW
      const rowH = 11
      let cy = 44

      clubs.forEach(club => {
        if (cy + rowH > pageH - 12) return

        const displayName = club.team.length > 34 ? club.team.slice(0, 33) + '…' : club.team
        doc.setTextColor(20, 20, 20)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.text(displayName, M, cy + 3.5)

        doc.setFont('helvetica', 'normal')
        doc.setTextColor(120, 120, 120)
        doc.setFontSize(6.5)
        doc.text(`${club.players} player${club.players !== 1 ? 's' : ''}`, M, cy + 8)

        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...accentRGB)
        doc.setFontSize(8)
        doc.text(`${club.total.toLocaleString()} min`, M + labelColW - 2, cy + 3.5, { align: 'right' })

        const barX = M + labelColW
        const barY = cy + 1
        const barH = 6
        const barW = (club.total / maxTotal) * barColW

        doc.setFillColor(235, 236, 238)
        doc.roundedRect(barX, barY, barColW, barH, 1, 1, 'F')

        let segX = barX
        YEARS.forEach(y => {
          const mins = club.byYear[y] || 0
          if (!mins) return
          const segW = (mins / maxTotal) * barColW
          doc.setFillColor(...BY_COLORS_HEX[y].bg)
          doc.rect(segX, barY, segW, barH, 'F')
          segX += segW
        })

        doc.setDrawColor(210, 212, 215)
        doc.setLineWidth(0.2)
        doc.roundedRect(barX, barY, barColW, barH, 1, 1, 'S')

        const breakdown = YEARS.filter(y => club.byYear[y]).map(y => `${y}: ${club.byYear[y].toLocaleString()}`).join('  ·  ')
        doc.setTextColor(130, 130, 130)
        doc.setFontSize(6)
        doc.setFont('helvetica', 'normal')
        doc.text(breakdown, barX + 2, cy + 9.5)

        doc.setDrawColor(235, 235, 235)
        doc.setLineWidth(0.2)
        doc.line(M, cy + rowH, pageW - M, cy + rowH)

        cy += rowH
      })

      drawFooter()

      const filename = `${leagueLabel.replace(/ /g, '_')}_Youth_Report_${today.replace(/, /g, '_').replace(/ /g, '_')}.pdf`
      doc.save(filename)

    } catch (err) {
      console.error('PDF export error:', err)
      alert('Something went wrong generating the PDF. Please try again.')
    }
    setLoading(false)
  }

  return (
    <button onClick={handleExport} disabled={loading} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '7px 14px', fontSize: 13, fontWeight: 500,
      borderRadius: 8, border: `0.5px solid ${accent}`,
      background: 'white', color: accent,
      cursor: loading ? 'wait' : 'pointer',
      opacity: loading ? 0.7 : 1,
    }}>
      {loading ? (
        <>
          <span style={{ width: 12, height: 12, border: `2px solid ${accent}`, borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
          Generating...
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export PDF report
        </>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  )
}
