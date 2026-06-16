import { useState } from 'react'
import { useKayakStore } from '@/store/useKayakStore'
import { BookOpen, User, MapPin, Clock, AlertTriangle, CheckCircle, XCircle, Users, ListOrdered, Ship, Users2, Calculator, ChevronDown, ChevronUp, ShieldCheck, Waves } from 'lucide-react'
import type { CoachLevel, CourseType, BoatType, ParticipantRole } from '@/types'

const levelColors: Record<CoachLevel, string> = {
  '初级': 'bg-emerald-100 text-emerald-700',
  '中级': 'bg-amber-100 text-amber-700',
  '高级': 'bg-rose-100 text-rose-700',
}

const courseTypeColors: Record<CourseType, string> = {
  '岸上安全课': 'bg-slate-100 text-slate-700',
  '水上实操课': 'bg-sky-100 text-sky-700',
  '组合课': 'bg-indigo-100 text-indigo-700',
  '体验营': 'bg-purple-100 text-purple-700',
}

const statusColors: Record<string, string> = {
  '正常': 'bg-emerald-100 text-emerald-700',
  '停课': 'bg-red-100 text-red-700',
  '待改期': 'bg-amber-100 text-amber-700',
  '已完成': 'bg-slate-100 text-slate-500',
  '部分保留': 'bg-teal-100 text-teal-700',
}

const roleColors: Record<ParticipantRole, string> = {
  '成人': 'bg-sky-100 text-sky-700',
  '儿童': 'bg-pink-100 text-pink-700',
}

const boatTypeIcons: Partial<Record<BoatType, string>> = {
  '单人皮划艇': '🚣',
  '双人皮划艇': '🚣‍♂️',
  '亲子双人艇': '👨‍👧',
  'SUP桨板': '🏄',
  '独木舟': '🛶',
}

export default function CourseBooking() {
  const { courses, coaches, waterAreas, students, bookings, families, currentStudentId, setCurrentStudent, validateBooking, createBooking, joinWaitlist, getStudentFamily, getFamilyMembers } = useKayakStore()
  const [selectedStudentId, setSelectedStudentId] = useState(currentStudentId || students[0]?.id || '')
  const [filterLevel, setFilterLevel] = useState<CoachLevel | '全部'>('全部')
  const [filterCourseType, setFilterCourseType] = useState<CourseType | '全部'>('全部')
  const [filterDate, setFilterDate] = useState('')
  const [useFamilyBooking, setUseFamilyBooking] = useState(false)
  const [selectedFamilyMemberIds, setSelectedFamilyMemberIds] = useState<string[]>([])
  const [validationResult, setValidationResult] = useState<{ courseId: string; result: ReturnType<typeof validateBooking> } | null>(null)
  const [showValidation, setShowValidation] = useState(false)
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null)

  const student = students.find(s => s.id === selectedStudentId)
  const family = student ? getStudentFamily(student.id) : undefined
  const familyMembers = family ? getFamilyMembers(family.id) : []
  const availableLessons = student ? student.totalLessons - student.usedLessons - student.frozenLessons : 0

  const allSelectedIds = [selectedStudentId, ...selectedFamilyMemberIds]

  const filteredCourses = courses.filter(c => {
    if (c.status !== '正常' && c.status !== '待改期' && c.status !== '部分保留') return false
    if (filterLevel !== '全部' && c.level !== filterLevel) return false
    if (filterCourseType !== '全部' && c.courseType !== filterCourseType) return false
    if (filterDate && c.date !== filterDate) return false
    return true
  })

  const handleStudentChange = (id: string) => {
    setSelectedStudentId(id)
    setCurrentStudent(id)
    setUseFamilyBooking(false)
    setSelectedFamilyMemberIds([])
  }

  const toggleFamilyMember = (id: string) => {
    setSelectedFamilyMemberIds(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  const handleBook = (courseId: string) => {
    if (!selectedStudentId) return
    const additionalIds = useFamilyBooking ? selectedFamilyMemberIds : []
    const result = validateBooking(selectedStudentId, courseId, additionalIds)
    setValidationResult({ courseId, result })
    setShowValidation(true)
  }

  const handleConfirmBook = (courseId: string) => {
    if (!selectedStudentId) return
    const additionalIds = useFamilyBooking ? selectedFamilyMemberIds : []
    createBooking(selectedStudentId, courseId, additionalIds)
    setShowValidation(false)
    setValidationResult(null)
  }

  const handleWaitlist = (courseId: string) => {
    if (!selectedStudentId) return
    joinWaitlist(selectedStudentId, courseId)
  }

  const isBooked = (courseId: string) => {
    return allSelectedIds.some(sid =>
      bookings.some(b => b.studentId === sid && b.courseId === courseId && (b.status === '已预约' || b.status === '候补'))
    )
  }

  const renderCostBreakdown = (breakdown: { type: string; amount: number; description: string }[], finalCost: number) => (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
      <div className="flex items-center gap-2 mb-3">
        <Calculator className="w-4 h-4 text-sky-600" />
        <span className="font-semibold text-slate-700 text-sm">费用计算明细</span>
      </div>
      <div className="space-y-1.5">
        {breakdown.map((item, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-slate-500">{item.description}</span>
            <span className={`font-mono font-medium ${item.amount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {item.amount > 0 ? '+' : ''}{item.amount}课时
            </span>
          </div>
        ))}
        <div className="border-t border-slate-200 my-2" />
        <div className="flex justify-between font-bold text-sm">
          <span className="text-slate-700">合计</span>
          <span className="text-sky-700 font-mono text-base">{finalCost}课时</span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-sky-950 mb-6">课程预约</h1>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm">
        <div className="flex items-start gap-6 flex-wrap">
          <div>
            <label className="block text-xs text-slate-400 mb-1">主预约人</label>
            <select value={selectedStudentId} onChange={e => handleStudentChange(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white min-w-[160px]">
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.role}·{s.level}·{s.age}岁)
                </option>
              ))}
            </select>
          </div>

          {student && (
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">剩余课时</label>
                <span className={`text-xl font-bold ${availableLessons > 0 ? 'text-emerald-600' : 'text-red-500'}`}>{availableLessons}</span>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">学员级别</label>
                <span className={`px-2.5 py-0.5 rounded-md text-sm font-medium ${levelColors[student.level]}`}>
                  {student.level}
                </span>
              </div>
              {student.role && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">身份</label>
                  <span className={`px-2.5 py-0.5 rounded-md text-sm font-medium ${roleColors[student.role]}`}>
                    {student.role} {student.age}岁
                  </span>
                </div>
              )}
            </div>
          )}

          {family && familyMembers.length > 1 && (
            <div className="flex-1 min-w-[300px]">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useFamilyBooking}
                  onChange={e => {
                    setUseFamilyBooking(e.target.checked)
                    if (!e.target.checked) setSelectedFamilyMemberIds([])
                  }}
                  className="w-4 h-4 rounded text-sky-600"
                />
                <Users2 className="w-4 h-4 text-sky-600" />
                <span>家庭/组合预约 (可添加家庭成员共享此课程)</span>
              </label>
              {useFamilyBooking && (
                <div className="flex flex-wrap gap-2 ml-6">
                  {familyMembers.filter(m => m.id !== selectedStudentId).map(m => {
                    const checked = selectedFamilyMemberIds.includes(m.id)
                    return (
                      <label key={m.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-colors border ${
                        checked ? 'bg-sky-50 border-sky-300 text-sky-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}>
                        <input type="checkbox" checked={checked} onChange={() => toggleFamilyMember(m.id)} className="w-3.5 h-3.5 rounded text-sky-600" />
                        <span className={`px-1.5 py-0.5 rounded text-xs ${roleColors[m.role]}`}>{m.role}</span>
                        <span>{m.name}</span>
                        <span className="text-slate-400 text-xs">{m.age}岁·{m.level}</span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="h-px bg-slate-100 my-5" />

        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <label className="block text-xs text-slate-400 mb-1">课程级别</label>
            <select value={filterLevel} onChange={e => setFilterLevel(e.target.value as CoachLevel | '全部')} className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white">
              <option value="全部">全部级别</option>
              <option value="初级">初级</option>
              <option value="中级">中级</option>
              <option value="高级">高级</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">课程类型</label>
            <select value={filterCourseType} onChange={e => setFilterCourseType(e.target.value as CourseType | '全部')} className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white">
              <option value="全部">全部类型</option>
              <option value="岸上安全课">岸上安全课</option>
              <option value="水上实操课">水上实操课</option>
              <option value="组合课">组合课</option>
              <option value="体验营">体验营</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">日期筛选</label>
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
          </div>
          {filterDate && (
            <button onClick={() => setFilterDate('')} className="text-xs text-sky-600 hover:text-sky-700 mt-5">清除日期</button>
          )}
        </div>
      </div>

      {filteredCourses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400">暂无可预约课程</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCourses.map(course => {
            const coach = coaches.find(c => c.id === course.coachId)
            const water = waterAreas.find(w => w.id === course.waterAreaId)
            const isFull = course.currentBookings >= course.maxCapacity
            const alreadyBooked = isBooked(course.id)
            const isExpanded = expandedCourse === course.id

            return (
              <div key={course.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${levelColors[course.level]}`}>
                      {course.level}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${courseTypeColors[course.courseType]}`}>
                      {course.isOnShoreOnly ? <ShieldCheck className="w-3 h-3 inline mr-1" /> : <Waves className="w-3 h-3 inline mr-1" />}
                      {course.courseType}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[course.status]}`}>
                      {course.status}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{course.date}</span>
                    <span className="text-xs text-sky-600 font-semibold">
                      {course.lessonCost}课时/人
                    </span>
                    {course.allowFamilyBooking && (
                      <span className="px-1.5 py-0.5 rounded text-xs bg-pink-50 text-pink-600 border border-pink-100">
                        <Users2 className="w-3 h-3 inline mr-0.5" />支持家庭
                      </span>
                    )}
                    {course.warningHandling?.retained && (
                      <span className="px-1.5 py-0.5 rounded text-xs bg-teal-50 text-teal-600 border border-teal-100">
                        <ShieldCheck className="w-3 h-3 inline mr-0.5" />岸上部分可保留
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setExpandedCourse(isExpanded ? null : course.id)}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>

                <div className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <User className="w-4 h-4 text-slate-400" />
                        <span>教练: <strong>{coach?.name}</strong> <span className="text-slate-400">({coach?.level})</span></span>
                        {coach?.isFamilyCoach && <span className="text-xs px-1.5 py-0.5 rounded bg-pink-50 text-pink-600">亲子教练</span>}
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
                        {water && !water.allowChildren && <span className="text-xs px-1.5 py-0.5 rounded bg-orange-50 text-orange-600">限成人</span>}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span>{course.currentBookings}/{course.maxCapacity}人</span>
                        {isFull && <span className="text-xs text-red-500 font-medium">已满</span>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Ship className="w-4 h-4 text-slate-400" />
                        <span>可用艇型: </span>
                        <div className="flex gap-1">
                          {course.boatTypes.map(bt => (
                            <span key={bt} className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600" title={bt}>
                              {boatTypeIcons[bt] || '🛶'} {bt}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-sm text-slate-600">
                        <span className="text-slate-400">年龄要求: </span>
                        <span className="font-medium">{course.minAge}岁以上</span>
                        {course.maxAge && <span className="font-medium"> - {course.maxAge}岁</span>}
                      </div>
                      {course.shoreLessonProportion !== undefined && course.shoreLessonProportion > 0 && (
                        <div className="text-sm text-slate-600">
                          <span className="text-slate-400">岸上内容占比: </span>
                          <span className="font-medium text-teal-600">{Math.round(course.shoreLessonProportion * 100)}%</span>
                        </div>
                      )}
                      {course.warningHandling && (
                        <div className="text-xs p-2 rounded bg-teal-50 text-teal-700 border border-teal-100">
                          <ShieldCheck className="w-3 h-3 inline mr-1" />
                          {course.warningHandling.reason}
                        </div>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      {(() => {
                        const additionalIds = useFamilyBooking ? selectedFamilyMemberIds : []
                        const preview = validateBooking(selectedStudentId, course.id, additionalIds)
                        return renderCostBreakdown(preview.costBreakdown, preview.estimatedCost)
                      })()}
                    </div>
                  )}

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
                    {!alreadyBooked && !isFull && !isExpanded && (
                      <button
                        onClick={() => setExpandedCourse(course.id)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <Calculator className="w-4 h-4" />
                        查看费用明细
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
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 mb-4">预约校验与费用明细</h3>
            <div className="space-y-3">
              {Object.entries(validationResult.result.participantValidations).length > 0 && (
                <div className="space-y-2">
                  {Object.entries(validationResult.result.participantValidations).map(([pid, pv]) => {
                    const s = students.find(st => st.id === pid)
                    return (
                      <div key={pid} className="p-3 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`px-1.5 py-0.5 rounded text-xs ${roleColors[s?.role || '成人']}`}>{s?.role}</span>
                          <span className="font-medium text-slate-700 text-sm">{s?.name}</span>
                          <span className="text-xs text-slate-400">{s?.age}岁·{s?.level}</span>
                          {pv.canBook
                            ? <CheckCircle className="w-4 h-4 text-emerald-500 ml-auto" />
                            : <XCircle className="w-4 h-4 text-red-500 ml-auto" />}
                        </div>
                        {pv.errors.map((e, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-xs text-red-600">
                            <XCircle className="w-3 h-3 shrink-0 mt-0.5" />
                            <span>{e}</span>
                          </div>
                        ))}
                        {pv.warnings.map((w, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-xs text-amber-600">
                            <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                            <span>{w}</span>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              )}

              {validationResult.result.warnings.filter(w => !Object.values(validationResult.result.participantValidations).some(pv => pv.warnings.includes(w))).map((w, i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-amber-50">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-amber-700">{w}</span>
                </div>
              ))}

              {validationResult.result.errors.length === 0 ? (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-emerald-700">所有校验通过</span>
                </div>
              ) : (
                validationResult.result.errors.map((e, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-red-50">
                    <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-red-700">{e}</span>
                  </div>
                ))
              )}

              {renderCostBreakdown(validationResult.result.costBreakdown, validationResult.result.estimatedCost)}
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
