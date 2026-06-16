import type { Coach, WaterArea, Student, Course, Booking, Warning, LessonTransaction } from '@/types'

export const seedCoaches: Coach[] = [
  {
    id: 'coach-1',
    name: '张伟',
    level: '初级',
    maxStudents: 6,
    availableSlots: [
      { dayOfWeek: 1, startTime: '09:00', endTime: '11:00', waterAreaId: 'water-1' },
      { dayOfWeek: 1, startTime: '14:00', endTime: '16:00', waterAreaId: 'water-3' },
      { dayOfWeek: 3, startTime: '09:00', endTime: '11:00', waterAreaId: 'water-1' },
      { dayOfWeek: 5, startTime: '14:00', endTime: '16:00', waterAreaId: 'water-3' },
    ],
    blackoutDates: [],
  },
  {
    id: 'coach-2',
    name: '李明',
    level: '中级',
    maxStudents: 4,
    availableSlots: [
      { dayOfWeek: 2, startTime: '09:00', endTime: '11:00', waterAreaId: 'water-2' },
      { dayOfWeek: 2, startTime: '14:00', endTime: '16:00', waterAreaId: 'water-1' },
      { dayOfWeek: 4, startTime: '09:00', endTime: '11:00', waterAreaId: 'water-2' },
      { dayOfWeek: 4, startTime: '14:00', endTime: '16:00', waterAreaId: 'water-1' },
    ],
    blackoutDates: [
      { date: '2026-06-20', reason: '培训' },
    ],
  },
  {
    id: 'coach-3',
    name: '王芳',
    level: '高级',
    maxStudents: 3,
    availableSlots: [
      { dayOfWeek: 1, startTime: '09:00', endTime: '11:00', waterAreaId: 'water-2' },
      { dayOfWeek: 3, startTime: '14:00', endTime: '16:00', waterAreaId: 'water-2' },
      { dayOfWeek: 5, startTime: '09:00', endTime: '11:00', waterAreaId: 'water-2' },
      { dayOfWeek: 6, startTime: '09:00', endTime: '12:00', waterAreaId: 'water-2' },
    ],
    blackoutDates: [],
  },
]

export const seedWaterAreas: WaterArea[] = [
  { id: 'water-1', name: '静水湖', status: '正常', description: '适合初学者练习的平静水域' },
  { id: 'water-2', name: '急流区', status: '正常', description: '中级以上学员使用的激流训练区' },
  { id: 'water-3', name: '训练池', status: '正常', description: '室内标准训练泳池' },
]

export const seedStudents: Student[] = [
  { id: 'student-1', name: '陈小明', level: '初级', totalLessons: 10, usedLessons: 3, frozenLessons: 0 },
  { id: 'student-2', name: '刘婷婷', level: '中级', totalLessons: 8, usedLessons: 5, frozenLessons: 0 },
  { id: 'student-3', name: '赵强', level: '高级', totalLessons: 12, usedLessons: 8, frozenLessons: 2 },
  { id: 'student-4', name: '孙丽', level: '初级', totalLessons: 5, usedLessons: 4, frozenLessons: 0 },
  { id: 'student-5', name: '周杰', level: '中级', totalLessons: 6, usedLessons: 2, frozenLessons: 1 },
]

function getNextDays(count: number): string[] {
  const dates: string[] = []
  const today = new Date()
  for (let i = 1; i <= count; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

function createSeedCourses(): Course[] {
  const dates = getNextDays(7)
  const courses: Course[] = []
  let id = 1

  for (const date of dates) {
    const d = new Date(date)
    const dow = d.getDay() === 0 ? 7 : d.getDay()

    for (const coach of seedCoaches) {
      for (const slot of coach.availableSlots) {
        if (slot.dayOfWeek === dow) {
          const isBlackout = coach.blackoutDates.some(b => b.date === date)
          if (isBlackout) continue
          courses.push({
            id: `course-${id++}`,
            coachId: coach.id,
            waterAreaId: slot.waterAreaId,
            level: coach.level,
            date,
            startTime: slot.startTime,
            endTime: slot.endTime,
            maxCapacity: coach.maxStudents,
            currentBookings: 0,
            status: '正常',
          })
        }
      }
    }
  }

  return courses
}

export const seedCourses: Course[] = createSeedCourses()
export const seedBookings: Booking[] = []
export const seedWarnings: Warning[] = []
export const seedTransactions: LessonTransaction[] = []
