import type { NormalizedLandmark } from '@mediapipe/tasks-vision'
import type { PoseRule } from '../data/exercises'

// Compute angle at vertex B given three 2D points A, B, C
export function angleBetween(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number }
): number {
  const abx = a.x - b.x
  const aby = a.y - b.y
  const cbx = c.x - b.x
  const cby = c.y - b.y

  const dot = abx * cbx + aby * cby
  const magAB = Math.sqrt(abx * abx + aby * aby)
  const magCB = Math.sqrt(cbx * cbx + cby * cby)

  if (magAB === 0 || magCB === 0) return 0
  const cosAngle = Math.max(-1, Math.min(1, dot / (magAB * magCB)))
  return (Math.acos(cosAngle) * 180) / Math.PI
}

export interface JointResult {
  label: string
  angle: number
  status: 'correct' | 'too_low' | 'too_high'
  feedback: string
  landmarks: [number, number, number]
}

// Evaluate all pose rules for an exercise against detected landmarks
export function evaluatePoseRules(
  rules: PoseRule[],
  landmarks: NormalizedLandmark[]
): JointResult[] {
  return rules.map((rule) => {
    const [ai, bi, ci] = rule.landmarks
    const a = landmarks[ai]
    const b = landmarks[bi]
    const c = landmarks[ci]

    if (!a || !b || !c) {
      return {
        label: rule.label,
        angle: 0,
        status: 'correct' as const,
        feedback: 'Position not fully visible',
        landmarks: rule.landmarks,
      }
    }

    const angle = angleBetween(a, b, c)

    let status: 'correct' | 'too_low' | 'too_high'
    let feedback: string

    if (angle < rule.minAngle) {
      status = 'too_low'
      feedback = rule.feedbackLow
    } else if (angle > rule.maxAngle) {
      status = 'too_high'
      feedback = rule.feedbackHigh
    } else {
      status = 'correct'
      feedback = rule.feedbackCorrect
    }

    return { label: rule.label, angle, status, feedback, landmarks: rule.landmarks }
  })
}

// Skeleton connections to draw (MediaPipe Pose landmark pairs)
export const SKELETON_CONNECTIONS: [number, number][] = [
  // Face
  [0, 1], [1, 2], [2, 3], [3, 7],
  [0, 4], [4, 5], [5, 6], [6, 8],
  // Torso
  [11, 12], [11, 23], [12, 24], [23, 24],
  // Left arm
  [11, 13], [13, 15],
  // Right arm
  [12, 14], [14, 16],
  // Left leg
  [23, 25], [25, 27], [27, 29], [29, 31],
  // Right leg
  [24, 26], [26, 28], [28, 30], [30, 32],
]

// Rep counter — tracks angle threshold crossings
export class RepCounter {
  private count = 0
  private lastState: 'above' | 'below' | null = null

  constructor(
    private threshold: number,
    private direction: 'above' | 'below'
  ) {}

  update(angle: number): boolean {
    const state: 'above' | 'below' = angle >= this.threshold ? 'above' : 'below'
    let fired = false

    if (this.lastState !== null && this.lastState !== state) {
      if (state === this.direction) {
        this.count++
        fired = true
      }
    }

    this.lastState = state
    return fired
  }

  getCount() {
    return this.count
  }

  reset() {
    this.count = 0
    this.lastState = null
  }
}

// Draw the skeleton + joint indicators on a canvas
export function drawPose(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  jointResults: JointResult[],
  width: number,
  height: number
) {
  const lm = (i: number) => ({
    x: landmarks[i].x * width,
    y: landmarks[i].y * height,
  })

  // Build a map of highlighted vertices from joint results
  const vertexColors = new Map<number, string>()
  for (const r of jointResults) {
    const color =
      r.status === 'correct'
        ? '#22c55e'
        : r.status === 'too_low'
        ? '#ef4444'
        : '#f59e0b'
    vertexColors.set(r.landmarks[1], color)
  }

  // Draw skeleton lines
  ctx.lineWidth = 3
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'
  for (const [a, b] of SKELETON_CONNECTIONS) {
    if (!landmarks[a] || !landmarks[b]) continue
    const pa = lm(a)
    const pb = lm(b)
    ctx.beginPath()
    ctx.moveTo(pa.x, pa.y)
    ctx.lineTo(pb.x, pb.y)
    ctx.stroke()
  }

  // Draw all landmark dots
  for (let i = 0; i < landmarks.length; i++) {
    const lmk = landmarks[i]
    if (!lmk || lmk.visibility !== undefined && lmk.visibility < 0.3) continue
    const color = vertexColors.get(i) ?? 'rgba(255,255,255,0.7)'
    const radius = vertexColors.has(i) ? 8 : 4
    ctx.beginPath()
    ctx.arc(lmk.x * width, lmk.y * height, radius, 0, 2 * Math.PI)
    ctx.fillStyle = color
    ctx.fill()
    if (vertexColors.has(i)) {
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 2
      ctx.stroke()
    }
  }

  // Draw angle labels on tracked joints
  ctx.font = 'bold 13px Inter, system-ui, sans-serif'
  for (const r of jointResults) {
    const b = landmarks[r.landmarks[1]]
    if (!b) continue
    const color =
      r.status === 'correct'
        ? '#22c55e'
        : r.status === 'too_low'
        ? '#ef4444'
        : '#f59e0b'
    ctx.fillStyle = color
    ctx.fillText(`${r.label}: ${Math.round(r.angle)}°`, b.x * width + 10, b.y * height - 6)
  }
}
