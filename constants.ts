import { DaySchedule, CourseType, ScheduleItem } from './types';

// Helper to create items quickly
const item = (text: string, type: CourseType, isExam = false): ScheduleItem => {
  // Extract time if present at start (simple heuristic)
  const timeMatch = text.match(/^\d{2}:\d{2}(-\d{2}:\d{2})?/);
  return {
    id: Math.random().toString(36).substr(2, 9),
    text: text,
    type,
    isExam: isExam || text.includes('SINAV') || text.includes('Sınav'),
    time: timeMatch ? timeMatch[0] : undefined
  };
};

export const SCHEDULE_DATA: DaySchedule[] = [
  {
    date: '03 Aralık',
    dayName: 'Çarşamba',
    morning: [item('(Dersler bitti 15:40)', CourseType.OTHER)],
    afternoon: [item('COMP 100 (16:40-18:40)', CourseType.COMP100)],
    evening: [
      item('19:00-21:00 DOLU', CourseType.BUSY),
      item('COMP 100 (21:00-23:00)', CourseType.COMP100)
    ]
  },
  {
    date: '04 Aralık',
    dayName: 'Perşembe',
    morning: [item('PHYS 101 (08:00-11:00)', CourseType.PHYS101)],
    afternoon: [
      item('COMP 106 Tekrar (15:40-16:40)', CourseType.COMP106),
      item('COMP 100 (16:40-18:40)', CourseType.COMP100)
    ],
    evening: [
      item('19:00-21:00 DOLU', CourseType.BUSY),
      item('PHYS 101 (21:00-23:00)', CourseType.PHYS101)
    ]
  },
  {
    date: '05 Aralık',
    dayName: 'Cuma',
    morning: [item('COMP 100 (08:00-09:40)', CourseType.COMP100)],
    afternoon: [
      item('PHYS 101 (11:40-13:00)', CourseType.PHYS101),
      item('PHYS 101 (13:00-15:00)', CourseType.PHYS101)
    ],
    evening: [
      item('COMP 106 Tekrar (18:40-19:40)', CourseType.COMP106),
      item('COMP 100 (19:40-23:40)', CourseType.COMP100)
    ]
  },
  {
    date: '06 Aralık',
    dayName: 'Cumartesi',
    morning: [item('PHYS 101 (09:00-11:00)', CourseType.PHYS101)],
    afternoon: [item('Tatil / Serbest', CourseType.FREE)],
    evening: [item('Tatil / Serbest', CourseType.FREE)]
  },
  {
    date: '07 Aralık',
    dayName: 'Pazar',
    morning: [item('COMP 100 (09:00-11:00)', CourseType.COMP100)],
    afternoon: [item('Tatil / Serbest', CourseType.FREE)],
    evening: [item('Tatil / Serbest', CourseType.FREE)]
  },
  {
    date: '08 Aralık',
    dayName: 'Pazartesi',
    morning: [item('MATH 106 (08:00-09:40)', CourseType.MATH106)],
    afternoon: [
      item('PHYS 101 (11:10-13:00)', CourseType.PHYS101),
      item('COMP 100 (17:10-18:30)', CourseType.COMP100)
    ],
    evening: [
      item('PHYS 101 (18:30-21:30)', CourseType.PHYS101),
      item('COMP 100 (21:30-23:30)', CourseType.COMP100)
    ]
  },
  {
    date: '09 Aralık',
    dayName: 'Salı',
    morning: [item('COMP 100 (08:00-12:30)', CourseType.COMP100)],
    afternoon: [item('COMP 106 Tekrar (15:40-16:40)', CourseType.COMP106)],
    evening: [
      item('PHYS 101 (18:30-21:30)', CourseType.PHYS101),
      item('COMP 100 (21:30-23:30)', CourseType.COMP100)
    ]
  },
  {
    date: '10 Aralık',
    dayName: 'Çarşamba',
    morning: [item('MATH 106 (08:00-09:40)', CourseType.MATH106)],
    afternoon: [
      item('COMP 100 (11:10-13:00)', CourseType.COMP100),
      item('PHYS 101 (15:40-17:00)', CourseType.PHYS101)
    ],
    evening: [
      item('COMP 100 (18:30-21:30)', CourseType.COMP100),
      item('PHYS 101 (21:30-23:30)', CourseType.PHYS101)
    ]
  },
  {
    date: '11 Aralık',
    dayName: 'Perşembe',
    morning: [item('PHYS 101 (08:00-11:00)', CourseType.PHYS101)],
    afternoon: [
      item('COMP 100 (11:00-14:30)', CourseType.COMP100),
      item('COMP 106 Tekrar (15:40-16:40)', CourseType.COMP106)
    ],
    evening: [
      item('MATH 106 (18:00-20:00)', CourseType.MATH106),
      item('PHYS 101 (20:00-23:00)', CourseType.PHYS101)
    ]
  },
  {
    date: '12 Aralık',
    dayName: 'Cuma',
    morning: [item('MATH 106 (08:00-09:40)', CourseType.MATH106)],
    afternoon: [item('MATH 106 (11:40-17:30)', CourseType.MATH106)],
    evening: [
      item('MATH 106 SON TEKRAR (18:40-21:40)', CourseType.MATH106),
      item('COMP 100 (21:40-23:40)', CourseType.COMP100)
    ]
  },
  {
    date: '13 Aralık',
    dayName: 'Cumartesi',
    morning: [
      item('MATH 106 Hızlı Tekrar (07:00-08:00)', CourseType.MATH106),
      item('08:30 MATH 106 SINAVI', CourseType.MATH106, true)
    ],
    afternoon: [item('COMP 100 (13:00-17:00)', CourseType.COMP100)],
    evening: [item('PHYS 101 (18:30-23:30)', CourseType.PHYS101)]
  },
  {
    date: '14 Aralık',
    dayName: 'Pazar',
    morning: [item('COMP 100 (09:00-12:00)', CourseType.COMP100)],
    afternoon: [item('PHYS 101 (14:00-17:00)', CourseType.PHYS101)],
    evening: [item('COMP 100 (18:30-23:30)', CourseType.COMP100)]
  },
  {
    date: '15 Aralık',
    dayName: 'Pazartesi',
    morning: [
      item('COMP 100 Tekrar (08:00-09:40)', CourseType.COMP100),
      item('PHYS 101 (11:10-12:40)', CourseType.PHYS101)
    ],
    afternoon: [
      item('COMP 100 Son Gözden Geçirme (15:40-17:00)', CourseType.COMP100),
      item('PHYS 101 (17:00-18:40)', CourseType.PHYS101)
    ],
    evening: [
      item('19:00 COMP 100 SINAVI', CourseType.COMP100, true),
      item('PHYS 101 (21:00-23:00)', CourseType.PHYS101)
    ]
  },
  {
    date: '16 Aralık',
    dayName: 'Salı',
    morning: [item('PHYS 101 Tekrar (08:00-12:30)', CourseType.PHYS101)],
    afternoon: [item('PHYS 101 Tekrar (15:40-18:30)', CourseType.PHYS101)],
    evening: [item('19:00 PHYS 101 SINAVI', CourseType.PHYS101, true)]
  },
];