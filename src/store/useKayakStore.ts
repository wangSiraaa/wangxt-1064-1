import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Coach, WaterArea, Student, Course, Booking, Warning, LessonTransaction,
  BookingValidation, UserRole, CoachLevel, CourseStatus, BookingStatus,
  Family, BookingParticipant, CalculationDetail, CalculationAdjustment,
  WarningCourseEffect, BookingSwapRecord,
} from '@/types'
import {
  seedCoaches, seedWaterAreas, seedStudents, seedCourses,
  seedBookings, seedWarnings, seedTransactions, seedFamilies,
} from '@/utils/seedData'

interface KayakState {
  currentRole: UserRole | null
  currentStudentId: string | null
  currentCoachId: string | null

  families: Family[]
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

  getFamilyMembers: (familyId: string) => Student[]
  getStudentFamily: (studentId: string) => Family | undefined

  validateBooking: (studentId: string, courseId: string, additionalStudentIds?: string[]) => BookingValidation
  createBooking: (studentId: string, courseId: string, additionalStudentIds?: string[]) => Booking | null
  cancelBooking: (bookingId: string, isStarted: boolean) => void
  rescheduleBooking: (bookingId: string, newCourseId: string) => { success: boolean; calculationDetail: CalculationDetail | null; errors: string[] }
  joinWaitlist: (studentId: string, courseId: string) => void

  swapBookingParticipant: (bookingId: string, oldStudentId: string, newStudentId: string, reason: string) => { success: boolean; errors: string[]; calculationDetail: CalculationDetail | null }

  issueWarning: (type: '水位预警' | '天气预警', waterAreaIds: string[], severity: '低' | '中' | '高', message: string) => void
  resolveWarning: (warningId: string) => void
  getWarningEffects: (warningId: string) => WarningCourseEffect[]

  calculateBookingCost: (courseId: string, participantIds: string[]) => CalculationDetail
  calculateRescheduleCost: (bookingId: string, newCourseId: string) => CalculationDetail
  calculateCancelCost: (bookingId: string, isStarted: boolean) => CalculationDetail

  addLessonTransaction: (studentId: string, type: '充值' | '预约消耗' | '取消扣费' | '冻结' | '解冻' | '归还' | '改期扣费' | '换人扣费', amount: number, reason: string, bookingId?: string, calculationDetail?: CalculationDetail) => void
  freezeLessons: (studentId: string, amount: number, reason: string) => void
  unfreezeLessons: (studentId: string, amount: number, reason: string) => void
  topUpLessons: (studentId: string, amount: number) => void

  supportCancelBooking: (bookingId: string, isStarted: boolean) => void
}

const levelMatch: Record<CoachLevel, CoachLevel[]> = {
  '初级': ['初级'],
  '中级': ['中级', '初级'],
  '高级': ['高级', '中级', '初级'],
}

const initialState = {
  currentRole: null as UserRole | null,
  currentStudentId: null as string | null,
  currentCoachId: null as string | null,
  families: seedFamilies as Family[],
  coaches: seedCoaches as Coach[],
  waterAreas: seedWaterAreas as WaterArea[],
  students: seedStudents as Student[],
  courses: seedCourses as Course[],
  bookings: seedBookings as Booking[],
  warnings: seedWarnings as Warning[],
  transactions: seedTransactions as LessonTransaction[],
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
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

      getFamilyMembers: (familyId) => {
        const state = get()
        const family = state.families.find(f => f.id === familyId)
        if (!family) return []
        return state.students.filter(s => family.memberIds.includes(s.id))
      },

      getStudentFamily: (studentId) => {
        const state = get()
        const student = state.students.find(s => s.id === studentId)
        if (!student?.familyId) return undefined
        return state.families.find(f => f.id === student.familyId)
      },

      validateBooking: (studentId, courseId, additionalStudentIds = []) => {
        const state = get()
        const course = state.courses.find(c => c.id === courseId)
        const errors: string[] = []
        const warnings: string[] = []
        const participantValidations: BookingValidation['participantValidations'] = {}
        const allParticipantIds = [studentId, ...additionalStudentIds].filter((v, i, a) => a.indexOf(v) === i)

        if (!course) {
          return { canBook: false, errors: ['课程不存在'], warnings, participantValidations, estimatedCost: 0, costBreakdown: [] }
        }

        const coach = state.coaches.find(c => c.id === course.coachId)
        const waterArea = state.waterAreas.find(w => w.id === course.waterAreaId)

        if (course.status === '停课') errors.push('该课程已停课')
        if (course.status === '待改期') errors.push('该课程待改期，暂不可预约')

        if (waterArea) {
          if (waterArea.status === '水位预警') {
            if (!course.isOnShoreOnly) {
              errors.push(`水域「${waterArea.name}」处于水位预警状态，水上课程无法预约`)
            } else {
              warnings.push(`水域「${waterArea.name}」处于水位预警状态，但本次为岸上安全课可正常进行`)
            }
          }
          if (waterArea.status === '停课') errors.push(`水域「${waterArea.name}」已停课`)
          if (waterArea.status === '天气预警') warnings.push(`水域「${waterArea.name}」处于天气预警状态，课程可能改期`)
        }

        if (allParticipantIds.length > 1) {
          if (!course.allowFamilyBooking) errors.push('该课程不支持家庭/组合预约')
          if (coach && !coach.isFamilyCoach) errors.push('该教练不负责亲子/家庭课程')
        }

        for (const pid of allParticipantIds) {
          const student = state.students.find(s => s.id === pid)
          const pErrors: string[] = []
          const pWarnings: string[] = []

          if (!student) {
            pErrors.push('学员不存在')
          } else {
            const available = student.totalLessons - student.usedLessons - student.frozenLessons
            if (available <= 0) pErrors.push('剩余课时不足，请先充值')

            if (!levelMatch[student.level]?.includes(course.level)) {
              pErrors.push(`学员级别(${student.level})不匹配课程级别(${course.level})`)
            }

            if (student.age < course.minAge) {
              pErrors.push(`学员年龄(${student.age}岁)低于课程最低年龄要求(${course.minAge}岁)`)
            }
            if (course.maxAge && student.age > course.maxAge) {
              pErrors.push(`学员年龄(${student.age}岁)高于课程最高年龄限制(${course.maxAge}岁)`)
            }

            if (student.role === '儿童' && waterArea && !waterArea.allowChildren) {
              pErrors.push(`该水域「${waterArea.name}」不允许儿童进入`)
            }

            if (coach && student.age < coach.minAge) {
              pErrors.push(`学员年龄(${student.age}岁)低于教练最低带教年龄(${coach.minAge}岁)`)
            }

            const boatMatch = course.boatTypes.some(bt => student.allowedBoatTypes.includes(bt))
            if (!boatMatch) {
              pErrors.push(`学员允许使用的艇型与课程艇型不匹配。课程提供: ${course.boatTypes.join('、')}`)
            }

            if (waterArea) {
              const waMatch = waterArea.allowedBoatTypes.some(bt => student.allowedBoatTypes.includes(bt))
              if (!waMatch) {
                pErrors.push(`学员艇型与水域「${waterArea.name}」允许的艇型不匹配`)
              }
            }
          }

          participantValidations[pid] = {
            canBook: pErrors.length === 0,
            errors: pErrors,
            warnings: pWarnings,
          }

          if (pErrors.length > 0) {
            const sname = student?.name || pid
            errors.push(`${sname}: ${pErrors.join('；')}`)
          }
        }

        const totalCapacityNeeded = allParticipantIds.length
        const isWaitlist = course.currentBookings >= course.maxCapacity
        if (isWaitlist) {
          if (course.currentBookings + totalCapacityNeeded > course.maxCapacity) {
            warnings.push('课程名额可能不足，将进入候补队列')
          }
        }

        for (const pid of allParticipantIds) {
          const existingBookings = state.bookings.filter(
            b => b.studentId === pid && (b.status === '已预约' || b.status === '候补')
          )
          const hasConflict = existingBookings.some(b => {
            const bc = state.courses.find(c => c.id === b.courseId)
            if (!bc) return false
            return bc.date === course.date && bc.startTime === course.startTime
          })
          if (hasConflict) {
            const sname = state.students.find(s => s.id === pid)?.name || pid
            errors.push(`${sname}: 同时段已有预约，存在冲突`)
          }
        }

        const costDetail = get().calculateBookingCost(courseId, allParticipantIds)

        return {
          canBook: errors.length === 0,
          errors,
          warnings,
          participantValidations,
          estimatedCost: costDetail.finalCost,
          costBreakdown: costDetail.adjustments,
        }
      },

      calculateBookingCost: (courseId, participantIds) => {
        const state = get()
        const course = state.courses.find(c => c.id === courseId)
        if (!course) {
          return { originalCost: 0, adjustments: [], finalCost: 0, explanation: '课程不存在' }
        }

        const adjustments: CalculationAdjustment[] = []
        let total = 0

        for (const pid of participantIds) {
          const student = state.students.find(s => s.id === pid)
          const participantLabel = student ? `${student.name}(${student.role})` : pid
          adjustments.push({
            type: '课时费',
            amount: course.lessonCost,
            description: `${participantLabel} - ${course.courseType}课时费`,
          })
          total += course.lessonCost
        }

        if (participantIds.length >= 2) {
          const hasFamily = participantIds.some(pid => {
            const s = state.students.find(st => st.id === pid)
            return !!s?.familyId
          })
          if (hasFamily) {
            const discount = Math.ceil(total * 0.1)
            adjustments.push({
              type: '家庭优惠',
              amount: -discount,
              description: '家庭组合预订享9折优惠',
            })
            total -= discount
          } else if (participantIds.length >= 2) {
            const discount = Math.ceil(total * 0.05)
            adjustments.push({
              type: '组合折扣',
              amount: -discount,
              description: '多人组合预订享95折优惠',
            })
            total -= discount
          }
        }

        const explanation = adjustments.map(a => `${a.description}: ${a.amount > 0 ? '+' : ''}${a.amount}课时`).join('；')

        return {
          originalCost: course.lessonCost * participantIds.length,
          adjustments,
          finalCost: Math.max(0, total),
          explanation: `费用明细 - ${explanation} = 共${Math.max(0, total)}课时`,
        }
      },

      createBooking: (studentId, courseId, additionalStudentIds = []) => {
        const state = get()
        const allParticipantIds = [studentId, ...additionalStudentIds].filter((v, i, a) => a.indexOf(v) === i)
        const validation = state.validateBooking(studentId, courseId, additionalStudentIds)
        if (!validation.canBook) return null

        const course = state.courses.find(c => c.id === courseId)
        const primaryStudent = state.students.find(s => s.id === studentId)
        if (!course || !primaryStudent) return null

        const calculationDetail = state.calculateBookingCost(courseId, allParticipantIds)
        const isWaitlist = course.currentBookings >= course.maxCapacity

        const participants: BookingParticipant[] = allParticipantIds.map(pid => {
          const s = state.students.find(st => st.id === pid)
          const pv = validation.participantValidations[pid]
          const commonBoat = course.boatTypes.find(bt => s?.allowedBoatTypes.includes(bt))
          return {
            studentId: pid,
            role: s?.role || '成人',
            age: s?.age || 18,
            level: s?.level || '初级',
            validated: pv?.canBook ?? false,
            validationErrors: pv?.errors || [],
            boatType: commonBoat,
          }
        })

        const booking: Booking = {
          id: generateId('booking'),
          studentId,
          courseId,
          status: isWaitlist ? '候补' : '已预约',
          createdAt: new Date().toISOString(),
          waitlistPosition: isWaitlist ? course.currentBookings - course.maxCapacity + 1 : undefined,
          familyId: primaryStudent.familyId,
          participants,
          isFamilyBooking: allParticipantIds.length > 1,
          totalLessonCost: calculationDetail.finalCost,
          swapHistory: [],
          calculationDetail,
        }

        const newTransactions: LessonTransaction[] = []
        const newStudents = [...state.students]

        const costPerParticipant = Math.ceil(calculationDetail.finalCost / allParticipantIds.length)
        let remainingCost = calculationDetail.finalCost
        allParticipantIds.forEach((pid, idx) => {
          const isLast = idx === allParticipantIds.length - 1
          const thisCost = isLast ? remainingCost : costPerParticipant
          remainingCost -= thisCost

          const sIdx = newStudents.findIndex(st => st.id === pid)
          if (sIdx >= 0) {
            newStudents[sIdx] = { ...newStudents[sIdx], usedLessons: newStudents[sIdx].usedLessons + thisCost }
          }
          newTransactions.push({
            id: generateId('tx'),
            studentId: pid,
            type: '预约消耗',
            amount: thisCost,
            bookingId: booking.id,
            reason: `预约${course.courseType} ${course.date} ${course.startTime}`,
            createdAt: new Date().toISOString(),
            calculationDetail: {
              ...calculationDetail,
              finalCost: thisCost,
              explanation: `${state.students.find(s => s.id === pid)?.name}分摊费用：${calculationDetail.explanation}`,
            },
          })
        })

        set((s) => ({
          bookings: [...s.bookings, booking],
          courses: s.courses.map(c =>
            c.id === courseId ? { ...c, currentBookings: c.currentBookings + allParticipantIds.length } : c
          ),
          students: newStudents,
          transactions: [...s.transactions, ...newTransactions],
        }))

        return booking
      },

      calculateCancelCost: (bookingId, isStarted) => {
        const state = get()
        const booking = state.bookings.find(b => b.id === bookingId)
        if (!booking) {
          return { originalCost: 0, adjustments: [], finalCost: 0, explanation: '预约不存在' }
        }

        const course = state.courses.find(c => c.id === booking.courseId)
        const adjustments: CalculationAdjustment[] = []

        if (isStarted) {
          adjustments.push({
            type: '取消费',
            amount: booking.totalLessonCost,
            description: '课程已开始，取消全额扣课时',
          })
          return {
            originalCost: booking.totalLessonCost,
            adjustments,
            finalCost: booking.totalLessonCost,
            explanation: `课程已开始取消：扣${booking.totalLessonCost}课时`,
          }
        }

        if (course?.warningHandling?.retained) {
          adjustments.push({
            type: '岸上保留',
            amount: -booking.totalLessonCost,
            description: course.warningHandling.reason,
          })
          adjustments.push({
            type: '归还',
            amount: 0,
            description: '因水位预警岸上课保留，无需扣课时',
          })
          return {
            originalCost: booking.totalLessonCost,
            adjustments,
            finalCost: 0,
            explanation: course.warningHandling.reason,
          }
        }

        adjustments.push({
          type: '归还',
          amount: -booking.totalLessonCost,
          description: '课程开始前取消，全额归还课时',
        })
        return {
          originalCost: booking.totalLessonCost,
          adjustments,
          finalCost: 0,
          explanation: `课程未开始取消：归还${booking.totalLessonCost}课时`,
        }
      },

      cancelBooking: (bookingId, isStarted) => {
        const state = get()
        const booking = state.bookings.find(b => b.id === bookingId)
        if (!booking) return

        const calculationDetail = state.calculateCancelCost(bookingId, isStarted)
        const newStatus: BookingStatus = isStarted ? '已取消(扣课时)' : '已取消(免费)'

        const newStudents = [...state.students]
        const newTransactions: LessonTransaction[] = []

        if (isStarted) {
          booking.participants.forEach(p => {
            const share = Math.ceil(booking.totalLessonCost / booking.participants.length)
            const sIdx = newStudents.findIndex(st => st.id === p.studentId)
            if (sIdx >= 0) {
              newStudents[sIdx] = { ...newStudents[sIdx], usedLessons: newStudents[sIdx].usedLessons + share }
            }
            newTransactions.push({
              id: generateId('tx'),
              studentId: p.studentId,
              type: '取消扣费',
              amount: share,
              bookingId,
              reason: `课程开始后取消，扣减${share}课时`,
              createdAt: new Date().toISOString(),
              calculationDetail,
            })
          })
        } else {
          booking.participants.forEach(p => {
            const share = Math.ceil(booking.totalLessonCost / booking.participants.length)
            const sIdx = newStudents.findIndex(st => st.id === p.studentId)
            if (sIdx >= 0) {
              newStudents[sIdx] = { ...newStudents[sIdx], usedLessons: Math.max(0, newStudents[sIdx].usedLessons - share) }
            }
            newTransactions.push({
              id: generateId('tx'),
              studentId: p.studentId,
              type: '归还',
              amount: share,
              bookingId,
              reason: `课程开始前取消，归还${share}课时`,
              createdAt: new Date().toISOString(),
              calculationDetail,
            })
          })
        }

        set((s) => ({
          bookings: s.bookings.map(b =>
            b.id === bookingId ? { ...b, status: newStatus, calculationDetail } : b
          ),
          courses: s.courses.map(c =>
            c.id === booking.courseId ? { ...c, currentBookings: Math.max(0, c.currentBookings - booking.participants.length) } : c
          ),
          students: newStudents,
          transactions: [...s.transactions, ...newTransactions],
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

      calculateRescheduleCost: (bookingId, newCourseId) => {
        const state = get()
        const booking = state.bookings.find(b => b.id === bookingId)
        const newCourse = state.courses.find(c => c.id === newCourseId)
        if (!booking || !newCourse) {
          return { originalCost: 0, adjustments: [], finalCost: 0, explanation: '预约或课程不存在' }
        }

        const adjustments: CalculationAdjustment[] = []
        const oldCost = booking.totalLessonCost
        const newBaseCost = newCourse.lessonCost * booking.participants.length

        adjustments.push({
          type: '课时费',
          amount: -oldCost,
          description: `原课程费用退还：${oldCost}课时`,
        })
        adjustments.push({
          type: '课时费',
          amount: newBaseCost,
          description: `新课程(${newCourse.courseType})费用：${newBaseCost}课时`,
        })

        const diff = newBaseCost - oldCost

        if (diff > 0) {
          adjustments.push({
            type: '改期费',
            amount: diff,
            description: `新课程费用更高，需补${diff}课时`,
          })
        } else if (diff < 0) {
          adjustments.push({
            type: '归还',
            amount: diff,
            description: `新课程费用更低，退还${-diff}课时`,
          })
        }

        return {
          originalCost: oldCost,
          adjustments,
          finalCost: diff,
          explanation: `改期：原${oldCost}课时 → 新${newBaseCost}课时${diff > 0 ? `，补${diff}课时` : diff < 0 ? `，退${-diff}课时` : '，费用相同'}`,
        }
      },

      rescheduleBooking: (bookingId, newCourseId) => {
        const state = get()
        const booking = state.bookings.find(b => b.id === bookingId)
        if (!booking) return { success: false, calculationDetail: null, errors: ['预约不存在'] }

        const errors: string[] = []
        const participantIds = booking.participants.map(p => p.studentId)
        const primaryId = participantIds[0] || booking.studentId
        const additionalIds = participantIds.slice(1)

        const validation = state.validateBooking(primaryId, newCourseId, additionalIds)
        if (!validation.canBook) {
          return { success: false, calculationDetail: null, errors: validation.errors }
        }

        const calculationDetail = state.calculateRescheduleCost(bookingId, newCourseId)
        const newStudents = [...state.students]
        const newTransactions: LessonTransaction[] = []

        if (calculationDetail.finalCost !== 0) {
          const diff = calculationDetail.finalCost
          const share = Math.ceil(Math.abs(diff) / booking.participants.length)

          booking.participants.forEach((p, idx) => {
            const isLast = idx === booking.participants.length - 1
            const thisShare = isLast ? Math.abs(diff) - share * (booking.participants.length - 1) : share
            const sIdx = newStudents.findIndex(st => st.id === p.studentId)

            if (sIdx >= 0) {
              if (diff > 0) {
                newStudents[sIdx] = { ...newStudents[sIdx], usedLessons: newStudents[sIdx].usedLessons + thisShare }
                newTransactions.push({
                  id: generateId('tx'),
                  studentId: p.studentId,
                  type: '改期扣费',
                  amount: thisShare,
                  bookingId,
                  reason: `改期补费：${state.students.find(s => s.id === p.studentId)?.name}承担${thisShare}课时`,
                  createdAt: new Date().toISOString(),
                  calculationDetail,
                })
              } else {
                newStudents[sIdx] = { ...newStudents[sIdx], usedLessons: Math.max(0, newStudents[sIdx].usedLessons - thisShare) }
                newTransactions.push({
                  id: generateId('tx'),
                  studentId: p.studentId,
                  type: '归还',
                  amount: thisShare,
                  bookingId,
                  reason: `改期退费：${state.students.find(s => s.id === p.studentId)?.name}退还${thisShare}课时`,
                  createdAt: new Date().toISOString(),
                  calculationDetail,
                })
              }
            }
          })
        }

        set((s) => ({
          bookings: s.bookings.map(b =>
            b.id === bookingId ? { ...b, courseId: newCourseId, status: '已预约' as BookingStatus, waitlistPosition: undefined, calculationDetail } : b
          ),
          courses: s.courses.map(c => {
            if (c.id === booking.courseId) return { ...c, currentBookings: Math.max(0, c.currentBookings - booking.participants.length) }
            if (c.id === newCourseId) return { ...c, currentBookings: c.currentBookings + booking.participants.length }
            return c
          }),
          students: newStudents,
          transactions: [...s.transactions, ...newTransactions],
        }))

        return { success: true, calculationDetail, errors }
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

        const student = state.students.find(s => s.id === studentId)
        const booking: Booking = {
          id: generateId('booking'),
          studentId,
          courseId,
          status: '候补',
          createdAt: new Date().toISOString(),
          waitlistPosition: waitlistCount + 1,
          familyId: student?.familyId,
          participants: [{
            studentId,
            role: student?.role || '成人',
            age: student?.age || 18,
            level: student?.level || '初级',
            validated: true,
            validationErrors: [],
          }],
          isFamilyBooking: false,
          totalLessonCost: course.lessonCost,
          swapHistory: [],
        }

        set((s) => ({
          bookings: [...s.bookings, booking],
          courses: s.courses.map(c =>
            c.id === courseId ? { ...c, currentBookings: c.currentBookings + 1 } : c
          ),
        }))
      },

      swapBookingParticipant: (bookingId, oldStudentId, newStudentId, reason) => {
        const state = get()
        const booking = state.bookings.find(b => b.id === bookingId)
        if (!booking) return { success: false, errors: ['预约不存在'], calculationDetail: null }

        const course = state.courses.find(c => c.id === booking.courseId)
        if (!course) return { success: false, errors: ['课程不存在'], calculationDetail: null }

        const newStudent = state.students.find(s => s.id === newStudentId)
        if (!newStudent) return { success: false, errors: ['新学员不存在'], calculationDetail: null }

        const otherParticipantIds = booking.participants.filter(p => p.studentId !== oldStudentId).map(p => p.studentId)
        const primaryId = otherParticipantIds[0] || newStudentId
        const additionalIds = [...otherParticipantIds.filter(id => id !== primaryId), newStudentId].filter(id => id !== primaryId)

        const validation = state.validateBooking(primaryId, booking.courseId, additionalIds)
        if (!validation.canBook) {
          return { success: false, errors: validation.errors, calculationDetail: null }
        }

        const oldStudent = state.students.find(s => s.id === oldStudentId)
        const available = newStudent.totalLessons - newStudent.usedLessons - newStudent.frozenLessons
        if (available <= 0) {
          return { success: false, errors: [`新学员${newStudent.name}剩余课时不足`], calculationDetail: null }
        }

        const costShare = Math.ceil(booking.totalLessonCost / booking.participants.length)
        const calculationDetail: CalculationDetail = {
          originalCost: 0,
          adjustments: [
            { type: '归还', amount: -costShare, description: `原学员${oldStudent?.name || oldStudentId}退还${costShare}课时` },
            { type: '换人费', amount: costShare, description: `新学员${newStudent.name}扣除${costShare}课时` },
          ],
          finalCost: 0,
          explanation: `换人：${oldStudent?.name || oldStudentId} → ${newStudent.name}，费用${costShare}课时转移`,
        }

        const swapRecord: BookingSwapRecord = {
          id: generateId('swap'),
          oldStudentId,
          newStudentId,
          swappedAt: new Date().toISOString(),
          validated: true,
          validationErrors: [],
          lessonsCost: costShare,
          reason,
        }

        const newParticipants = booking.participants.map(p =>
          p.studentId === oldStudentId
            ? {
                studentId: newStudentId,
                role: newStudent.role,
                age: newStudent.age,
                level: newStudent.level,
                validated: true,
                validationErrors: [],
                boatType: course.boatTypes.find(bt => newStudent.allowedBoatTypes.includes(bt)),
              }
            : p
        )

        const newStudents = [...state.students]
        const oldIdx = newStudents.findIndex(s => s.id === oldStudentId)
        const newIdx = newStudents.findIndex(s => s.id === newStudentId)
        if (oldIdx >= 0) {
          newStudents[oldIdx] = { ...newStudents[oldIdx], usedLessons: Math.max(0, newStudents[oldIdx].usedLessons - costShare) }
        }
        if (newIdx >= 0) {
          newStudents[newIdx] = { ...newStudents[newIdx], usedLessons: newStudents[newIdx].usedLessons + costShare }
        }

        const newTransactions: LessonTransaction[] = [
          {
            id: generateId('tx'),
            studentId: oldStudentId,
            type: '归还',
            amount: costShare,
            bookingId,
            reason: `换人退还${costShare}课时给${oldStudent?.name || oldStudentId}`,
            createdAt: new Date().toISOString(),
            calculationDetail,
          },
          {
            id: generateId('tx'),
            studentId: newStudentId,
            type: '换人扣费',
            amount: costShare,
            bookingId,
            reason: `换人扣${costShare}课时（${newStudent.name}接替${oldStudent?.name || oldStudentId}）`,
            createdAt: new Date().toISOString(),
            calculationDetail,
          },
        ]

        set((s) => ({
          bookings: s.bookings.map(b =>
            b.id === bookingId ? {
              ...b,
              studentId: b.studentId === oldStudentId ? newStudentId : b.studentId,
              participants: newParticipants,
              swapHistory: [...b.swapHistory, swapRecord],
              calculationDetail,
            } : b
          ),
          students: newStudents,
          transactions: [...s.transactions, ...newTransactions],
        }))

        return { success: true, errors: [], calculationDetail }
      },

      getWarningEffects: (warningId) => {
        const state = get()
        const warning = state.warnings.find(w => w.id === warningId)
        return warning?.affectedCourses || []
      },

      issueWarning: (type, waterAreaIds, severity, message) => {
        const warningId = generateId('warning')
        const state = get()

        const affectedCourses: WarningCourseEffect[] = []
        const relevantCourses = state.courses.filter(c =>
          waterAreaIds.includes(c.waterAreaId) && c.status === '正常'
        )

        for (const course of relevantCourses) {
          const coach = state.coaches.find(c => c.id === course.coachId)
          let handlingType: WarningCourseEffect['handlingType']
          let newStatus: CourseStatus
          let reason: string

          if (type === '水位预警') {
            if (course.isOnShoreOnly) {
              handlingType = '保留(岸上课)'
              newStatus = '正常'
              reason = `${course.courseType}为岸上安全课，不受水位预警影响，课程正常进行`
            } else if (course.shoreLessonProportion && course.shoreLessonProportion >= 0.5) {
              handlingType = '保留(岸上课)'
              newStatus = '部分保留'
              reason = `${course.courseType}含${Math.round(course.shoreLessonProportion * 100)}%岸上内容，可保留岸上安全课部分进行，实操部分另安排`
            } else {
              handlingType = '改期(水上课)'
              newStatus = '待改期'
              reason = `${course.courseType}为水上实操课，受水位预警影响需改期`
            }
          } else {
            handlingType = '改期(水上课)'
            newStatus = '待改期'
            reason = `${course.courseType}受天气预警影响需改期`
          }

          affectedCourses.push({
            courseId: course.id,
            courseName: `${course.courseType} - ${course.date} ${course.startTime}`,
            originalStatus: course.status,
            newStatus,
            handlingType,
            reason,
          })
        }

        const warning: Warning = {
          id: warningId,
          type,
          waterAreaIds,
          severity,
          message,
          createdAt: new Date().toISOString(),
          status: '生效中',
          affectedCourses,
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
            const effect = affectedCourses.find(e => e.courseId === c.id)
            if (!effect) return c
            return {
              ...c,
              status: effect.newStatus,
              warningHandling: effect.handlingType === '保留(岸上课)'
                ? { retained: true, reason: effect.reason }
                : { retained: false, reason: effect.reason },
            }
          })

          const updatedBookings = s.bookings.map(b => {
            const course = updatedCourses.find(c => c.id === b.courseId)
            if (!course) return b
            if (b.status !== '已预约' && b.status !== '候补') return b
            if (course.status === '待改期') return { ...b, status: '待改期' as BookingStatus }
            if (course.status === '部分保留') return { ...b, status: '部分保留' as BookingStatus }
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
            if (waterArea.status === '正常' && (c.status === '待改期' || c.status === '部分保留')) {
              return { ...c, status: '正常' as CourseStatus, warningHandling: undefined }
            }
            return c
          })

          const updatedBookings = s.bookings.map(b => {
            const course = updatedCourses.find(c => c.id === b.courseId)
            if (!course) return b
            if (course.status === '正常' && (b.status === '待改期' || b.status === '部分保留')) {
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

      addLessonTransaction: (studentId, type, amount, reason, bookingId, calculationDetail) => {
        set((s) => ({
          transactions: [...s.transactions, {
            id: generateId('tx'),
            studentId,
            type,
            amount,
            bookingId,
            reason,
            createdAt: new Date().toISOString(),
            calculationDetail,
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
              id: generateId('tx'),
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
              id: generateId('tx'),
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
            id: generateId('tx'),
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
