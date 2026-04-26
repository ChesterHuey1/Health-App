import { useNavigate } from 'react-router-dom'
import { CheckCircle, Circle, Play, Calendar, TrendingUp } from 'lucide-react'
import { useScheduleStore } from '../store/scheduleStore'
import { useUserStore } from '../store/userStore'
import { exercises, difficultyColors, difficultyLabels, categoryLabels } from '../data/exercises'

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function Schedule() {
  const navigate = useNavigate()
  const { plan, history } = useScheduleStore()
  const { profile } = useUserStore()
  const today = new Date().toISOString().split('T')[0]

  // Sort plan by date
  const sortedPlan = [...plan].sort((a, b) => a.date.localeCompare(b.date))

  // Progress stats
  const totalCompleted = history.length
  const uniqueExercises = new Set(history.map((h) => h.exerciseId)).size
  const totalReps = history.reduce((a, h) => a + h.repsCompleted, 0)

  // Category breakdown
  const catBreakdown = exercises
    .filter((e) => history.some((h) => h.exerciseId === e.id))
    .reduce((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + history.filter((h) => h.exerciseId === e.id).length
      return acc
    }, {} as Record<string, number>)

  return (
    <div className="flex-1 flex flex-col overflow-y-auto scrollbar-hide p-6 gap-6">
      <div>
        <h1 className="text-white text-2xl font-bold">PT Schedule</h1>
        <p className="text-[#64748b] text-sm">
          {profile.surgeryType
            ? `${categoryLabels[profile.surgeryType]} recovery plan`
            : 'Your weekly plan'}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: CheckCircle, label: 'Sessions Done', value: totalCompleted, color: '#22c55e' },
          { icon: TrendingUp, label: 'Total Reps', value: totalReps, color: '#4f8ef7' },
          { icon: Calendar, label: 'Exercises Tried', value: uniqueExercises, color: '#f59e0b' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-[#1a1d27] rounded-xl p-4 border border-[#2a2d3e]">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={14} style={{ color }} />
              <p className="text-[#64748b] text-xs">{label}</p>
            </div>
            <p className="text-white text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Category breakdown */}
      {Object.keys(catBreakdown).length > 0 && (
        <div className="bg-[#1a1d27] rounded-xl p-4 border border-[#2a2d3e]">
          <p className="text-[#94a3b8] text-xs font-medium uppercase tracking-wide mb-3">
            Exercise Breakdown
          </p>
          <div className="space-y-2">
            {Object.entries(catBreakdown).map(([cat, count]) => {
              const maxCount = Math.max(...Object.values(catBreakdown))
              return (
                <div key={cat} className="flex items-center gap-3">
                  <p className="text-[#94a3b8] text-xs w-36 flex-shrink-0">
                    {categoryLabels[cat as keyof typeof categoryLabels] ?? cat}
                  </p>
                  <div className="flex-1 h-2 bg-[#2a2d3e] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#4f8ef7] rounded-full transition-all"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                  <p className="text-[#64748b] text-xs w-6 text-right">{count}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Weekly schedule */}
      <div>
        <h2 className="text-white font-semibold mb-3">Weekly Plan</h2>
        {sortedPlan.length === 0 ? (
          <div className="bg-[#1a1d27] rounded-xl p-8 border border-[#2a2d3e] text-center">
            <p className="text-[#64748b]">No plan yet — complete onboarding to generate your schedule.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedPlan.map((session, i) => {
              const sessionExercises = session.exercises
                .map((se) => exercises.find((e) => e.id === se.exerciseId))
                .filter(Boolean)
              const isToday = session.date === today
              const isPast = session.date < today
              const isRest = session.exercises.length === 0
              const sessionHistory = history.filter((h) =>
                session.exercises.some((se) => se.exerciseId === h.exerciseId && h.date === session.date)
              )
              const completedCount = new Set(sessionHistory.map((h) => h.exerciseId)).size

              const dateObj = new Date(session.date + 'T00:00:00')
              const dayIdx = (dateObj.getDay() + 6) % 7
              const dayLabel = dayLabels[dayIdx] ?? dateObj.toLocaleDateString()

              return (
                <div
                  key={session.id}
                  className={`bg-[#1a1d27] rounded-xl border transition-all ${
                    isToday
                      ? 'border-[#4f8ef7]/40'
                      : isPast
                      ? 'border-[#2a2d3e] opacity-70'
                      : 'border-[#2a2d3e]'
                  }`}
                >
                  <div className="flex items-center gap-3 p-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        isToday
                          ? 'bg-[#4f8ef7] text-white'
                          : isPast && completedCount > 0
                          ? 'bg-[#22c55e]/20 text-[#22c55e]'
                          : 'bg-[#2a2d3e] text-[#64748b]'
                      }`}
                    >
                      {dayLabel}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium text-sm">
                          {isRest
                            ? session.notes ?? 'Rest Day'
                            : `${session.exercises.length} exercises`}
                        </p>
                        {isToday && (
                          <span className="text-xs bg-[#4f8ef7]/20 text-[#4f8ef7] px-2 py-0.5 rounded-full">
                            Today
                          </span>
                        )}
                      </div>
                      <p className="text-[#64748b] text-xs">{session.date}</p>
                    </div>
                    {!isRest && (
                      <div className="flex items-center gap-2">
                        <p className="text-[#64748b] text-xs">{completedCount}/{session.exercises.length}</p>
                        {completedCount === session.exercises.length && session.exercises.length > 0 ? (
                          <CheckCircle size={18} className="text-[#22c55e]" />
                        ) : (
                          <Circle size={18} className="text-[#2a2d3e]" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Exercise list */}
                  {!isRest && sessionExercises.length > 0 && (
                    <div className="px-4 pb-4 space-y-2">
                      {sessionExercises.map((ex) => {
                        if (!ex) return null
                        const done = history.some(
                          (h) => h.exerciseId === ex.id && h.date === session.date
                        )
                        const diffColor = difficultyColors[ex.difficulty]
                        return (
                          <div
                            key={ex.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              done
                                ? 'border-[#22c55e]/20 bg-[#22c55e]/5'
                                : isToday
                                ? 'border-[#2a2d3e] hover:border-[#4f8ef7]/40 bg-[#0f1117]'
                                : 'border-[#2a2d3e] bg-[#0f1117] opacity-60'
                            }`}
                            onClick={() => isToday && !done && navigate(`/exercise/${ex.id}`)}
                          >
                            <span className="text-lg">{ex.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-xs font-medium truncate">{ex.name}</p>
                              <p className="text-[#64748b] text-xs">
                                {ex.sets}×{ex.reps}{ex.holdSeconds > 0 ? ` • ${ex.holdSeconds}s hold` : ''}
                              </p>
                            </div>
                            <span
                              className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
                              style={{ color: diffColor, backgroundColor: `${diffColor}20` }}
                            >
                              {difficultyLabels[ex.difficulty]}
                            </span>
                            {done ? (
                              <CheckCircle size={16} className="text-[#22c55e] flex-shrink-0" />
                            ) : isToday ? (
                              <Play size={16} className="text-[#4f8ef7] flex-shrink-0" />
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
