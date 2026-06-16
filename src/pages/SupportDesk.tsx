import { useState } from 'react'
import { useKayakStore } from '@/store/useKayakStore'
import { Headphones, XCircle, Snowflake, AlertTriangle, Users, TrendingUp, ShieldAlert, Search, Calendar } from 'lucide-react'

export default function SupportDesk() {
  const { students, bookings, courses, coaches, waterAreas, warnings, supportCancelBooking, freezeLessons, unfreezeLessons, transactions } = useKayakStore()
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [selectedBookingId, setSelectedBookingId] = useState('')
  const [cancelStarted, setCancelStarted] = useState(false)
  const [freezeAmount, setFreezeAmount] = useState(1)
  const [freezeReason, setFreezeReason] = useState('')
  const [showFreeze, setShowFreeze] = useState(false)
  const [showUnfreeze, setShowUnfreeze] = useState(false)
  const [unfreezeAmount, setUnfreezeAmount] = useState(1)
  const [unfreezeReason, setUnfreezeReason] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const student = students.find(s => s.id === selectedStudentId)
  const studentBookings = bookings.filter(b => b.studentId === selectedStudentId && (b.status === '已预约' || b.status === '候补'))
  const available = student ? student.totalLessons - student.usedLessons - student.frozenLessons : 0

  const activeWarnings = warnings.filter(w => w.status === '生效中')
  const suspendedCourses = courses.filter(c => c.status === '停课')
  const rescheduleCourses = courses.filter(c => c.status === '待改期')
  const affectedStudents = bookings.filter(b => b.status === '停课' || b.status === '待改期').length

  const filteredStudents = searchQuery
    ? students.filter(s => s.name.includes(searchQuery) || s.id.includes(searchQuery))
    : students

  const handleCancel = () => {
    if (!selectedBookingId) return
    supportCancelBooking(selectedBookingId, cancelStarted)
    setSelectedBookingId('')
  }

  const handleFreeze = () => {
    if (!selectedStudentId || freezeAmount <= 0 || !freezeReason) return
    freezeLessons(selectedStudentId, freezeAmount, freezeReason)
    setShowFreeze(false)
    setFreezeReason('')
    setFreezeAmount(1)
  }

  const handleUnfreeze = () => {
    if (!selectedStudentId || unfreezeAmount <= 0 || !unfreezeReason) return
    unfreezeLessons(selectedStudentId, unfreezeAmount, unfreezeReason)
    setShowUnfreeze(false)
    setUnfreezeReason('')
    setUnfreezeAmount(1)
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-sky-950 mb-6 flex items-center gap-3">
        <Headphones className="w-7 h-7 text-violet-500" />
        客服工作台
      </h1>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400">生效预警</p>
              <p className="text-2xl font-bold text-red-600">{activeWarnings.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400">停课课程</p>
              <p className="text-2xl font-bold text-red-600">{suspendedCourses.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400">待改期</p>
              <p className="text-2xl font-bold text-amber-600">{rescheduleCourses.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400">受影响学员</p>
              <p className="text-2xl font-bold text-violet-600">{affectedStudents}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800">代取消预约</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">搜索学员</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="输入学员姓名..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">选择学员</label>
                <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white">
                  <option value="">-- 请选择 --</option>
                  {filteredStudents.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.level} · 剩余{available}课时)</option>
                  ))}
                </select>
              </div>

              {student && (
                <div className="p-3 rounded-lg bg-sky-50 text-sm">
                  <div className="flex items-center gap-4">
                    <span>剩余: <strong className="text-sky-700">{available}</strong></span>
                    <span>冻结: <strong className="text-sky-600">{student.frozenLessons}</strong></span>
                    <span>已用: <strong>{student.usedLessons}</strong></span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-400 mb-1">选择预约</label>
                <select value={selectedBookingId} onChange={e => setSelectedBookingId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white">
                  <option value="">-- 请选择 --</option>
                  {studentBookings.map(b => {
                    const c = courses.find(co => co.id === b.courseId)
                    const coach = c ? coaches.find(co => co.id === c.coachId) : null
                    return (
                      <option key={b.id} value={b.id}>
                        {c?.date} {c?.startTime}-{c?.endTime} · {coach?.name} · [{b.status}]
                      </option>
                    )
                  })}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm text-slate-500">课程是否已开始:</label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={cancelStarted} onChange={e => setCancelStarted(e.target.checked)} className="accent-red-500" />
                  <span className="text-sm text-red-600 font-medium">已开始 (将扣课时)</span>
                </label>
              </div>

              <button
                onClick={handleCancel}
                disabled={!selectedBookingId}
                className="w-full px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                确认代取消
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800">课时冻结/解冻</h2>
            </div>
            <div className="p-6 space-y-4">
              {!selectedStudentId && <p className="text-sm text-slate-400">请先选择学员</p>}
              {student && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setShowFreeze(true)}
                      disabled={available <= 0}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-sky-100 text-sky-700 text-sm font-medium hover:bg-sky-200 disabled:opacity-50 transition-colors"
                    >
                      <Snowflake className="w-4 h-4" />
                      冻结课时
                    </button>
                    <button
                      onClick={() => setShowUnfreeze(true)}
                      disabled={student.frozenLessons <= 0}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-emerald-100 text-emerald-700 text-sm font-medium hover:bg-emerald-200 disabled:opacity-50 transition-colors"
                    >
                      <TrendingUp className="w-4 h-4" />
                      解冻课时
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              风险提示
            </h2>
          </div>
          <div className="p-6">
            {activeWarnings.length === 0 && suspendedCourses.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">✓</span>
                </div>
                <p className="text-emerald-600 font-medium">当前无风险</p>
                <p className="text-xs text-slate-400 mt-1">所有水域正常运行</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeWarnings.map(w => (
                  <div key={w.id} className="p-4 rounded-lg bg-red-50 border border-red-200">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-bold text-red-700">{w.type} · {w.severity}</span>
                    </div>
                    <p className="text-xs text-red-600">{w.message}</p>
                    <p className="text-xs text-red-400 mt-1">
                      影响水域: {w.waterAreaIds.map(id => waterAreas.find(a => a.id === id)?.name).join('、')}
                    </p>
                  </div>
                ))}

                {suspendedCourses.length > 0 && (
                  <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                    <div className="flex items-center gap-2 mb-1">
                      <XCircle className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-bold text-amber-700">已停课课程: {suspendedCourses.length}</span>
                    </div>
                    <p className="text-xs text-amber-600">涉及 {affectedStudents} 名学员预约受影响</p>
                  </div>
                )}

                {rescheduleCourses.length > 0 && (
                  <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-bold text-amber-700">待改期课程: {rescheduleCourses.length}</span>
                    </div>
                    <p className="text-xs text-amber-600">学员可申请改期</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showFreeze && student && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowFreeze(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-sky-800 mb-4 flex items-center gap-2"><Snowflake className="w-5 h-5" />冻结课时</h3>
            <p className="text-sm text-slate-500 mb-3">学员: {student.name} · 可冻结: {available}课时</p>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">冻结数量</label>
                <input type="range" min={1} max={available} value={freezeAmount} onChange={e => setFreezeAmount(Number(e.target.value))} className="w-full accent-sky-600" />
                <p className="text-center text-xl font-bold text-sky-700">{freezeAmount} 课时</p>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">冻结原因</label>
                <select value={freezeReason} onChange={e => setFreezeReason(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm">
                  <option value="">请选择</option>
                  <option value="伤病休养">伤病休养</option>
                  <option value="长期请假">长期请假</option>
                  <option value="其他">其他</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowFreeze(false)} className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600">取消</button>
              <button onClick={handleFreeze} disabled={!freezeReason} className="flex-1 px-4 py-2 rounded-lg bg-sky-700 text-white text-sm disabled:opacity-50">确认冻结</button>
            </div>
          </div>
        </div>
      )}

      {showUnfreeze && student && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowUnfreeze(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-emerald-700 mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5" />解冻课时</h3>
            <p className="text-sm text-slate-500 mb-3">学员: {student.name} · 冻结中: {student.frozenLessons}课时</p>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">解冻数量</label>
                <input type="range" min={1} max={student.frozenLessons} value={unfreezeAmount} onChange={e => setUnfreezeAmount(Number(e.target.value))} className="w-full accent-emerald-600" />
                <p className="text-center text-xl font-bold text-emerald-700">{unfreezeAmount} 课时</p>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">解冻原因</label>
                <input type="text" value={unfreezeReason} onChange={e => setUnfreezeReason(e.target.value)} placeholder="如：伤病恢复" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowUnfreeze(false)} className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600">取消</button>
              <button onClick={handleUnfreeze} disabled={!unfreezeReason} className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm disabled:opacity-50">确认解冻</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
