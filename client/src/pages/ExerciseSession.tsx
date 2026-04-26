import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, CheckCircle, ThumbsUp, ThumbsDown, Minus,
  MessageCircle, ChevronRight, RotateCcw, Send, Loader2
} from 'lucide-react'
import { exercises, difficultyLabels, difficultyColors } from '../data/exercises'
import { PoseCamera } from '../components/exercise/PoseCamera'
import { useScheduleStore, type SessionFeedback } from '../store/scheduleStore'
import { useUserStore } from '../store/userStore'
import { getNextExercise } from '../lib/scheduler'
import type { JointResult } from '../lib/poseAnalysis'

export function ExerciseSession() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addHistory, setDifficulty } = useScheduleStore()
  const { todayCheckin } = useUserStore()
  const { profile } = useUserStore()

  const exercise = exercises.find((e) => e.id === id)

  const [repCount, setRepCount] = useState(0)
  const [currentSet, setCurrentSet] = useState(1)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [feedback, setFeedback] = useState<SessionFeedback | null>(null)
  const [nextExercise, setNextExercise] = useState<typeof exercises[0] | null>(null)
  const [latestJoints, setLatestJoints] = useState<JointResult[]>([])

  // AI assistant state
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [input, setInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Seed initial assistant message
  useEffect(() => {
    if (!exercise) return
    setMessages([{
      role: 'assistant',
      content: `I'm watching your form on the ${exercise.name}. Start the camera and begin your reps — I'll give you real-time feedback. You can also ask me anything about this exercise.`,
    }])
  }, [exercise?.id])

  if (!exercise) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[#64748b]">Exercise not found.</p>
      </div>
    )
  }

  const targetReps = exercise.reps
  const totalSets = exercise.sets

  function handleRepComplete(count: number, joints: JointResult[]) {
    setLatestJoints(joints)
    if (count >= targetReps) {
      if (currentSet < totalSets) {
        setCurrentSet((s) => s + 1)
        setRepCount(0)
      } else {
        setSessionComplete(true)
        addHistory({
          exerciseId: exercise.id,
          date: new Date().toISOString().split('T')[0],
          repsCompleted: count,
          setsCompleted: currentSet,
          feedback: 'just_right',
          jointAngles: Object.fromEntries(joints.map((j) => [j.label, j.angle])),
        })
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
  }

  async function sendMessage() {
    if (!input.trim() || aiLoading) return
    const userMsg = input.trim()
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: userMsg }])
    setAiLoading(true)

    const formContext = latestJoints.length > 0
      ? `Current form data: ${latestJoints.map((j) => `${j.label}=${Math.round(j.angle)}° (${j.status})`).join(', ')}.`
      : ''

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...messages,
            { role: 'user', content: userMsg },
          ],
          systemContext: `You are a physical therapy AI assistant helping a patient recover from ${profile.surgeryType} surgery. They are currently doing: ${exercise.name} (${exercise.description}). ${formContext} Instructions: ${exercise.instructions.join(' ')}. Keep responses short, encouraging, and clinically accurate. Never diagnose or replace a real PT.`,
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

  // Auto-send AI form feedback when joints change significantly
  async function askAIAboutForm() {
    if (!latestJoints.length) return
    const issues = latestJoints.filter((j) => j.status !== 'correct')
    if (issues.length === 0) return
    const prompt = `I'm detecting form issues: ${issues.map((j) => `${j.label} at ${Math.round(j.angle)}° — ${j.feedback}`).join('; ')}. What's the most important correction?`
    setInput(prompt)
  }

  const diffColor = difficultyColors[exercise.difficulty]

  return (
    <div className="flex-1 flex h-full overflow-hidden">
      {/* Left — exercise + camera */}
      <div className="flex-1 flex flex-col overflow-y-auto scrollbar-hide p-6 gap-5">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-[#2a2d3e] rounded-lg transition-colors text-[#94a3b8]"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xl">{exercise.icon}</span>
              <h1 className="text-white text-xl font-bold truncate">{exercise.name}</h1>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ color: diffColor, backgroundColor: `${diffColor}20`, border: `1px solid ${diffColor}40` }}
              >
                {difficultyLabels[exercise.difficulty]}
              </span>
            </div>
            <p className="text-[#64748b] text-sm">{exercise.description}</p>
          </div>
        </div>

        {/* Set / rep progress */}
        <div className="flex gap-3">
          <div className="flex-1 bg-[#1a1d27] rounded-xl p-4 border border-[#2a2d3e] text-center">
            <p className="text-[#64748b] text-xs mb-1">Set</p>
            <p className="text-white text-2xl font-bold">
              {currentSet}
              <span className="text-[#64748b] text-base font-normal"> / {totalSets}</span>
            </p>
          </div>
          <div className="flex-1 bg-[#1a1d27] rounded-xl p-4 border border-[#2a2d3e] text-center">
            <p className="text-[#64748b] text-xs mb-1">Reps</p>
            <p className="text-white text-2xl font-bold">
              {repCount}
              <span className="text-[#64748b] text-base font-normal"> / {targetReps}</span>
            </p>
          </div>
          {exercise.holdSeconds > 0 && (
            <div className="flex-1 bg-[#1a1d27] rounded-xl p-4 border border-[#2a2d3e] text-center">
              <p className="text-[#64748b] text-xs mb-1">Hold</p>
              <p className="text-white text-2xl font-bold">
                {exercise.holdSeconds}
                <span className="text-[#64748b] text-base font-normal">s</span>
              </p>
            </div>
          )}
        </div>

        {/* Camera + pose visualization */}
        {!sessionComplete && (
          <PoseCamera
            exercise={exercise}
            targetReps={targetReps}
            onRepComplete={handleRepComplete}
            onFormUpdate={setLatestJoints}
          />
        )}

        {/* Session complete */}
        {sessionComplete && !feedback && (
          <div className="bg-[#1a1d27] rounded-xl p-6 border border-[#2a2d3e] text-center space-y-5">
            <CheckCircle size={48} className="text-[#22c55e] mx-auto" />
            <div>
              <h2 className="text-white text-xl font-bold mb-1">Session Complete!</h2>
              <p className="text-[#64748b] text-sm">
                {totalSets} sets × {targetReps} reps of {exercise.name}
              </p>
            </div>
            <p className="text-[#94a3b8] text-sm">How was the difficulty?</p>
            <div className="flex gap-3 justify-center">
              {[
                { f: 'too_hard' as const, icon: ThumbsDown, label: 'Too Hard', color: '#ef4444' },
                { f: 'just_right' as const, icon: Minus, label: 'Just Right', color: '#22c55e' },
                { f: 'too_easy' as const, icon: ThumbsUp, label: 'Too Easy', color: '#4f8ef7' },
              ].map(({ f, icon: Icon, label, color }) => (
                <button
                  key={f}
                  onClick={() => handleFeedback(f)}
                  className="flex-1 py-3 px-4 rounded-xl border transition-all flex flex-col items-center gap-2 hover:scale-105"
                  style={{ borderColor: `${color}40`, backgroundColor: `${color}10` }}
                >
                  <Icon size={22} style={{ color }} />
                  <span className="text-white text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Post-feedback — next exercise suggestion */}
        {feedback && (
          <div className="bg-[#1a1d27] rounded-xl p-6 border border-[#2a2d3e] space-y-4">
            <h2 className="text-white font-semibold">
              {feedback === 'too_easy'
                ? '💪 Stepping it up!'
                : feedback === 'too_hard'
                ? '👍 Taking it easier — smart recovery.'
                : '✅ Perfect — keeping this level.'}
            </h2>
            {nextExercise && nextExercise.id !== exercise.id && (
              <div className="p-4 rounded-lg bg-[#4f8ef7]/10 border border-[#4f8ef7]/20">
                <p className="text-[#64748b] text-xs mb-1">Recommended next</p>
                <p className="text-white font-medium">
                  {nextExercise.icon} {nextExercise.name}
                </p>
                <p className="text-[#94a3b8] text-xs mt-0.5">{nextExercise.description}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/library')}
                className="flex-1 py-2.5 border border-[#2a2d3e] hover:bg-[#2a2d3e] text-[#94a3b8] rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw size={16} /> Back to Library
              </button>
              {nextExercise && nextExercise.id !== exercise.id && (
                <button
                  onClick={() => navigate(`/exercise/${nextExercise.id}`)}
                  className="flex-1 py-2.5 bg-[#4f8ef7] hover:bg-[#6ba3ff] text-white rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                >
                  Start Next <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-[#1a1d27] rounded-xl p-4 border border-[#2a2d3e]">
          <p className="text-[#94a3b8] text-xs font-medium uppercase tracking-wide mb-3">Instructions</p>
          <ol className="space-y-2">
            {exercise.instructions.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="w-5 h-5 rounded-full bg-[#4f8ef7]/20 text-[#4f8ef7] text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-[#94a3b8]">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Right — AI assistant panel */}
      <div className="w-[340px] flex flex-col border-l border-[#2a2d3e] bg-[#1a1d27]">
        <div className="px-4 py-3 border-b border-[#2a2d3e] flex items-center gap-2">
          <MessageCircle size={16} className="text-[#4f8ef7]" />
          <p className="text-white text-sm font-medium">AI Form Coach</p>
          <div className="ml-auto w-2 h-2 rounded-full bg-[#22c55e]" />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#4f8ef7] text-white rounded-br-sm'
                    : 'bg-[#2a2d3e] text-[#e2e8f0] rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {aiLoading && (
            <div className="flex justify-start">
              <div className="bg-[#2a2d3e] px-3 py-2 rounded-xl rounded-bl-sm">
                <Loader2 size={14} className="text-[#64748b] animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Form check button */}
        {latestJoints.some((j) => j.status !== 'correct') && (
          <div className="px-4 pb-2">
            <button
              onClick={askAIAboutForm}
              className="w-full py-2 text-xs bg-[#f59e0b]/10 border border-[#f59e0b]/30 text-[#f59e0b] rounded-lg hover:bg-[#f59e0b]/20 transition-colors"
            >
              ⚠ Ask AI about my current form issue
            </button>
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-[#2a2d3e] flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask anything…"
            className="flex-1 bg-[#2a2d3e] text-white text-sm rounded-lg px-3 py-2 outline-none placeholder-[#64748b] border border-transparent focus:border-[#4f8ef7] transition-colors"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || aiLoading}
            className="p-2 bg-[#4f8ef7] hover:bg-[#6ba3ff] disabled:opacity-40 text-white rounded-lg transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
