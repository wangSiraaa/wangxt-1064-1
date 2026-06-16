import { useState } from 'react'
import { useKayakStore } from '@/store/useKayakStore'
import { BookOpen, User, MapPin, Clock, AlertTriangle, CheckCircle, XCircle, Users, ListOrdered } from 'lucide-react'
import type { CoachLevel } from '@/types'

const levelColors: Record<CoachLevel, string> = {
  '初级': 'bg-emerald-100 text-emerald-700',
  '中级': 'bg-amber-100 text-amber-700',
  '高级': 'bg-rose-100 text-rose-700',
}

const statusColors: Record<string, string> = {
  '正常': 'bg-emerald-100 text-emerald-700',
  '停课': 'bg-red-100 text-red-700',
  '待改期': 'bg-amber-100 text-amber-700',
  '已完成': 'bg-slate-100 text-slate-500',
}

export default function CourseBooking() {
  const { courses, coaches, waterAreas, students, bookings, currentStudentId, setCurrentStudent, validateBooking, createBooking, joinWaitlist } = useKayakStore()
  const [selectedStudentId, setSelectedStudentId] = useState(currentStudentId || students[0]?.id || '')
  const [filterLevel, setFilterLevel] = useState<CoachLevel | '全部'>('全部')
  const [filterDate, setFilterDate] = useState('')
  const [validationResult, setValidationResult] = useState<{ courseId: string; result: ReturnType<typeof validateBooking> } | null>(null)
  const [showValidation, setShowValidation] = useState(false)

  const student = students.find(s => s.id === selectedStudentId)
  const availableLessons = student ? student.totalLessons - student.usedLessons - student.frozenLessons : 0

  const filteredCourses = courses.filter(c => {
    if (c.status !== '正常' && c.status !== '待改期') return false
    if (filterLevel !== '全部' && c.level !== filterLevel) return false
    if (filterDate && c.date !== filterDate) return false
    return true
  })

  const handleStudentChange = (id: string) => {
    setSelectedStudentId(id)
    setCurrentStudent(id)
  }

  const handleBook = (courseId: string) => {
    if (!selectedStudentId) return
    const result = validateBooking(selectedStudentId, courseId)
    setValidationResult({ courseId, result })
    setShowValidation(true)
  }

  const handleConfirmBook = (courseId: string) => {
    if (!selectedStudentId) return
    createBooking(selectedStudentId, courseId)
    setShowValidation(false)
    setValidationResult(null)
  }

  const handleWaitlist = (courseId: string) => {
    if (!selectedStudentId) return
    joinWaitlist(selectedStudentId, courseId)
  }

  const isBooked = (courseId: string) => {
    return bookings.some(b => b.studentId === selectedStudentId && b.courseId === courseId && (b.status === '已预约' || b.status === '候补'))
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-sky-950 mb-6">课程预约</h1>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm">
        <div className="flex items-center gap-6 flex-wrap">
          <div>
            <label className="block text-xs text-slate-400 mb-1">当前学员</label>
            <select value={selectedStudentId} onChange={e => handleStudentChange(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white min-w-[140px]">
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.level})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">剩余课时</label>
            <span className={`text-xl font-bold ${availableLessons > 0 ? 'text-emerald-600' : 'text-red-500'}`}>{availableLessons}</span>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">学员级别</label>
            <span className={`px-2.5 py-0.5 rounded-md text-sm font-medium ${levelColors[student?.level || '初级']}`}>
              {student?.level}
            </span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <label className="block text-xs text-slate-400 mb-1">课程级别</label>
            <select value={filterLevel} onChange={e => setFilterLevel(e.target.value as CoachLevel | '全部')} className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white">
              <option value="全部">全部</option>
              <option value="初级">初级</option>
              <option value="中级">中级</option>
              <option value="高级">高级</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">日期筛选</label>
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
          </div>
          {filterDate && (
            <button onClick={() => setFilterDate('')} className="text-xs text-sky-600 hover:text-sky-700 mt-4">清除日期</button>
          )}
        </div>
      </div>

      {filteredCourses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400">暂无可预约课程</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCourses.map(course => {
            const coach = coaches.find(c => c.id === course.coachId)
            const water = waterAreas.find(w => w.id === course.waterAreaId)
            const isFull = course.currentBookings >= course.maxCapacity
            const alreadyBooked = isBooked(course.id)

            return (
              <div key={course.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${levelColors[course.level]}`}>
                      {course.level}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[course.status]}`}>
                      {course.status}
                    </span>
                  </div>
                  <span className="text-sm font-mono text-slate-500">{course.date}</span>
                </div>

                <div className="p-5">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <User className="w-4 h-4 text-slate-400" />
                      <span>教练: <strong>{coach?.name}</strong> <span className="text-slate-400">({coach?.level})</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="font-mono">{course.startTime} - {course.endTime}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>{water?.name}</span>
                      {water && water.status !== '正常' && (
                        <span className="flex items-center gap-1 text-xs text-amber-600">
                          <AlertTriangle className="w-3 h-3" />
                          {water.status}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span>{course.currentBookings}/{course.maxCapacity}</span>
                      {isFull && <span className="text-xs text-red-500 font-medium">已满</span>}
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    {alreadyBooked ? (
                      <span className="px-4 py-2 rounded-lg bg-slate-100 text-slate-400 text-sm">已预约</span>
                    ) : isFull ? (
                      <button
                        onClick={() => handleWaitlist(course.id)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm hover:bg-amber-600 transition-colors"
                      >
                        <ListOrdered className="w-4 h-4" />
                        加入候补
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBook(course.id)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-950 text-white text-sm hover:bg-sky-900 transition-colors"
                      >
                        <BookOpen className="w-4 h-4" />
                        预约课程
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showValidation && validationResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowValidation(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 mb-4">预约校验</h3>
            <div className="space-y-3">
              {validationResult.result.errors.length === 0 ? (
                <>
                  {validationResult.result.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-amber-50">
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-amber-700">{w}</span>
                    </div>
                  ))}
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50">
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-emerald-700">所有校验通过，可以预约</span>
                  </div>
                </>
              ) : (
                validationResult.result.errors.map((e, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-red-50">
                    <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-red-700">{e}</span>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <button onClick={() => setShowValidation(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
                取消
              </button>
              {validationResult.result.canBook && (
                <button
                  onClick={() => handleConfirmBook(validationResult.courseId)}
                  className="px-4 py-2 rounded-lg bg-sky-950 text-white text-sm hover:bg-sky-900"
                >
                  确认预约
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
