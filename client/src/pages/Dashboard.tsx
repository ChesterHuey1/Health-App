import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Play, CheckCircle, Moon, Zap, Activity, ChevronRight,
  Calendar, TrendingUp, AlertCircle
} from 'lucide-react'
import { useUserStore } from '../store/userStore'
import { useScheduleStore } from '../store/scheduleStore'
import { exercises, difficultyColors, difficultyLabels } from '../data/exercises'
import type { DailyCheckin } from '../store/userStore'

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function CheckInModal({ onClose }: { onClose: () => void }) {
  const { addCheckin } = useUserStore()
  const [pain, setPain] = useState(3)
  const [sleep, setSleep] = useState(7)
  const [completion, setCompletion] = useState(100)

  function submit() {
    const today = new Date().toISOString().split('T')[0]
    addCheckin({ date: today, painScale: pain, sleepHours: sleep, completionPct: completion })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#1a1d27] border border-[#2a2d3e] rounded-2xl p-6 w-full max-w-sm mx-4 space-y-5">
        <h2 className="text-white text-lg font-bold">Daily Check-In</h2>
        <p className="text-[#64748b] text-sm">This helps us adjust your PT plan automatically.</p>

        {/* Pain */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-[#94a3b8] text-sm">Pain Level</label>
            <span className="text-white font-bold">{pain} / 10</span>
          </div>
          <input
            type="range" min={0} max={10} value={pain}
            onChange={(e) => setPain(Number(e.target.value))}
            className="w-full accent-[#4f8ef7]"
          />
          <div className="flex justify-between text-xs text-[#64748b] mt-1">
            <span>No pain</span><span>Severe</span>
          </div>
        </div>

        {/* Sleep */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-[#94a3b8] text-sm">Sleep Last Night</label>
            <span className="text-white font-bold">{sleep} hrs</span>
          </div>
          <input
            type="range" min={0} max={12} value={sleep}
            onChange={(e) => setSleep(Number(e.target.value))}
            className="w-full accent-[#4f8ef7]"
          />
          <div className="flex justify-between text-xs text-[#64748b] mt-1">
            <span>0 hrs</span><span>12 hrs</span>
          </div>
        </div>

        {/* Completion */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-[#94a3b8] text-sm">Yesterday's PT Completion</label>
            <span className="text-white font-bold">{completion}%</span>
          </div>
          <input
            type="range" min={0} max={100} step={10} value={completion}
            onChange={(e) => setCompletion(Number(e.target.value))}
            className="w-full accent-[#4f8ef7]"
          />
          <div className="flex justify-between text-xs text-[#64748b] mt-1">
            <span>0%</span><span>100%</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-[#2a2d3e] text-[#94a3b8] rounded-lg text-sm hover:bg-[#2a2d3e] transition-colors"
          >
            Skip
          </button>
          <button
            onClick={submit}
            className="flex-1 py-2.5 bg-[#4f8ef7] hover:bg-[#6ba3ff] text-white rounded-lg text-sm transition-colors"
          >
            Save Check-In
          </button>
        </div>
      </div>
    </div>
  )
}

export function Dashboard() {
  const navigate = useNavigate()
  const { profile, todayCheckin } = useUserStore()
  const { plan, history } = useScheduleStore()
  const [showCheckin, setShowCheckin] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const todaySession = plan.find((s) => s.date === today)
  const checkin = todayCheckin()

  const todayExercises = (todaySession?.exercises ?? []).map((se) => ({
    scheduled: se,
    exercise: exercises.find((e) => e.id === se.exerciseId),
  })).filter((x) => x.exercise)

  // Weekly overview — last 7 days
  const today7 = new Date()
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today7)
    d.setDate(today7.getDate() - today7.getDay() + 1 + i)
    return d.toISOString().split('T')[0]
  })

  const completedToday = history.filter((h) => h.date === today).length

  return (
    <div className="flex-1 flex flex-col overflow-y-auto scrollbar-hide p-6 gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">
            {profile.name ? `Hey, ${profile.name} 👋` : 'Good morning'}
          </h1>
          <p className="text-[#64748b] text-sm mt-0.5">
            {profile.surgeryType
              ? `${profile.surgeryType.charAt(0).toUpperCase() + profile.surgeryType.slice(1)} recovery plan`
              : 'Start your recovery plan'}
          </p>
        </div>
        <button
          onClick={() => setShowCheckin(true)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            checkin
              ? 'bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e]'
              : 'bg-[#4f8ef7]/10 border border-[#4f8ef7]/30 text-[#4f8ef7] hover:bg-[#4f8ef7]/20'
          }`}
        >
          {checkin ? <CheckCircle size={16} /> : <Activity size={16} />}
          {checkin ? 'Checked In' : 'Daily Check-In'}
        </button>
      </div>

      {/* Check-in alert */}
      {!checkin && (
        <div
          className="flex items-center gap-3 p-4 rounded-xl bg-[#f59e0b]/10 border border-[#f59e0b]/20 cursor-pointer hover:bg-[#f59e0b]/15 transition-colors"
          onClick={() => setShowCheckin(true)}
        >
          <AlertCircle size={18} className="text-[#f59e0b] flex-shrink-0" />
          <div>
            <p className="text-white text-sm font-medium">Complete your daily check-in</p>
            <p className="text-[#94a3b8] text-xs">Pain level, sleep & completion data helps adjust your plan automatically.</p>
          </div>
          <ChevronRight size={16} className="text-[#f59e0b] ml-auto" />
        </div>
      )}

      {/* Check-in summary */}
      {checkin && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Zap, label: 'Pain', value: `${checkin.painScale}/10`, color: checkin.painScale > 7 ? '#ef4444' : checkin.painScale > 4 ? '#f59e0b' : '#22c55e' },
            { icon: Moon, label: 'Sleep', value: `${checkin.sleepHours}hrs`, color: checkin.sleepHours < 5 ? '#ef4444' : checkin.sleepHours < 7 ? '#f59e0b' : '#22c55e' },
            { icon: CheckCircle, label: 'Yesterday', value: `${checkin.completionPct}%`, color: checkin.completionPct < 70 ? '#ef4444' : '#22c55e' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-[#1a1d27] rounded-xl p-4 border border-[#2a2d3e]">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={14} style={{ color }} />
                <p className="text-[#64748b] text-xs">{label}</p>
              </div>
              <p className="text-white text-xl font-bold" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Weekly calendar */}
      <div className="bg-[#1a1d27] rounded-xl p-4 border border-[#2a2d3e]">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={16} className="text-[#4f8ef7]" />
          <p className="text-white font-medium text-sm">This Week</p>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date, i) => {
            const sess = plan.find((s) => s.date === date)
            const isToday = date === today
            const isRest = !sess || sess.exercises.length === 0
            const isDone = sess?.completed
            const dayHistoryCount = history.filter((h) => h.date === date).length

            return (
              <div
                key={date}
                className={`flex flex-col items-center gap-1.5 py-2 px-1 rounded-lg cursor-pointer transition-colors ${
                  isToday
                    ? 'bg-[#4f8ef7]/15 border border-[#4f8ef7]/30'
                    : 'hover:bg-[#2a2d3e]'
                }`}
                onClick={() => sess && !isRest && navigate(`/schedule`)}
              >
                <p className={`text-xs ${isToday ? 'text-[#4f8ef7] font-bold' : 'text-[#64748b]'}`}>
                  {dayLabels[i]}
                </p>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                    isRest
                      ? 'bg-[#2a2d3e] text-[#64748b]'
                      : isDone || dayHistoryCount > 0
                      ? 'bg-[#22c55e] text-white'
                      : isToday
                      ? 'bg-[#4f8ef7] text-white'
                      : 'bg-[#2a2d3e] text-[#94a3b8]'
                  }`}
                >
                  {isRest ? '—' : isDone || dayHistoryCount > 0 ? '✓' : sess?.exercises.length ?? '?'}
                </div>
                <p className="text-[10px] text-[#64748b]">
                  {isRest ? 'Rest' : `${sess?.exercises.length ?? 0} ex`}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Today's exercises */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold">Today's Exercises</h2>
          <p className="text-[#64748b] text-sm">{completedToday}/{todayExercises.length} done</p>
        </div>

        {todayExercises.length === 0 ? (
          <div className="bg-[#1a1d27] rounded-xl p-8 border border-[#2a2d3e] text-center">
            <p className="text-4xl mb-3">🎉</p>
            <p className="text-white font-medium">Rest day — great work this week!</p>
            <p className="text-[#64748b] text-sm mt-1">Light walking encouraged.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayExercises.map(({ scheduled, exercise }) => {
              if (!exercise) return null
              const done = history.some(
                (h) => h.exerciseId === exercise.id && h.date === today
              )
              const diffColor = difficultyColors[exercise.difficulty]
              return (
                <div
                  key={exercise.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                    done
                      ? 'border-[#22c55e]/20 bg-[#22c55e]/5'
                      : 'border-[#2a2d3e] bg-[#1a1d27] hover:border-[#4f8ef7]/40'
                  }`}
                  onClick={() => !done && navigate(`/exercise/${exercise.id}`)}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#2a2d3e] flex items-center justify-center text-xl">
                    {exercise.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{exercise.name}</p>
                    <p className="text-[#64748b] text-xs">
                      {scheduled.sets} sets × {scheduled.reps} reps
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ color: diffColor, backgroundColor: `${diffColor}20` }}
                    >
                      {difficultyLabels[exercise.difficulty]}
                    </span>
                    {done ? (
                      <CheckCircle size={20} className="text-[#22c55e]" />
                    ) : (
                      <Play size={20} className="text-[#4f8ef7]" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Progress summary */}
      <div className="bg-[#1a1d27] rounded-xl p-4 border border-[#2a2d3e]">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={16} className="text-[#4f8ef7]" />
          <p className="text-white font-medium text-sm">Recovery Progress</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-[#64748b] text-xs mb-1">Sessions completed</p>
            <p className="text-white text-2xl font-bold">{history.length}</p>
          </div>
          <div className="flex-1">
            <p className="text-[#64748b] text-xs mb-1">Total reps logged</p>
            <p className="text-white text-2xl font-bold">
              {history.reduce((acc, h) => acc + h.repsCompleted, 0)}
            </p>
          </div>
          <div className="flex-1">
            <p className="text-[#64748b] text-xs mb-1">Unique exercises</p>
            <p className="text-white text-2xl font-bold">
              {new Set(history.map((h) => h.exerciseId)).size}
            </p>
          </div>
        </div>
      </div>

      {showCheckin && <CheckInModal onClose={() => setShowCheckin(false)} />}
    </div>
  )
}
