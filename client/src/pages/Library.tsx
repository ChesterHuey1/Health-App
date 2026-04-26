import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import {
  exercises,
  categoryLabels,
  difficultyLabels,
  getPosition,
  positionLabels,
  type Category,
  type Difficulty,
  type Position,
} from '../data/exercises'
import { Topbar } from '../components/layout/Topbar'

const ALL = 'all'

const DIFFICULTY_OPTIONS: { value: Difficulty | typeof ALL; label: string }[] = [
  { value: ALL, label: 'All Levels' },
  { value: 1, label: 'Beginner' },
  { value: 2, label: 'Early Intermediate' },
  { value: 3, label: 'Intermediate' },
  { value: 4, label: 'Advanced' },
  { value: 5, label: 'Expert' },
]

const LEVEL_COLORS: Record<number, { bg: string; text: string }> = {
  1: { bg: '#D4EDDA', text: '#166534' },
  2: { bg: '#D6F0F5', text: '#0E7490' },
  3: { bg: '#FDE8D0', text: '#9A4E0F' },
  4: { bg: '#FDE8D0', text: '#9A4E0F' },
  5: { bg: '#FDDCDC', text: '#9B1C1C' },
}

const POSITION_ICONS: Record<Position, string> = {
  standing: '🧍',
  seated: '🪑',
  floor: '🛏',
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 px-4 py-1.5 rounded-full text-[12px] font-semibold transition-all cursor-pointer"
      style={{
        border: `1.5px solid ${active ? '#1A3D5C' : '#E2E8ED'}`,
        background: active ? '#1A3D5C' : '#fff',
        color: active ? '#fff' : '#5A7080',
      }}
    >
      {children}
    </button>
  )
}

export function Library() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<Category | typeof ALL>(ALL)
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | typeof ALL>(ALL)
  const [positionFilter, setPositionFilter] = useState<Position | typeof ALL>(ALL)

  const categories = Object.entries(categoryLabels) as [Category, string][]

  const filtered = exercises.filter((ex) => {
    const matchCat = categoryFilter === ALL || ex.category === categoryFilter
    const matchDiff = difficultyFilter === ALL || ex.difficulty === difficultyFilter
    const matchPos = positionFilter === ALL || getPosition(ex.id) === positionFilter
    const matchSearch =
      !query ||
      ex.name.toLowerCase().includes(query.toLowerCase()) ||
      ex.muscleGroups.some((m) => m.toLowerCase().includes(query.toLowerCase())) ||
      ex.description.toLowerCase().includes(query.toLowerCase())
    return matchCat && matchDiff && matchPos && matchSearch
  })

  const levelColors = (diff: number) => LEVEL_COLORS[diff] ?? LEVEL_COLORS[3]

  function clearAll() {
    setQuery('')
    setCategoryFilter(ALL)
    setDifficultyFilter(ALL)
    setPositionFilter(ALL)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar
        title="PT Library"
        subtitle={`${exercises.length} exercises with live pose checking`}
        actions={
          <span className="px-[9px] py-[3px] rounded-full text-[11px] font-semibold" style={{ background: '#D6F0F5', color: '#0E7490' }}>
            {filtered.length} shown
          </span>
        }
      />

      {/* Filters */}
      <div className="bg-white border-b border-[#E2E8ED] px-7 py-4 space-y-3 flex-shrink-0">
        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9BAAB6' }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search exercises, muscle groups…"
            className="w-full text-[14px] rounded-[9px] outline-none transition-colors"
            style={{
              paddingLeft: 36, paddingRight: 14, paddingTop: 9, paddingBottom: 9,
              background: '#F4F6F8', border: '1.5px solid #E2E8ED', color: '#0F1E2B',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#1A7FA8')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#E2E8ED')}
          />
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          <FilterChip active={categoryFilter === ALL} onClick={() => setCategoryFilter(ALL)}>All</FilterChip>
          {categories.map(([cat, label]) => (
            <FilterChip key={cat} active={categoryFilter === cat} onClick={() => setCategoryFilter(cat)}>
              {label}
            </FilterChip>
          ))}
        </div>

        {/* Position filter */}
        <div className="flex gap-2">
          <FilterChip active={positionFilter === ALL} onClick={() => setPositionFilter(ALL)}>All Positions</FilterChip>
          {(Object.entries(positionLabels) as [Position, string][]).map(([pos, label]) => (
            <FilterChip key={pos} active={positionFilter === pos} onClick={() => setPositionFilter(pos)}>
              {POSITION_ICONS[pos]} {label}
            </FilterChip>
          ))}
        </div>

        {/* Difficulty filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {DIFFICULTY_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setDifficultyFilter(value as Difficulty | typeof ALL)}
              className="flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer"
              style={{
                background: difficultyFilter === value ? '#D6E4EE' : 'transparent',
                color: difficultyFilter === value ? '#1A3D5C' : '#7A909F',
                border: 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-[24px_28px]">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <p className="text-4xl">🔍</p>
            <p className="font-semibold text-[#0F1E2B]">No exercises found</p>
            <button
              onClick={clearAll}
              className="text-[13px] font-semibold cursor-pointer"
              style={{ color: '#1A7FA8', background: 'none', border: 'none' }}
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {filtered.map((ex) => {
              const lc = levelColors(ex.difficulty)
              const pos = getPosition(ex.id)
              return (
                <div
                  key={ex.id}
                  className="bg-white rounded-[13px] overflow-hidden cursor-pointer group"
                  style={{ border: '1px solid #E2E8ED', transition: 'transform 0.15s' }}
                  onClick={() => navigate(`/exercise/${ex.id}`)}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  {/* Thumbnail */}
                  <div className="relative flex items-center justify-center" style={{ height: 120, background: '#D6E4EE' }}>
                    {/* Stick figure */}
                    <svg viewBox="0 0 120 120" className="w-full h-full absolute inset-0 opacity-25">
                      <circle cx="60" cy="25" r="10" stroke="#1A3D5C" strokeWidth="2" fill="none"/>
                      <line x1="60" y1="35" x2="60" y2="70" stroke="#1A3D5C" strokeWidth="2"/>
                      <line x1="60" y1="45" x2="35" y2="60" stroke="#1A3D5C" strokeWidth="2"/>
                      <line x1="60" y1="45" x2="85" y2="60" stroke="#1A3D5C" strokeWidth="2"/>
                      <line x1="60" y1="70" x2="42" y2="100" stroke="#1A3D5C" strokeWidth="2"/>
                      <line x1="60" y1="70" x2="78" y2="100" stroke="#1A3D5C" strokeWidth="2"/>
                      <circle cx="60" cy="70" r="4" fill="#1A7FA8"/>
                      <circle cx="42" cy="85" r="3" fill="#1A7FA8" opacity="0.7"/>
                      <circle cx="78" cy="85" r="3" fill="#1A7FA8" opacity="0.7"/>
                    </svg>
                    <span className="text-4xl relative z-10">{ex.icon}</span>

                    {/* Area badge */}
                    <span
                      className="absolute top-2 left-2 px-[9px] py-[3px] rounded-full text-[10px] font-semibold"
                      style={{ background: '#D6E4EE', color: '#1A3D5C' }}
                    >
                      {categoryLabels[ex.category]}
                    </span>

                    {/* Position badge */}
                    <span
                      className="absolute top-2 right-2 px-[9px] py-[3px] rounded-full text-[10px] font-semibold"
                      style={{ background: 'rgba(255,255,255,0.85)', color: '#5A7080' }}
                    >
                      {POSITION_ICONS[pos]} {positionLabels[pos]}
                    </span>

                    {/* Play overlay */}
                    <div
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'rgba(26,61,92,0.15)' }}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1A3D5C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg viewBox="0 0 24 24" fill="none" width={16} height={16}>
                          <path d="M8 5l11 7-11 7V5Z" fill="white" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-[12px_14px] space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13px] font-bold text-[#0F1E2B] leading-tight">{ex.name}</p>
                      <span
                        className="flex-shrink-0 px-[9px] py-[3px] rounded-full text-[10px] font-semibold"
                        style={{ background: lc.bg, color: lc.text }}
                      >
                        {difficultyLabels[ex.difficulty]}
                      </span>
                    </div>
                    <p className="text-[11px] line-clamp-2" style={{ color: '#7A909F' }}>
                      {ex.description}
                    </p>
                    <p className="text-[11px] font-semibold" style={{ color: '#5A7080' }}>
                      {ex.sets} sets × {ex.reps} reps
                      {ex.holdSeconds > 0 ? ` · ${ex.holdSeconds}s hold` : ''}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {ex.muscleGroups.slice(0, 3).map((m) => (
                        <span
                          key={m}
                          className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                          style={{ background: '#F0F3F6', color: '#5A7080' }}
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
