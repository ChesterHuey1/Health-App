import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Sidebar } from './components/layout/Sidebar'
import { Onboarding } from './pages/Onboarding'
import { Dashboard } from './pages/Dashboard'
import { Library } from './pages/Library'
import { Schedule } from './pages/Schedule'
import { Assistant } from './pages/Assistant'
import { ExerciseSession } from './pages/ExerciseSession'
import { useUserStore } from './store/userStore'

function AppShell() {
  const { onboardingComplete } = useUserStore()

  if (!onboardingComplete) {
    return (
      <Routes>
        <Route path="*" element={<Onboarding />} />
      </Routes>
    )
  }

  return (
    <>
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/library" element={<Library />} />
          <Route path="/exercise/:id" element={<ExerciseSession />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}
