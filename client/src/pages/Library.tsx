import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Play, Filter } from 'lucide-react'
import {
  exercises,
  categoryLabels,
  difficultyLabels,
  difficultyColors,
  type Category,
  type Difficulty,
} from '../data/exercises'

const ALL = 'all'

const difficultyOptions: { value: Difficulty | typeof ALL; label: string }[] = [
  { value: ALL, label: 'All Levels' },
  { value: 1, label: 'Beginner' },
  { value: 2, label: 'Early Intermediate' },
  { value: 3, label: 'Intermediate' },
  { value: 4, label: 'Advanced' },
  { value: 5, label: 'Expert' },
]

export function Library() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<Category | typeof ALL>(ALL)
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | typeof ALL>(ALL)

  const categories = Object.entries(categoryLabels) as [Category, string][]

  const filtered = exercises.filter((ex) => {
    const matchCat = categoryFilter === ALL || ex.category === categoryFilter
    const matchDiff = difficultyFilter === ALL || ex.difficulty === difficultyFilter
    const matchSearch =
      !query ||
      ex.name.toLowerCase().includes(query.toLowerCase()) ||
      ex.muscleGroups.some((m) => m.toLowerCase().includes(query.toLowerCase())) ||
      ex.description.toLowerCase().includes(query.toLowerCase())
    return matchCat && matchDiff && matchSearch
  })

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header + filters */}
      <div className="px-6 pt-6 pb-4 border-b border-[#2a2d3e] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold">Exercise Library</h1>
            <p className="text-[#64748b] text-sm">{exercises.length} exercises with live pose checking</p>
          </div>
          <div className="flex items-center gap-2 text-[#4f8ef7] bg-[#4f8ef7]/10 border border-[#4f8ef7]/20 px-3 py-1.5 rounded-lg">
            <Filter size={14} />
            <p className="text-xs font-medium">{filtered.length} shown</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search exercises, muscle groups…"
            className="w-full pl-9 pr-4 py-2.5 bg-[#1a1d27] border border-[#2a2d3e] text-white rounded-lg text-sm outline-none focus:border-[#4f8ef7] transition-colors placeholder-[#64748b]"
          />
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={() => setCategoryFilter(ALL)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              categoryFilter === ALL
                ? 'bg-[#4f8ef7] text-white'
                : 'bg-[#1a1d27] border border-[#2a2d3e] text-[#94a3b8] hover:bg-[#2a2d3e]'
            }`}
          >
            All
          </button>
          {categories.map(([cat, label]) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-[#4f8ef7] text-white'
                  : 'bg-[#1a1d27] border border-[#2a2d3e] text-[#94a3b8] hover:bg-[#2a2d3e]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Difficulty filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {difficultyOptions.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setDifficultyFilter(value as any)}
              className={`flex-shrink-0 px-3 py-1 rounded-lg text-xs transition-colors ${
                difficultyFilter === value
                  ? 'bg-[#2a2d3e] text-white font-medium border border-[#4f8ef7]/40'
                  : 'text-[#64748b] hover:text-[#94a3b8]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise grid */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <p className="text-4xl">🔍</p>
            <p className="text-[#94a3b8]">No exercises found</p>
            <button
              onClick={() => { setQuery(''); setCategoryFilter(ALL); setDifficultyFilter(ALL) }}
              className="text-[#4f8ef7] text-sm hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((ex) => {
              const diffColor = difficultyColors[ex.difficulty]
              return (
                <div
                  key={ex.id}
                  className="bg-[#1a1d27] border border-[#2a2d3e] rounded-xl p-4 hover:border-[#4f8ef7]/40 transition-all cursor-pointer group"
                  onClick={() => navigate(`/exercise/${ex.id}`)}
                >
                  {/* Exercise image placeholder with pose diagram */}
                  <div className="rounded-lg bg-[#0f1117] mb-3 flex items-center justify-center relative overflow-hidden"
                    style={{ height: 120 }}>
                    {/* Stick figure illustration */}
                    <svg viewBox="0 0 120 120" className="w-full h-full opacity-60">
                      {/* Body */}
                      <circle cx="60" cy="25" r="10" stroke="#4f8ef7" strokeWidth="2" fill="none" />
                      <line x1="60" y1="35" x2="60" y2="70" stroke="#4f8ef7" strokeWidth="2" />
                      {/* Arms */}
                      <line x1="60" y1="45" x2="35" y2="60" stroke="#4f8ef7" strokeWidth="2" />
                      <line x1="60" y1="45" x2="85" y2="60" stroke="#4f8ef7" strokeWidth="2" />
                      {/* Legs */}
                      <line x1="60" y1="70" x2="42" y2="100" stroke="#4f8ef7" strokeWidth="2" />
                      <line x1="60" y1="70" x2="78" y2="100" stroke="#4f8ef7" strokeWidth="2" />
                      {/* Joint dots */}
                      <circle cx="60" cy="70" r="4" fill={diffColor} />
                      <circle cx="42" cy="85" r="3" fill={diffColor} opacity="0.7" />
                      <circle cx="78" cy="85" r="3" fill={diffColor} opacity="0.7" />
                      <circle cx="35" cy="60" r="3" fill={diffColor} opacity="0.7" />
                      <circle cx="85" cy="60" r="3" fill={diffColor} opacity="0.7" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl">{ex.icon}</span>
                    </div>
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-[#4f8ef7]/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="bg-[#4f8ef7] rounded-full p-3">
                        <Play size={18} className="text-white" fill="white" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-white font-medium text-sm leading-tight">{ex.name}</h3>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ color: diffColor, backgroundColor: `${diffColor}20` }}
                      >
                        L{ex.difficulty}
                      </span>
                    </div>

                    <p className="text-[#64748b] text-xs leading-relaxed line-clamp-2">
                      {ex.description}
                    </p>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs bg-[#2a2d3e] text-[#94a3b8] px-2 py-0.5 rounded">
                        {categoryLabels[ex.category]}
                      </span>
                      <span className="text-xs text-[#64748b]">
                        {ex.sets}×{ex.reps}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {ex.muscleGroups.slice(0, 3).map((m) => (
                        <span key={m} className="text-[10px] text-[#64748b] bg-[#2a2d3e] px-1.5 py-0.5 rounded">
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
