import { useEffect, useRef, useState, useCallback } from 'react'
import {
  PoseLandmarker,
  FilesetResolver,
  type PoseLandmarkerResult,
} from '@mediapipe/tasks-vision'
import type { Exercise } from '../../data/exercises'
import {
  evaluatePoseRules,
  drawPose,
  RepCounter,
  type JointResult,
} from '../../lib/poseAnalysis'
import { Camera, AlertCircle, Loader2 } from 'lucide-react'

interface Props {
  exercise: Exercise
  onRepComplete?: (count: number, jointResults: JointResult[]) => void
  onFormUpdate?: (results: JointResult[]) => void
  targetReps: number
}

type ModelState = 'loading' | 'ready' | 'error' | 'no-camera'

export function PoseCamera({ exercise, onRepComplete, onFormUpdate, targetReps }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const landmarkerRef = useRef<PoseLandmarker | null>(null)
  const animFrameRef = useRef<number>(0)
  const repCountersRef = useRef<RepCounter[]>([])
  const repCountRef = useRef(0)

  const [modelState, setModelState] = useState<ModelState>('loading')
  const [repCount, setRepCount] = useState(0)
  const [jointResults, setJointResults] = useState<JointResult[]>([])
  const [cameraActive, setCameraActive] = useState(false)

  // Initialize rep counters when exercise changes
  useEffect(() => {
    repCountRef.current = 0
    setRepCount(0)
    repCountersRef.current = exercise.poseRules.map(
      (rule) => new RepCounter(rule.repTriggerAngle, rule.repDirection)
    )
  }, [exercise.id])

  // Load MediaPipe model
  useEffect(() => {
    let cancelled = false

    async function loadModel() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        )
        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
        })
        if (!cancelled) {
          landmarkerRef.current = landmarker
          setModelState('ready')
        }
      } catch {
        if (!cancelled) setModelState('error')
      }
    }

    loadModel()
    return () => {
      cancelled = true
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  const processFrame = useCallback(
    (result: PoseLandmarkerResult) => {
      const canvas = canvasRef.current
      const video = videoRef.current
      if (!canvas || !video) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const w = canvas.width
      const h = canvas.height

      ctx.clearRect(0, 0, w, h)
      // Mirror the video
      ctx.save()
      ctx.scale(-1, 1)
      ctx.drawImage(video, -w, 0, w, h)
      ctx.restore()

      const lms = result.landmarks[0]
      if (!lms || lms.length === 0) return

      // Mirror x coordinate for landmarks
      const mirrored = lms.map((lm) => ({ ...lm, x: 1 - lm.x }))

      const results = evaluatePoseRules(exercise.poseRules, mirrored as any)
      setJointResults(results)
      onFormUpdate?.(results)

      drawPose(ctx, mirrored as any, results, w, h)

      // Update rep counters using primary rule
      if (exercise.poseRules.length > 0 && results[0]) {
        const fired = repCountersRef.current[0]?.update(results[0].angle)
        if (fired) {
          repCountRef.current += 1
          setRepCount(repCountRef.current)
          onRepComplete?.(repCountRef.current, results)
        }
      }
    },
    [exercise, onFormUpdate, onRepComplete]
  )

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
      })
      const video = videoRef.current
      if (!video) return
      video.srcObject = stream
      await video.play()
      setCameraActive(true)

      let lastTime = -1
      function detect() {
        const lm = landmarkerRef.current
        const v = videoRef.current
        if (!lm || !v || v.readyState < 2) {
          animFrameRef.current = requestAnimationFrame(detect)
          return
        }
        const now = performance.now()
        if (now !== lastTime) {
          const result = lm.detectForVideo(v, now)
          processFrame(result)
          lastTime = now
        }
        animFrameRef.current = requestAnimationFrame(detect)
      }
      detect()
    } catch {
      setModelState('no-camera')
    }
  }, [processFrame])

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current)
    const video = videoRef.current
    if (video?.srcObject) {
      const stream = video.srcObject as MediaStream
      stream.getTracks().forEach((t) => t.stop())
      video.srcObject = null
    }
    setCameraActive(false)
  }, [])

  useEffect(() => () => stopCamera(), [stopCamera])

  const primaryResult = jointResults[0]
  const allCorrect = jointResults.length > 0 && jointResults.every((r) => r.status === 'correct')

  return (
    <div className="flex flex-col gap-4">
      {/* Camera canvas */}
      <div className="relative bg-[#0f1117] rounded-xl overflow-hidden border border-[#2a2d3e]" style={{ aspectRatio: '16/9' }}>
        <video ref={videoRef} className="hidden" playsInline muted />
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="w-full h-full object-cover"
        />

        {/* Overlay states */}
        {!cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0f1117]/90">
            {modelState === 'loading' && (
              <>
                <Loader2 size={40} className="text-[#4f8ef7] animate-spin" />
                <p className="text-[#94a3b8] text-sm">Loading pose detection model…</p>
              </>
            )}
            {modelState === 'error' && (
              <>
                <AlertCircle size={40} className="text-[#ef4444]" />
                <p className="text-[#ef4444]">Failed to load model. Check your connection.</p>
              </>
            )}
            {modelState === 'no-camera' && (
              <>
                <AlertCircle size={40} className="text-[#f59e0b]" />
                <p className="text-[#f59e0b]">Camera access denied.</p>
              </>
            )}
            {modelState === 'ready' && (
              <>
                <Camera size={48} className="text-[#4f8ef7]" />
                <p className="text-white font-medium">Ready for pose detection</p>
                <p className="text-[#64748b] text-sm text-center max-w-xs">
                  Position yourself so your full body is visible. Keep {Math.max(2, Math.floor(1280 / 200))} feet from the camera.
                </p>
                <button
                  onClick={startCamera}
                  className="px-6 py-3 bg-[#4f8ef7] hover:bg-[#6ba3ff] text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Camera size={18} />
                  Start Camera
                </button>
              </>
            )}
          </div>
        )}

        {/* Live rep counter overlay */}
        {cameraActive && (
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2">
            <p className="text-white text-sm font-medium">Reps</p>
            <p className="text-white text-3xl font-bold leading-none">
              {repCount}
              <span className="text-[#64748b] text-lg font-normal"> / {targetReps}</span>
            </p>
          </div>
        )}

        {/* Form indicator badge */}
        {cameraActive && jointResults.length > 0 && (
          <div
            className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm ${
              allCorrect
                ? 'bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30'
                : 'bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30'
            }`}
          >
            {allCorrect ? '✓ Form Correct' : '⚠ Check Form'}
          </div>
        )}

        {/* Stop button */}
        {cameraActive && (
          <button
            onClick={stopCamera}
            className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white text-xs rounded-lg backdrop-blur-sm transition-colors"
          >
            Stop Camera
          </button>
        )}
      </div>

      {/* Joint angle meters */}
      {jointResults.length > 0 && (
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(jointResults.length, 3)}, 1fr)` }}>
          {jointResults.map((r) => {
            const color =
              r.status === 'correct' ? '#22c55e' : r.status === 'too_low' ? '#ef4444' : '#f59e0b'
            return (
              <div key={r.label} className="bg-[#1a1d27] rounded-lg p-3 border border-[#2a2d3e]">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[#94a3b8] text-xs">{r.label}</p>
                  <p className="text-white text-sm font-bold" style={{ color }}>
                    {Math.round(r.angle)}°
                  </p>
                </div>
                <div className="h-1.5 bg-[#2a2d3e] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-150"
                    style={{
                      width: `${Math.min(100, (r.angle / 180) * 100)}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
                <p className="text-xs mt-1.5" style={{ color }}>
                  {r.feedback}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
