export type CoachLevel = '初级' | '中级' | '高级'
export type CourseStatus = '正常' | '停课' | '待改期' | '已完成' | '部分保留'
export type WaterAreaStatus = '正常' | '水位预警' | '天气预警' | '停课'
export type BookingStatus = '已预约' | '候补' | '停课' | '待改期' | '已完成' | '已取消(扣课时)' | '已取消(免费)' | '部分保留'
export type WarningType = '水位预警' | '天气预警'
export type WarningSeverity = '低' | '中' | '高'
export type WarningStatus = '生效中' | '已解除'
export type TransactionType = '充值' | '预约消耗' | '取消扣费' | '冻结' | '解冻' | '归还' | '改期扣费' | '换人扣费'
export type UserRole = 'coach' | 'student' | 'admin' | 'support'
export type BoatType = '单人皮划艇' | '双人皮划艇' | '亲子双人艇' | 'SUP桨板' | '独木舟'
export type CourseType = '岸上安全课' | '水上实操课' | '组合课' | '体验营'
export type ParticipantRole = '成人' | '儿童'

export interface TimeSlot {
  dayOfWeek: number
  startTime: string
  endTime: string
  waterAreaId: string
}

export interface BlackoutDate {
  date: string
  reason: string
}

export interface Family {
  id: string
  name: string
  memberIds: string[]
  primaryContactId: string
}

export interface Coach {
  id: string
  name: string
  level: CoachLevel
  maxStudents: number
  availableSlots: TimeSlot[]
  blackoutDates: BlackoutDate[]
  certifiedBoatTypes: BoatType[]
  isFamilyCoach: boolean
  minAge: number
}

export interface WaterArea {
  id: string
  name: string
  status: WaterAreaStatus
  description: string
  allowedBoatTypes: BoatType[]
  minLevel: CoachLevel
  allowChildren: boolean
}

export interface Course {
  id: string
  coachId: string
  waterAreaId: string
  level: CoachLevel
  date: string
  startTime: string
  endTime: string
  maxCapacity: number
  currentBookings: number
  status: CourseStatus
  courseType: CourseType
  boatTypes: BoatType[]
  minAge: number
  maxAge?: number
  lessonCost: number
  allowFamilyBooking: boolean
  isOnShoreOnly: boolean
  shoreLessonProportion?: number
  warningHandling?: {
    retained: boolean
    reason: string
  }
}

export interface Student {
  id: string
  name: string
  level: CoachLevel
  totalLessons: number
  usedLessons: number
  frozenLessons: number
  age: number
  role: ParticipantRole
  familyId?: string
  allowedBoatTypes: BoatType[]
}

export interface BookingParticipant {
  studentId: string
  role: ParticipantRole
  age: number
  level: CoachLevel
  validated: boolean
  validationErrors: string[]
  boatType?: BoatType
}

export interface Booking {
  id: string
  studentId: string
  courseId: string
  status: BookingStatus
  createdAt: string
  waitlistPosition?: number
  familyId?: string
  participants: BookingParticipant[]
  isFamilyBooking: boolean
  totalLessonCost: number
  swapHistory: BookingSwapRecord[]
  calculationDetail?: CalculationDetail
}

export interface BookingSwapRecord {
  id: string
  oldStudentId: string
  newStudentId: string
  swappedAt: string
  validated: boolean
  validationErrors: string[]
  lessonsCost: number
  reason: string
}

export interface CalculationDetail {
  originalCost: number
  adjustments: CalculationAdjustment[]
  finalCost: number
  explanation: string
}

export interface CalculationAdjustment {
  type: '课时费' | '改期费' | '取消费' | '换人费' | '家庭优惠' | '组合折扣' | '岸上保留'
  amount: number
  description: string
}

export interface Warning {
  id: string
  type: WarningType
  waterAreaIds: string[]
  severity: WarningSeverity
  message: string
  createdAt: string
  resolvedAt?: string
  status: WarningStatus
  affectedCourses: WarningCourseEffect[]
}

export interface WarningCourseEffect {
  courseId: string
  courseName: string
  originalStatus: CourseStatus
  newStatus: CourseStatus
  handlingType: '保留(岸上课)' | '改期(水上课)' | '停课'
  reason: string
}

export interface LessonTransaction {
  id: string
  studentId: string
  type: TransactionType
  amount: number
  bookingId?: string
  reason: string
  createdAt: string
  calculationDetail?: CalculationDetail
}

export interface BookingValidation {
  canBook: boolean
  errors: string[]
  warnings: string[]
  participantValidations: Record<string, { canBook: boolean; errors: string[]; warnings: string[] }>
  estimatedCost: number
  costBreakdown: CalculationAdjustment[]
}
