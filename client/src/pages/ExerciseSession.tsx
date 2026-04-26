import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ThumbsUp, ThumbsDown, Minus,
  RotateCcw, ChevronRight, Send, Loader2, Play,
} from 'lucide-react'
import { exercises, categoryLabels, getPosition, positionLabels, type Position } from '../data/exercises'
import { PoseCamera } from '../components/exercise/PoseCamera'
import { useScheduleStore, type SessionFeedback } from '../store/scheduleStore'
import { useUserStore } from '../store/userStore'
import { getNextExercise } from '../lib/scheduler'
import type { JointResult } from '../lib/poseAnalysis'

const LEVEL_COLORS: Record<number, { bg: string; text: string }> = {
  1: { bg: '#D4EDDA', text: '#166534' },
  2: { bg: '#D6F0F5', text: '#0E7490' },
  3: { bg: '#FDE8D0', text: '#9A4E0F' },
  4: { bg: '#FDE8D0', text: '#9A4E0F' },
  5: { bg: '#FDDCDC', text: '#9B1C1C' },
}

const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Beginner',
  2: 'Early Intermediate',
  3: 'Intermediate',
  4: 'Advanced',
  5: 'Expert',
}

const POSITION_ICONS: Record<Position, string> = {
  standing: '🧍',
  seated: '🪑',
  floor: '🛏',
}

function PositionIllustration({ position }: { position: Position }) {
  const stroke = '#1A3D5C'
  const accent = '#1A7FA8'
  const sw = 2.5

  if (position === 'standing') {
    return (
      <svg viewBox="0 0 120 120" width="110" height="110">
        <circle cx="60" cy="16" r="9" stroke={stroke} strokeWidth={sw} fill="none" />
        <line x1="60" y1="25" x2="60" y2="68" stroke={stroke} strokeWidth={sw} />
        <line x1="60" y1="40" x2="36" y2="56" stroke={stroke} strokeWidth={sw} />
        <line x1="60" y1="40" x2="84" y2="56" stroke={stroke} strokeWidth={sw} />
        <line x1="60" y1="68" x2="46" y2="104" stroke={stroke} strokeWidth={sw} />
        <line x1="60" y1="68" x2="74" y2="104" stroke={stroke} strokeWidth={sw} />
        <circle cx="60" cy="68" r="4.5" fill={accent} />
        <line x1="14" y1="108" x2="106" y2="108" stroke={accent} strokeWidth="1.5" strokeDasharray="4 3" />
      </svg>
    )
  }

  if (position === 'seated') {
    return (
      <svg viewBox="0 0 120 120" width="110" height="110">
        <circle cx="42" cy="14" r="9" stroke={stroke} strokeWidth={sw} fill="none" />
        <line x1="42" y1="23" x2="42" y2="62" stroke={stroke} strokeWidth={sw} />
        <line x1="42" y1="36" x2="19" y2="52" stroke={stroke} strokeWidth={sw} />
        <line x1="42" y1="36" x2="65" y2="52" stroke={stroke} strokeWidth={sw} />
        {/* thigh horizontal */}
        <line x1="42" y1="62" x2="88" y2="62" stroke={stroke} strokeWidth={sw} />
        {/* lower leg vertical */}
        <line x1="88" y1="62" x2="88" y2="100" stroke={stroke} strokeWidth={sw} />
        {/* chair seat */}
        <line x1="20" y1="62" x2="92" y2="62" stroke={accent} strokeWidth="1.5" strokeDasharray="4 3" />
        {/* chair back leg */}
        <line x1="25" y1="62" x2="25" y2="100" stroke={accent} strokeWidth="1.5" />
        {/* floor */}
        <line x1="14" y1="100" x2="106" y2="100" stroke={accent} strokeWidth="1.5" strokeDasharray="4 3" />
        <circle cx="42" cy="62" r="4.5" fill={accent} />
      </svg>
    )
  }

  // floor / mat
  return (
    <svg viewBox="0 0 120 120" width="110" height="110">
      {/* head */}
      <circle cx="14" cy="62" r="9" stroke={stroke} strokeWidth={sw} fill="none" />
      {/* body horizontal */}
      <line x1="23" y1="62" x2="88" y2="62" stroke={stroke} strokeWidth={sw} />
      {/* arms raised */}
      <line x1="46" y1="62" x2="40" y2="40" stroke={stroke} strokeWidth={sw} />
      <line x1="58" y1="62" x2="52" y2="40" stroke={stroke} strokeWidth={sw} />
      {/* legs slightly bent */}
      <line x1="88" y1="62" x2="98" y2="80" stroke={stroke} strokeWidth={sw} />
      <line x1="88" y1="62" x2="108" y2="80" stroke={stroke} strokeWidth={sw} />
      {/* mat / floor */}
      <line x1="5" y1="74" x2="115" y2="74" stroke={accent} strokeWidth="1.5" strokeDasharray="4 3" />
      <circle cx="88" cy="62" r="4.5" fill={accent} />
    </svg>
  )
}

export function ExerciseSession() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addHistory, setDifficulty } = useScheduleStore()
  const { todayCheckin, profile } = useUserStore()

  const exercise = exercises.find((e) => e.id === id)

  const [showPreview, setShowPreview] = useState(true)
  const [repCount, setRepCount] = useState(0)
  const [currentSet, setCurrentSet] = useState(1)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [feedback, setFeedback] = useState<SessionFeedback | null>(null)
  const [showNotesStep, setShowNotesStep] = useState(false)
  const [sessionNotes, setSessionNotes] = useState('')
  const [completedJoints, setCompletedJoints] = useState<JointResult[]>([])
  const [nextExercise, setNextExercise] = useState<typeof exercises[0] | null>(null)
  const [latestJoints, setLatestJoints] = useState<JointResult[]>([])

  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [input, setInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!exercise) return
    setMessages([{
      role: 'assistant',
      content: `I'm watching your form on ${exercise.name}. Start the camera and begin your reps — I'll give you real-time feedback. Ask me anything about this exercise.`,
    }])
  }, [exercise?.id])

  if (!exercise) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p style={{ color: '#7A909F' }}>Exercise not found.</p>
      </div>
    )
  }

  const targetReps = exercise.reps
  const totalSets = exercise.sets
  const lc = LEVEL_COLORS[exercise.difficulty] ?? LEVEL_COLORS[3]
  const position = getPosition(exercise.id)

  function handleRepComplete(count: number, joints: JointResult[]) {
    setLatestJoints(joints)
    if (count >= targetReps) {
      if (currentSet < totalSets) {
        setCurrentSet((s) => s + 1)
        setRepCount(0)
      } else {
        setCompletedJoints(joints)
        setSessionComplete(true)
      }
    } else {
      setRepCount(count)
    }
  }

  function handleFeedback(f: SessionFeedback) {
    setFeedback(f)
    const checkin = todayCheckin()
    const next = getNextExercise(exercise.id, f, checkin)
    setNextExercise(next ?? null)
    const newDiff = f === 'too_easy'
      ? Math.min(5, exercise.difficulty + 1)
      : f === 'too_hard'
      ? Math.max(1, exercise.difficulty - 1)
      : exercise.difficulty
    setDifficulty(exercise.id, newDiff as any)
    setShowNotesStep(true)
  }

  function handleSaveNotes(notes: string) {
    addHistory({
      exerciseId: exercise.id,
      date: new Date().toISOString().split('T')[0],
      repsCompleted: targetReps,
      setsCompleted: totalSets,
      feedback: feedback ?? 'just_right',
      jointAngles: Object.fromEntries(completedJoints.map((j) => [j.label, j.angle])),
      userNotes: notes || undefined,
    })
    setShowNotesStep(false)
    setSessionNotes('')
  }

  async function sendMessage(overrideText?: string) {
    const userText = (overrideText ?? input).trim()
    if (!userText || aiLoading) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: userText }])
    setAiLoading(true)

    const formContext = latestJoints.length > 0
      ? `Current form data: ${latestJoints.map((j) => `${j.label}=${Math.round(j.angle)}° (${j.status})`).join(', ')}.`
      : ''

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userText }],
          systemContext: `You are a physical therapy AI assistant helping a patient recover from ${profile.surgeryType ?? 'surgery'}. They are currently doing: ${exercise.name} (${exercise.description}). ${formContext} Instructions: ${exercise.instructions.join(' ')}. Keep responses short, encouraging, and clinically accurate.`,
        }),
      })
      const data = await res.json()
      setMessages((m) => [...m, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Connection error. Please try again.' }])
    } finally {
      setAiLoading(false)
    }
  }

  function askAIAboutForm() {
    const issues = latestJoints.filter((j) => j.status !== 'correct')
    if (!issues.length) return
    const prompt = `I'm seeing form issues: ${issues.map((j) => `${j.label} at ${Math.round(j.angle)}° — ${j.feedback}`).join('; ')}. What's the most important fix?`
    sendMessage(prompt)
  }

  return (
    <div className="flex-1 flex h-full overflow-hidden">
      {/* Left — exercise content */}
      <div className="flex-1 flex flex-col overflow-y-auto scrollbar-hide" style={{ background: '#F0F3F6' }}>
        {/* Top bar */}
        <div className="bg-white border-b border-[#E2E8ED] px-6 h-[58px] flex items-center gap-4 flex-shrink-0">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 transition-colors"
            style={{ color: '#1A3D5C', fontSize: 13, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <div className="h-4 w-px" style={{ background: '#E2E8ED' }} />
          <p className="text-[16px] font-bold text-[#0F1E2B] flex-1 truncate">
            {exercise.icon} {exercise.name}
          </p>
          <span
            className="px-[9px] py-[3px] rounded-full text-[11px] font-semibold flex-shrink-0"
            style={{ background: lc.bg, color: lc.text }}
          >
            {DIFFICULTY_LABELS[exercise.difficulty]}
          </span>
        </div>

        <div className="p-6 space-y-4">
          {/* Preview card — shown before session starts */}
          {showPreview && (
            <div className="bg-white rounded-[14px] overflow-hidden" style={{ border: '1px solid #E2E8ED' }}>
              {/* Illustration area */}
              <div
                className="relative flex items-center justify-center"
                style={{ height: 180, background: '#D6E4EE' }}
              >
                <PositionIllustration position={position} />
                <span
                  className="absolute top-3 left-3 px-[9px] py-[3px] rounded-full text-[10px] font-semibold"
                  style={{ background: '#D6F0F5', color: '#0E7490' }}
                >
                  {categoryLabels[exercise.category]}
                </span>
                <span
                  className="absolute top-3 right-3 px-[9px] py-[3px] rounded-full text-[10px] font-semibold"
                  style={{ background: 'rgba(255,255,255,0.85)', color: '#5A7080' }}
                >
                  {POSITION_ICONS[position]} {positionLabels[position]}
                </span>
              </div>

              {/* Info */}
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-[19px] font-bold text-[#0F1E2B]">{exercise.name}</p>
                  <p className="text-[13px] mt-1 leading-relaxed" style={{ color: '#7A909F' }}>
                    {exercise.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {exercise.muscleGroups.map((m) => (
                    <span
                      key={m}
                      className="px-[10px] py-[4px] rounded-full text-[11px] font-medium"
                      style={{ background: '#F0F3F6', color: '#5A7080' }}
                    >
                      {m}
                    </span>
                  ))}
                </div>

                <div className="flex gap-3 text-[13px]" style={{ color: '#5A7080' }}>
                  <span><span className="font-semibold text-[#0F1E2B]">{totalSets}</span> sets</span>
                  <span>·</span>
                  <span><span className="font-semibold text-[#0F1E2B]">{targetReps}</span> reps</span>
                  {exercise.holdSeconds > 0 && (
                    <>
                      <span>·</span>
                      <span><span className="font-semibold text-[#0F1E2B]">{exercise.holdSeconds}s</span> hold</span>
                    </>
                  )}
                </div>

                <button
                  onClick={() => setShowPreview(false)}
                  className="w-full py-[14px] rounded-[12px] text-[14px] font-semibold text-white flex items-center justify-center gap-2 cursor-pointer transition-opacity hover:opacity-90"
                  style={{ background: '#1A3D5C', border: 'none' }}
                >
                  <Play size={15} fill="white" strokeWidth={0} />
                  Start Session
                </button>
              </div>
            </div>
          )}

          {/* Set / rep counters — shown once session starts */}
          {!showPreview && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Set', value: currentSet, total: totalSets },
                { label: 'Reps', value: repCount, total: targetReps },
                ...(exercise.holdSeconds > 0 ? [{ label: 'Hold', value: exercise.holdSeconds, total: null, unit: 's' }] : []),
              ].map(({ label, value, total, unit }: any) => (
                <div key={label} className="bg-white rounded-[14px] p-4 text-center" style={{ border: '1px solid #E2E8ED' }}>
                  <p style={{ fontSize: 11, color: '#7A909F', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{label}</p>
                  <p style={{ fontSize: 28, fontWeight: 700, color: '#0F1E2B', lineHeight: 1 }}>
                    {value}
                    {total !== null && <span style={{ fontSize: 16, fontWeight: 400, color: '#7A909F' }}> / {total}</span>}
                    {unit && <span style={{ fontSize: 16, fontWeight: 400, color: '#7A909F' }}>{unit}</span>}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Camera */}
          {!showPreview && !sessionComplete && (
            <PoseCamera
              exercise={exercise}
              targetReps={targetReps}
              onRepComplete={handleRepComplete}
              onFormUpdate={setLatestJoints}
            />
          )}

          {/* Session complete — difficulty rating */}
          {sessionComplete && !feedback && (
            <div className="bg-white rounded-[14px] p-8 text-center space-y-5" style={{ border: '1px solid #E2E8ED' }}>
              <div className="w-16 h-16 rounded-[16px] mx-auto flex items-center justify-center" style={{ background: '#D4EDDA' }}>
                <svg viewBox="0 0 24 24" fill="none" width={32} height={32}>
                  <path d="M5 12l5 5L19 7" stroke="#27A060" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <p className="text-[22px] font-bold text-[#0F1E2B] mb-1">Session Complete!</p>
                <p style={{ fontSize: 13, color: '#7A909F' }}>
                  {totalSets} sets × {targetReps} reps of {exercise.name}
                </p>
              </div>
              <p style={{ fontSize: 14, color: '#5A7080' }}>How was the difficulty?</p>
              <div className="flex gap-3">
                {[
                  { f: 'too_hard' as const, icon: ThumbsDown, label: 'Too Hard', bg: '#FDDCDC', text: '#9B1C1C' },
                  { f: 'just_right' as const, icon: Minus, label: 'Just Right', bg: '#D4EDDA', text: '#166534' },
                  { f: 'too_easy' as const, icon: ThumbsUp, label: 'Too Easy', bg: '#D6F0F5', text: '#0E7490' },
                ].map(({ f, icon: Icon, label, bg, text }) => (
                  <button
                    key={f}
                    onClick={() => handleFeedback(f)}
                    className="flex-1 py-4 px-3 rounded-[12px] flex flex-col items-center gap-2 transition-all hover:scale-105 cursor-pointer"
                    style={{ background: bg, border: 'none' }}
                  >
                    <Icon size={22} style={{ color: text }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: text }}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Session notes step */}
          {sessionComplete && feedback && showNotesStep && (
            <div className="bg-white rounded-[14px] p-8 space-y-5" style={{ border: '1px solid #E2E8ED' }}>
              <div>
                <p className="text-[18px] font-bold text-[#0F1E2B]">How did it feel?</p>
                <p className="text-[13px] mt-1 leading-relaxed" style={{ color: '#7A909F' }}>
                  Share any notes for your therapist — pain, difficulty, or anything notable. Optional.
                </p>
              </div>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="e.g. Felt tightness in my knee during set 3, otherwise manageable..."
                rows={4}
                className="w-full text-[13px] rounded-[10px] outline-none resize-none transition-colors"
                style={{
                  padding: '12px 14px',
                  background: '#F4F6F8',
                  border: '1.5px solid #E2E8ED',
                  color: '#0F1E2B',
                  fontFamily: 'DM Sans, sans-serif',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#1A7FA8')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#E2E8ED')}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => handleSaveNotes('')}
                  className="flex-1 py-[12px] rounded-[10px] text-[14px] font-semibold cursor-pointer transition-colors"
                  style={{ background: '#F0F3F6', color: '#5A7080', border: 'none' }}
                >
                  Skip
                </button>
                <button
                  onClick={() => handleSaveNotes(sessionNotes)}
                  className="flex-1 py-[12px] rounded-[10px] text-[14px] font-semibold text-white cursor-pointer transition-opacity hover:opacity-90"
                  style={{ background: '#1A3D5C', border: 'none' }}
                >
                  Save Notes
                </button>
              </div>
            </div>
          )}

          {/* Post-feedback — recommendations */}
          {sessionComplete && feedback && !showNotesStep && (
            <div className="bg-white rounded-[14px] p-6 space-y-4" style={{ border: '1px solid #E2E8ED' }}>
              <p className="text-[15px] font-bold text-[#0F1E2B]">
                {feedback === 'too_easy' ? '💪 Stepping it up!' : feedback === 'too_hard' ? '👍 Taking it easier — smart recovery.' : '✅ Perfect — keeping this level.'}
              </p>
              {nextExercise && nextExercise.id !== exercise.id && (
                <div className="p-4 rounded-[10px]" style={{ background: '#D6F0F5' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#7A909F', marginBottom: 4 }}>Recommended next</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#0F1E2B' }}>
                    {nextExercise.icon} {nextExercise.name}
                  </p>
                  <p style={{ fontSize: 12, color: '#5A7080', marginTop: 2 }}>{nextExercise.description}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/library')}
                  className="flex-1 py-[11px] rounded-[9px] text-[14px] font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  style={{ background: '#F0F3F6', color: '#1A3D5C', border: 'none' }}
                >
                  <RotateCcw size={15} /> Back to Library
                </button>
                {nextExercise && nextExercise.id !== exercise.id && (
                  <button
                    onClick={() => navigate(`/exercise/${nextExercise.id}`)}
                    className="flex-1 py-[11px] rounded-[9px] text-[14px] font-semibold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    style={{ background: '#1A3D5C', border: 'none' }}
                  >
                    Start Next <ChevronRight size={15} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-white rounded-[14px] p-[22px]" style={{ border: '1px solid #E2E8ED' }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#7A909F', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>
              Instructions
            </p>
            <ol className="space-y-3">
              {exercise.instructions.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <div
                    className="flex-shrink-0 flex items-center justify-center mt-0.5"
                    style={{ width: 22, height: 22, borderRadius: '50%', background: '#D6F0F5', fontSize: 11, fontWeight: 700, color: '#0E7490' }}
                  >
                    {i + 1}
                  </div>
                  <p style={{ fontSize: 13, color: '#5A7080', lineHeight: 1.6 }}>{step}</p>
                </li>
              ))}
            </ol>
          </div>

          <p style={{ fontSize: 11, color: '#9BAAB6', textAlign: 'center', padding: '0 0 8px' }}>
            {categoryLabels[exercise.category]} · {exercise.muscleGroups.join(', ')}
          </p>
        </div>
      </div>

      {/* Right — AI coach */}
      <div className="flex flex-col" style={{ width: 320, flexShrink: 0, background: '#fff', borderLeft: '1px solid #E2E8ED' }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 h-[58px] flex-shrink-0" style={{ borderBottom: '1px solid #E2E8ED' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#D6F0F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24" fill="none" width={16} height={16}>
              <circle cx="12" cy="12" r="9" stroke="#1A7FA8" strokeWidth="1.8"/>
              <circle cx="12" cy="12" r="5" stroke="#1A7FA8" strokeWidth="1.8"/>
              <circle cx="12" cy="12" r="1" fill="#1A7FA8"/>
            </svg>
          </div>
          <div className="flex-1">
            <p style={{ fontSize: 13, fontWeight: 700, color: '#0F1E2B' }}>AI Form Coach</p>
            <p style={{ fontSize: 10, color: '#7A909F' }}>Powered by DeepSeek</p>
          </div>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#27A060' }} />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-[85%] px-3 py-2 rounded-[12px] text-[13px] leading-relaxed"
                style={
                  msg.role === 'user'
                    ? { background: '#1A3D5C', color: '#fff', borderBottomRightRadius: 4 }
                    : { background: '#F0F3F6', color: '#0F1E2B', borderBottomLeftRadius: 4 }
                }
              >
                {msg.content}
              </div>
            </div>
          ))}
          {aiLoading && (
            <div className="flex justify-start">
              <div className="px-3 py-2 rounded-[12px]" style={{ background: '#F0F3F6', borderBottomLeftRadius: 4 }}>
                <Loader2 size={14} style={{ color: '#7A909F' }} className="animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Form issue button */}
        {latestJoints.some((j) => j.status !== 'correct') && (
          <div className="px-4 pb-2">
            <button
              onClick={askAIAboutForm}
              className="w-full py-2 rounded-[9px] text-[12px] font-semibold transition-colors cursor-pointer"
              style={{ background: '#FDE8D0', color: '#9A4E0F', border: 'none' }}
            >
              ⚠ Ask AI about my current form issue
            </button>
          </div>
        )}

        {/* Input */}
        <div className="p-3 flex gap-2" style={{ borderTop: '1px solid #E2E8ED' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask anything…"
            className="flex-1 outline-none text-[13px] rounded-[9px] transition-colors"
            style={{
              background: '#F4F6F8', border: '1.5px solid #E2E8ED',
              padding: '8px 12px', color: '#0F1E2B', fontFamily: 'DM Sans, sans-serif',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#1A7FA8')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#E2E8ED')}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || aiLoading}
            className="flex items-center justify-center rounded-[9px] transition-colors cursor-pointer disabled:opacity-40"
            style={{ width: 38, height: 38, background: '#1A3D5C', border: 'none', flexShrink: 0 }}
          >
            <Send size={15} style={{ color: '#fff' }} />
          </button>
        </div>
      </div>
    </div>
  )
}
