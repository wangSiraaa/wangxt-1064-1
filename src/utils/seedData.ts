import type { Coach, WaterArea, Student, Course, Booking, Warning, LessonTransaction, Family } from '@/types'

export const seedFamilies: Family[] = [
  {
    id: 'family-1',
    name: '陈家',
    memberIds: ['student-1', 'student-6'],
    primaryContactId: 'student-6',
  },
  {
    id: 'family-2',
    name: '刘家',
    memberIds: ['student-2', 'student-7'],
    primaryContactId: 'student-2',
  },
]

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
    certifiedBoatTypes: ['单人皮划艇', '亲子双人艇', '独木舟'],
    isFamilyCoach: true,
    minAge: 6,
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
    certifiedBoatTypes: ['单人皮划艇', '双人皮划艇', 'SUP桨板', '独木舟'],
    isFamilyCoach: false,
    minAge: 12,
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
    certifiedBoatTypes: ['单人皮划艇', '双人皮划艇', 'SUP桨板', '独木舟'],
    isFamilyCoach: true,
    minAge: 8,
  },
  {
    id: 'coach-4',
    name: '赵敏',
    level: '中级',
    maxStudents: 8,
    availableSlots: [
      { dayOfWeek: 6, startTime: '09:00', endTime: '12:00', waterAreaId: 'water-3' },
      { dayOfWeek: 6, startTime: '14:00', endTime: '17:00', waterAreaId: 'water-1' },
      { dayOfWeek: 7, startTime: '09:00', endTime: '12:00', waterAreaId: 'water-3' },
    ],
    blackoutDates: [],
    certifiedBoatTypes: ['单人皮划艇', '亲子双人艇', '独木舟'],
    isFamilyCoach: true,
    minAge: 5,
  },
]

export const seedWaterAreas: WaterArea[] = [
  {
    id: 'water-1',
    name: '静水湖',
    status: '正常',
    description: '适合初学者练习的平静水域',
    allowedBoatTypes: ['单人皮划艇', '亲子双人艇', '独木舟', 'SUP桨板'],
    minLevel: '初级',
    allowChildren: true,
  },
  {
    id: 'water-2',
    name: '急流区',
    status: '正常',
    description: '中级以上学员使用的激流训练区',
    allowedBoatTypes: ['单人皮划艇', '双人皮划艇'],
    minLevel: '中级',
    allowChildren: false,
  },
  {
    id: 'water-3',
    name: '训练池',
    status: '正常',
    description: '室内标准训练泳池，岸上课和基础训练专用',
    allowedBoatTypes: ['单人皮划艇', '亲子双人艇', '独木舟', 'SUP桨板'],
    minLevel: '初级',
    allowChildren: true,
  },
]

export const seedStudents: Student[] = [
  { id: 'student-1', name: '陈小明', level: '初级', totalLessons: 10, usedLessons: 3, frozenLessons: 0, age: 10, role: '儿童', familyId: 'family-1', allowedBoatTypes: ['单人皮划艇', '亲子双人艇'] },
  { id: 'student-2', name: '刘婷婷', level: '中级', totalLessons: 8, usedLessons: 5, frozenLessons: 0, age: 28, role: '成人', familyId: 'family-2', allowedBoatTypes: ['单人皮划艇', '双人皮划艇', 'SUP桨板'] },
  { id: 'student-3', name: '赵强', level: '高级', totalLessons: 12, usedLessons: 8, frozenLessons: 2, age: 35, role: '成人', allowedBoatTypes: ['单人皮划艇', '双人皮划艇', 'SUP桨板', '独木舟'] },
  { id: 'student-4', name: '孙丽', level: '初级', totalLessons: 5, usedLessons: 4, frozenLessons: 0, age: 25, role: '成人', allowedBoatTypes: ['单人皮划艇', '亲子双人艇'] },
  { id: 'student-5', name: '周杰', level: '中级', totalLessons: 6, usedLessons: 2, frozenLessons: 1, age: 30, role: '成人', allowedBoatTypes: ['单人皮划艇', '双人皮划艇'] },
  { id: 'student-6', name: '陈爸爸', level: '初级', totalLessons: 15, usedLessons: 2, frozenLessons: 0, age: 36, role: '成人', familyId: 'family-1', allowedBoatTypes: ['单人皮划艇', '亲子双人艇', '独木舟'] },
  { id: 'student-7', name: '刘小贝', level: '初级', totalLessons: 12, usedLessons: 1, frozenLessons: 0, age: 7, role: '儿童', familyId: 'family-2', allowedBoatTypes: ['亲子双人艇'] },
  { id: 'student-8', name: '钱朵朵', level: '初级', totalLessons: 8, usedLessons: 0, frozenLessons: 0, age: 8, role: '儿童', allowedBoatTypes: ['单人皮划艇', '亲子双人艇'] },
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
  const dates = getNextDays(14)
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

          const waterArea = seedWaterAreas.find(w => w.id === slot.waterAreaId)
          const isWeekend = dow === 6 || dow === 7
          const isPool = slot.waterAreaId === 'water-3'

          const courseConfigs = [
            { condition: isPool, courseType: '岸上安全课' as const, isOnShoreOnly: true, cost: 1, boatTypes: coach.certifiedBoatTypes.slice(0, 2), minAge: coach.minAge, allowFamily: coach.isFamilyCoach, proportion: undefined },
            { condition: !isPool && !isWeekend, courseType: '水上实操课' as const, isOnShoreOnly: false, cost: 2, boatTypes: coach.certifiedBoatTypes.slice(0, 3), minAge: Math.max(coach.minAge, waterArea?.allowChildren ? 6 : 14), allowFamily: coach.isFamilyCoach && (waterArea?.allowChildren ?? false), proportion: 0 },
            { condition: isWeekend && !isPool, courseType: '体验营' as const, isOnShoreOnly: false, cost: 3, boatTypes: coach.certifiedBoatTypes, minAge: coach.minAge, allowFamily: coach.isFamilyCoach && (waterArea?.allowChildren ?? false), proportion: 0.3 },
            { condition: isWeekend && isPool, courseType: '组合课' as const, isOnShoreOnly: false, cost: 2, boatTypes: coach.certifiedBoatTypes, minAge: coach.minAge, allowFamily: true, proportion: 0.5 },
          ]

          for (const cfg of courseConfigs) {
            if (cfg.condition) {
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
                courseType: cfg.courseType,
                boatTypes: cfg.boatTypes,
                minAge: cfg.minAge,
                lessonCost: cfg.cost,
                allowFamilyBooking: cfg.allowFamily,
                isOnShoreOnly: cfg.isOnShoreOnly,
                shoreLessonProportion: cfg.proportion,
              })
              break
            }
          }
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
