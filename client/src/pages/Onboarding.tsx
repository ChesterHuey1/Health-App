import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useUserStore } from '../store/userStore'
import { useScheduleStore } from '../store/scheduleStore'
import { generateWeeklyPlan } from '../lib/scheduler'
import { categoryLabels, type Category } from '../data/exercises'

const SURGERY_OPTIONS: { value: Category; label: string }[] = [
  { value: 'knee', label: 'Knee' },
  { value: 'hip', label: 'Hip' },
  { value: 'shoulder', label: 'Shoulder' },
  { value: 'spine', label: 'Spine / Back' },
  { value: 'acl', label: 'ACL / Knee Ligament' },
  { value: 'ankle', label: 'Ankle / Foot' },
]

const FEATURES = [
  'Auto-generated PT schedule',
  'AI-guided exercise library',
  'Daily adaptive check-ins',
  'Progress tracking & analytics',
]

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={16} height={16}>
      <path d="M5 12l5 5L19 7" stroke="rgba(255,255,255,0.65)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function TargetIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={22} height={22}>
      <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.8"/>
      <circle cx="12" cy="12" r="5" stroke="white" strokeWidth="1.8"/>
      <circle cx="12" cy="12" r="1" fill="white"/>
    </svg>
  )
}

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

  const canProceed0 = name.trim().length > 0
  const canProceed1 = !!surgeryType

  return (
    <div
      className="flex-1 flex items-center justify-center overflow-y-auto"
      style={{ background: '#0F1E2B', padding: 40 }}
    >
      <div
        className="w-full flex overflow-hidden"
        style={{ maxWidth: 860, minHeight: 540, borderRadius: 20, background: '#fff' }}
      >
        {/* Left panel */}
        <div
          className="flex flex-col"
          style={{ width: 320, flexShrink: 0, background: '#1A3D5C', padding: '44px 36px' }}
        >
          <div>
            <div
              style={{
                width: 44, height: 44, background: '#1A7FA8',
                borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <TargetIcon />
            </div>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Recover</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
              The PT experience, all in one, in your hands.
            </p>
          </div>

          <div className="mt-10 space-y-4">
            {FEATURES.map((feat) => (
              <div key={feat} className="flex items-center gap-3">
                <CheckIcon />
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{feat}</p>
              </div>
            ))}
          </div>

          {/* Progress dots */}
          <div className="mt-auto flex gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: 4, borderRadius: 99, transition: 'all 0.3s',
                  width: i === step ? 24 : 12,
                  background: i <= step ? '#1A7FA8' : 'rgba(255,255,255,0.2)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div
          className="flex-1 flex flex-col overflow-y-auto fade-in"
          style={{ padding: '44px 40px' }}
        >
          {/* Step 0 — Name */}
          {step === 0 && (
            <div className="flex flex-col gap-6 h-full">
              <div>
                <p style={{ fontSize: 20, fontWeight: 700, color: '#0F1E2B', marginBottom: 8 }}>Get started</p>
                <p style={{ fontSize: 13, color: '#7A909F' }}>
                  Let's personalize your physical therapy plan. This takes about 2 minutes.
                </p>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#5A7080', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                  Your name
                </p>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full outline-none transition-colors"
                  style={{
                    background: '#F4F6F8', border: '1.5px solid #E2E8ED', borderRadius: 9,
                    padding: '11px 13px', fontSize: 14, color: '#0F1E2B', fontFamily: 'DM Sans, sans-serif',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#1A7FA8')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#E2E8ED')}
                  onKeyDown={(e) => e.key === 'Enter' && canProceed0 && setStep(1)}
                />
              </div>
              <button
                onClick={() => setStep(1)}
                disabled={!canProceed0}
                className="w-full font-semibold text-white transition-colors"
                style={{
                  padding: '11px 20px', borderRadius: 9, fontSize: 14, border: 'none',
                  background: canProceed0 ? '#1A3D5C' : '#E2E8ED',
                  color: canProceed0 ? '#fff' : '#9BAAB6',
                  cursor: canProceed0 ? 'pointer' : 'not-allowed',
                }}
              >
                Continue →
              </button>
            </div>
          )}

          {/* Step 1 — Surgery type */}
          {step === 1 && (
            <div className="flex flex-col gap-6 h-full">
              <div>
                <p style={{ fontSize: 20, fontWeight: 700, color: '#0F1E2B', marginBottom: 8 }}>What surgery did you have?</p>
                <p style={{ fontSize: 13, color: '#7A909F' }}>Select the area that needs the most attention.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {SURGERY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSurgeryType(opt.value)}
                    className="px-4 py-2 rounded-full text-[13px] font-semibold transition-all"
                    style={{
                      border: `1.5px solid ${surgeryType === opt.value ? '#1A3D5C' : '#E2E8ED'}`,
                      background: surgeryType === opt.value ? '#1A3D5C' : '#fff',
                      color: surgeryType === opt.value ? '#fff' : '#0F1E2B',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="mt-auto flex gap-3">
                <button
                  onClick={() => setStep(0)}
                  className="flex-1 font-semibold transition-colors"
                  style={{ padding: '11px 20px', borderRadius: 9, fontSize: 14, border: 'none', background: '#F0F3F6', color: '#1A3D5C', cursor: 'pointer' }}
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!canProceed1}
                  className="flex-1 font-semibold text-white transition-colors"
                  style={{
                    padding: '11px 20px', borderRadius: 9, fontSize: 14, border: 'none',
                    background: canProceed1 ? '#1A3D5C' : '#E2E8ED',
                    color: canProceed1 ? '#fff' : '#9BAAB6',
                    cursor: canProceed1 ? 'pointer' : 'not-allowed',
                  }}
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Details */}
          {step === 2 && (
            <div className="flex flex-col gap-6 h-full">
              <div>
                <p style={{ fontSize: 20, fontWeight: 700, color: '#0F1E2B', marginBottom: 8 }}>A few more details</p>
                <p style={{ fontSize: 13, color: '#7A909F' }}>These help us start you at the right intensity.</p>
              </div>

              <div className="p-4 rounded-[12px]" style={{ background: '#D6F0F5' }}>
                <p style={{ fontSize: 12, color: '#0E7490' }}>
                  Your plan will be automatically adjusted based on your daily check-ins and feedback.
                </p>
              </div>

              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#5A7080', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                  Surgery or injury date
                </p>
                <input
                  type="date"
                  value={surgeryDate}
                  onChange={(e) => setSurgeryDate(e.target.value)}
                  className="w-full outline-none transition-colors"
                  style={{
                    background: '#F4F6F8', border: '1.5px solid #E2E8ED', borderRadius: 9,
                    padding: '11px 13px', fontSize: 14, color: '#0F1E2B', fontFamily: 'DM Sans, sans-serif',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#1A7FA8')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#E2E8ED')}
                />
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#5A7080', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                  Therapist instructions <span style={{ textTransform: 'none', fontWeight: 400, color: '#9BAAB6' }}>(optional)</span>
                </p>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. No weight-bearing for 6 weeks, focus on ROM, avoid deep flexion past 90°…"
                  rows={4}
                  className="w-full outline-none transition-colors resize-none"
                  style={{
                    background: '#F4F6F8', border: '1.5px solid #E2E8ED', borderRadius: 9,
                    padding: '11px 13px', fontSize: 14, color: '#0F1E2B', fontFamily: 'DM Sans, sans-serif',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#1A7FA8')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#E2E8ED')}
                />
              </div>
              <div className="mt-auto flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 font-semibold transition-colors"
                  style={{ padding: '11px 20px', borderRadius: 9, fontSize: 14, border: 'none', background: '#F0F3F6', color: '#1A3D5C', cursor: 'pointer' }}
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 font-semibold text-white transition-colors"
                  style={{ padding: '11px 20px', borderRadius: 9, fontSize: 14, border: 'none', background: '#1A3D5C', cursor: 'pointer' }}
                >
                  Review Plan →
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Confirmation */}
          {step === 3 && (
            <div className="flex flex-col gap-6 h-full">
              <div className="text-center">
                <div
                  className="mx-auto flex items-center justify-center mb-6"
                  style={{ width: 72, height: 72, background: '#D4EDDA', borderRadius: 20 }}
                >
                  <svg viewBox="0 0 24 24" fill="none" width={36} height={36}>
                    <path d="M5 12l5 5L19 7" stroke="#27A060" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p style={{ fontSize: 22, fontWeight: 700, color: '#0F1E2B', marginBottom: 8 }}>Your plan is ready!</p>
                <p style={{ fontSize: 13, color: '#7A909F' }}>Here's a summary of your personalized PT program.</p>
              </div>

              <div className="rounded-[12px] border border-[#E2E8ED] divide-y divide-[#E2E8ED]">
                {[
                  { label: 'Recovery area', value: surgeryType ? categoryLabels[surgeryType] : '—' },
                  { label: 'Program length', value: '8 weeks' },
                  { label: 'Sessions / week', value: '5 days' },
                  { label: 'Starting phase', value: 'Phase 1: Mobility' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between px-5 py-4">
                    <p style={{ fontSize: 13, color: '#7A909F' }}>{label}</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#0F1E2B' }}>{value}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={finish}
                disabled={loading}
                className="w-full font-semibold text-white flex items-center justify-center gap-2 transition-colors"
                style={{ padding: '11px 20px', borderRadius: 9, fontSize: 14, border: 'none', background: '#1A3D5C', cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Building your plan…
                  </>
                ) : (
                  'Start My Recovery →'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
