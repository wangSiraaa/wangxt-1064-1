import { useState } from 'react'
import { useKayakStore } from '@/store/useKayakStore'
import { Calendar, Clock, MapPin, User, AlertTriangle, CalendarClock, XCircle, CheckCircle, ListOrdered, Users, ArrowRightLeft, Receipt, ChevronDown, ChevronUp, ShieldCheck, Waves, Info } from 'lucide-react'
import type { BookingStatus, Student } from '@/types'

const statusConfig: Record<BookingStatus, { color: string; icon: typeof CheckCircle; label: string }> = {
  '已预约': { color: 'bg-sky-100 text-sky-700', icon: CheckCircle, label: '已预约' },
  '候补': { color: 'bg-amber-100 text-amber-700', icon: ListOrdered, label: '候补中' },
  '停课': { color: 'bg-red-100 text-red-700', icon: AlertTriangle, label: '已停课' },
  '待改期': { color: 'bg-amber-100 text-amber-700', icon: CalendarClock, label: '待改期' },
  '已完成': { color: 'bg-slate-100 text-slate-500', icon: CheckCircle, label: '已完成' },
  '已取消(扣课时)': { color: 'bg-red-100 text-red-700', icon: XCircle, label: '已取消(扣课时)' },
  '已取消(免费)': { color: 'bg-slate-100 text-slate-500', icon: XCircle, label: '已取消(免费)' },
}

export default function MyBookings() {
  const {
    bookings, courses, coaches, waterAreas, students, families,
    currentStudentId, setCurrentStudent, cancelBooking, rescheduleBooking,
    swapBookingParticipant, getFamilyMembers, getStudentFamily
  } = useKayakStore()
  const [selectedStudentId, setSelectedStudentId] = useState(currentStudentId || students[0]?.id || '')
  const [showCancelConfirm, setShowCancelConfirm] = useState<string | null>(null)
  const [showReschedule, setShowReschedule] = useState<string | null>(null)
  const [showSwap, setShowSwap] = useState<string | null>(null)
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null)

  const student = students.find(s => s.id === selectedStudentId)

  const myBookings = bookings
    .filter(b => b.studentId === selectedStudentId || b.participants?.some(p => p.studentId === selectedStudentId))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const handleCancel = (bookingId: string, isStarted: boolean) => {
    cancelBooking(bookingId, isStarted)
    setShowCancelConfirm(null)
  }

  const handleReschedule = (bookingId: string, newCourseId: string) => {
    rescheduleBooking(bookingId, newCourseId)
    setShowReschedule(null)
  }

  const handleSwap = (bookingId: string, oldStudentId: string, newStudentId: string) => {
    swapBookingParticipant(bookingId, oldStudentId, newStudentId)
    setShowSwap(null)
  }

  const availableRescheduleCourses = (originalCourseId: string) => {
    const originalCourse = courses.find(c => c.id === originalCourseId)
    if (!originalCourse) return []
    return courses.filter(c =>
      c.id !== originalCourseId &&
      c.status === '正常' &&
      c.level === originalCourse.level &&
      c.currentBookings < c.maxCapacity
    )
  }

  const getSwapCandidates = (bookingId: string, currentParticipantId: string): Student[] => {
    const booking = bookings.find(b => b.id === bookingId)
    const course = booking ? courses.find(c => c.id === booking.courseId) : null
    if (!course) return []

    const family = getStudentFamily(currentParticipantId)
    if (family) {
      return getFamilyMembers(family.id).filter(s => s.id !== currentParticipantId)
    }

    const currentStudent = students.find(s => s.id === currentParticipantId)
    return students.filter(s =>
      s.id !== currentParticipantId &&
      s.level === course.level &&
      (!currentStudent || s.role === currentStudent.role)
    )
  }

  const formatCalculationDetail = (detail?: { adjustments?: { type: string; amount: number; description: string }[]; finalAmount?: number; description?: string }) => {
    if (!detail || !detail.adjustments || detail.adjustments.length === 0) return null
    return (
      <div className="bg-slate-50 rounded-xl p-4 mt-3 border border-slate-200">
        <div className="flex items-center gap-2 mb-2">
          <Receipt className="w-4 h-4 text-sky-600" />
          <span className="text-sm font-medium text-slate-700">费用计算明细</span>
        </div>
        {detail.description && (
          <p className="text-xs text-slate-500 mb-2">{detail.description}</p>
        )}
        <div className="space-y-1.5">
          {detail.adjustments.map((adj, i) => (
            <div key={i} className="flex justify-between text-xs">
              <span className="text-slate-600">{adj.description}</span>
              <span className={`font-mono font-medium ${adj.amount >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {adj.amount >= 0 ? '+' : ''}{adj.amount}课时
              </span>
            </div>
          ))}
          <div className="border-t border-slate-300 pt-1.5 mt-2 flex justify-between text-sm font-bold">
            <span className="text-slate-700">实际{detail.finalAmount !== undefined && detail.finalAmount >= 0 ? '扣减' : '返还'}</span>
            <span className="text-sky-700 font-mono">
              {Math.abs(detail.finalAmount ?? 0)}课时
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-sky-950">我的预约</h1>
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-500">学员:</label>
          <select
            value={selectedStudentId}
            onChange={e => { setSelectedStudentId(e.target.value); setCurrentStudent(e.target.value) }}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
          >
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.role === '儿童' ? '儿童' : '成人'})</option>
            ))}
          </select>
        </div>
      </div>

      {student && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 shadow-sm">
          <div className="flex items-center gap-6 flex-wrap">
            <div>
              <p className="text-xs text-slate-400">剩余课时</p>
              <p className="text-2xl font-bold text-sky-950">{student.totalLessons - student.usedLessons - student.frozenLessons}</p>
            </div>
            <div className="h-10 w-px bg-slate-200" />
            <div>
              <p className="text-xs text-slate-400">冻结课时</p>
              <p className="text-lg font-bold text-slate-400">{student.frozenLessons}</p>
            </div>
            <div className="h-10 w-px bg-slate-200" />
            <div>
              <p className="text-xs text-slate-400">已用课时</p>
              <p className="text-lg font-bold text-slate-400">{student.usedLessons}</p>
            </div>
            {student.familyId && families.find(f => f.id === student.familyId) && (
              <>
                <div className="h-10 w-px bg-slate-200" />
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-violet-500" />
                  <span className="text-sm text-violet-600 font-medium">
                    {families.find(f => f.id === student.familyId)?.name}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {myBookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400">暂无预约记录</p>
        </div>
      ) : (
        <div className="space-y-3">
          {myBookings.map(booking => {
            const course = courses.find(c => c.id === booking.courseId)
            const coach = course ? coaches.find(c => c.id === course.coachId) : null
            const water = course ? waterAreas.find(w => w.id === course.waterAreaId) : null
            const config = statusConfig[booking.status]
            const StatusIcon = config.icon
            const isExpanded = expandedBooking === booking.id
            const courseTypeInfo = course?.courseType === '岸上安全课'
              ? { icon: ShieldCheck, label: '岸上安全课', color: 'text-emerald-600 bg-emerald-50' }
              : course?.courseType === '水上实操课'
                ? { icon: Waves, label: '水上实操课', color: 'text-sky-600 bg-sky-50' }
                : course?.courseType === '体验营'
                  ? { icon: Users, label: '体验营', color: 'text-violet-600 bg-violet-50' }
                  : course?.courseType === '组合课'
                    ? { icon: Info, label: '组合课', color: 'text-amber-600 bg-amber-50' }
                    : null

            return (
              <div key={booking.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center shrink-0`}>
                    <StatusIcon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
                        {config.label}
                      </span>
                      {booking.status === '候补' && booking.waitlistPosition && (
                        <span className="text-xs text-amber-600">第 {booking.waitlistPosition} 位</span>
                      )}
                      {courseTypeInfo && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${courseTypeInfo.color}`}>
                          <courseTypeInfo.icon className="w-3 h-3" />
                          {courseTypeInfo.label}
                        </span>
                      )}
                      {booking.isFamilyBooking && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-violet-50 text-violet-600">
                          <Users className="w-3 h-3" />
                          家庭预约
                        </span>
                      )}
                    </div>
                    {course && (
                      <div className="flex items-center gap-4 text-sm text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{course.date}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{course.startTime}-{course.endTime}</span>
                        <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{coach?.name}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{water?.name}</span>
                      </div>
                    )}
                    {booking.participants && booking.participants.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-500">
                          参与者: {booking.participants.map(p => {
                            const ps = students.find(s => s.id === p.studentId)
                            return ps ? `${ps.name}(${ps.role === '儿童' ? '童' : '成'})` : ''
                          }).filter(Boolean).join('、')}
                        </span>
                      </div>
                    )}
                    {booking.totalLessonCost !== undefined && (
                      <div className="flex items-center gap-1 mt-1">
                        <Receipt className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-500">合计扣减: {booking.totalLessonCost}课时</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isExpanded ? (
                      <button
                        onClick={() => setExpandedBooking(null)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setExpandedBooking(booking.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    )}
                    {(booking.status === '已预约') && (
                      <button
                        onClick={() => setShowSwap(booking.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-500 text-white text-sm hover:bg-violet-600 transition-colors"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        换人
                      </button>
                    )}
                    {(booking.status === '停课' || booking.status === '待改期') && (
                      <button
                        onClick={() => setShowReschedule(booking.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-sm hover:bg-amber-600 transition-colors"
                      >
                        <CalendarClock className="w-3.5 h-3.5" />
                        改期
                      </button>
                    )}
                    {(booking.status === '已预约' || booking.status === '候补') && (
                      <button
                        onClick={() => setShowCancelConfirm(booking.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        取消
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-3">
                    {booking.participants && booking.participants.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">参与者详情</h4>
                        <div className="grid gap-2">
                          {booking.participants.map((p, i) => {
                            const ps = students.find(s => s.id === p.studentId)
                            return (
                              <div key={i} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${p.role === '儿童' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>
                                    {ps?.name.slice(-1)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-slate-700">{ps?.name}</p>
                                    <p className="text-xs text-slate-500">{p.role} · Lv.{p.level} · {ps?.age}岁 · {p.boatType}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium text-sky-700">{p.lessonCost}课时</p>
                                  {p.validationPassed === false && (
                                    <p className="text-xs text-red-500">校验未通过</p>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {formatCalculationDetail(booking.calculationDetail)}

                    {booking.swapHistory && booking.swapHistory.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">换人记录</h4>
                        <div className="space-y-2">
                          {booking.swapHistory.map((swap, i) => {
                            const oldS = students.find(s => s.id === swap.oldStudentId)
                            const newS = students.find(s => s.id === swap.newStudentId)
                            return (
                              <div key={i} className="bg-slate-50 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-2 text-sm">
                                  <ArrowRightLeft className="w-3.5 h-3.5 text-violet-500" />
                                  <span className="text-slate-600">
                                    {oldS?.name} → <span className="font-medium text-slate-700">{newS?.name}</span>
                                  </span>
                                  <span className="text-xs text-slate-400 ml-auto">
                                    {swap.swappedAt.slice(0, 16).replace('T', ' ')}
                                  </span>
                                </div>
                                {formatCalculationDetail(swap.calculationDetail)}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCancelConfirm(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 mb-3">确认取消预约</h3>
            <div className="space-y-2 mb-4">
              <button
                onClick={() => handleCancel(showCancelConfirm, false)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm text-left hover:bg-slate-50 transition-colors"
              >
                <span className="font-medium text-slate-700">课程开始前取消</span>
                <span className="block text-xs text-emerald-600 mt-0.5">免费取消，全额返还课时</span>
              </button>
              <button
                onClick={() => handleCancel(showCancelConfirm, true)}
                className="w-full px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-left hover:bg-red-100 transition-colors"
              >
                <span className="font-medium text-red-700">课程开始后取消</span>
                <span className="block text-xs text-red-500 mt-0.5">⚠️ 课时已在预约时扣减，取消后不予归还</span>
              </button>
            </div>
            <button onClick={() => setShowCancelConfirm(null)} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
              返回
            </button>
          </div>
        </div>
      )}

      {showReschedule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowReschedule(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 mb-4">选择新课程时间</h3>
            {(() => {
              const booking = bookings.find(b => b.id === showReschedule)
              if (!booking) return null
              const originalCourse = courses.find(c => c.id === booking.courseId)
              const available = availableRescheduleCourses(booking.courseId)
              return available.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-6">暂无可改期的课程</p>
              ) : (
                <div className="space-y-2">
                  {available.map(c => {
                    const cCoach = coaches.find(co => co.id === c.coachId)
                    const cWater = waterAreas.find(w => w.id === c.waterAreaId)
                    const priceDiff = originalCourse ? c.lessonCost - originalCourse.lessonCost : 0
                    return (
                      <button
                        key={c.id}
                        onClick={() => handleReschedule(showReschedule!, c.id)}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm text-left hover:bg-sky-50 hover:border-sky-300 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-700">{c.date} {c.startTime}-{c.endTime}</span>
                          {priceDiff !== 0 && (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${priceDiff > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                              {priceDiff > 0 ? `+${priceDiff}` : priceDiff}课时
                            </span>
                          )}
                        </div>
                        <span className="block text-xs text-slate-400 mt-0.5">
                          教练: {cCoach?.name} · 水域: {cWater?.name} · 剩余: {c.maxCapacity - c.currentBookings}名 · {c.lessonCost}课时/人
                        </span>
                      </button>
                    )
                  })}
                </div>
              )
            })()}
            <button onClick={() => setShowReschedule(null)} className="w-full mt-4 px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
              取消
            </button>
          </div>
        </div>
      )}

      {showSwap && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSwap(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 mb-2">学员换人</h3>
            <p className="text-xs text-slate-500 mb-4">换人后将重新校验新学员的年龄、级别、艇型和剩余课时，原有资格不会直接继承。</p>
            {(() => {
              const booking = bookings.find(b => b.id === showSwap)
              if (!booking) return null
              const participants = booking.participants?.length ? booking.participants : [{ studentId: booking.studentId }]
              return (
                <div className="space-y-4">
                  {participants.map((p, pIdx) => {
                    const oldStudent = students.find(s => s.id === p.studentId)
                    const candidates = getSwapCandidates(booking.id, p.studentId)
                    return (
                      <div key={pIdx} className="border border-slate-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <ArrowRightLeft className="w-4 h-4 text-violet-500" />
                          <span className="text-sm font-medium text-slate-700">
                            替换 {oldStudent?.name}（{oldStudent?.role}，{oldStudent?.age}岁，Lv.{oldStudent?.level}）
                          </span>
                        </div>
                        {candidates.length === 0 ? (
                          <p className="text-xs text-slate-400 py-2 text-center">暂无可替换的学员</p>
                        ) : (
                          <div className="space-y-2">
                            {candidates.map(cand => {
                              const family = getStudentFamily(cand.id)
                              return (
                                <button
                                  key={cand.id}
                                  onClick={() => handleSwap(booking.id, p.studentId, cand.id)}
                                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-left hover:bg-violet-50 hover:border-violet-300 transition-colors"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-slate-700">{cand.name}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded ${cand.role === '儿童' ? 'bg-amber-50 text-amber-600' : 'bg-sky-50 text-sky-600'}`}>
                                      {cand.role} · {cand.age}岁
                                    </span>
                                  </div>
                                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                                    <span>Lv.{cand.level}</span>
                                    <span>剩余 {cand.totalLessons - cand.usedLessons - cand.frozenLessons}课时</span>
                                    {family && <span className="text-violet-500">同家庭</span>}
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })()}
            <button onClick={() => setShowSwap(null)} className="w-full mt-4 px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
