import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Category } from '../data/exercises'

export interface UserProfile {
  name: string
  surgeryType: Category | null
  surgeryDate: string
  therapistInstructions: string
  weeksSinceOp: number
}

export interface DailyCheckin {
  date: string
  painScale: number        // 1–10
  sleepHours: number       // 0–12
  completionPct: number    // 0–100
}

interface UserState {
  profile: UserProfile
  checkins: DailyCheckin[]
  onboardingComplete: boolean
  setProfile: (p: Partial<UserProfile>) => void
  addCheckin: (c: DailyCheckin) => void
  todayCheckin: () => DailyCheckin | null
  completeOnboarding: () => void
  reset: () => void
}

const defaultProfile: UserProfile = {
  name: '',
  surgeryType: null,
  surgeryDate: '',
  therapistInstructions: '',
  weeksSinceOp: 0,
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: defaultProfile,
      checkins: [],
      onboardingComplete: false,
      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      addCheckin: (c) =>
        set((s) => ({
          checkins: [
            ...s.checkins.filter((x) => x.date !== c.date),
            c,
          ],
        })),
      todayCheckin: () => {
        const today = new Date().toISOString().split('T')[0]
        return get().checkins.find((c) => c.date === today) ?? null
      },
      completeOnboarding: () => set({ onboardingComplete: true }),
      reset: () =>
        set({ profile: defaultProfile, checkins: [], onboardingComplete: false }),
    }),
    { name: 'pt-user' }
  )
)
