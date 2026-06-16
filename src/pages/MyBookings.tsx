import { useState } from 'react'
import { useKayakStore } from '@/store/useKayakStore'
import { Calendar, Clock, MapPin, User, AlertTriangle, CalendarClock, XCircle, CheckCircle, ListOrdered } from 'lucide-react'
import type { BookingStatus } from '@/types'

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
  const { bookings, courses, coaches, waterAreas, students, currentStudentId, setCurrentStudent, cancelBooking, rescheduleBooking } = useKayakStore()
  const [selectedStudentId, setSelectedStudentId] = useState(currentStudentId || students[0]?.id || '')
  const [showCancelConfirm, setShowCancelConfirm] = useState<string | null>(null)
  const [showReschedule, setShowReschedule] = useState<string | null>(null)

  const student = students.find(s => s.id === selectedStudentId)

  const myBookings = bookings
    .filter(b => b.studentId === selectedStudentId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const handleCancel = (bookingId: string, isStarted: boolean) => {
    cancelBooking(bookingId, isStarted)
    setShowCancelConfirm(null)
  }

  const handleReschedule = (bookingId: string, newCourseId: string) => {
    rescheduleBooking(bookingId, newCourseId)
    setShowReschedule(null)
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
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {student && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 shadow-sm">
          <div className="flex items-center gap-6">
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

            return (
              <div key={booking.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center shrink-0`}>
                    <StatusIcon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
                        {config.label}
                      </span>
                      {booking.status === '候补' && booking.waitlistPosition && (
                        <span className="text-xs text-amber-600">第 {booking.waitlistPosition} 位</span>
                      )}
                    </div>
                    {course && (
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{course.date}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{course.startTime}-{course.endTime}</span>
                        <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{coach?.name}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{water?.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
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
                <span className="block text-xs text-emerald-600 mt-0.5">免费取消，归还1课时</span>
              </button>
              <button
                onClick={() => handleCancel(showCancelConfirm, true)}
                className="w-full px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-left hover:bg-red-100 transition-colors"
              >
                <span className="font-medium text-red-700">课程开始后取消</span>
                <span className="block text-xs text-red-500 mt-0.5">⚠️ 扣减1课时</span>
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
              const available = availableRescheduleCourses(booking.courseId)
              return available.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-6">暂无可改期的课程</p>
              ) : (
                <div className="space-y-2">
                  {available.map(c => {
                    const cCoach = coaches.find(co => co.id === c.coachId)
                    const cWater = waterAreas.find(w => w.id === c.waterAreaId)
                    return (
                      <button
                        key={c.id}
                        onClick={() => handleReschedule(showReschedule!, c.id)}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm text-left hover:bg-sky-50 hover:border-sky-300 transition-colors"
                      >
                        <span className="font-medium text-slate-700">{c.date} {c.startTime}-{c.endTime}</span>
                        <span className="block text-xs text-slate-400 mt-0.5">
                          教练: {cCoach?.name} · 水域: {cWater?.name} · 剩余: {c.maxCapacity - c.currentBookings}名
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
    </div>
  )
}
