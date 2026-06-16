import { useState } from 'react'
import { useKayakStore } from '@/store/useKayakStore'
import { GraduationCap, Plus, Snowflake, TrendingUp, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import type { TransactionType } from '@/types'

const typeColors: Record<TransactionType, string> = {
  '充值': 'text-emerald-600',
  '预约消耗': 'text-slate-500',
  '取消扣费': 'text-red-600',
  '冻结': 'text-sky-600',
  '解冻': 'text-sky-500',
  '归还': 'text-emerald-500',
  '改期扣费': 'text-red-600',
  '换人扣费': 'text-red-600',
}

const typeBg: Record<TransactionType, string> = {
  '充值': 'bg-emerald-50',
  '预约消耗': 'bg-slate-50',
  '取消扣费': 'bg-red-50',
  '冻结': 'bg-sky-50',
  '解冻': 'bg-sky-50',
  '归还': 'bg-emerald-50',
  '改期扣费': 'bg-red-50',
  '换人扣费': 'bg-red-50',
}

export default function LessonManagement() {
  const { students, transactions, currentStudentId, setCurrentStudent, topUpLessons } = useKayakStore()
  const [selectedStudentId, setSelectedStudentId] = useState(currentStudentId || students[0]?.id || '')
  const [topUpAmount, setTopUpAmount] = useState(5)
  const [showTopUp, setShowTopUp] = useState(false)

  const student = students.find(s => s.id === selectedStudentId)
  const studentTransactions = transactions
    .filter(t => t.studentId === selectedStudentId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const available = student ? student.totalLessons - student.usedLessons - student.frozenLessons : 0
  const total = student?.totalLessons || 0
  const used = student?.usedLessons || 0
  const frozen = student?.frozenLessons || 0

  const usagePercent = total > 0 ? ((used / total) * 100).toFixed(0) : '0'
  const frozenPercent = total > 0 ? ((frozen / total) * 100).toFixed(0) : '0'
  const availablePercent = total > 0 ? ((available / total) * 100).toFixed(0) : '0'

  const handleTopUp = () => {
    topUpLessons(selectedStudentId, topUpAmount)
    setShowTopUp(false)
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-sky-950">课时管理</h1>
        <div className="flex items-center gap-3">
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
        <>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm">
            <div className="flex items-center gap-8">
              <div className="relative w-36 h-36">
                <svg viewBox="0 0 36 36" className="w-36 h-36 transform -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#ef4444" strokeWidth="3"
                    strokeDasharray={`${usagePercent} ${100 - Number(usagePercent)}`} strokeDashoffset="0" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#0ea5e9" strokeWidth="3"
                    strokeDasharray={`${frozenPercent} ${100 - Number(frozenPercent)}`} strokeDashoffset={`-${usagePercent}`} />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#10b981" strokeWidth="3"
                    strokeDasharray={`${availablePercent} ${100 - Number(availablePercent)}`} strokeDashoffset={`-${Number(usagePercent) + Number(frozenPercent)}`} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-sky-950">{available}</span>
                  <span className="text-xs text-slate-400">可用课时</span>
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-sm text-slate-500">可用</span>
                  </div>
                  <span className="text-lg font-bold text-emerald-600">{available}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-sky-500" />
                    <span className="text-sm text-slate-500">冻结</span>
                  </div>
                  <span className="text-lg font-bold text-sky-600">{frozen}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-sm text-slate-500">已用</span>
                  </div>
                  <span className="text-lg font-bold text-red-600">{used}</span>
                </div>
                <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                  <span className="text-sm text-slate-500">总计</span>
                  <span className="text-lg font-bold text-slate-800">{total}</span>
                </div>
              </div>

              <div>
                <button
                  onClick={() => setShowTopUp(true)}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-sky-950 text-white text-sm font-medium hover:bg-sky-900 transition-colors shadow-lg shadow-sky-900/20"
                >
                  <Plus className="w-4 h-4" />
                  充值课时
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800">课时变动记录</h2>
            </div>
            {studentTransactions.length === 0 ? (
              <div className="p-8 text-center">
                <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">暂无记录</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {studentTransactions.map(tx => (
                  <div key={tx.id} className={`px-6 py-3.5 flex items-center justify-between ${typeBg[tx.type]}`}>
                    <div className="flex items-center gap-3">
                      {tx.type === '充值' || tx.type === '归还' ? (
                        <ArrowUpCircle className="w-5 h-5 text-emerald-500" />
                      ) : tx.type === '冻结' || tx.type === '解冻' ? (
                        <Snowflake className="w-5 h-5 text-sky-500" />
                      ) : (
                        <ArrowDownCircle className="w-5 h-5 text-red-500" />
                      )}
                      <div>
                        <span className={`text-sm font-medium ${typeColors[tx.type]}`}>{tx.type}</span>
                        <p className="text-xs text-slate-400 mt-0.5">{tx.reason}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {tx.type === '取消扣费' && tx.amount === 0 ? (
                        <span className="text-sm font-bold text-red-600">不予归还</span>
                      ) : (
                        <span className={`text-sm font-bold ${tx.type === '充值' || tx.type === '归还' || tx.type === '解冻' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {tx.type === '充值' || tx.type === '归还' || tx.type === '解冻' ? '+' : '-'}{tx.amount}
                        </span>
                      )}
                      <p className="text-xs text-slate-400 mt-0.5">{tx.createdAt.slice(0, 16).replace('T', ' ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {showTopUp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowTopUp(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 mb-4">充值课时</h3>
            <div className="mb-4">
              <label className="block text-sm text-slate-500 mb-2">充值数量</label>
              <input
                type="range"
                min={1}
                max={50}
                value={topUpAmount}
                onChange={e => setTopUpAmount(Number(e.target.value))}
                className="w-full accent-sky-600"
              />
              <p className="text-center text-2xl font-bold text-sky-950 mt-2">{topUpAmount} <span className="text-sm font-normal text-slate-400">课时</span></p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowTopUp(false)} className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600">
                取消
              </button>
              <button onClick={handleTopUp} className="flex-1 px-4 py-2 rounded-lg bg-sky-950 text-white text-sm hover:bg-sky-900">
                确认充值
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
