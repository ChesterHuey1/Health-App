import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useUserStore } from '../store/userStore'
import { useScheduleStore } from '../store/scheduleStore'
import { exercises, categoryLabels } from '../data/exercises'
import { Topbar } from '../components/layout/Topbar'

const DAY_NAMES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

function getDayStreak(dates: string[]): number {
  if (!dates.length) return 0
  const unique = [...new Set(dates)].sort().reverse()
  let streak = 0
  let cursor = new Date().toISOString().split('T')[0]
  for (const d of unique) {
    if (d === cursor) {
      streak++
      const prev = new Date(cursor + 'T12:00:00')
      prev.setDate(prev.getDate() - 1)
      cursor = prev.toISOString().split('T')[0]
    } else break
  }
  return streak
}

function Checkmark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={12} height={12}>
      <path d="M5 12l5 5L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function StatCard({ iconBg, iconColor, iconPath, label, value, unit }: {
  iconBg: string; iconColor: string; iconPath: string
  label: string; value: string; unit?: string
}) {
  return (
    <div className="bg-white rounded-[14px] p-[18px_20px] flex flex-col gap-2.5">
      <div style={{ width: 38, height: 38, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 24 24" fill="none" width={18} height={18}>
          <path d={iconPath} stroke={iconColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div>
        <p style={{ fontSize: 26, fontWeight: 700, color: '#0F1E2B', lineHeight: 1 }}>
          {value}
          {unit && <span style={{ fontSize: 13, fontWeight: 400, color: '#7A909F', marginLeft: 4 }}>{unit}</span>}
        </p>
        <p style={{ fontSize: 12, color: '#7A909F', fontWeight: 500, marginTop: 4 }}>{label}</p>
      </div>
    </div>
  )
}

function CheckInModal({ onClose }: { onClose: () => void }) {
  const { addCheckin } = useUserStore()
  const [step, setStep] = useState(0)
  const [pain, setPain] = useState<number | null>(null)
  const [readiness, setReadiness] = useState<string | null>(null)
  const [sleep, setSleep] = useState(7)
  const [completion, setCompletion] = useState(75)
  const [submitted, setSubmitted] = useState(false)

  function submit() {
    const today = new Date().toISOString().split('T')[0]
    addCheckin({ date: today, painScale: pain ?? 0, sleepHours: sleep, completionPct: completion })
    setSubmitted(true)
  }

  const painColors: Record<string, string> = {
    '0': '#27A060', '1': '#27A060', '2': '#27A060', '3': '#27A060',
    '4': '#F0A06A', '5': '#F0A06A', '6': '#F0A06A',
    '7': '#D9534F', '8': '#D9534F', '9': '#D9534F',
  }

  const sleepLabel =
    sleep >= 8 ? { text: 'Excellent — great for recovery', color: '#27A060' } :
    sleep >= 7 ? { text: 'Good sleep — keep it up', color: '#27A060' } :
    sleep >= 5 ? { text: 'Moderate — try to get more rest', color: '#F0A06A' } :
    { text: 'Low sleep — recovery may be slower', color: '#D9534F' }

  const adaptiveMsg =
    (pain ?? 0) <= 3 && readiness === 'yes'
      ? "Great news — we've bumped up tomorrow's session intensity."
      : (pain ?? 0) >= 7
      ? "We've eased tomorrow's session for your safety. Rest well."
      : "Plan updated. Keep up the consistent effort!"

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-[20px] w-full max-w-[580px] mx-4 overflow-hidden">
        {/* Step indicator */}
        {!submitted && (
          <div className="flex" style={{ borderBottom: '1px solid #E2E8ED' }}>
            {['Pain & Readiness', 'Sleep', 'Completion'].map((label, i) => (
              <div key={i} className="flex-1 px-4 py-3">
                <div className="h-1 rounded-full mb-1.5" style={{ background: i < step ? '#1A7FA8' : i === step ? '#1A7FA8' : '#E2E8ED', opacity: i === step ? 1 : i < step ? 1 : 0.4 }} />
                <p style={{ fontSize: 11, fontWeight: 600, color: i <= step ? '#1A7FA8' : '#9BAAB6' }}>{label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="p-8">
          {submitted ? (
            <div className="text-center space-y-5">
              <div className="w-20 h-20 rounded-[20px] mx-auto flex items-center justify-center" style={{ background: '#D6F0F5' }}>
                <svg viewBox="0 0 24 24" fill="none" width={36} height={36}>
                  <path d="M5 12l5 5L19 7" stroke="#1A7FA8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <p className="text-[22px] font-bold text-[#0F1E2B] mb-1">Check-in Logged!</p>
                <p className="text-[14px] text-[#7A909F]">{adaptiveMsg}</p>
              </div>
              <div className="rounded-[12px] border border-[#E2E8ED] divide-y divide-[#E2E8ED]">
                {[
                  { label: 'Pain score', value: `${pain ?? 0} / 9` },
                  { label: 'Sleep', value: `${sleep} hours` },
                  { label: 'Completion', value: `${completion}%` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between px-5 py-3">
                    <p className="text-[13px] text-[#7A909F]">{label}</p>
                    <p className="text-[13px] font-semibold text-[#0F1E2B]">{value}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={onClose}
                className="w-full py-[11px] rounded-[9px] text-[14px] font-semibold text-white"
                style={{ background: '#1A3D5C' }}
              >
                Back to Dashboard
              </button>
            </div>
          ) : step === 0 ? (
            <div className="space-y-6">
              <div>
                <p className="text-[18px] font-bold text-[#0F1E2B] mb-1">How difficult is it to move right now?</p>
                <p className="text-[13px] text-[#7A909F]">Select your current pain level (0 = no pain)</p>
              </div>
              <div className="flex gap-2">
                {Array.from({ length: 10 }, (_, i) => {
                  const col = painColors[String(i)]
                  const sel = pain === i
                  return (
                    <button
                      key={i}
                      onClick={() => setPain(i)}
                      className="flex-1 h-[38px] rounded-full text-[13px] font-bold transition-all"
                      style={{
                        border: `2px solid ${sel ? '#1A3D5C' : col}`,
                        background: sel ? '#1A3D5C' : '#fff',
                        color: sel ? '#fff' : col,
                      }}
                    >
                      {i}
                    </button>
                  )
                })}
              </div>
              {pain !== null && (
                <div className="rounded-full px-4 py-1.5 inline-flex items-center" style={{ background: `${painColors[String(pain)]}20` }}>
                  <p className="text-[13px] font-semibold" style={{ color: painColors[String(pain)] }}>
                    {pain <= 3 ? 'Low pain — good to go' : pain <= 6 ? 'Moderate — proceed carefully' : 'High pain — take it easy today'}
                  </p>
                </div>
              )}
              <div>
                <p className="text-[14px] font-semibold text-[#0F1E2B] mb-3">Ready to progress?</p>
                <div className="space-y-2">
                  {[
                    { val: 'yes', label: 'Yes, ready to push' },
                    { val: 'same', label: 'Keep same level' },
                    { val: 'no', label: 'No, too much pain' },
                  ].map(({ val, label }) => (
                    <button
                      key={val}
                      onClick={() => setReadiness(val)}
                      className="w-full py-3 px-4 rounded-[9px] text-[14px] font-semibold text-left transition-all"
                      style={{
                        border: `1.5px solid ${readiness === val ? '#1A3D5C' : '#E2E8ED'}`,
                        background: readiness === val ? '#1A3D5C' : '#fff',
                        color: readiness === val ? '#fff' : '#0F1E2B',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setStep(1)}
                disabled={pain === null || !readiness}
                className="w-full py-[11px] rounded-[9px] text-[14px] font-semibold text-white disabled:opacity-40"
                style={{ background: '#1A3D5C' }}
              >
                Continue →
              </button>
            </div>
          ) : step === 1 ? (
            <div className="space-y-6">
              <p className="text-[18px] font-bold text-[#0F1E2B]">How did you sleep?</p>
              <div className="text-center">
                <p style={{ fontSize: 64, fontWeight: 700, color: '#1A3D5C', lineHeight: 1 }}>{sleep}</p>
                <p className="text-[14px] text-[#7A909F] mt-1">hours</p>
              </div>
              <input
                type="range" min={3} max={12} step={0.5} value={sleep}
                onChange={(e) => setSleep(Number(e.target.value))}
              />
              <div className="rounded-full px-4 py-1.5 inline-flex" style={{ background: `${sleepLabel.color}20` }}>
                <p className="text-[13px] font-semibold" style={{ color: sleepLabel.color }}>{sleepLabel.text}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="flex-1 py-[11px] rounded-[9px] text-[14px] font-semibold" style={{ background: '#F0F3F6', color: '#1A3D5C' }}>Back</button>
                <button onClick={() => setStep(2)} className="flex-1 py-[11px] rounded-[9px] text-[14px] font-semibold text-white" style={{ background: '#1A3D5C' }}>Continue →</button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-[18px] font-bold text-[#0F1E2B]">Yesterday's session completion</p>
              <div className="text-center">
                <p style={{ fontSize: 64, fontWeight: 700, color: '#1A3D5C', lineHeight: 1 }}>{completion}%</p>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: '#E2E8ED' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${completion}%`, background: '#1A7FA8' }} />
              </div>
              <input type="range" min={0} max={100} step={5} value={completion} onChange={(e) => setCompletion(Number(e.target.value))} />
              <div className="flex gap-2">
                {[25, 50, 75, 100].map((v) => (
                  <button
                    key={v}
                    onClick={() => setCompletion(v)}
                    className="flex-1 py-2 rounded-[8px] text-[13px] font-semibold transition-all"
                    style={{
                      border: `1.5px solid ${completion === v ? '#1A3D5C' : '#E2E8ED'}`,
                      background: completion === v ? '#1A3D5C' : '#fff',
                      color: completion === v ? '#fff' : '#5A7080',
                    }}
                  >
                    {v}%
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-[11px] rounded-[9px] text-[14px] font-semibold" style={{ background: '#F0F3F6', color: '#1A3D5C' }}>Back</button>
                <button onClick={submit} className="flex-1 py-[11px] rounded-[9px] text-[14px] font-semibold text-white" style={{ background: '#1A3D5C' }}>Save Check-in</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function Dashboard() {
  const navigate = useNavigate()
  const { profile, checkins, todayCheckin } = useUserStore()
  const { plan, history } = useScheduleStore()
  const [showCheckin, setShowCheckin] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const checkin = todayCheckin()
  const todaySession = plan.find((s) => s.date === today)

  const todayExercises = useMemo(() =>
    (todaySession?.exercises ?? [])
      .map((se) => exercises.find((e) => e.id === se.exerciseId))
      .filter(Boolean) as typeof exercises[0][], [todaySession])

  const todayDone = new Set(history.filter((h) => h.date === today).map((h) => h.exerciseId))
  const todayTotal = todayExercises.length
  const todayPct = todayTotal > 0 ? Math.round((Math.min(todayDone.size, todayTotal) / todayTotal) * 100) : 0

  // Stats
  const streak = useMemo(() => getDayStreak(history.map((h) => h.date)), [history])

  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7))
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d.toISOString().split('T')[0]
  })
  const weekDone = weekDates.filter((d) => history.some((h) => h.date === d)).length
  const weekTotal = weekDates.filter((d) => plan.find((s) => s.date === d && s.exercises.length > 0)).length

  const lastSleep = checkins.slice(-1)[0]?.sleepHours ?? null
  const recentPains = checkins.slice(-7).map((c) => c.painScale)
  const avgPain = recentPains.length
    ? (recentPains.reduce((a, b) => a + b, 0) / recentPains.length).toFixed(1)
    : null

  // Phase from avg difficulty
  const avgDiff = todayExercises.length > 0
    ? Math.round(todayExercises.reduce((a, e) => a + e.difficulty, 0) / todayExercises.length)
    : 1
  const phases = ['Phase 1: Mobility', 'Phase 2: Strengthening', 'Phase 3: Functional', 'Phase 4: Advanced']
  const currentPhaseIdx = Math.max(0, Math.min(3, avgDiff - 1))
  const phaseLabel = phases[currentPhaseIdx]

  const weekNum = profile.surgeryDate
    ? Math.max(1, Math.floor((Date.now() - new Date(profile.surgeryDate).getTime()) / (1000 * 60 * 60 * 24 * 7)) + 1)
    : 1
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  // Recovery overall progress
  const totalPlanned = plan.reduce((a, s) => a + s.exercises.length, 0)
  const overallPct = totalPlanned > 0 ? Math.min(100, Math.round((history.length / totalPlanned) * 100)) : 0

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar
        title={`Good morning${profile.name ? `, ${profile.name} 👋` : ' 👋'}`}
        subtitle={`${dateStr} · Week ${weekNum} of 8 · ${phaseLabel}`}
        actions={
          <>
            <button
              onClick={() => setShowCheckin(true)}
              className="px-4 py-[7px] rounded-[8px] text-[13px] font-semibold transition-colors"
              style={{ background: '#F0F3F6', color: '#1A3D5C' }}
            >
              {checkin ? '✓ Checked In' : 'Log Check-in'}
            </button>
            <button
              onClick={() => navigate('/library')}
              className="px-4 py-[7px] rounded-[8px] text-[13px] font-semibold text-white transition-colors"
              style={{ background: '#1A3D5C' }}
            >
              Browse Library
            </button>
          </>
        }
      />

      <div className="flex-1 overflow-y-auto scrollbar-hide p-[24px_28px] space-y-4 fade-in">
        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-[14px]">
          <StatCard
            iconBg="#FDE8D0" iconColor="#F0A06A"
            iconPath="M12 2s-4 4-4 9a4 4 0 0 0 8 0c0-2-1-4-1-4s-1 2-2 2c-1 0-1.5-1-1.5-2S12 2 12 2Z"
            label="Day Streak" value={String(streak)} unit="days"
          />
          <StatCard
            iconBg="#D6F0F5" iconColor="#1A7FA8"
            iconPath="M13 2L4 14h8l-1 8 9-12h-8l1-8Z"
            label="This Week" value={`${weekDone}/${weekTotal}`} unit="sessions"
          />
          <StatCard
            iconBg="#EEEAFF" iconColor="#7B68EE"
            iconPath="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 1 0 9.8 9.8Z"
            label="Last Sleep" value={lastSleep !== null ? String(lastSleep) : '—'} unit={lastSleep !== null ? 'hours' : ''}
          />
          <StatCard
            iconBg="#D4EDDA" iconColor="#27A060"
            iconPath="M12 21C12 21 3 15 3 9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-9 12-9 12Z"
            label="Avg Pain" value={avgPain ?? '—'} unit={avgPain ? '/ 9 scale' : ''}
          />
        </div>

        {/* Main 2-col grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Today's Session */}
          <div className="bg-white rounded-[14px] p-[22px]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[15px] font-bold text-[#0F1E2B]">Today's Session</p>
              <span className="px-[9px] py-[3px] rounded-full text-[11px] font-semibold" style={{ background: '#D6F0F5', color: '#0E7490' }}>
                {phaseLabel.split(':')[0]}
              </span>
            </div>
            <p className="text-[12px] text-[#7A909F] mb-3">
              {todayTotal > 0 ? `${todayTotal} exercises · approx. ${todayTotal * 5} min` : 'Rest day'}
            </p>

            {/* Progress bar */}
            <div className="h-[5px] rounded-full mb-4" style={{ background: '#E2E8ED' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${todayPct}%`, background: '#1A7FA8' }} />
            </div>

            {todayExercises.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-[28px] mb-2">😌</p>
                <p className="text-[14px] font-semibold text-[#0F1E2B]">Rest day</p>
                <p className="text-[12px] text-[#7A909F] mt-1">Light walking encouraged</p>
              </div>
            ) : (
              <div>
                {todayExercises.map((ex) => {
                  const isDone = todayDone.has(ex.id)
                  return (
                    <div
                      key={ex.id}
                      className="flex items-center gap-[14px] py-[13px] cursor-pointer"
                      style={{ borderBottom: '1px solid #F0F3F6' }}
                      onClick={() => !isDone && navigate(`/exercise/${ex.id}`)}
                    >
                      <div
                        className="flex-shrink-0 flex items-center justify-center transition-all"
                        style={{
                          width: 22, height: 22, borderRadius: '50%',
                          border: `2px solid ${isDone ? '#1A7FA8' : '#CBD5DC'}`,
                          background: isDone ? '#1A7FA8' : '#fff',
                        }}
                      >
                        {isDone && <Checkmark />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold truncate" style={{ color: isDone ? '#9BAAB6' : '#0F1E2B', textDecoration: isDone ? 'line-through' : 'none' }}>
                          {ex.name}
                        </p>
                        <p className="text-[11px]" style={{ color: '#7A909F' }}>
                          {ex.sets} sets · {ex.reps} reps · {categoryLabels[ex.category]}
                        </p>
                      </div>
                      {!isDone && (
                        <div className="p-1.5 rounded-lg transition-colors hover:bg-[#F0F3F6]">
                          <svg viewBox="0 0 24 24" fill="none" width={16} height={16}>
                            <path d="M8 5l11 7-11 7V5Z" fill="#1A7FA8" stroke="#1A7FA8" strokeWidth="1.8" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                    </div>
                  )
                })}
                {todayPct === 100 && (
                  <div className="mt-3 p-3 rounded-[10px] text-center text-[13px] font-semibold" style={{ background: '#D4EDDA', color: '#166534' }}>
                    All done! Great work today 🎉
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            {/* Recovery Progress */}
            <div className="bg-white rounded-[14px] p-[22px]">
              <p className="text-[15px] font-bold text-[#0F1E2B] mb-3">Recovery Progress</p>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[13px] text-[#7A909F]">Overall</p>
                <p className="text-[13px] font-semibold text-[#1A7FA8]">{overallPct}%</p>
              </div>
              <div className="h-[5px] rounded-full mb-5" style={{ background: '#E2E8ED' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${overallPct}%`, background: '#1A7FA8' }} />
              </div>
              {/* Phase nodes */}
              <div className="flex items-center">
                {['Mobility', 'Strength', 'Function', 'Active'].map((phase, i, arr) => (
                  <div key={phase} className="flex items-center" style={{ flex: i < arr.length - 1 ? '1' : undefined }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700,
                      background: currentPhaseIdx >= i ? '#1A3D5C' : '#E2E8ED',
                      color: currentPhaseIdx >= i ? '#fff' : '#7A909F',
                      flexShrink: 0,
                    }}>
                      {i + 1}
                    </div>
                    {i < arr.length - 1 && (
                      <div style={{ flex: 1, height: 2, background: currentPhaseIdx > i ? '#1A7FA8' : '#E2E8ED' }} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2">
                {['Mobility', 'Strength', 'Function', 'Active'].map((phase, i) => (
                  <p key={phase} style={{ fontSize: 9, color: currentPhaseIdx >= i ? '#1A3D5C' : '#9BAAB6', fontWeight: 600 }}>
                    {phase}
                  </p>
                ))}
              </div>
            </div>

            {/* Check-in CTA or summary */}
            {!checkin ? (
              <div
                className="rounded-[14px] p-[22px] flex items-center gap-4 cursor-pointer"
                style={{ background: '#1A3D5C' }}
                onClick={() => setShowCheckin(true)}
              >
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg viewBox="0 0 24 24" fill="none" width={20} height={20}>
                    <path d="M12 21C12 21 3 15 3 9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-9 12-9 12Z" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[14px] text-white">Log today's check-in</p>
                  <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.55)' }}>Pain, sleep & completion</p>
                </div>
                <ChevronRight size={18} style={{ color: 'rgba(255,255,255,0.55)' }} />
              </div>
            ) : (
              <div className="bg-white rounded-[14px] p-[22px]">
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: '#7A909F', letterSpacing: '0.8px' }}>Today's Check-in</p>
                <div className="flex gap-6">
                  <div>
                    <p style={{ fontSize: 11, color: '#7A909F' }}>Pain</p>
                    <p style={{ fontSize: 24, fontWeight: 700, color: checkin.painScale > 6 ? '#D9534F' : checkin.painScale > 3 ? '#F0A06A' : '#27A060' }}>
                      {checkin.painScale}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: '#7A909F' }}>Sleep</p>
                    <p style={{ fontSize: 24, fontWeight: 700, color: checkin.sleepHours < 5 ? '#D9534F' : checkin.sleepHours < 7 ? '#F0A06A' : '#27A060' }}>
                      {checkin.sleepHours}h
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: '#7A909F' }}>Completion</p>
                    <p style={{ fontSize: 24, fontWeight: 700, color: '#1A7FA8' }}>{checkin.completionPct}%</p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick stat */}
            <div className="bg-white rounded-[14px] p-[22px]">
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: '#7A909F', letterSpacing: '0.8px' }}>All Time</p>
              <div className="flex gap-6">
                <div>
                  <p style={{ fontSize: 11, color: '#7A909F' }}>Sessions</p>
                  <p style={{ fontSize: 24, fontWeight: 700, color: '#0F1E2B' }}>{new Set(history.map(h => h.date)).size}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: '#7A909F' }}>Total Reps</p>
                  <p style={{ fontSize: 24, fontWeight: 700, color: '#0F1E2B' }}>{history.reduce((a, h) => a + h.repsCompleted, 0)}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: '#7A909F' }}>Exercises</p>
                  <p style={{ fontSize: 24, fontWeight: 700, color: '#0F1E2B' }}>{new Set(history.map(h => h.exerciseId)).size}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Week strip */}
        <div className="bg-white rounded-[14px] p-[22px]">
          <p className="text-[15px] font-bold text-[#0F1E2B] mb-4">This Week</p>
          <div className="flex gap-1.5">
            {weekDates.map((date, i) => {
              const isToday = date === today
              const isRest = !plan.find((s) => s.date === date && s.exercises.length > 0)
              const isDone = history.some((h) => h.date === date)
              const dateNum = new Date(date + 'T12:00:00').getDate()
              return (
                <div
                  key={date}
                  className="flex-1 flex flex-col items-center gap-1.5 rounded-[10px] py-2.5 px-1.5 cursor-pointer transition-all"
                  style={{
                    background: '#fff',
                    border: isToday ? '1.5px solid #1A7FA8' : '1.5px solid transparent',
                  }}
                  onClick={() => !isRest && navigate('/schedule')}
                >
                  <p style={{ fontSize: 10, fontWeight: 600, color: '#9BAAB6', letterSpacing: '0.3px' }}>{DAY_NAMES[i]}</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#0F1E2B' }}>{dateNum}</p>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: isDone ? '#27A060' : isToday ? '#1A7FA8' : '#E2E8ED',
                  }} />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {showCheckin && <CheckInModal onClose={() => setShowCheckin(false)} />}
    </div>
  )
}
