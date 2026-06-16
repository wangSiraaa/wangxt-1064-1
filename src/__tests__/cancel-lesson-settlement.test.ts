import { describe, it, expect, beforeEach } from 'vitest'
import { useKayakStore } from '@/store/useKayakStore'

function getAvailable(s: { totalLessons: number; usedLessons: number; frozenLessons: number }) {
  return s.totalLessons - s.usedLessons - s.frozenLessons
}

describe('课时结算回归验证', () => {
  beforeEach(() => {
    useKayakStore.getState().resetData()
  })

  it('预约成功扣课时，课程开始后取消不再重复扣课时', () => {
    const state = useKayakStore.getState()
    const student = state.students.find(s => s.name === '孙丽')!
    const course = state.courses.find(c =>
      c.status === '正常' && c.level === '初级' && c.currentBookings < c.maxCapacity && c.lessonCost === 1
    )!

    const beforeAvailable = getAvailable(student)
    const beforeUsed = student.usedLessons
    const cost = course.lessonCost

    const booking = state.createBooking(student.id, course.id)
    expect(booking).not.toBeNull()

    const afterBook = useKayakStore.getState().students.find(s => s.id === student.id)!
    expect(getAvailable(afterBook)).toBe(beforeAvailable - cost)
    expect(afterBook.usedLessons).toBe(beforeUsed + cost)

    const bookTx = useKayakStore.getState().transactions.filter(
      t => t.studentId === student.id && t.type === '预约消耗'
    )
    expect(bookTx.length).toBe(1)
    expect(bookTx[0].amount).toBe(cost)

    useKayakStore.getState().cancelBooking(booking!.id, true)

    const afterCancel = useKayakStore.getState().students.find(s => s.id === student.id)!
    expect(getAvailable(afterCancel)).toBe(beforeAvailable - cost)
    expect(afterCancel.usedLessons).toBe(beforeUsed + cost)

    const cancelTx = useKayakStore.getState().transactions.filter(
      t => t.studentId === student.id && t.type === '取消扣费'
    )
    expect(cancelTx.length).toBe(1)
    expect(cancelTx[0].amount).toBe(0)
    expect(cancelTx[0].reason).toContain('不予归还')

    const totalDeduction = useKayakStore.getState().transactions
      .filter(t => t.studentId === student.id && (t.type === '预约消耗' || t.type === '取消扣费'))
      .reduce((sum, t) => sum + t.amount, 0)
    expect(totalDeduction).toBe(cost)
  })

  it('预约成功扣课时，课程开始前取消归还课时', () => {
    const state = useKayakStore.getState()
    const student = state.students.find(s => s.name === '孙丽')!
    const course = state.courses.find(c =>
      c.status === '正常' && c.level === '初级' && c.currentBookings < c.maxCapacity && c.lessonCost === 1
    )!

    const beforeAvailable = getAvailable(student)
    const beforeUsed = student.usedLessons
    const cost = course.lessonCost

    const booking = state.createBooking(student.id, course.id)
    expect(booking).not.toBeNull()

    const afterBook = useKayakStore.getState().students.find(s => s.id === student.id)!
    expect(getAvailable(afterBook)).toBe(beforeAvailable - cost)
    expect(afterBook.usedLessons).toBe(beforeUsed + cost)

    useKayakStore.getState().cancelBooking(booking!.id, false)

    const afterCancel = useKayakStore.getState().students.find(s => s.id === student.id)!
    expect(getAvailable(afterCancel)).toBe(beforeAvailable)
    expect(afterCancel.usedLessons).toBe(beforeUsed)

    const returnTx = useKayakStore.getState().transactions.filter(
      t => t.studentId === student.id && t.type === '归还'
    )
    expect(returnTx.length).toBe(1)
    expect(returnTx[0].amount).toBe(cost)
  })

  it('课程开始后取消：usedLessons 不变，仅记录信息型交易', () => {
    const state = useKayakStore.getState()
    const student = state.students.find(s => s.name === '孙丽')!
    const course = state.courses.find(c =>
      c.status === '正常' && c.level === '初级' && c.currentBookings < c.maxCapacity && c.lessonCost === 1
    )!

    const beforeUsed = student.usedLessons

    const booking = state.createBooking(student.id, course.id)
    expect(booking).not.toBeNull()

    const afterBook = useKayakStore.getState().students.find(s => s.id === student.id)!
    const usedAfterBook = afterBook.usedLessons
    expect(usedAfterBook).toBe(beforeUsed + course.lessonCost)

    useKayakStore.getState().cancelBooking(booking!.id, true)

    const afterCancel = useKayakStore.getState().students.find(s => s.id === student.id)!
    expect(afterCancel.usedLessons).toBe(usedAfterBook)
  })

  it('calculateCancelCost isStarted=true 返回0额外扣减', () => {
    const state = useKayakStore.getState()
    const student = state.students.find(s => s.name === '孙丽')!
    const course = state.courses.find(c =>
      c.status === '正常' && c.level === '初级' && c.currentBookings < c.maxCapacity && c.lessonCost === 1
    )!

    const booking = state.createBooking(student.id, course.id)
    expect(booking).not.toBeNull()

    const cost = useKayakStore.getState().calculateCancelCost(booking!.id, true)
    expect(cost.finalCost).toBe(0)
    expect(cost.explanation).toContain('不予归还')
  })

  it('calculateCancelCost isStarted=false 返回负数(归还)', () => {
    const state = useKayakStore.getState()
    const student = state.students.find(s => s.name === '孙丽')!
    const course = state.courses.find(c =>
      c.status === '正常' && c.level === '初级' && c.currentBookings < c.maxCapacity && c.lessonCost === 1
    )!

    const booking = state.createBooking(student.id, course.id)
    expect(booking).not.toBeNull()

    const cost = useKayakStore.getState().calculateCancelCost(booking!.id, false)
    expect(cost.finalCost).toBeLessThan(0)
    expect(cost.explanation).toContain('归还')
  })

  it('预约消耗和取消扣费交易记录正确，无双重扣费', () => {
    const state = useKayakStore.getState()
    const student = state.students.find(s => s.name === '孙丽')!
    const course = state.courses.find(c =>
      c.status === '正常' && c.level === '初级' && c.currentBookings < c.maxCapacity && c.lessonCost === 1
    )!

    const booking = state.createBooking(student.id, course.id)
    expect(booking).not.toBeNull()
    const lessonCost = booking!.totalLessonCost

    const bookTx = useKayakStore.getState().transactions.filter(
      t => t.bookingId === booking!.id && t.type === '预约消耗'
    )
    expect(bookTx.length).toBe(1)
    expect(bookTx[0].amount).toBe(lessonCost)

    useKayakStore.getState().cancelBooking(booking!.id, true)

    const cancelTx = useKayakStore.getState().transactions.filter(
      t => t.bookingId === booking!.id && t.type === '取消扣费'
    )
    expect(cancelTx.length).toBe(1)
    expect(cancelTx[0].amount).toBe(0)

    const allTxForBooking = useKayakStore.getState().transactions.filter(
      t => t.bookingId === booking!.id
    )
    const totalDebit = allTxForBooking
      .filter(t => t.type === '预约消耗' || t.type === '取消扣费')
      .reduce((sum, t) => sum + t.amount, 0)
    const totalCredit = allTxForBooking
      .filter(t => t.type === '归还')
      .reduce((sum, t) => sum + t.amount, 0)

    expect(totalDebit).toBe(lessonCost)
    expect(totalCredit).toBe(0)
  })

  it('课时管理页面剩余课时 = 总课时 - 已用 - 冻结', () => {
    const state = useKayakStore.getState()
    const student = state.students.find(s => s.name === '孙丽')!
    const course = state.courses.find(c =>
      c.status === '正常' && c.level === '初级' && c.currentBookings < c.maxCapacity && c.lessonCost === 1
    )!

    const booking = state.createBooking(student.id, course.id)
    expect(booking).not.toBeNull()

    const afterBook = useKayakStore.getState().students.find(s => s.id === student.id)!
    const available = afterBook.totalLessons - afterBook.usedLessons - afterBook.frozenLessons
    expect(available).toBeGreaterThanOrEqual(0)
    expect(available).toBe(getAvailable(afterBook))

    useKayakStore.getState().cancelBooking(booking!.id, true)

    const afterCancel = useKayakStore.getState().students.find(s => s.id === student.id)!
    const availableAfterCancel = afterCancel.totalLessons - afterCancel.usedLessons - afterCancel.frozenLessons
    expect(availableAfterCancel).toBe(getAvailable(afterCancel))
    expect(availableAfterCancel).toBe(available)
  })
})
