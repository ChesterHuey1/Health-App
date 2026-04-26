import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, ChevronRight, Loader2 } from 'lucide-react'
import { useUserStore } from '../store/userStore'
import { useScheduleStore } from '../store/scheduleStore'
import { generateWeeklyPlan } from '../lib/scheduler'
import { categoryLabels, type Category } from '../data/exercises'

const surgeryOptions: { value: Category; label: string; desc: string; emoji: string }[] = [
  { value: 'knee', label: 'Knee', desc: 'Total/partial knee replacement, meniscus repair', emoji: '🦵' },
  { value: 'hip', label: 'Hip', desc: 'Total/partial hip replacement, labrum repair', emoji: '🦴' },
  { value: 'shoulder', label: 'Shoulder', desc: 'Rotator cuff repair, shoulder replacement', emoji: '💪' },
  { value: 'spine', label: 'Spine / Back', desc: 'Lumbar fusion, discectomy, laminectomy', emoji: '🏥' },
  { value: 'acl', label: 'ACL / Knee Ligament', desc: 'ACL, PCL, or ligament reconstruction', emoji: '⚡' },
  { value: 'ankle', label: 'Ankle / Foot', desc: 'Ankle reconstruction, Achilles repair', emoji: '🦶' },
]

export function Onboarding() {
  const navigate = useNavigate()
  const { setProfile, completeOnboarding } = useUserStore()
  const { setPlan } = useScheduleStore()

  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [surgeryType, setSurgeryType] = useState<Category | null>(null)
  const [surgeryDate, setSurgeryDate] = useState('')
  const [instructions, setInstructions] = useState('')
  const [loading, setLoading] = useState(false)

  async function finish() {
    if (!surgeryType) return
    setLoading(true)
    setProfile({ name, surgeryType, surgeryDate, therapistInstructions: instructions })
    const plan = generateWeeklyPlan(surgeryType, 1)
    setPlan(plan)
    completeOnboarding()
    setTimeout(() => navigate('/dashboard'), 400)
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-[#0f1117] overflow-y-auto">
      <div className="w-full max-w-xl px-6 py-12">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-[#4f8ef7] flex items-center justify-center">
            <Heart size={20} fill="white" color="white" />
          </div>
          <div>
            <p className="text-white font-bold text-xl leading-tight">RecoverPT</p>
            <p className="text-[#64748b] text-sm">The PT experience, all-in-one</p>
          </div>
        </div>

        {/* Step 0 — Name */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-white text-3xl font-bold mb-2">Welcome to your recovery.</h1>
              <p className="text-[#64748b]">
                Let's personalize your physical therapy plan. This takes about 2 minutes.
              </p>
            </div>
            <div>
              <label className="block text-[#94a3b8] text-sm mb-2">Your name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex"
                className="w-full bg-[#1a1d27] border border-[#2a2d3e] text-white rounded-lg px-4 py-3 outline-none focus:border-[#4f8ef7] transition-colors placeholder-[#64748b]"
              />
            </div>
            <button
              onClick={() => setStep(1)}
              disabled={!name.trim()}
              className="w-full py-3 bg-[#4f8ef7] hover:bg-[#6ba3ff] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              Continue <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Step 1 — Surgery type */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-white text-2xl font-bold mb-2">What surgery did you have?</h1>
              <p className="text-[#64748b] text-sm">
                Or select the area that needs the most attention.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {surgeryOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSurgeryType(opt.value)}
                  className={`text-left p-4 rounded-xl border transition-all ${
                    surgeryType === opt.value
                      ? 'border-[#4f8ef7] bg-[#4f8ef7]/10'
                      : 'border-[#2a2d3e] bg-[#1a1d27] hover:border-[#4f8ef7]/50'
                  }`}
                >
                  <p className="text-2xl mb-1">{opt.emoji}</p>
                  <p className="text-white font-medium text-sm">{opt.label}</p>
                  <p className="text-[#64748b] text-xs mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!surgeryType}
              className="w-full py-3 bg-[#4f8ef7] hover:bg-[#6ba3ff] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              Continue <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Step 2 — Surgery date + therapist notes */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-white text-2xl font-bold mb-2">A few more details</h1>
              <p className="text-[#64748b] text-sm">
                These help us start you at the right intensity.
              </p>
            </div>
            <div>
              <label className="block text-[#94a3b8] text-sm mb-2">Surgery or injury date</label>
              <input
                type="date"
                value={surgeryDate}
                onChange={(e) => setSurgeryDate(e.target.value)}
                className="w-full bg-[#1a1d27] border border-[#2a2d3e] text-white rounded-lg px-4 py-3 outline-none focus:border-[#4f8ef7] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[#94a3b8] text-sm mb-2">
                Therapist instructions{' '}
                <span className="text-[#64748b]">(optional)</span>
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. No weight-bearing for 6 weeks, focus on ROM, avoid deep flexion past 90°…"
                rows={4}
                className="w-full bg-[#1a1d27] border border-[#2a2d3e] text-white rounded-lg px-4 py-3 outline-none focus:border-[#4f8ef7] transition-colors placeholder-[#64748b] resize-none"
              />
            </div>
            <button
              onClick={finish}
              disabled={loading}
              className="w-full py-3 bg-[#4f8ef7] hover:bg-[#6ba3ff] disabled:opacity-40 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Building your plan…
                </>
              ) : (
                <>
                  Build My PT Plan <ChevronRight size={18} />
                </>
              )}
            </button>
          </div>
        )}

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-6 bg-[#4f8ef7]' : i < step ? 'w-3 bg-[#4f8ef7]/50' : 'w-3 bg-[#2a2d3e]'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
