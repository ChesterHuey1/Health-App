import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useScheduleStore } from '../store/scheduleStore'
import { useUserStore } from '../store/userStore'
import { exercises, categoryLabels } from '../data/exercises'
import { Topbar } from '../components/layout/Topbar'

const DAY_NAMES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function Schedule() {
  const navigate = useNavigate()
  const { plan, history } = useScheduleStore()
  const { profile } = useUserStore()
  const today = new Date().toISOString().split('T')[0]

  // Current week dates
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7))
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d.toISOString().split('T')[0]
  })

  const [selectedDate, setSelectedDate] = useState(today)
  const selectedSession = plan.find((s) => s.date === selectedDate)
  const selectedExercises = (selectedSession?.exercises ?? [])
    .map((se) => exercises.find((e) => e.id === se.exerciseId))
    .filter(Boolean) as typeof exercises[0][]

  const isSelectedToday = selectedDate === today
  const isSelectedRest = !selectedSession || selectedSession.exercises.length === 0
  const selectedDone = history.filter((h) =>
    selectedSession?.exercises.some((se) => se.exerciseId === h.exerciseId && h.date === selectedDate)
  )
  const selectedCompletedIds = new Set(selectedDone.map((h) => h.exerciseId))

  // Stats
  const totalReps = history.reduce((a, h) => a + h.repsCompleted, 0)
  const uniqueExercises = new Set(history.map((h) => h.exerciseId)).size
  const sessionsCount = new Set(history.map((h) => h.date)).size

  // Phase from difficulty
  const avgDiff = plan.length > 0
    ? Math.round(plan.flatMap((s) => s.exercises).reduce((a, se) => {
        const ex = exercises.find((e) => e.id === se.exerciseId)
        return a + (ex?.difficulty ?? 1)
      }, 0) / Math.max(1, plan.flatMap((s) => s.exercises).length))
    : 1
  const phases = ['Phase 1: Mobility', 'Phase 2: Strengthening', 'Phase 3: Functional', 'Phase 4: Advanced']
  const currentPhaseIdx = Math.max(0, Math.min(3, avgDiff - 1))

  const weekNum = profile.surgeryDate
    ? Math.max(1, Math.floor((Date.now() - new Date(profile.surgeryDate).getTime()) / (1000 * 60 * 60 * 24 * 7)) + 1)
    : 1

  // Selected day status
  const selectedDateObj = new Date(selectedDate + 'T12:00:00')
  const isPast = selectedDate < today
  const isFuture = selectedDate > today
  const completedCount = selectedCompletedIds.size
  const totalCount = selectedExercises.length

  const statusBadge = isSelectedRest
    ? { label: 'Rest Day', bg: '#F0F3F6', text: '#7A909F' }
    : isSelectedToday
    ? { label: 'Today', bg: '#D6F0F5', text: '#0E7490' }
    : isPast && completedCount === totalCount && totalCount > 0
    ? { label: 'Completed', bg: '#D4EDDA', text: '#166534' }
    : isPast
    ? { label: 'Past', bg: '#FDE8D0', text: '#9A4E0F' }
    : { label: 'Upcoming', bg: '#F0F3F6', text: '#7A909F' }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar
        title="My Schedule"
        subtitle={profile.surgeryType ? `${categoryLabels[profile.surgeryType]} recovery plan · Week ${weekNum} of 8` : 'Your weekly plan'}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Main content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-[24px_28px] space-y-5 fade-in">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-[14px]">
            {[
              { label: 'Sessions Done', value: sessionsCount, iconPath: 'M5 12l5 5L19 7', iconBg: '#D4EDDA', iconColor: '#27A060' },
              { label: 'Total Reps', value: totalReps, iconPath: 'M13 2L4 14h8l-1 8 9-12h-8l1-8Z', iconBg: '#D6F0F5', iconColor: '#1A7FA8' },
              { label: 'Exercises Tried', value: uniqueExercises, iconPath: 'M12 2s-4 4-4 9a4 4 0 0 0 8 0c0-2-1-4-1-4s-1 2-2 2c-1 0-1.5-1-1.5-2S12 2 12 2Z', iconBg: '#FDE8D0', iconColor: '#F0A06A' },
            ].map(({ label, value, iconPath, iconBg, iconColor }) => (
              <div key={label} className="bg-white rounded-[14px] p-[18px_20px] flex items-center gap-4">
                <div style={{ width: 38, height: 38, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg viewBox="0 0 24 24" fill="none" width={18} height={18}>
                    <path d={iconPath} stroke={iconColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: 26, fontWeight: 700, color: '#0F1E2B', lineHeight: 1 }}>{value}</p>
                  <p style={{ fontSize: 12, color: '#7A909F', fontWeight: 500, marginTop: 4 }}>{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Overall progress */}
          <div className="bg-white rounded-[14px] p-[22px]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[15px] font-bold text-[#0F1E2B]">Overall Recovery</p>
              <p className="text-[13px] font-semibold" style={{ color: '#1A7FA8' }}>{phases[currentPhaseIdx]}</p>
            </div>
            <div className="h-[5px] rounded-full mb-4" style={{ background: '#E2E8ED' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (currentPhaseIdx + 1) * 25)}%`, background: '#1A7FA8' }} />
            </div>
            <div className="flex items-center">
              {['Mobility', 'Strengthening', 'Functional', 'Advanced'].map((phase, i, arr) => (
                <div key={phase} className="flex items-center" style={{ flex: i < arr.length - 1 ? '1' : undefined }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700,
                    background: currentPhaseIdx >= i ? '#1A3D5C' : '#E2E8ED',
                    color: currentPhaseIdx >= i ? '#fff' : '#7A909F',
                  }}>
                    {i + 1}
                  </div>
                  {i < arr.length - 1 && (
                    <div style={{ flex: 1, height: 2, background: currentPhaseIdx > i ? '#1A7FA8' : '#E2E8ED' }} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-1.5">
              {['Mobility', 'Strengthening', 'Functional', 'Advanced'].map((phase, i) => (
                <p key={phase} style={{ fontSize: 10, fontWeight: 600, color: currentPhaseIdx >= i ? '#1A3D5C' : '#9BAAB6' }}>
                  {phase}
                </p>
              ))}
            </div>
          </div>

          {/* Week strip */}
          <div className="bg-white rounded-[14px] p-[22px]">
            <p className="text-[15px] font-bold text-[#0F1E2B] mb-4">This Week</p>
            <div className="flex gap-1.5">
              {weekDates.map((date, i) => {
                const isToday = date === today
                const isSel = date === selectedDate
                const isRest = !plan.find((s) => s.date === date && s.exercises.length > 0)
                const isDone = history.some((h) => h.date === date)
                const dateNum = new Date(date + 'T12:00:00').getDate()
                return (
                  <div
                    key={date}
                    className="flex-1 flex flex-col items-center gap-1.5 rounded-[10px] py-2.5 px-1.5 cursor-pointer transition-all"
                    style={{
                      border: isSel
                        ? '1.5px solid #1A3D5C'
                        : isToday
                        ? '1.5px solid #1A7FA8'
                        : '1.5px solid transparent',
                      background: '#fff',
                    }}
                    onClick={() => setSelectedDate(date)}
                  >
                    <p style={{ fontSize: 10, fontWeight: 600, color: '#9BAAB6', letterSpacing: '0.3px' }}>{DAY_NAMES[i]}</p>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#0F1E2B' }}>{dateNum}</p>
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: isDone ? '#27A060' : isToday ? '#1A7FA8' : isRest ? '#E2E8ED' : '#E2E8ED',
                    }} />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Full plan list */}
          {plan.length === 0 ? (
            <div className="bg-white rounded-[14px] p-8 text-center">
              <p style={{ color: '#7A909F' }}>No plan yet — complete onboarding to generate your schedule.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {[...plan].sort((a, b) => a.date.localeCompare(b.date)).map((session) => {
                const isToday = session.date === today
                const isRest = session.exercises.length === 0
                const done = new Set(history.filter((h) => session.exercises.some((se) => se.exerciseId === h.exerciseId && h.date === session.date)).map((h) => h.exerciseId))
                const dateObj = new Date(session.date + 'T12:00:00')
                const dayIdx = (dateObj.getDay() + 6) % 7
                const isSel = session.date === selectedDate

                return (
                  <div
                    key={session.id}
                    className="bg-white rounded-[12px] p-4 flex items-center gap-3 cursor-pointer transition-all"
                    style={{ border: `1.5px solid ${isSel ? '#1A3D5C' : isToday ? '#1A7FA8' : '#E2E8ED'}` }}
                    onClick={() => setSelectedDate(session.date)}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700,
                      background: isToday ? '#1A3D5C' : session.date < today && done.size > 0 ? '#D4EDDA' : '#F0F3F6',
                      color: isToday ? '#fff' : session.date < today && done.size > 0 ? '#166534' : '#7A909F',
                    }}>
                      {DAY_LABELS[dayIdx]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#0F1E2B]">
                        {isRest ? (session.notes ?? 'Rest Day') : `${session.exercises.length} exercises`}
                      </p>
                      <p className="text-[11px]" style={{ color: '#7A909F' }}>{session.date}</p>
                    </div>
                    {!isRest && (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold" style={{ color: '#7A909F' }}>
                          {done.size}/{session.exercises.length}
                        </span>
                        {isToday && (
                          <span className="px-[9px] py-[3px] rounded-full text-[11px] font-semibold" style={{ background: '#D6F0F5', color: '#0E7490' }}>Today</span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right detail panel */}
        <div
          className="flex flex-col overflow-y-auto scrollbar-hide"
          style={{ width: 300, flexShrink: 0, background: '#fff', borderLeft: '1px solid #E2E8ED', padding: '24px 22px', gap: 18 }}
        >
          {/* Day header */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[15px] font-bold text-[#0F1E2B]">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>
              <span className="px-[9px] py-[3px] rounded-full text-[11px] font-semibold" style={{ background: statusBadge.bg, color: statusBadge.text }}>
                {statusBadge.label}
              </span>
            </div>
          </div>

          {/* Exercise list or rest */}
          {isSelectedRest ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">😌</p>
              <p className="text-[14px] font-semibold text-[#0F1E2B]">Rest Day</p>
              <p className="text-[12px] mt-1" style={{ color: '#7A909F' }}>
                Recovery is as important as training. Light walking is encouraged.
              </p>
            </div>
          ) : selectedExercises.length === 0 ? (
            <p className="text-[13px]" style={{ color: '#7A909F' }}>No exercises scheduled.</p>
          ) : (
            <div className="space-y-2">
              {selectedExercises.map((ex) => {
                const isDone = selectedCompletedIds.has(ex.id)
                return (
                  <div
                    key={ex.id}
                    className="flex items-start gap-3 py-2 cursor-pointer"
                    style={{ borderBottom: '1px solid #F0F3F6' }}
                    onClick={() => isSelectedToday && !isDone && navigate(`/exercise/${ex.id}`)}
                  >
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 5,
                      background: isDone ? '#27A060' : isSelectedToday ? '#1A7FA8' : '#CBD5DC',
                    }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#0F1E2B] leading-tight" style={{ textDecoration: isDone ? 'line-through' : 'none', color: isDone ? '#9BAAB6' : '#0F1E2B' }}>
                        {ex.name}
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: '#7A909F' }}>
                        {ex.sets} sets · {ex.reps} reps
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Progress */}
          {!isSelectedRest && totalCount > 0 && (
            <div>
              <div className="flex justify-between text-[11px] font-semibold mb-1.5" style={{ color: '#7A909F' }}>
                <span>Progress</span>
                <span style={{ color: '#1A7FA8' }}>{completedCount}/{totalCount}</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: '#E2E8ED' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${(completedCount / totalCount) * 100}%`, background: '#1A7FA8' }} />
              </div>
            </div>
          )}

          {/* CTA */}
          {isSelectedToday && !isSelectedRest && (
            <button
              onClick={() => selectedExercises[0] && navigate(`/exercise/${selectedExercises[0].id}`)}
              className="w-full py-[11px] rounded-[9px] text-[14px] font-semibold text-white transition-colors"
              style={{ background: '#1A3D5C' }}
            >
              Start Session →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
