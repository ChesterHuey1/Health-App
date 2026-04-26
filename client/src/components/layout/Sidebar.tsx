import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Dumbbell,
  Calendar,
  BookOpen,
  MessageCircle,
  Heart,
} from 'lucide-react'

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/library', icon: BookOpen, label: 'Exercises' },
  { to: '/schedule', icon: Calendar, label: 'Schedule' },
  { to: '/assistant', icon: MessageCircle, label: 'AI Assistant' },
]

export function Sidebar() {
  return (
    <aside className="w-[220px] min-w-[220px] flex flex-col gap-1 bg-[#1a1d27] border-r border-[#2a2d3e] px-3 py-6 h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-3 mb-8">
        <div className="w-8 h-8 rounded-lg bg-[#4f8ef7] flex items-center justify-center">
          <Heart size={16} fill="white" color="white" />
        </div>
        <div>
          <p className="text-white font-semibold text-sm leading-tight">RecoverPT</p>
          <p className="text-[#64748b] text-xs">Your recovery, guided</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-[#4f8ef7]/15 text-[#4f8ef7] font-medium'
                  : 'text-[#94a3b8] hover:bg-[#2a2d3e] hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto px-3 py-3 rounded-lg bg-[#4f8ef7]/10 border border-[#4f8ef7]/20">
        <div className="flex items-center gap-2 mb-1">
          <Dumbbell size={14} className="text-[#4f8ef7]" />
          <p className="text-xs font-medium text-[#4f8ef7]">Recovery Mode</p>
        </div>
        <p className="text-xs text-[#64748b]">Form-checked exercises with AI guidance</p>
      </div>
    </aside>
  )
}
