import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useKayakStore } from '@/store/useKayakStore'
import { Waves, Calendar, BookOpen, AlertTriangle, ClipboardList, GraduationCap, Headphones, LogOut, RotateCcw } from 'lucide-react'

const roleNavItems = {
  coach: [
    { to: '/coach', label: '排课管理', icon: Calendar },
  ],
  student: [
    { to: '/booking', label: '课程预约', icon: BookOpen },
    { to: '/my-bookings', label: '我的预约', icon: ClipboardList },
    { to: '/lessons', label: '课时管理', icon: GraduationCap },
  ],
  admin: [
    { to: '/warnings', label: '预警管理', icon: AlertTriangle },
  ],
  support: [
    { to: '/support', label: '客服工作台', icon: Headphones },
  ],
}

const roleLabels = { coach: '教练', student: '学员', admin: '场地管理员', support: '客服' }

export default function Layout() {
  const { currentRole, setRole, resetData } = useKayakStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    setRole(null as never)
    navigate('/')
  }

  if (!currentRole) return <Outlet />

  const navItems = roleNavItems[currentRole] || []

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-56 bg-gradient-to-b from-sky-950 to-sky-900 text-white flex flex-col shrink-0">
        <div className="p-4 border-b border-sky-800">
          <div className="flex items-center gap-2">
            <Waves className="w-7 h-7 text-cyan-400" />
            <div>
              <h1 className="text-base font-bold tracking-tight">皮划艇预约</h1>
              <p className="text-xs text-sky-300">{roleLabels[currentRole]}端</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 font-medium'
                    : 'text-sky-200 hover:bg-sky-800/60 hover:text-white'
                }`
              }
            >
              <item.icon className="w-4.5 h-4.5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-sky-800 space-y-1">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sky-300 hover:bg-sky-800/60 hover:text-white w-full transition-all"
          >
            <LogOut className="w-4.5 h-4.5" />
            切换角色
          </button>
          <button
            onClick={() => { resetData(); navigate('/') }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sky-300 hover:bg-sky-800/60 hover:text-white w-full transition-all"
          >
            <RotateCcw className="w-4.5 h-4.5" />
            重置数据
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
