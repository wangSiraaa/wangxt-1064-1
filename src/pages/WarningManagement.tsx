import { useState } from 'react'
import { useKayakStore } from '@/store/useKayakStore'
import { AlertTriangle, Droplets, Cloud, ShieldAlert, CheckCircle, XCircle, Plus } from 'lucide-react'
import type { WarningType, WarningSeverity } from '@/types'

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

export default function WarningManagement() {
  const { waterAreas, warnings, courses, bookings, students, coaches, issueWarning, resolveWarning } = useKayakStore()
  const [showIssueForm, setShowIssueForm] = useState(false)
  const [warningType, setWarningType] = useState<WarningType>('水位预警')
  const [selectedAreaIds, setSelectedAreaIds] = useState<string[]>([])
  const [severity, setSeverity] = useState<WarningSeverity>('中')
  const [message, setMessage] = useState('')

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

  const getAffectedCourses = (areaId: string) => courses.filter(c => c.waterAreaId === areaId && (c.status === '正常' || c.status === '待改期'))

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
              <div className="flex gap-3">
                <button
                  onClick={() => setWarningType('水位预警')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                    warningType === '水位预警' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <Droplets className="w-4 h-4" />
                  水位预警 (课程自动停课)
                </button>
                <button
                  onClick={() => setWarningType('天气预警')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                    warningType === '天气预警' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <Cloud className="w-4 h-4" />
                  天气预警 (课程待改期)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">影响水域</label>
              <div className="flex gap-3">
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
              </div>
              <div className="p-4">
                <p className="text-xs text-slate-400">受影响课程: <span className="font-medium text-slate-600">{affectedCourses.length}</span></p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">预警记录</h2>
        </div>
        {activeWarnings.length === 0 && resolvedWarnings.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-10 h-10 text-emerald-300 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">暂无预警记录，水域一切正常</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {[...activeWarnings, ...resolvedWarnings].map(w => (
              <div key={w.id} className={`px-6 py-4 ${w.status === '生效中' ? 'bg-red-50/50' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {w.type === '水位预警' ? (
                      <Droplets className="w-5 h-5 text-red-500" />
                    ) : (
                      <Cloud className="w-5 h-5 text-amber-500" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">{w.type}</span>
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          w.severity === '高' ? 'bg-red-100 text-red-700' : w.severity === '中' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'
                        }`}>{w.severity}</span>
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          w.status === '生效中' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
                        }`}>{w.status}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{w.message}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        影响水域: {w.waterAreaIds.map(id => waterAreas.find(a => a.id === id)?.name).join('、')} · {w.createdAt.slice(0, 16).replace('T', ' ')}
                      </p>
                    </div>
                  </div>
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
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
