import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, MessageCircle, Sparkles } from 'lucide-react'
import { useUserStore } from '../store/userStore'
import { useScheduleStore } from '../store/scheduleStore'
import { exercises, categoryLabels } from '../data/exercises'

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
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#2a2d3e] flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#4f8ef7]/20 flex items-center justify-center">
          <Sparkles size={18} className="text-[#4f8ef7]" />
        </div>
        <div>
          <h1 className="text-white font-semibold">AI PT Assistant</h1>
          <p className="text-[#64748b] text-xs">Powered by DeepSeek · Personalized to your recovery</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
          <p className="text-[#22c55e] text-xs">Online</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-[#4f8ef7]/20 flex items-center justify-center flex-shrink-0 mt-0.5 mr-2">
                <MessageCircle size={14} className="text-[#4f8ef7]" />
              </div>
            )}
            <div
              className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-[#4f8ef7] text-white rounded-br-sm'
                  : 'bg-[#1a1d27] border border-[#2a2d3e] text-[#e2e8f0] rounded-bl-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-[#4f8ef7]/20 flex items-center justify-center flex-shrink-0 mt-0.5 mr-2">
              <MessageCircle size={14} className="text-[#4f8ef7]" />
            </div>
            <div className="bg-[#1a1d27] border border-[#2a2d3e] px-4 py-3 rounded-2xl rounded-bl-sm">
              <Loader2 size={16} className="text-[#64748b] animate-spin" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <div className="px-6 pb-3">
          <p className="text-[#64748b] text-xs mb-2">Common questions</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                className="text-xs px-3 py-1.5 bg-[#1a1d27] border border-[#2a2d3e] text-[#94a3b8] rounded-lg hover:border-[#4f8ef7]/40 hover:text-white transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-6 pb-6 pt-3 border-t border-[#2a2d3e]">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Ask about your recovery, exercises, pain…"
            className="flex-1 bg-[#1a1d27] border border-[#2a2d3e] text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-[#4f8ef7] transition-colors placeholder-[#64748b]"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="px-4 py-3 bg-[#4f8ef7] hover:bg-[#6ba3ff] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-[#64748b] text-xs mt-2 text-center">
          AI guidance only — always follow your licensed PT's instructions.
        </p>
      </div>
    </div>
  )
}
