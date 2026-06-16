import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Coach, WaterArea, Student, Course, Booking, Warning, LessonTransaction,
  BookingValidation, UserRole, CoachLevel, CourseStatus, BookingStatus,
} from '@/types'
import {
  seedCoaches, seedWaterAreas, seedStudents, seedCourses,
  seedBookings, seedWarnings, seedTransactions,
} from '@/utils/seedData'

interface KayakState {
  currentRole: UserRole | null
  currentStudentId: string | null
  currentCoachId: string | null

  coaches: Coach[]
  waterAreas: WaterArea[]
  students: Student[]
  courses: Course[]
  bookings: Booking[]
  warnings: Warning[]
  transactions: LessonTransaction[]

  setRole: (role: UserRole) => void
  setCurrentStudent: (id: string) => void
  setCurrentCoach: (id: string) => void
  resetData: () => void

  updateCoach: (id: string, data: Partial<Coach>) => void
  addBlackoutDate: (coachId: string, date: string, reason: string) => void
  removeBlackoutDate: (coachId: string, date: string) => void
  addAvailableSlot: (coachId: string, slot: { dayOfWeek: number; startTime: string; endTime: string; waterAreaId: string }) => void
  removeAvailableSlot: (coachId: string, dayOfWeek: number, startTime: string) => void

  validateBooking: (studentId: string, courseId: string) => BookingValidation
  createBooking: (studentId: string, courseId: string) => Booking | null
  cancelBooking: (bookingId: string, isStarted: boolean) => void
  rescheduleBooking: (bookingId: string, newCourseId: string) => void
  joinWaitlist: (studentId: string, courseId: string) => void

  issueWarning: (type: '水位预警' | '天气预警', waterAreaIds: string[], severity: '低' | '中' | '高', message: string) => void
  resolveWarning: (warningId: string) => void

  addLessonTransaction: (studentId: string, type: '充值' | '预约消耗' | '取消扣费' | '冻结' | '解冻' | '归还', amount: number, reason: string, bookingId?: string) => void
  freezeLessons: (studentId: string, amount: number, reason: string) => void
  unfreezeLessons: (studentId: string, amount: number, reason: string) => void
  topUpLessons: (studentId: string, amount: number) => void

  supportCancelBooking: (bookingId: string, isStarted: boolean) => void
}

const initialState = {
  currentRole: null as UserRole | null,
  currentStudentId: null as string | null,
  currentCoachId: null as string | null,
  coaches: seedCoaches as Coach[],
  waterAreas: seedWaterAreas as WaterArea[],
  students: seedStudents as Student[],
  courses: seedCourses as Course[],
  bookings: seedBookings as Booking[],
  warnings: seedWarnings as Warning[],
  transactions: seedTransactions as LessonTransaction[],
}

export const useKayakStore = create<KayakState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setRole: (role) => set({ currentRole: role }),
      setCurrentStudent: (id) => set({ currentStudentId: id }),
      setCurrentCoach: (id) => set({ currentCoachId: id }),

      resetData: () => set({ ...initialState }),

      updateCoach: (id, data) => set((s) => ({
        coaches: s.coaches.map(c => c.id === id ? { ...c, ...data } : c),
      })),

      addBlackoutDate: (coachId, date, reason) => set((s) => ({
        coaches: s.coaches.map(c =>
          c.id === coachId
            ? { ...c, blackoutDates: [...c.blackoutDates, { date, reason }] }
            : c
        ),
        courses: s.courses.map(course =>
          course.coachId === coachId && course.date === date && course.status === '正常'
            ? { ...course, status: '停课' as CourseStatus }
            : course
        ),
      })),

      removeBlackoutDate: (coachId, date) => set((s) => ({
        coaches: s.coaches.map(c =>
          c.id === coachId
            ? { ...c, blackoutDates: c.blackoutDates.filter(b => b.date !== date) }
            : c
        ),
      })),

      addAvailableSlot: (coachId, slot) => set((s) => ({
        coaches: s.coaches.map(c =>
          c.id === coachId
            ? { ...c, availableSlots: [...c.availableSlots, slot] }
            : c
        ),
      })),

      removeAvailableSlot: (coachId, dayOfWeek, startTime) => set((s) => ({
        coaches: s.coaches.map(c =>
          c.id === coachId
            ? { ...c, availableSlots: c.availableSlots.filter(sl => !(sl.dayOfWeek === dayOfWeek && sl.startTime === startTime)) }
            : c
        ),
      })),

      validateBooking: (studentId, courseId) => {
        const state = get()
        const student = state.students.find(s => s.id === studentId)
        const course = state.courses.find(c => c.id === courseId)
        const errors: string[] = []
        const warnings: string[] = []

        if (!student) { errors.push('学员不存在'); return { canBook: false, errors, warnings } }
        if (!course) { errors.push('课程不存在'); return { canBook: false, errors, warnings } }

        const available = student.totalLessons - student.usedLessons - student.frozenLessons
        if (available <= 0) errors.push('剩余课时不足，请先充值')

        const levelMatch: Record<CoachLevel, CoachLevel[]> = {
          '初级': ['初级'],
          '中级': ['中级', '初级'],
          '高级': ['高级', '中级', '初级'],
        }
        if (!levelMatch[student.level]?.includes(course.level)) {
          errors.push(`学员级别(${student.level})不匹配课程级别(${course.level})`)
        }

        const waterArea = state.waterAreas.find(w => w.id === course.waterAreaId)
        if (waterArea && (waterArea.status === '水位预警' || waterArea.status === '停课')) {
          errors.push(`水域「${waterArea.name}」处于${waterArea.status}状态，无法预约`)
        }
        if (waterArea && waterArea.status === '天气预警') {
          warnings.push(`水域「${waterArea.name}」处于天气预警状态，课程可能改期`)
        }

        if (course.status === '停课') errors.push('该课程已停课')
        if (course.status === '待改期') errors.push('该课程待改期，暂不可预约')
        if (course.currentBookings >= course.maxCapacity) warnings.push('课程已满，可加入候补')

        const existingBookings = state.bookings.filter(
          b => b.studentId === studentId && (b.status === '已预约' || b.status === '候补')
        )
        const conflictBooking = existingBookings.find(b => {
          const bc = state.courses.find(c => c.id === b.courseId)
          if (!bc) return false
          return bc.date === course.date && bc.startTime === course.startTime && bc.coachId === course.coachId
        })
        if (conflictBooking) errors.push('同教练同时段已有预约，存在冲突')

        return { canBook: errors.length === 0, errors, warnings }
      },

      createBooking: (studentId, courseId) => {
        const state = get()
        const validation = state.validateBooking(studentId, courseId)
        if (!validation.canBook) return null

        const course = state.courses.find(c => c.id === courseId)
        const student = state.students.find(s => s.id === studentId)
        if (!course || !student) return null

        const isWaitlist = course.currentBookings >= course.maxCapacity
        const booking: Booking = {
          id: `booking-${Date.now()}`,
          studentId,
          courseId,
          status: isWaitlist ? '候补' : '已预约',
          createdAt: new Date().toISOString(),
          waitlistPosition: isWaitlist ? course.currentBookings - course.maxCapacity + 1 : undefined,
        }

        const txId = `tx-${Date.now()}`
        const tx: LessonTransaction = {
          id: txId,
          studentId,
          type: '预约消耗',
          amount: 1,
          bookingId: booking.id,
          reason: `预约课程 ${course.date} ${course.startTime}`,
          createdAt: new Date().toISOString(),
        }

        set((s) => ({
          bookings: [...s.bookings, booking],
          courses: s.courses.map(c =>
            c.id === courseId ? { ...c, currentBookings: c.currentBookings + 1 } : c
          ),
          students: s.students.map(st =>
            st.id === studentId ? { ...st, usedLessons: st.usedLessons + 1 } : st
          ),
          transactions: [...s.transactions, tx],
        }))

        return booking
      },

      cancelBooking: (bookingId, isStarted) => {
        const state = get()
        const booking = state.bookings.find(b => b.id === bookingId)
        if (!booking) return

        const newStatus: BookingStatus = isStarted ? '已取消(扣课时)' : '已取消(免费)'
        const txType = isStarted ? '取消扣费' : '归还'
        const amount = isStarted ? 1 : -1

        set((s) => ({
          bookings: s.bookings.map(b =>
            b.id === bookingId ? { ...b, status: newStatus } : b
          ),
          courses: s.courses.map(c =>
            c.id === booking.courseId ? { ...c, currentBookings: Math.max(0, c.currentBookings - 1) } : c
          ),
          students: s.students.map(st => {
            if (st.id !== booking.studentId) return st
            return isStarted
              ? { ...st, usedLessons: st.usedLessons + 1 }
              : { ...st, usedLessons: Math.max(0, st.usedLessons - 1) }
          }),
          transactions: [...s.transactions, {
            id: `tx-${Date.now()}`,
            studentId: booking.studentId,
            type: txType,
            amount: Math.abs(amount),
            bookingId,
            reason: isStarted ? '课程开始后取消，扣减1课时' : '课程开始前取消，归还1课时',
            createdAt: new Date().toISOString(),
          }],
        }))

        const updatedState = get()
        const course = updatedState.courses.find(c => c.id === booking.courseId)
        if (course) {
          const waitlistBookings = updatedState.bookings.filter(
            b => b.courseId === booking.courseId && b.status === '候补'
          )
          if (waitlistBookings.length > 0 && course.currentBookings < course.maxCapacity) {
            const firstWaitlist = waitlistBookings.sort((a, b) =>
              (a.waitlistPosition ?? 999) - (b.waitlistPosition ?? 999)
            )[0]
            set((s) => ({
              bookings: s.bookings.map(b =>
                b.id === firstWaitlist.id ? { ...b, status: '已预约' as BookingStatus, waitlistPosition: undefined } : b
              ),
            }))
          }
        }
      },

      rescheduleBooking: (bookingId, newCourseId) => {
        const state = get()
        const booking = state.bookings.find(b => b.id === bookingId)
        if (!booking) return

        set((s) => ({
          bookings: s.bookings.map(b =>
            b.id === bookingId ? { ...b, courseId: newCourseId, status: '已预约' as BookingStatus, waitlistPosition: undefined } : b
          ),
          courses: s.courses.map(c => {
            if (c.id === booking.courseId) return { ...c, currentBookings: Math.max(0, c.currentBookings - 1) }
            if (c.id === newCourseId) return { ...c, currentBookings: c.currentBookings + 1 }
            return c
          }),
        }))
      },

      joinWaitlist: (studentId, courseId) => {
        const state = get()
        const course = state.courses.find(c => c.id === courseId)
        if (!course) return

        const existing = state.bookings.filter(
          b => b.studentId === studentId && b.courseId === courseId
        )
        if (existing.length > 0) return

        const waitlistCount = state.bookings.filter(
          b => b.courseId === courseId && b.status === '候补'
        ).length

        const booking: Booking = {
          id: `booking-${Date.now()}`,
          studentId,
          courseId,
          status: '候补',
          createdAt: new Date().toISOString(),
          waitlistPosition: waitlistCount + 1,
        }

        set((s) => ({
          bookings: [...s.bookings, booking],
          courses: s.courses.map(c =>
            c.id === courseId ? { ...c, currentBookings: c.currentBookings + 1 } : c
          ),
        }))
      },

      issueWarning: (type, waterAreaIds, severity, message) => {
        const warningId = `warning-${Date.now()}`
        const warning: Warning = {
          id: warningId,
          type,
          waterAreaIds,
          severity,
          message,
          createdAt: new Date().toISOString(),
          status: '生效中',
        }

        set((s) => {
          const updatedWaterAreas = s.waterAreas.map(w => {
            if (waterAreaIds.includes(w.id)) {
              if (type === '水位预警') return { ...w, status: '水位预警' as const }
              if (type === '天气预警') return { ...w, status: '天气预警' as const }
            }
            return w
          })

          const updatedCourses = s.courses.map(c => {
            const course = s.courses.find(cc => cc.id === c.id)
            if (!course) return c
            if (!waterAreaIds.includes(course.waterAreaId)) return c
            if (course.status !== '正常') return c

            if (type === '水位预警') return { ...c, status: '停课' as CourseStatus }
            if (type === '天气预警') return { ...c, status: '待改期' as CourseStatus }
            return c
          })

          const updatedBookings = s.bookings.map(b => {
            const course = updatedCourses.find(c => c.id === b.courseId)
            if (!course) return b
            if (b.status !== '已预约') return b
            if (course.status === '停课') return { ...b, status: '停课' as BookingStatus }
            if (course.status === '待改期') return { ...b, status: '待改期' as BookingStatus }
            return b
          })

          return {
            warnings: [...s.warnings, warning],
            waterAreas: updatedWaterAreas,
            courses: updatedCourses,
            bookings: updatedBookings,
          }
        })
      },

      resolveWarning: (warningId) => {
        const state = get()
        const warning = state.warnings.find(w => w.id === warningId)
        if (!warning || warning.status === '已解除') return

        set((s) => {
          const updatedWarnings = s.warnings.map(w =>
            w.id === warningId ? { ...w, status: '已解除' as const, resolvedAt: new Date().toISOString() } : w
          )

          const otherActiveWarnings = s.warnings.filter(
            w => w.id !== warningId && w.status === '生效中' && w.waterAreaIds.some(waId => warning.waterAreaIds.includes(waId))
          )

          const updatedWaterAreas = s.waterAreas.map(w => {
            if (!warning.waterAreaIds.includes(w.id)) return w
            const stillHasWarning = otherActiveWarnings.some(aw => aw.waterAreaIds.includes(w.id))
            return stillHasWarning ? w : { ...w, status: '正常' as const }
          })

          const updatedCourses = s.courses.map(c => {
            const waterArea = updatedWaterAreas.find(wa => wa.id === c.waterAreaId)
            if (!waterArea) return c
            if (waterArea.status === '正常' && (c.status === '停课' || c.status === '待改期')) {
              const hasBooking = s.bookings.some(b => b.courseId === c.id && (b.status === '停课' || b.status === '待改期'))
              return { ...c, status: '正常' as CourseStatus }
            }
            return c
          })

          const updatedBookings = s.bookings.map(b => {
            const course = updatedCourses.find(c => c.id === b.courseId)
            if (!course) return b
            if (course.status === '正常' && (b.status === '停课' || b.status === '待改期')) {
              return { ...b, status: '已预约' as BookingStatus }
            }
            return b
          })

          return {
            warnings: updatedWarnings,
            waterAreas: updatedWaterAreas,
            courses: updatedCourses,
            bookings: updatedBookings,
          }
        })
      },

      addLessonTransaction: (studentId, type, amount, reason, bookingId) => {
        set((s) => ({
          transactions: [...s.transactions, {
            id: `tx-${Date.now()}`,
            studentId,
            type,
            amount,
            bookingId,
            reason,
            createdAt: new Date().toISOString(),
          }],
        }))
      },

      freezeLessons: (studentId, amount, reason) => {
        set((s) => {
          const student = s.students.find(st => st.id === studentId)
          if (!student) return s
          const available = student.totalLessons - student.usedLessons - student.frozenLessons
          const freezeAmount = Math.min(amount, available)
          if (freezeAmount <= 0) return s

          return {
            students: s.students.map(st =>
              st.id === studentId ? { ...st, frozenLessons: st.frozenLessons + freezeAmount } : st
            ),
            transactions: [...s.transactions, {
              id: `tx-${Date.now()}`,
              studentId,
              type: '冻结' as const,
              amount: freezeAmount,
              reason,
              createdAt: new Date().toISOString(),
            }],
          }
        })
      },

      unfreezeLessons: (studentId, amount, reason) => {
        set((s) => {
          const student = s.students.find(st => st.id === studentId)
          if (!student) return s
          const unfreezeAmount = Math.min(amount, student.frozenLessons)
          if (unfreezeAmount <= 0) return s

          return {
            students: s.students.map(st =>
              st.id === studentId ? { ...st, frozenLessons: st.frozenLessons - unfreezeAmount } : st
            ),
            transactions: [...s.transactions, {
              id: `tx-${Date.now()}`,
              studentId,
              type: '解冻' as const,
              amount: unfreezeAmount,
              reason,
              createdAt: new Date().toISOString(),
            }],
          }
        })
      },

      topUpLessons: (studentId, amount) => {
        set((s) => ({
          students: s.students.map(st =>
            st.id === studentId ? { ...st, totalLessons: st.totalLessons + amount } : st
          ),
          transactions: [...s.transactions, {
            id: `tx-${Date.now()}`,
            studentId,
            type: '充值' as const,
            amount,
            reason: `充值${amount}课时`,
            createdAt: new Date().toISOString(),
          }],
        }))
      },

      supportCancelBooking: (bookingId, isStarted) => {
        get().cancelBooking(bookingId, isStarted)
      },
    }),
    {
      name: 'kayak-booking-store',
    }
  )
)
