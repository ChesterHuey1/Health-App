import { exercises, type Difficulty, type Category } from '../data/exercises'
import type { DailyCheckin } from '../store/userStore'
import type {
  WorkoutSession,
  ScheduledExercise,
  SessionFeedback,
} from '../store/scheduleStore'

// Returns exercises for a given category sorted by difficulty
function exercisesForCategory(cat: Category) {
  return exercises
    .filter((e) => e.category === cat || e.relatedCategories.includes(cat))
    .sort((a, b) => a.difficulty - b.difficulty)
}

// Clamp difficulty to 1–5
function clamp(d: number): Difficulty {
  return Math.min(5, Math.max(1, Math.round(d))) as Difficulty
}

// Adjust difficulty based on feedback + daily checkin signals
export function adjustDifficulty(
  current: Difficulty,
  feedback: SessionFeedback,
  checkin: DailyCheckin | null
): Difficulty {
  let delta = 0

  if (feedback === 'too_easy') delta += 1
  if (feedback === 'too_hard') delta -= 1

  if (checkin) {
    if (checkin.painScale > 7) delta -= 1
    if (checkin.sleepHours < 5) delta -= 0.5
    if (checkin.completionPct < 70) delta -= 0.5
    if (
      checkin.painScale <= 4 &&
      checkin.sleepHours >= 7 &&
      checkin.completionPct >= 90
    ) {
      delta += 0.5
    }
  }

  return clamp(current + delta)
}

// Pick the best exercise for a category at a target difficulty
export function pickExercise(cat: Category, targetDifficulty: Difficulty) {
  const pool = exercisesForCategory(cat)
  // Find closest difficulty
  return pool.reduce((best, ex) => {
    const bestDelta = Math.abs(best.difficulty - targetDifficulty)
    const exDelta = Math.abs(ex.difficulty - targetDifficulty)
    return exDelta < bestDelta ? ex : best
  })
}

// Generate a 7-day plan for a given surgery category
export function generateWeeklyPlan(
  cat: Category,
  startDifficulty: Difficulty = 1
): WorkoutSession[] {
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  // Rest days on Wed and Sun (indices 2, 6)
  const restDays = new Set([2, 6])
  const today = new Date()
  // Start from last Monday
  const dow = today.getDay()
  const diffToMon = (dow + 6) % 7
  const monday = new Date(today)
  monday.setDate(today.getDate() - diffToMon)

  const pool = exercisesForCategory(cat)
  const sessions: WorkoutSession[] = []
  let difficulty = startDifficulty

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]

    if (restDays.has(i)) {
      sessions.push({
        id: `${dateStr}-rest`,
        date: dateStr,
        exercises: [],
        completed: false,
        notes: `${dayNames[i]} — Rest / Light Walking`,
      })
      continue
    }

    // Pick 4–5 exercises around the target difficulty
    const selected = pool
      .filter((e) => Math.abs(e.difficulty - difficulty) <= 1)
      .slice(0, 5)
      .map((e): ScheduledExercise => ({
        exerciseId: e.id,
        sets: e.sets,
        reps: e.reps,
        difficultyOverride: e.difficulty as Difficulty,
      }))

    sessions.push({
      id: `${dateStr}-${cat}`,
      date: dateStr,
      exercises: selected,
      completed: false,
    })
  }

  return sessions
}

// After session feedback, return updated difficulty for an exercise
export function getNextExercise(
  exerciseId: string,
  feedback: SessionFeedback,
  checkin: DailyCheckin | null
) {
  const current = exercises.find((e) => e.id === exerciseId)
  if (!current) return null

  const newDifficulty = adjustDifficulty(current.difficulty as Difficulty, feedback, checkin)

  if (feedback === 'too_easy' && current.progressesTo.length > 0) {
    const next = exercises.find((e) => e.id === current.progressesTo[0])
    if (next) return next
  }
  if (feedback === 'too_hard' && current.regressesTo.length > 0) {
    const prev = exercises.find((e) => e.id === current.regressesTo[0])
    if (prev) return prev
  }

  // Fall back to difficulty-matched exercise in same category
  return pickExercise(current.category, newDifficulty)
}
