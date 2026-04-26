import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Difficulty } from '../data/exercises'

export type SessionFeedback = 'too_easy' | 'just_right' | 'too_hard'

export interface ScheduledExercise {
  exerciseId: string
  sets: number
  reps: number
  // override difficulty level for this scheduled instance
  difficultyOverride: Difficulty
}

export interface WorkoutSession {
  id: string
  date: string
  exercises: ScheduledExercise[]
  completed: boolean
  feedback?: SessionFeedback
  painScale?: number
  completionPct?: number
  notes?: string
}

export interface ExerciseHistory {
  exerciseId: string
  date: string
  repsCompleted: number
  setsCompleted: number
  feedback: SessionFeedback
  jointAngles: Record<string, number>
  aiFormFeedback?: string
  userNotes?: string
}

interface ScheduleState {
  plan: WorkoutSession[]
  history: ExerciseHistory[]
  // per-exercise difficulty overrides (dynamic adjustment)
  difficultyMap: Record<string, Difficulty>
  setPlan: (plan: WorkoutSession[]) => void
  addSession: (session: WorkoutSession) => void
  completeSession: (id: string, feedback: SessionFeedback, completionPct: number) => void
  addHistory: (entry: ExerciseHistory) => void
  setDifficulty: (exerciseId: string, d: Difficulty) => void
  getDifficulty: (exerciseId: string, base: Difficulty) => Difficulty
  todaySession: () => WorkoutSession | null
}

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set, get) => ({
      plan: [],
      history: [],
      difficultyMap: {},
      setPlan: (plan) => set({ plan }),
      addSession: (session) =>
        set((s) => ({ plan: [...s.plan, session] })),
      completeSession: (id, feedback, completionPct) =>
        set((s) => ({
          plan: s.plan.map((sess) =>
            sess.id === id
              ? { ...sess, completed: true, feedback, completionPct }
              : sess
          ),
        })),
      addHistory: (entry) =>
        set((s) => ({ history: [...s.history, entry] })),
      setDifficulty: (exerciseId, d) =>
        set((s) => ({
          difficultyMap: { ...s.difficultyMap, [exerciseId]: d },
        })),
      getDifficulty: (exerciseId, base) =>
        get().difficultyMap[exerciseId] ?? base,
      todaySession: () => {
        const today = new Date().toISOString().split('T')[0]
        return get().plan.find((s) => s.date === today) ?? null
      },
    }),
    { name: 'pt-schedule' }
  )
)
