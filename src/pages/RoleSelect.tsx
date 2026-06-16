import { useNavigate } from 'react-router-dom'
import { useKayakStore } from '@/store/useKayakStore'
import { Waves, User, BookOpen, ShieldAlert, Headphones } from 'lucide-react'
import type { UserRole } from '@/types'

const roles: { role: UserRole; label: string; desc: string; icon: typeof User; color: string }[] = [
  { role: 'coach', label: '教练', desc: '维护可授课时间、资质等级与禁排日期', icon: User, color: 'from-sky-600 to-sky-700' },
  { role: 'student', label: '学员', desc: '预约课程、查看课时、申请改期与候补', icon: BookOpen, color: 'from-cyan-500 to-teal-600' },
  { role: 'admin', label: '场地管理员', desc: '发布水位/天气预警、管理水域状态', icon: ShieldAlert, color: 'from-amber-500 to-orange-600' },
  { role: 'support', label: '客服', desc: '代取消预约、课时冻结/解冻、风险提示', icon: Headphones, color: 'from-violet-500 to-purple-600' },
]

export default function RoleSelect() {
  const { setRole, coaches, students } = useKayakStore()
  const navigate = useNavigate()

  const handleSelect = (role: UserRole) => {
    setRole(role)
    if (role === 'coach') navigate('/coach')
    else if (role === 'student') navigate('/booking')
    else if (role === 'admin') navigate('/warnings')
    else if (role === 'support') navigate('/support')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-950 via-sky-900 to-cyan-900 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-6">
            <Waves className="w-12 h-12 text-cyan-400" />
            <h1 className="text-4xl font-bold text-white tracking-tight">皮划艇课程预约系统</h1>
          </div>
          <p className="text-sky-300 text-lg">水上运动基地安全排课管理平台</p>
          <p className="text-sky-400/70 text-sm mt-2">选择角色进入系统 · 教练 {coaches.length} 名 · 学员 {students.length} 名</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {roles.map(r => (
            <button
              key={r.role}
              onClick={() => handleSelect(r.role)}
              className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-left hover:bg-white/10 hover:border-cyan-400/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-500/10"
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                <r.icon className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">{r.label}</h2>
              <p className="text-sky-300/80 text-sm leading-relaxed">{r.desc}</p>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-cyan-400 text-lg">→</span>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-sky-500/50 text-xs">水位预警禁止开课 · 教练资质不匹配禁止排班 · 课程开始后取消扣课时</p>
        </div>
      </div>
    </div>
  )
}
