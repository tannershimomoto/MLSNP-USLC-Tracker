import { useState, useRef, useEffect } from 'react'

export default function Autocomplete({ value, onChange, suggestions, placeholder, onSelect }) {
  const [open, setOpen] = useState(false)
  const [filtered, setFiltered] = useState([])
  const wrapRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleInput(e) {
    const val = e.target.value
    onChange(val)
    const q = val.toLowerCase()
    setFiltered(q ? suggestions.filter(s => {
      const label = typeof s === 'string' ? s : s.label
      return label.toLowerCase().includes(q)
    }) : suggestions)
    setOpen(true)
  }

  function handleFocus() {
    const q = value.toLowerCase()
    setFiltered(q ? suggestions.filter(s => {
      const label = typeof s === 'string' ? s : s.label
      return label.toLowerCase().includes(q)
    }) : suggestions)
    setOpen(true)
  }

  function handleSelect(item) {
    const label = typeof item === 'string' ? item : item.label
    onChange(label)
    onSelect && onSelect(item)
    setOpen(false)
  }

  function highlight(text, query) {
    if (!query) return text
    const idx = text.toLowerCase().indexOf(query.toLowerCase())
    if (idx < 0) return text
    return (
      <>
        {text.slice(0, idx)}
        <strong>{text.slice(idx, idx + query.length)}</strong>
        {text.slice(idx + query.length)}
      </>
    )
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <input
        type="text"
        value={value}
        onChange={handleInput}
        onFocus={handleFocus}
        placeholder={placeholder}
        autoComplete="off"
        style={inputStyle}
      />
      {open && filtered.length > 0 && (
        <div style={dropStyle}>
          {filtered.map((item, i) => {
            const label = typeof item === 'string' ? item : item.label
            const sub = typeof item === 'object' ? item.sub : null
            return (
              <div key={i} onMouseDown={() => handleSelect(item)} style={itemStyle}
                onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                <span>{highlight(label, value)}</span>
                {sub && <span style={{ fontSize: 11, color: '#6b7280' }}>{sub}</span>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '7px 10px', fontSize: 13,
  border: '0.5px solid #d1d5db', borderRadius: 8,
  outline: 'none', background: 'white'
}

const dropStyle = {
  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
  background: 'white', border: '0.5px solid #d1d5db', borderRadius: 8,
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)', maxHeight: 200, overflowY: 'auto',
  marginTop: 2
}

const itemStyle = {
  padding: '8px 12px', fontSize: 13, cursor: 'pointer',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  background: 'white', transition: 'background 0.1s'
}
