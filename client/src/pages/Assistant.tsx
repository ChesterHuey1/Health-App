import { useState, useRef, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { useUserStore } from '../store/userStore'
import { useScheduleStore } from '../store/scheduleStore'
import { exercises, categoryLabels } from '../data/exercises'
import { Topbar } from '../components/layout/Topbar'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const QUICK_PROMPTS = [
  'Why does my knee still feel stiff after sessions?',
  'How long does PT usually take after surgery?',
  'My pain increased today — should I still do PT?',
  'What exercises should I focus on this week?',
  "I'm not seeing progress — what should I change?",
  'Is it normal to feel sore after PT?',
]

export function Assistant() {
  const { profile, checkins } = useUserStore()
  const { history, plan } = useScheduleStore()

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi${profile.name ? ` ${profile.name}` : ''}! I'm your PT recovery assistant. I have access to your exercise history and daily check-ins, so I can give you personalized guidance.\n\nWhat's on your mind today?`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function buildSystemContext() {
    const recentCheckins = checkins.slice(-7)
    const recentHistory = history.slice(-20)
    const exerciseNames = recentHistory
      .map((h) => exercises.find((e) => e.id === h.exerciseId)?.name)
      .filter(Boolean)

    const todayStr = new Date().toISOString().split('T')[0]
    const todaySession = plan.find((s) => s.date === todayStr)
    const todayExerciseNames = (todaySession?.exercises ?? [])
      .map((se) => exercises.find((e) => e.id === se.exerciseId)?.name)
      .filter(Boolean)

    return `You are a warm, knowledgeable physical therapy assistant.

Patient profile:
- Name: ${profile.name || 'Patient'}
- Surgery type: ${profile.surgeryType ? categoryLabels[profile.surgeryType] : 'Not specified'}
- Surgery date: ${profile.surgeryDate || 'Not specified'}
- Therapist instructions: ${profile.therapistInstructions || 'None on file'}

Recent activity:
- Exercises completed recently: ${exerciseNames.join(', ') || 'None yet'}
- Today's planned exercises: ${todayExerciseNames.join(', ') || 'None scheduled'}
- Recent check-ins (pain, sleep, completion%): ${recentCheckins
      .map((c) => `${c.date}: pain=${c.painScale}, sleep=${c.sleepHours}h, completion=${c.completionPct}%`)
      .join(' | ') || 'None recorded'}

Instructions:
- Be supportive, encouraging, and clinically accurate
- Keep responses concise (2–4 sentences unless a detailed explanation is needed)
- Never diagnose medical conditions or replace a licensed PT
- If pain is severe or unusual, always recommend contacting their healthcare provider
- Use the patient's history to personalize your response`
  }

  async function send(text?: string) {
    const userText = (text ?? input).trim()
    if (!userText || loading) return
    setInput('')
    const newMessages: Message[] = [...messages, { role: 'user', content: userText }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          systemContext: buildSystemContext(),
        }),
      })
      const data = await res.json()
      setMessages((m) => [...m, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Connection error. Please check that the server is running.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar
        title="AI PT Assistant"
        subtitle="Personalized to your recovery · Powered by DeepSeek"
        actions={
          <div className="flex items-center gap-1.5">
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#27A060' }} />
            <p style={{ fontSize: 12, fontWeight: 600, color: '#27A060' }}>Online</p>
          </div>
        }
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-[24px_28px] space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div
                className="flex-shrink-0 mt-0.5 mr-2.5"
                style={{ width: 30, height: 30, borderRadius: '50%', background: '#D6F0F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg viewBox="0 0 24 24" fill="none" width={14} height={14}>
                  <circle cx="12" cy="12" r="9" stroke="#1A7FA8" strokeWidth="1.8"/>
                  <circle cx="12" cy="12" r="5" stroke="#1A7FA8" strokeWidth="1.8"/>
                  <circle cx="12" cy="12" r="1" fill="#1A7FA8"/>
                </svg>
              </div>
            )}
            <div
              className="max-w-[70%] px-4 py-3 rounded-[16px] text-[13px] leading-relaxed whitespace-pre-wrap"
              style={
                msg.role === 'user'
                  ? { background: '#1A3D5C', color: '#fff', borderBottomRightRadius: 4 }
                  : { background: '#fff', color: '#0F1E2B', borderBottomLeftRadius: 4, border: '1px solid #E2E8ED' }
              }
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div
              className="flex-shrink-0 mt-0.5 mr-2.5"
              style={{ width: 30, height: 30, borderRadius: '50%', background: '#D6F0F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg viewBox="0 0 24 24" fill="none" width={14} height={14}>
                <circle cx="12" cy="12" r="9" stroke="#1A7FA8" strokeWidth="1.8"/>
                <circle cx="12" cy="12" r="5" stroke="#1A7FA8" strokeWidth="1.8"/>
                <circle cx="12" cy="12" r="1" fill="#1A7FA8"/>
              </svg>
            </div>
            <div className="px-4 py-3 rounded-[16px] rounded-bl-sm" style={{ background: '#fff', border: '1px solid #E2E8ED' }}>
              <Loader2 size={16} style={{ color: '#9BAAB6' }} className="animate-spin" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <div className="px-7 pb-3">
          <p style={{ fontSize: 11, fontWeight: 600, color: '#7A909F', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
            Common questions
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                className="text-[12px] font-medium transition-all cursor-pointer"
                style={{
                  padding: '6px 12px', borderRadius: 99,
                  border: '1.5px solid #E2E8ED', background: '#fff', color: '#5A7080',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#1A7FA8'; e.currentTarget.style.color = '#1A7FA8' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8ED'; e.currentTarget.style.color = '#5A7080' }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-7 pb-6 pt-3" style={{ borderTop: '1px solid #E2E8ED', background: '#fff' }}>
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Ask about your recovery, exercises, pain…"
            className="flex-1 outline-none text-[14px] transition-colors"
            style={{
              background: '#F4F6F8', border: '1.5px solid #E2E8ED',
              borderRadius: 9, padding: '11px 14px',
              color: '#0F1E2B', fontFamily: 'DM Sans, sans-serif',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#1A7FA8')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#E2E8ED')}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="flex items-center justify-center rounded-[9px] transition-colors cursor-pointer disabled:opacity-40"
            style={{ width: 46, background: '#1A3D5C', border: 'none', flexShrink: 0 }}
          >
            <Send size={16} style={{ color: '#fff' }} />
          </button>
        </div>
        <p style={{ fontSize: 11, color: '#9BAAB6', textAlign: 'center', marginTop: 8 }}>
          AI guidance only — always follow your licensed PT's instructions.
        </p>
      </div>
    </div>
  )
}
