export enum SlotType {
  MORNING = 'Sabah/Öğle',
  AFTERNOON = 'Öğle Arası/Öğleden Sonra',
  EVENING = 'Akşam',
}

export enum CourseType {
  COMP100 = 'COMP 100',
  COMP106 = 'COMP 106',
  PHYS101 = 'PHYS 101',
  MATH106 = 'MATH 106',
  EXAM = 'SINAV',
  FREE = 'Tatil / Serbest',
  BUSY = 'DOLU',
  OTHER = 'OTHER'
}

export interface ScheduleItem {
  id: string;
  text: string;
  type: CourseType;
  isExam?: boolean;
  time?: string;
}

export interface DaySchedule {
  date: string;
  dayName: string;
  morning: ScheduleItem[];
  afternoon: ScheduleItem[];
  evening: ScheduleItem[];
}

export interface StudyLog {
  id: string;
  courseName: string;
  date: string; // ISO string
  durationMinutes: number;
}

export interface TodoItem {
  id: string;
  courseType: CourseType;
  text: string;
  completed: boolean;
  createdAt: number;
}