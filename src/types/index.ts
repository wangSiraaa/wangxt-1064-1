export type CoachLevel = '初级' | '中级' | '高级'
export type CourseStatus = '正常' | '停课' | '待改期' | '已完成'
export type WaterAreaStatus = '正常' | '水位预警' | '天气预警' | '停课'
export type BookingStatus = '已预约' | '候补' | '停课' | '待改期' | '已完成' | '已取消(扣课时)' | '已取消(免费)'
export type WarningType = '水位预警' | '天气预警'
export type WarningSeverity = '低' | '中' | '高'
export type WarningStatus = '生效中' | '已解除'
export type TransactionType = '充值' | '预约消耗' | '取消扣费' | '冻结' | '解冻' | '归还'
export type UserRole = 'coach' | 'student' | 'admin' | 'support'

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

export interface Coach {
  id: string
  name: string
  level: CoachLevel
  maxStudents: number
  availableSlots: TimeSlot[]
  blackoutDates: BlackoutDate[]
}

export interface WaterArea {
  id: string
  name: string
  status: WaterAreaStatus
  description: string
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
}

export interface Student {
  id: string
  name: string
  level: CoachLevel
  totalLessons: number
  usedLessons: number
  frozenLessons: number
}

export interface Booking {
  id: string
  studentId: string
  courseId: string
  status: BookingStatus
  createdAt: string
  waitlistPosition?: number
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
}

export interface LessonTransaction {
  id: string
  studentId: string
  type: TransactionType
  amount: number
  bookingId?: string
  reason: string
  createdAt: string
}

export interface BookingValidation {
  canBook: boolean
  errors: string[]
  warnings: string[]
}
