import { useState } from 'react'

const BY_COLORS_HEX = {
  2008: { bg: [219, 234, 254], text: [30, 64, 175] },
  2009: { bg: [209, 250, 229], text: [6, 95, 70] },
  2010: { bg: [254, 243, 199], text: [146, 64, 14] },
  2011: { bg: [252, 231, 243], text: [157, 23, 77] },
  2012: { bg: [237, 233, 254], text: [91, 33, 182] },
}

export default function ExportButton({ league }) {
  const [loading, setLoading] = useState(false)
  const accent = league === 'mnp' ? '#1a6b3c' : '#1a3a6b'
  const accentRGB = league === 'mnp' ? [26, 107, 60] : [26, 58, 107]
  const leagueLabel = league === 'mnp' ? 'MLS NEXT Pro' : 'USL Championship'

  async function handleExport() {
    setLoading(true)
    try {
      // Dynamically import jsPDF to keep bundle small
      const { jsPDF } = await import('jspdf')
      await import('jspdf-autotable')

      const res = await fetch(`/api/export-data?league=${league}`)
      const { players, clubs, matchCount } = await res.json()

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = doc.internal.pageSize.getWidth()
      const pageH = doc.internal.pageSize.getHeight()
      const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      const margin = 14

      // ── PAGE 1: Player Tracker ──────────────────────────────────────

      // Header bar
      doc.setFillColor(...accentRGB)
      doc.rect(0, 0, pageW, 28, 'F')

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text(leagueLabel + ' Youth Tracker', margin, 12)

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text('Born 2008–2012  ·  2026–27 Season  ·  Report generated ' + today, margin, 20)
      doc.text('Page 1 of 2', pageW - margin, 20, { align: 'right' })

      // Summary stat boxes
      const totalMins = players.reduce((s, p) => s + p.mins, 0)
      const clubs_count = new Set(players.map(p => p.team)).size
      const statBoxes = [
        { label: 'Players tracked', value: players.length },
        { label: 'Clubs giving minutes', value: clubs_count },
        { label: 'Total minutes logged', value: totalMins.toLocaleString() },
        { label: 'Matches recorded', value: matchCount },
      ]

      const boxW = (pageW - margin * 2 - 9) / 4
      statBoxes.forEach((box, i) => {
        const x = margin + i * (boxW + 3)
        const y = 33
        doc.setFillColor(245, 245, 245)
        doc.roundedRect(x, y, boxW, 16, 2, 2, 'F')
        doc.setTextColor(100, 100, 100)
        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        doc.text(box.label, x + boxW / 2, y + 5, { align: 'center' })
        doc.setTextColor(20, 20, 20)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text(String(box.value), x + boxW / 2, y + 12, { align: 'center' })
      })

      // Section title
      doc.setTextColor(...accentRGB)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Player tracker — sorted by total minutes', margin, 57)
      doc.setDrawColor(...accentRGB)
      doc.setLineWidth(0.5)
      doc.line(margin, 59, pageW - margin, 59)

      // Player table
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
        p.agency || '—'
      ])

      doc.autoTable({
        startY: 62,
        head: [['#', 'Player', 'Club', 'Pos', 'Born', 'Apps', 'Min', 'G', 'A', 'Agency']],
        body: tableRows,
        margin: { left: margin, right: margin },
        styles: { fontSize: 7.5, cellPadding: 2.5, lineColor: [230, 230, 230], lineWidth: 0.3 },
        headStyles: { fillColor: accentRGB, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [249, 249, 249] },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 38, fontStyle: 'bold' },
          2: { cellWidth: 38 },
          3: { cellWidth: 10, halign: 'center' },
          4: { cellWidth: 14, halign: 'center' },
          5: { cellWidth: 10, halign: 'center' },
          6: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
          7: { cellWidth: 8, halign: 'center' },
          8: { cellWidth: 8, halign: 'center' },
          9: { cellWidth: 28 },
        },
        didParseCell: (data) => {
          // Color birth year cells
          if (data.column.index === 4 && data.section === 'body') {
            const year = data.cell.raw
            const colors = BY_COLORS_HEX[year]
            if (colors) {
              data.cell.styles.fillColor = colors.bg
              data.cell.styles.textColor = colors.text
              data.cell.styles.fontStyle = 'bold'
            }
          }
        },
      })

      // Footer page 1
      doc.setTextColor(150, 150, 150)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.text('Confidential — internal scouting report', margin, pageH - 6)
      doc.text(leagueLabel + ' Youth Tracker · 2026–27', pageW - margin, pageH - 6, { align: 'right' })

      // ── PAGE 2: Club Minutes ────────────────────────────────────────
      doc.addPage()

      // Header bar
      doc.setFillColor(...accentRGB)
      doc.rect(0, 0, pageW, 28, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text(leagueLabel + ' Youth Tracker', margin, 12)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text('Born 2008–2012  ·  2026–27 Season  ·  Report generated ' + today, margin, 20)
      doc.text('Page 2 of 2', pageW - margin, 20, { align: 'right' })

      // Section title
      doc.setTextColor(...accentRGB)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Club minutes breakdown — total minutes given to 2008–2012 players', margin, 36)
      doc.setDrawColor(...accentRGB)
      doc.setLineWidth(0.5)
      doc.line(margin, 38, pageW - margin, 38)

      // Birth year legend
      const years = [2008, 2009, 2010, 2011, 2012]
      const yearLabels = ['2008', '2009', '2010', '2011', '2012']
      let lx = margin
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(80, 80, 80)
      doc.text('Birth year:', lx, 44)
      lx += 18
      years.forEach((y, i) => {
        const c = BY_COLORS_HEX[y]
        doc.setFillColor(...c.bg)
        doc.setDrawColor(...c.text)
        doc.setLineWidth(0.3)
        doc.roundedRect(lx, 40.5, 14, 5, 1, 1, 'FD')
        doc.setTextColor(...c.text)
        doc.setFont('helvetica', 'bold')
        doc.text(yearLabels[i], lx + 7, 44.2, { align: 'center' })
        lx += 17
      })

      // Club bar chart
      const maxTotal = Math.max(...clubs.map(c => c.total), 1)
      const barAreaW = pageW - margin * 2
      const rowH = 13
      let cy = 50

      clubs.forEach((club, i) => {
        if (cy + rowH > pageH - 15) return // skip if no space

        // Club name + total
        doc.setTextColor(20, 20, 20)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.text(club.team, margin, cy + 3.5)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(80, 80, 80)
        doc.setFontSize(7)
        doc.text(`${club.players} player${club.players !== 1 ? 's' : ''}`, margin + 55, cy + 3.5)

        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...accentRGB)
        doc.setFontSize(8)
        doc.text(`${club.total.toLocaleString()} min`, pageW - margin, cy + 3.5, { align: 'right' })

        // Bar background
        const barY = cy + 5.5
        const barH = 4
        const barW = barAreaW - 32
        doc.setFillColor(235, 235, 235)
        doc.roundedRect(margin, barY, barW, barH, 1, 1, 'F')

        // Stacked colored segments
        let bx = margin
        years.forEach(y => {
          const mins = club.byYear[y] || 0
          if (!mins) return
          const segW = (mins / maxTotal) * barW
          const c = BY_COLORS_HEX[y]
          doc.setFillColor(...c.bg)
          doc.rect(bx, barY, segW, barH, 'F')
          bx += segW
        })

        // Bar border
        doc.setDrawColor(200, 200, 200)
        doc.setLineWidth(0.2)
        doc.roundedRect(margin, barY, barW, barH, 1, 1, 'S')

        // Year breakdown text
        const breakdown = years.filter(y => club.byYear[y]).map(y => `${y}: ${club.byYear[y]}`).join('  ·  ')
        doc.setTextColor(120, 120, 120)
        doc.setFontSize(6.5)
        doc.setFont('helvetica', 'normal')
        doc.text(breakdown, margin, cy + 12)

        // Divider
        doc.setDrawColor(235, 235, 235)
        doc.setLineWidth(0.2)
        doc.line(margin, cy + rowH, pageW - margin, cy + rowH)

        cy += rowH
      })

      // Footer page 2
      doc.setTextColor(150, 150, 150)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.text('Confidential — internal scouting report', margin, pageH - 6)
      doc.text(leagueLabel + ' Youth Tracker · 2026–27', pageW - margin, pageH - 6, { align: 'right' })

      // Save
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
      background: 'white', color: accent, cursor: loading ? 'wait' : 'pointer',
      opacity: loading ? 0.7 : 1
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
