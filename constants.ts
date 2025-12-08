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
    morning: [
      item('COMP 100 (08:00-12:00)', CourseType.COMP100)
    ],
    afternoon: [
      item('COMP 106 Tekrar (17:00-18:00)', CourseType.COMP106)
    ],
    evening: [
      item('PHYS 101 (18:00-20:00)', CourseType.PHYS101),
      item('COMP 100 (20:00-23:00)', CourseType.COMP100),
      item('PHYS 101 (23:00-24:00)', CourseType.PHYS101)
    ]
  },
  {
    date: '10 Aralık',
    dayName: 'Çarşamba',
    morning: [
      item('PHYS 101 (08:00-10:00)', CourseType.PHYS101),
      item('COMP 100 (12:00-14:00)', CourseType.COMP100)
    ],
    afternoon: [
      item('MATH 106 (15:00-16:00)', CourseType.MATH106),
      item('PHYS 101 (16:00-18:00)', CourseType.PHYS101)
    ],
    evening: [
      item('COMP 100 (18:00-21:00)', CourseType.COMP100),
      item('PHYS 101 (21:00-23:00)', CourseType.PHYS101)
    ]
  },
  {
    date: '11 Aralık',
    dayName: 'Perşembe',
    morning: [
      item('COMP 100 (08:00-11:00)', CourseType.COMP100),
      item('PHYS 101 (11:00-14:00)', CourseType.PHYS101)
    ],
    afternoon: [
      item('COMP 106 Tekrar (15:00-16:00)', CourseType.COMP106),
      item('MATH 106 (16:00-19:00)', CourseType.MATH106)
    ],
    evening: [
      item('COMP 100 (19:00-24:00)', CourseType.COMP100)
    ]
  },
  {
    date: '12 Aralık',
    dayName: 'Cuma',
    morning: [
      item('MATH 106 (08:00-10:00)', CourseType.MATH106)
    ],
    afternoon: [
      item('MATH 106 (12:00-18:00)', CourseType.MATH106),
      item('COMP 106 Tekrar (18:00-19:00)', CourseType.COMP106)
    ],
    evening: [
      item('MATH 106 (19:00-22:00)', CourseType.MATH106),
      item('COMP 100 (22:00-24:00)', CourseType.COMP100)
    ]
  },
  {
    date: '13 Aralık',
    dayName: 'Cumartesi',
    morning: [
      item('MATH 106 (08:00-09:00)', CourseType.MATH106)
    ],
    afternoon: [
      item('COMP 100 (12:00-16:00)', CourseType.COMP100),
      item('PHYS 101 (16:00-18:00)', CourseType.PHYS101)
    ],
    evening: [
      item('PHYS 101 (18:00-24:00)', CourseType.PHYS101)
    ]
  },
  {
    date: '14 Aralık',
    dayName: 'Pazar',
    morning: [
      item('COMP 100 (09:00-13:00)', CourseType.COMP100)
    ],
    afternoon: [
      item('PHYS 101 (14:00-17:00)', CourseType.PHYS101)
    ],
    evening: [
      item('COMP 100 (18:00-24:00)', CourseType.COMP100)
    ]
  },
  {
    date: '15 Aralık',
    dayName: 'Pazartesi',
    morning: [
      item('COMP 100 (08:00-10:00)', CourseType.COMP100),
      item('PHYS 101 (12:00-14:00)', CourseType.PHYS101)
    ],
    afternoon: [
      item('COMP 100 (15:00-16:00)', CourseType.COMP100),
      item('PHYS 101 (16:00-19:00)', CourseType.PHYS101)
    ],
    evening: [
      item('PHYS 101 (21:00-24:00)', CourseType.PHYS101)
    ]
  },
  {
    date: '16 Aralık',
    dayName: 'Salı',
    morning: [
      item('PHYS 101 (08:00-13:00)', CourseType.PHYS101)
    ],
    afternoon: [
      item('PHYS 101 (16:00-18:00)', CourseType.PHYS101)
    ],
    evening: [
      item('PHYS 101 (18:00-20:00)', CourseType.PHYS101)
    ]
  },
];