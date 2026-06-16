import { useState } from 'react'
import { useKayakStore } from '@/store/useKayakStore'
import { AlertTriangle, Droplets, Cloud, ShieldAlert, CheckCircle, XCircle, Plus, ShieldCheck, Waves, Info, ChevronDown, ChevronUp, Users } from 'lucide-react'
import type { WarningType, WarningSeverity, WarningCourseEffect, CourseStatus } from '@/types'

const statusColors: Record<string, string> = {
  '正常': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  '水位预警': 'bg-red-100 text-red-700 border-red-200',
  '天气预警': 'bg-amber-100 text-amber-700 border-amber-200',
  '停课': 'bg-slate-200 text-slate-600 border-slate-300',
}

const statusIcons: Record<string, typeof Droplets> = {
  '正常': CheckCircle,
  '水位预警': Droplets,
  '天气预警': Cloud,
  '停课': ShieldAlert,
}

const effectDisplayColors: Record<string, string> = {
  '保留': 'bg-emerald-50 border-emerald-200 text-emerald-700',
  '部分保留': 'bg-amber-50 border-amber-200 text-amber-700',
  '待改期': 'bg-orange-50 border-orange-200 text-orange-700',
  '停课': 'bg-red-50 border-red-200 text-red-700',
}

const effectDisplayIcons: Record<string, typeof ShieldCheck> = {
  '保留': ShieldCheck,
  '部分保留': Info,
  '待改期': AlertTriangle,
  '停课': XCircle,
}

const getEffectDisplay = (effect: WarningCourseEffect): { label: string; category: '保留' | '部分保留' | '待改期' | '停课' } => {
  const { handlingType, newStatus } = effect

  if (handlingType === '保留(岸上课)') {
    if (newStatus === '正常') {
      return { label: '保留', category: '保留' }
    } else if (newStatus === '部分保留') {
      return { label: '部分保留', category: '部分保留' }
    }
    return { label: '保留', category: '保留' }
  }

  if (handlingType === '改期(水上课)') {
    return { label: '待改期', category: '待改期' }
  }

  if (handlingType === '停课') {
    return { label: '停课', category: '停课' }
  }

  return { label: newStatus, category: '待改期' }
}

export default function WarningManagement() {
  const { waterAreas, warnings, courses, bookings, students, coaches, issueWarning, resolveWarning } = useKayakStore()
  const [showIssueForm, setShowIssueForm] = useState(false)
  const [warningType, setWarningType] = useState<WarningType>('水位预警')
  const [selectedAreaIds, setSelectedAreaIds] = useState<string[]>([])
  const [severity, setSeverity] = useState<WarningSeverity>('中')
  const [message, setMessage] = useState('')
  const [expandedWarning, setExpandedWarning] = useState<string | null>(null)

  const activeWarnings = warnings.filter(w => w.status === '生效中')
  const resolvedWarnings = warnings.filter(w => w.status === '已解除')

  const toggleArea = (id: string) => {
    setSelectedAreaIds(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id])
  }

  const handleIssue = () => {
    if (selectedAreaIds.length === 0 || !message) return
    issueWarning(warningType, selectedAreaIds, severity, message)
    setShowIssueForm(false)
    setSelectedAreaIds([])
    setMessage('')
    setSeverity('中')
  }

  const getAffectedCourses = (areaId: string) => courses.filter(c => c.waterAreaId === areaId && (c.status === '正常' || c.status === '待改期' || c.status === '部分保留'))

  const countCourseEffects = (effects?: WarningCourseEffect[]) => {
    if (!effects || effects.length === 0) return { keep: 0, partial: 0, reschedule: 0, cancel: 0 }
    return effects.reduce((acc, effect) => {
      const { category } = getEffectDisplay(effect)
      if (category === '保留') acc.keep += 1
      else if (category === '部分保留') acc.partial += 1
      else if (category === '待改期') acc.reschedule += 1
      else if (category === '停课') acc.cancel += 1
      return acc
    }, { keep: 0, partial: 0, reschedule: 0, cancel: 0 })
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-sky-950">预警管理</h1>
        <button
          onClick={() => setShowIssueForm(!showIssueForm)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
        >
          <Plus className="w-4 h-4" />
          发布预警
        </button>
      </div>

      {showIssueForm && (
        <div className="bg-white rounded-2xl border-2 border-red-200 p-6 mb-6 shadow-lg shadow-red-500/5">
          <h3 className="text-lg font-bold text-red-700 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            发布新预警
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">预警类型</label>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => setWarningType('水位预警')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                    warningType === '水位预警' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <Droplets className="w-4 h-4" />
                  水位预警（岸上课保留，水上课待改期）
                </button>
                <button
                  onClick={() => setWarningType('天气预警')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                    warningType === '天气预警' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <Cloud className="w-4 h-4" />
                  天气预警（所有课程待改期）
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">影响水域</label>
              <div className="flex gap-3 flex-wrap">
                {waterAreas.map(area => (
                  <button
                    key={area.id}
                    onClick={() => toggleArea(area.id)}
                    className={`px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                      selectedAreaIds.includes(area.id)
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {area.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">紧急程度</label>
              <div className="flex gap-3">
                {(['低', '中', '高'] as WarningSeverity[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setSeverity(s)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                      severity === s
                        ? s === '高' ? 'border-red-500 bg-red-50 text-red-700'
                          : s === '中' ? 'border-amber-500 bg-amber-50 text-amber-700'
                            : 'border-sky-500 bg-sky-50 text-sky-700'
                        : 'border-slate-200 text-slate-500'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">预警说明</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
                placeholder="请描述预警详情..."
              />
            </div>

            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-xs text-amber-700 space-y-1">
                  <p className="font-medium">智能处理规则：</p>
                  <ul className="list-disc list-inside space-y-0.5 ml-1">
                    <li>水位预警时，<span className="font-medium">岸上安全课</span>将正常保留</li>
                    <li>岸上课占比≥50%的组合课<span className="font-medium">部分保留</span>（水上部分待改期）</li>
                    <li>纯水上实操课和体验营<span className="font-medium">全部待改期</span></li>
                    <li>天气预警时<span className="font-medium">所有课程待改期</span></li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowIssueForm(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600">
                取消
              </button>
              <button
                onClick={handleIssue}
                disabled={selectedAreaIds.length === 0 || !message}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认发布
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        {waterAreas.map(area => {
          const StatusIcon = statusIcons[area.status] || CheckCircle
          const affectedCourses = getAffectedCourses(area.id)
          const activeWarning = activeWarnings.find(w => w.waterAreaIds.includes(area.id))
          const courseCounts = countCourseEffects(activeWarning?.affectedCourses)
          return (
            <div key={area.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className={`px-5 py-4 border-b-2 ${area.status === '正常' ? 'border-emerald-300 bg-emerald-50' : area.status === '水位预警' ? 'border-red-300 bg-red-50' : area.status === '天气预警' ? 'border-amber-300 bg-amber-50' : 'border-slate-300 bg-slate-50'}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800">{area.name}</h3>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium border ${statusColors[area.status]}`}>
                    <StatusIcon className="w-3 h-3" />
                    {area.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{area.description}</p>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {area.allowedBoatTypes && area.allowedBoatTypes.length > 0 && (
                    <span className="text-xs text-slate-400">艇型: {area.allowedBoatTypes.join('、')}</span>
                  )}
                  {area.allowChildren !== undefined && (
                    <span className={`text-xs ${area.allowChildren ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {area.allowChildren ? '允许儿童' : '限成人'}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">受影响课程</p>
                  <p className="text-sm font-bold text-slate-700">{affectedCourses.length}</p>
                </div>
                {activeWarning && activeWarning.affectedCourses && activeWarning.affectedCourses.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {courseCounts.keep > 0 && (
                      <div className="flex items-center gap-1.5 bg-emerald-50 rounded-lg px-2 py-1.5">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span className="text-xs text-emerald-700">保留 {courseCounts.keep}</span>
                      </div>
                    )}
                    {courseCounts.partial > 0 && (
                      <div className="flex items-center gap-1.5 bg-amber-50 rounded-lg px-2 py-1.5">
                        <Info className="w-3 h-3 text-amber-600" />
                        <span className="text-xs text-amber-700">部分保留 {courseCounts.partial}</span>
                      </div>
                    )}
                    {courseCounts.reschedule > 0 && (
                      <div className="flex items-center gap-1.5 bg-orange-50 rounded-lg px-2 py-1.5">
                        <AlertTriangle className="w-3 h-3 text-orange-600" />
                        <span className="text-xs text-orange-700">待改期 {courseCounts.reschedule}</span>
                      </div>
                    )}
                    {courseCounts.cancel > 0 && (
                      <div className="flex items-center gap-1.5 bg-red-50 rounded-lg px-2 py-1.5">
                        <XCircle className="w-3 h-3 text-red-600" />
                        <span className="text-xs text-red-700">停课 {courseCounts.cancel}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800">预警记录</h2>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>保留</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span>部分保留</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"></span>待改期</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span>停课</span>
          </div>
        </div>
        {activeWarnings.length === 0 && resolvedWarnings.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-10 h-10 text-emerald-300 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">暂无预警记录，水域一切正常</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {[...activeWarnings, ...resolvedWarnings].map(w => {
              const isExpanded = expandedWarning === w.id
              const counts = countCourseEffects(w.affectedCourses)
              return (
                <div key={w.id} className={`${w.status === '生效中' ? 'bg-red-50/50' : ''}`}>
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {w.type === '水位预警' ? (
                          <Droplets className="w-5 h-5 text-red-500" />
                        ) : (
                          <Cloud className="w-5 h-5 text-amber-500" />
                        )}
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-slate-800">{w.type}</span>
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                              w.severity === '高' ? 'bg-red-100 text-red-700' : w.severity === '中' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'
                            }`}>{w.severity}</span>
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                              w.status === '生效中' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
                            }`}>{w.status}</span>
                            {counts.keep > 0 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                                <ShieldCheck className="w-3 h-3" />保留 {counts.keep}
                              </span>
                            )}
                            {counts.partial > 0 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                                <Info className="w-3 h-3" />部分 {counts.partial}
                              </span>
                            )}
                            {counts.reschedule > 0 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
                                <AlertTriangle className="w-3 h-3" />改期 {counts.reschedule}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{w.message}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            影响水域: {w.waterAreaIds.map(id => waterAreas.find(a => a.id === id)?.name).join('、')} · {w.createdAt.slice(0, 16).replace('T', ' ')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {w.affectedCourses && w.affectedCourses.length > 0 && (
                          <button
                            onClick={() => setExpandedWarning(isExpanded ? null : w.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/60 transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        )}
                        {w.status === '生效中' && (
                          <button
                            onClick={() => resolveWarning(w.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-sm hover:bg-emerald-600 transition-colors"
                          >
                            解除预警
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && w.affectedCourses && w.affectedCourses.length > 0 && (
                    <div className="px-6 pb-4">
                      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="grid grid-cols-6 gap-4 px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500 uppercase tracking-wide">
                          <div className="col-span-2">课程</div>
                          <div>类型</div>
                          <div>处理结果</div>
                          <div className="col-span-2">原因</div>
                        </div>
                        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                          {w.affectedCourses.map((effect, i) => {
                            const course = courses.find(c => c.id === effect.courseId)
                            const coach = course ? coaches.find(c => c.id === course.coachId) : null
                            const { label, category } = getEffectDisplay(effect)
                            const EffectIcon = effectDisplayIcons[category] || Info
                            return (
                              <div key={i} className="grid grid-cols-6 gap-4 px-4 py-3 items-center hover:bg-slate-50 transition-colors">
                                <div className="col-span-2">
                                  <p className="text-sm font-medium text-slate-700">{course?.date} {course?.startTime}-{course?.endTime}</p>
                                  <p className="text-xs text-slate-400">教练: {coach?.name} · Lv.{course?.level}</p>
                                </div>
                                <div>
                                  {course?.courseType === '岸上安全课' && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-600">
                                      <ShieldCheck className="w-3 h-3" />岸上安全课
                                    </span>
                                  )}
                                  {course?.courseType === '水上实操课' && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-sky-50 text-sky-600">
                                      <Waves className="w-3 h-3" />水上实操课
                                    </span>
                                  )}
                                  {course?.courseType === '体验营' && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-violet-50 text-violet-600">
                                      <Users className="w-3 h-3" />体验营
                                    </span>
                                  )}
                                  {course?.courseType === '组合课' && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-600">
                                      组合课 {course?.shoreLessonProportion !== undefined ? `${Math.round(course.shoreLessonProportion * 100)}%岸上` : ''}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${effectDisplayColors[category] || effectDisplayColors['待改期']}`}>
                                    <EffectIcon className="w-3 h-3" />
                                    {label}
                                  </span>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-xs text-slate-500">{effect.reason}</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
