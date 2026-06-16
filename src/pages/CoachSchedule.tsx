import { useState } from 'react'
import { useKayakStore } from '@/store/useKayakStore'
import { Award, Users, CalendarX, Clock, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import type { CoachLevel } from '@/types'

const dayLabels = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日']

const levelColors: Record<CoachLevel, string> = {
  '初级': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  '中级': 'bg-amber-100 text-amber-700 border-amber-200',
  '高级': 'bg-rose-100 text-rose-700 border-rose-200',
}

export default function CoachSchedule() {
  const { coaches, waterAreas, updateCoach, addAvailableSlot, removeAvailableSlot, addBlackoutDate, removeBlackoutDate, setCurrentCoach } = useKayakStore()
  const [selectedCoachId, setSelectedCoachId] = useState(coaches[0]?.id || '')
  const [newSlotDay, setNewSlotDay] = useState(1)
  const [newSlotStart, setNewSlotStart] = useState('09:00')
  const [newSlotEnd, setNewSlotEnd] = useState('11:00')
  const [newSlotWater, setNewSlotWater] = useState(waterAreas[0]?.id || '')
  const [blackoutDate, setBlackoutDate] = useState('')
  const [blackoutReason, setBlackoutReason] = useState('')
  const [showAddSlot, setShowAddSlot] = useState(false)
  const [showAddBlackout, setShowAddBlackout] = useState(false)

  const coach = coaches.find(c => c.id === selectedCoachId)

  const handleSelectCoach = (id: string) => {
    setSelectedCoachId(id)
    setCurrentCoach(id)
  }

  const handleAddSlot = () => {
    if (!coach || !newSlotStart || !newSlotEnd) return
    addAvailableSlot(selectedCoachId, { dayOfWeek: newSlotDay, startTime: newSlotStart, endTime: newSlotEnd, waterAreaId: newSlotWater })
    setShowAddSlot(false)
  }

  const handleAddBlackout = () => {
    if (!coach || !blackoutDate || !blackoutReason) return
    addBlackoutDate(selectedCoachId, blackoutDate, blackoutReason)
    setBlackoutDate('')
    setBlackoutReason('')
    setShowAddBlackout(false)
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-sky-950 mb-6">排课管理</h1>

      <div className="flex gap-3 mb-6">
        {coaches.map(c => (
          <button
            key={c.id}
            onClick={() => handleSelectCoach(c.id)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              c.id === selectedCoachId
                ? 'bg-sky-950 text-white shadow-lg shadow-sky-900/30'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {coach && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-sky-950 to-sky-800 px-6 py-4">
              <h2 className="text-lg font-bold text-white">{coach.name} 的资质信息</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center">
                    <Award className="w-5 h-5 text-sky-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">资质等级</p>
                    <span className={`inline-block px-2.5 py-0.5 rounded-md text-sm font-medium border ${levelColors[coach.level]}`}>
                      {coach.level}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center">
                    <Users className="w-5 h-5 text-sky-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">可带人数</p>
                    <p className="text-lg font-bold text-slate-800">{coach.maxStudents} <span className="text-sm font-normal text-slate-400">人/课</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center">
                    <CalendarX className="w-5 h-5 text-sky-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">禁排日期</p>
                    <p className="text-lg font-bold text-slate-800">{coach.blackoutDates.length} <span className="text-sm font-normal text-slate-400">天</span></p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <label className="text-sm text-slate-500">调整可带人数:</label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={coach.maxStudents}
                  onChange={e => updateCoach(coach.id, { maxStudents: Number(e.target.value) })}
                  className="flex-1 max-w-[200px] accent-sky-600"
                />
                <span className="text-sm font-bold text-sky-700 w-8 text-center">{coach.maxStudents}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-600" />
                可授课时间
              </h2>
              <button
                onClick={() => setShowAddSlot(!showAddSlot)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 text-white text-sm hover:bg-cyan-600 transition-colors"
              >
                {showAddSlot ? <ChevronUp className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {showAddSlot ? '收起' : '添加时段'}
              </button>
            </div>

            {showAddSlot && (
              <div className="px-6 py-4 bg-sky-50/50 border-b border-slate-100">
                <div className="flex items-end gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">星期</label>
                    <select value={newSlotDay} onChange={e => setNewSlotDay(Number(e.target.value))} className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white">
                      {dayLabels.slice(1).map((d, i) => <option key={i} value={i + 1}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">开始时间</label>
                    <input type="time" value={newSlotStart} onChange={e => setNewSlotStart(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">结束时间</label>
                    <input type="time" value={newSlotEnd} onChange={e => setNewSlotEnd(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">水域</label>
                    <select value={newSlotWater} onChange={e => setNewSlotWater(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white">
                      {waterAreas.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
                  <button onClick={handleAddSlot} className="px-4 py-2 rounded-lg bg-sky-950 text-white text-sm hover:bg-sky-900 transition-colors">
                    确认添加
                  </button>
                </div>
              </div>
            )}

            <div className="p-6">
              {coach.availableSlots.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-6">暂无可授课时间</p>
              ) : (
                <div className="space-y-2">
                  {coach.availableSlots.map((slot, idx) => {
                    const water = waterAreas.find(w => w.id === slot.waterAreaId)
                    return (
                      <div key={idx} className="flex items-center justify-between px-4 py-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group">
                        <div className="flex items-center gap-4">
                          <span className="inline-flex items-center justify-center w-16 py-1 rounded-md bg-sky-100 text-sky-700 text-sm font-medium">
                            {dayLabels[slot.dayOfWeek]}
                          </span>
                          <span className="text-sm text-slate-600 font-mono">{slot.startTime} - {slot.endTime}</span>
                          <span className="text-xs text-slate-400">@ {water?.name || '未知'}</span>
                        </div>
                        <button
                          onClick={() => removeAvailableSlot(coach.id, slot.dayOfWeek, slot.startTime)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <CalendarX className="w-4 h-4 text-red-500" />
                禁排日期
              </h2>
              <button
                onClick={() => setShowAddBlackout(!showAddBlackout)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600 transition-colors"
              >
                {showAddBlackout ? <ChevronUp className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {showAddBlackout ? '收起' : '添加禁排'}
              </button>
            </div>

            {showAddBlackout && (
              <div className="px-6 py-4 bg-red-50/50 border-b border-slate-100">
                <div className="flex items-end gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">日期</label>
                    <input type="date" value={blackoutDate} onChange={e => setBlackoutDate(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">原因</label>
                    <input type="text" value={blackoutReason} onChange={e => setBlackoutReason(e.target.value)} placeholder="如：请假、培训" className="px-3 py-2 rounded-lg border border-slate-200 text-sm w-48" />
                  </div>
                  <button onClick={handleAddBlackout} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 transition-colors">
                    确认添加
                  </button>
                </div>
              </div>
            )}

            <div className="p-6">
              {coach.blackoutDates.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-6">暂无禁排日期</p>
              ) : (
                <div className="space-y-2">
                  {coach.blackoutDates.map((bd, idx) => (
                    <div key={idx} className="flex items-center justify-between px-4 py-3 rounded-lg bg-red-50 hover:bg-red-100/70 transition-colors group">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-mono text-red-700 font-medium">{bd.date}</span>
                        <span className="text-xs text-red-500">{bd.reason}</span>
                      </div>
                      <button
                        onClick={() => removeBlackoutDate(coach.id, bd.date)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-red-100 text-slate-400 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
