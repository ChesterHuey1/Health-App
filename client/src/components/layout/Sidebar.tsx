import { NavLink } from 'react-router-dom'
import {
  Home, Calendar, BookOpen, Bot, Plus, Settings, Target,
} from 'lucide-react'
import { useUserStore } from '../../store/userStore'
import { categoryLabels } from '../../data/exercises'

const NAV_MAIN = [
  { to: '/dashboard', label: 'Dashboard', Icon: Home },
  { to: '/schedule', label: 'My Schedule', Icon: Calendar },
  { to: '/library', label: 'PT Library', Icon: BookOpen },
  { to: '/assistant', label: 'AI Assistant', Icon: Bot },
]

export function Sidebar() {
  const { profile, todayCheckin } = useUserStore()
  const hasCheckin = !!todayCheckin()

  const initials = profile.name
    ? profile.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : 'PT'

  const weekNum = profile.surgeryDate
    ? Math.max(1, Math.floor((Date.now() - new Date(profile.surgeryDate).getTime()) / (1000 * 60 * 60 * 24 * 7)) + 1)
    : 1

  const surgeryShort = profile.surgeryType
    ? categoryLabels[profile.surgeryType].split(' ')[0]
    : 'PT'

  return (
    <aside
      style={{
        width: 228, flexShrink: 0, background: '#1A3D5C',
        display: 'flex', flexDirection: 'column', height: '100vh',
        position: 'relative', zIndex: 10,
      }}
    >
      {/* Logo */}
      <div style={{ padding: '28px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{
          width: 36, height: 36, background: '#1A7FA8', borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
        }}>
          <Target size={20} color="white" />
        </div>
        <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>Recover</p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Post-Op PT Platform</p>
      </div>

      {/* Nav */}
      <nav style={{
        flex: 1, padding: '16px 12px',
        display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto',
      }}>
        <p style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '0.8px',
          color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase',
          padding: '12px 8px 6px',
        }}>
          Main
        </p>

        {NAV_MAIN.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            style={{ textDecoration: 'none' }}
            className={({ isActive }) =>
              [
                'flex items-center gap-2.5 px-2.5 py-[9px] rounded-[9px]',
                'text-[13.5px] font-medium cursor-pointer transition-colors',
                isActive
                  ? 'bg-white/[0.12] text-white'
                  : 'text-white/55 hover:bg-white/[0.07] hover:text-white/85',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={17} color={isActive ? '#fff' : 'rgba(255,255,255,0.55)'} />
                <span>{label}</span>
                {to === '/library' && !hasCheckin && (
                  <span style={{
                    marginLeft: 'auto', background: '#1A7FA8', color: '#fff',
                    fontSize: 10, fontWeight: 700, padding: '1px 7px',
                    borderRadius: 99, minWidth: 18, textAlign: 'center',
                  }}>
                    1
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}

        <p style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '0.8px',
          color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase',
          padding: '12px 8px 6px', marginTop: 4,
        }}>
          Account
        </p>

        <button
          className="flex items-center gap-2.5 px-2.5 py-[9px] rounded-[9px] text-[13.5px] font-medium cursor-pointer text-white/55 hover:bg-white/[0.07] hover:text-white/85 transition-colors w-full text-left"
          style={{ background: 'none', border: 'none' }}
        >
          <Plus size={17} color="rgba(255,255,255,0.55)" />
          New PT Plan
        </button>
        <button
          className="flex items-center gap-2.5 px-2.5 py-[9px] rounded-[9px] text-[13.5px] font-medium cursor-pointer text-white/55 hover:bg-white/[0.07] hover:text-white/85 transition-colors w-full text-left"
          style={{ background: 'none', border: 'none' }}
        >
          <Settings size={17} color="rgba(255,255,255,0.55)" />
          Settings
        </button>
      </nav>

      {/* User */}
      <div style={{
        padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0,
        }}>
          {initials}
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{profile.name || 'Patient'}</p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
            Week {weekNum} · {surgeryShort} Recovery
          </p>
        </div>
      </div>
    </aside>
  )
}
