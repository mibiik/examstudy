import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { SCHEDULE_DATA } from './constants';
import { CourseBadge } from './components/CourseBadge';
import { 
  Sun, Sunset, Moon, Bell, CheckCircle, 
  Menu, X, Timer, Play, Pause, RotateCcw, History, Lock,
  ChevronLeft, Save, Trash2, Edit3, Award, Settings,
  Headphones, ListTodo, Trophy, CalendarClock, TrendingUp, Volume2, Plus, Square, CheckSquare,
  Maximize2, Minimize2
} from 'lucide-react';
import { CourseType, ScheduleItem, StudyLog, TodoItem } from './types';

// --- Constants for New Features ---

const LEVELS = [
  { name: 'Çaylak Öğrenci', minMinutes: 0 },
  { name: 'Azimli Çalışan', minMinutes: 60 },     // 1 hour
  { name: 'Ders Kurdu', minMinutes: 300 },        // 5 hours
  { name: 'Akademik Yıldız', minMinutes: 600 },   // 10 hours
  { name: 'Kampüs Efsanesi', minMinutes: 1200 },  // 20 hours
  { name: 'Bilge', minMinutes: 3000 }             // 50 hours
];

const AMBIENT_SOUNDS = [
  { id: 'rain', name: 'Yağmur Sesi', url: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg' },
  { id: 'fire', name: 'Şömine', url: 'https://actions.google.com/sounds/v1/ambiences/fireplace.ogg' },
  { id: 'cafe', name: 'Kafe Ortamı', url: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg' },
];

// --- Helper Functions (Pure) ---

const getThemeColors = (type: CourseType) => {
  switch (type) {
    case CourseType.COMP100: return { bg: 'bg-emerald-600', light: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    case CourseType.COMP106: return { bg: 'bg-teal-600', light: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' };
    case CourseType.PHYS101: return { bg: 'bg-violet-600', light: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' };
    case CourseType.MATH106: return { bg: 'bg-blue-600', light: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
    default: return { bg: 'bg-indigo-600', light: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' };
  }
};

const parseCourseDates = (dateStr: string, text: string, now: Date): { start: Date, end: Date } | null => {
  const day = parseInt(dateStr.split(' ')[0]);
  const year = now.getFullYear();
  const month = 11; // December

  const timeMatch = text.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
  if (!timeMatch) return null;

  const [_, startStr, endStr] = timeMatch;
  const [startH, startM] = startStr.split(':').map(Number);
  const [endH, endM] = endStr.split(':').map(Number);

  const start = new Date(year, month, day, startH, startM);
  const end = new Date(year, month, day, endH, endM);
  
  return { start, end };
};

function App() {
  // --- Global State ---
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const activeDayRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<'HOME' | 'DETAIL' | 'SESSION'>('HOME');
  const [detailTab, setDetailTab] = useState<'NOTES' | 'TASKS'>('NOTES'); // New Tab state
  const [selectedCourseType, setSelectedCourseType] = useState<CourseType | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // --- Data State ---
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [notes, setNotes] = useState<{[key: string]: string}>({});
  const [tasks, setTasks] = useState<TodoItem[]>([]); // New Tasks State

  // --- Timer & Modal State ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeCourse, setActiveCourse] = useState<ScheduleItem | null>(null);
  const [activeCourseEndTime, setActiveCourseEndTime] = useState<Date | null>(null);
  const [activeCourseDateStr, setActiveCourseDateStr] = useState<string | null>(null);
  
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [customWorkMinutes, setCustomWorkMinutes] = useState(25);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<'WORK' | 'BREAK' | 'COURSE'>('WORK');
  const [initialDuration, setInitialDuration] = useState(25 * 60);
  const [currentSessionKey, setCurrentSessionKey] = useState<string | null>(null);
  
  // Sound State
  const [activeSoundId, setActiveSoundId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [soundVolume, setSoundVolume] = useState<number>(0.6);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  // Notification sent trackers
  const upcomingNotifiedRef = useRef<Set<string>>(new Set());
  
  // Modal for Saving/Discarding
  const [pendingSession, setPendingSession] = useState<{mode: string, duration: number} | null>(null);
 
  // Local state for new task input (moved from renderDetail to maintain stable hook order)
  const [newTaskText, setNewTaskText] = useState('');

  // --- Initialization ---
  useEffect(() => {
    // 1. Notification Permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      if (Notification.permission === 'granted') setNotificationsEnabled(true);
    }

    // 2. Load Data from LocalStorage
    const savedLogs = localStorage.getItem('studyLogs');
    if (savedLogs) {
      try {
        setLogs(JSON.parse(savedLogs));
      } catch (e) {
        console.error("Failed to parse logs", e);
      }
    }
    
    const savedNotes = localStorage.getItem('courseNotes');
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch (e) {
        console.error("Failed to parse notes", e);
      }
    }

    const savedTasks = localStorage.getItem('courseTasks');
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (e) {
        console.error("Failed to parse tasks", e);
      }
    }

    // Load previously sent upcoming notifications
    const savedUpcoming = localStorage.getItem('upcomingNotifiedKeys');
    if (savedUpcoming) {
      try {
        const arr: string[] = JSON.parse(savedUpcoming);
        upcomingNotifiedRef.current = new Set(arr);
      } catch {}
    }

    // Load sound volume
    const savedVol = localStorage.getItem('soundVolume');
    if (savedVol) {
      const vol = parseFloat(savedVol);
      if (!isNaN(vol)) setSoundVolume(Math.min(1, Math.max(0, vol)));
    }

    // 3. Scroll to today
    const isMobile = window.matchMedia && window.matchMedia('(max-width: 1023px)').matches;
    if (isMobile && activeDayRef.current) {
       activeDayRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  useEffect(() => {
    const isMobile = window.matchMedia && window.matchMedia('(max-width: 1023px)').matches;
    if (view === 'HOME' && isMobile && activeDayRef.current) {
      setTimeout(() => {
        if (activeDayRef.current) {
          activeDayRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 0);
    }
  }, [view]);

  // --- Clock & Active Course Check Loop ---
  useEffect(() => {
    // Define the checkActiveCourse logic directly within the effect
    const checkActiveCourse = (now: Date) => {
      if (now.getMonth() !== 11) return; 
      const currentDay = now.getDate();
      const dayData = SCHEDULE_DATA.find(d => parseInt(d.date) === currentDay);

      if (!dayData) {
        setActiveCourse(prev => prev ? null : prev);
        setActiveCourseEndTime(prev => prev ? null : prev);
        return;
      }

      const allItems = [...dayData.morning, ...dayData.afternoon, ...dayData.evening];
      let foundCourse: ScheduleItem | null = null;
      let foundEndTime: Date | null = null;

      for (const item of allItems) {
        const dates = parseCourseDates(dayData.date, item.text, now);
        if (dates) {
          // Pre-session notifications (10 min and 1 min before)
          if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted' && now < dates.start) {
            const msUntil = dates.start.getTime() - now.getTime();
            const minutesUntil = Math.ceil(msUntil / 60000);
            const baseKey = `${dayData.date}-${item.id}`;

            if (minutesUntil <= 10 && minutesUntil > 1) {
              const key10 = `${baseKey}-10`; 
              if (!upcomingNotifiedRef.current.has(key10)) {
                new Notification('Ders yaklaşıyor', { body: `${item.text} dersi 10 dakika sonra başlıyor. Hazırlan!` });
                upcomingNotifiedRef.current.add(key10);
              }
            }
            if (minutesUntil <= 1) {
              const key1 = `${baseKey}-1`;
              if (!upcomingNotifiedRef.current.has(key1)) {
                new Notification('Başlamak üzere', { body: `${item.text} 1 dakika içinde başlıyor. İyi çalışma!` });
                upcomingNotifiedRef.current.add(key1);
              }
            }
          }

          if (now >= dates.start && now <= dates.end) {
            foundCourse = item;
            foundEndTime = dates.end;
            break;
          }
        }
      }

      // Only update state if values actually changed to avoid re-renders
      setActiveCourse(prev => (prev?.id === foundCourse?.id ? prev : foundCourse));
      setActiveCourseDateStr(prev => (foundCourse ? dayData.date : null));
      
      setActiveCourseEndTime(prev => {
          // If both are null or undefined, no change
          if (!foundEndTime && !prev) return prev;
          // If prev is null but foundEndTime exists, update
          if (!prev && foundEndTime) return foundEndTime;
          // If foundEndTime is null but prev exists, update
          if (prev && !foundEndTime) return foundEndTime;
          // If both exist and have the same time, return prev reference to prevent re-render
          if (prev && foundEndTime && prev.getTime() === foundEndTime.getTime()) {
              return prev; 
          }
          // Otherwise, update with the new foundEndTime
          return foundEndTime;
      });

      // Persist upcoming notified keys periodically (throttle by using current tick)
      if (upcomingNotifiedRef.current.size) {
        try { localStorage.setItem('upcomingNotifiedKeys', JSON.stringify(Array.from(upcomingNotifiedRef.current))); } catch {}
      }
    };

    // Initial check
    checkActiveCourse(new Date());

    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      checkActiveCourse(now); // Call the defined function
    }, 1000);

    return () => clearInterval(interval);
  }, []); // Empty dependency array as checkActiveCourse is now internal

  

  // --- Sound Effect Logic ---
  useEffect(() => {
    if (activeSoundId) {
      const sound = AMBIENT_SOUNDS.find(s => s.id === activeSoundId);
      if (sound) {
        if (!audioRef.current) {
          audioRef.current = new Audio(sound.url);
          audioRef.current.loop = true;
        } else {
          audioRef.current.src = sound.url;
        }
        audioRef.current.volume = soundVolume;
        audioRef.current.play().catch(e => console.error("Audio play error", e));
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [activeSoundId, soundVolume]);

  // Persist volume
  useEffect(() => {
    localStorage.setItem('soundVolume', String(soundVolume));
    if (audioRef.current) audioRef.current.volume = soundVolume;
  }, [soundVolume]);

  // Keyboard shortcuts (active in SESSION)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (view !== 'SESSION') return;
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const typing = tag === 'input' || tag === 'textarea' || (e as any).isComposing;
      if (typing) return;
      if (e.code === 'Space') { e.preventDefault(); toggleTimer(); }
      else if (e.key === 'r' || e.key === 'R') { resetTimer(); }
      else if (e.key === 'f' || e.key === 'F') { if (isTimerRunning) finishSessionEarly(); }
      else if (e.key === 'm' || e.key === 'M') { setIsMenuOpen(prev => !prev); }
      else if (e.key === 'Escape' && isFullscreen) { exitFullscreen(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [view, isTimerRunning, isFullscreen]);

  // Fullscreen helpers
  const enterFullscreen = () => {
    const el = document.documentElement as any;
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    setIsFullscreen(true);
  };
  const exitFullscreen = () => {
    const d = document as any;
    if (d.exitFullscreen) d.exitFullscreen();
    else if (d.webkitExitFullscreen) d.webkitExitFullscreen();
    setIsFullscreen(false);
  };
  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // --- Timer Logic ---
  useEffect(() => {
    let interval: any;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  // Sync custom minutes change to timer only when NOT running and in WORK mode
  useEffect(() => {
    if (!isTimerRunning && timerMode === 'WORK') {
      const seconds = customWorkMinutes * 60;
      setTimerSeconds(seconds);
      setInitialDuration(seconds);
    }
  }, [customWorkMinutes, isTimerRunning, timerMode]);

  const getCourseStatusAndProgress = (item: ScheduleItem, dateStr: string): { status: 'PAST' | 'PRESENT' | 'FUTURE', progress: number } => {
    const now = currentTime;
    const dates = parseCourseDates(dateStr, item.text, now);

    if (!dates) {
       const day = parseInt(dateStr.split(' ')[0]);
       const todayDay = now.getDate();
       const month = 11;
       if (now.getMonth() > month) return { status: 'PAST', progress: 0 };
       if (now.getMonth() === month && todayDay > day) return { status: 'PAST', progress: 0 };
       return { status: 'FUTURE', progress: 0 };
    }

    if (now > dates.end) return { status: 'PAST', progress: 100 };
    if (now < dates.start) return { status: 'FUTURE', progress: 0 };

    const totalDuration = dates.end.getTime() - dates.start.getTime();
    const elapsed = now.getTime() - dates.start.getTime();
    const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

    return { status: 'PRESENT', progress };
  };

  // --- NEW: Gamification Logic ---
  const { currentLevel, nextLevel, progressToNextLevel, totalMinutesStudied } = useMemo(() => {
    const total = logs.reduce((acc, log) => acc + log.durationMinutes, 0);
    let levelIndex = 0;
    
    for (let i = 0; i < LEVELS.length; i++) {
      if (total >= LEVELS[i].minMinutes) {
        levelIndex = i;
      } else {
        break;
      }
    }
    
    const current = LEVELS[levelIndex];
    const next = LEVELS[levelIndex + 1];
    
    let progress = 100;
    if (next) {
      const range = next.minMinutes - current.minMinutes;
      const achieved = total - current.minMinutes;
      progress = (achieved / range) * 100;
    }

    return { 
      currentLevel: current, 
      nextLevel: next, 
      progressToNextLevel: progress, 
      totalMinutesStudied: total 
    };
  }, [logs]);

  // --- NEW: Next Exam Logic ---
  const nextExam = useMemo(() => {
    const now = currentTime;
    let closestExam: { item: ScheduleItem, date: Date, daysLeft: number } | null = null;

    SCHEDULE_DATA.forEach(day => {
      [...day.morning, ...day.afternoon, ...day.evening].forEach(item => {
        if (item.isExam) {
          const dates = parseCourseDates(day.date, item.text, now);
          // Fallback if regex fails but we know the day
          let examDate = dates ? dates.start : new Date(now.getFullYear(), 11, parseInt(day.date.split(' ')[0]), 9, 0); 
          
          if (examDate > now) {
             const diffTime = Math.abs(examDate.getTime() - now.getTime());
             const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
             
             if (!closestExam || examDate < closestExam.date) {
               closestExam = { item, date: examDate, daysLeft: diffDays };
             }
          }
        }
      });
    });
    return closestExam;
  }, [currentTime]);

  // Exam motivation notification when exam is close (<=7 days), once per day
  useEffect(() => {
    if (!nextExam) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (!notificationsEnabled) return;
    if (nextExam.daysLeft > 7) return;
    const todayKey = new Date().toISOString().slice(0,10);
    const last = localStorage.getItem('lastExamMotivationDate');
    if (last === todayKey) return;
    const msg = nextExam.daysLeft === 0
      ? 'Bugün sınav günü! Hazırlıklarını gözden geçir ve sakin kal.'
      : `${nextExam.daysLeft} gün kaldı. Bugün küçük ama istikrarlı bir adım at: 30 dk tekrar!`;
    new Notification('Sınav yaklaşırken', { body: msg });
    localStorage.setItem('lastExamMotivationDate', todayKey);
  }, [nextExam, notificationsEnabled]);

  // --- Actions ---

  const handleCourseClick = (item: ScheduleItem) => {
    setSelectedCourseType(item.type);
    setView('DETAIL');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNoteChange = (text: string) => {
    if (!selectedCourseType) return;
    const newNotes = { ...notes, [selectedCourseType]: text };
    setNotes(newNotes);
    localStorage.setItem('courseNotes', JSON.stringify(newNotes));
  };

  // Task Actions
  const handleAddTask = (text: string) => {
    if (!selectedCourseType || !text.trim()) return;
    const newTask: TodoItem = {
      id: Date.now().toString(),
      courseType: selectedCourseType,
      text: text,
      completed: false,
      createdAt: Date.now()
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    localStorage.setItem('courseTasks', JSON.stringify(updatedTasks));
  };

  const toggleTask = (taskId: string) => {
    const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    setTasks(updatedTasks);
    localStorage.setItem('courseTasks', JSON.stringify(updatedTasks));
  };

  const deleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    setTasks(updatedTasks);
    localStorage.setItem('courseTasks', JSON.stringify(updatedTasks));
  };

  const startActiveCourseTimer = () => {
    if (!activeCourseEndTime) return;
    const now = new Date();
    const diffSeconds = Math.floor((activeCourseEndTime.getTime() - now.getTime()) / 1000);
    
    if (diffSeconds > 0) {
      setTimerMode('COURSE');
      setTimerSeconds(diffSeconds);
      setInitialDuration(diffSeconds);
      setIsTimerRunning(true);
      if (activeCourse) {
        setSelectedCourseType(activeCourse.type);
      }
      // Unique session key: date + schedule item id
      if (activeCourse && activeCourseDateStr) {
        setCurrentSessionKey(`${activeCourseDateStr}-${activeCourse.id}`);
      } else {
        setCurrentSessionKey(`course-${Date.now()}`);
      }
      setView('SESSION');
    } else {
      alert("Ders süresi dolmuş veya hatalı zaman.");
    }
  };

  const startManualTimer = (type: CourseType) => {
    setSelectedCourseType(type);
    setTimerMode('WORK');
    setTimerSeconds(customWorkMinutes * 60);
    setInitialDuration(customWorkMinutes * 60);
    setIsTimerRunning(true);
    // Unique manual session key
    setCurrentSessionKey(`manual-${type}-${Date.now()}`);
    setView('SESSION');
  };

  const handleTimerComplete = () => {
    setPendingSession({
      mode: timerMode,
      duration: Math.ceil((initialDuration - timerSeconds) / 60)
    });
    // Check permission again just in case
    if (Notification.permission === 'granted') {
       new Notification("Süre Bitti!", { body: "Oturumu kaydetmek ister misin?" });
    }
    // Stop sound when timer ends naturally
    setActiveSoundId(null);
  };

  const saveSession = () => {
    if (!pendingSession) return;

    if (pendingSession.mode !== 'BREAK') {
      let courseName = 'Serbest Çalışma';
      if (pendingSession.mode === 'COURSE' && activeCourse) {
        // Include the day label to make course instances unique across days
        const dayLabel = activeCourseDateStr ? ` @ ${activeCourseDateStr}` : '';
        courseName = `${activeCourse.text}${dayLabel}`;
      } else if (selectedCourseType) {
        const todayLabel = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long' });
        courseName = `${selectedCourseType.toString()} @ ${todayLabel}`;
      }

      const newLog: StudyLog = {
        id: Date.now().toString(),
        courseName: courseName,
        date: new Date().toISOString(),
        durationMinutes: pendingSession.duration
      };
      
      const updatedLogs = [newLog, ...logs];
      setLogs(updatedLogs);
      localStorage.setItem('studyLogs', JSON.stringify(updatedLogs));
    }
    
    setPendingSession(null);
    if (pendingSession.mode !== 'BREAK') {
       setTimerMode('BREAK');
       setInitialDuration(5 * 60);
       setTimerSeconds(5 * 60);
    } else {
       setTimerMode('WORK');
       setInitialDuration(customWorkMinutes * 60);
       setTimerSeconds(customWorkMinutes * 60);
    }
  };

  const discardSession = () => {
    setPendingSession(null);
    resetTimer();
  };

  const toggleTimer = () => {
    setIsTimerRunning(prev => !prev);
  };

  const finishSessionEarly = () => {
    setIsTimerRunning(false);
    handleTimerComplete();
  };
  
  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerMode('WORK');
    const resetSecs = customWorkMinutes * 60;
    setInitialDuration(resetSecs);
    setTimerSeconds(resetSecs);
    setActiveSoundId(null);
  };

  // --- Render Helpers ---

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const getTimerLabel = () => {
    switch (timerMode) {
      case 'COURSE': return 'Ders Süresi';
      case 'BREAK': return 'Mola';
      default: return 'Odaklanma';
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return;
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        alert("Bildirimler ayarlandı.");
      }
    } catch (e) {
      console.error("Notification permission error", e);
    }
  };

  const isToday = (dateStr: string) => {
    const today = new Date();
    const day = parseInt(dateStr.split(' ')[0]);
    return today.getDate() === day && today.getMonth() === 11;
  };

  // --- Views ---

  const renderHome = () => (
    <div className="animate-in fade-in duration-500 pb-20 space-y-6">
      
      {/* FEATURE: Exam Countdown Widget */}
      {nextExam && (
        <div className="bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl p-5 text-white shadow-lg shadow-rose-200 relative overflow-hidden transition-transform hover:scale-[1.01] duration-300">
          <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
             <CalendarClock size={120} />
          </div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
               <p className="text-rose-100 font-bold text-xs uppercase tracking-wider mb-1">Sıradaki Sınav</p>
               <h3 className="text-2xl font-black">{nextExam.item.text.replace(/SINAV.*/, 'SINAVI')}</h3>
               <p className="text-sm font-medium opacity-90">{nextExam.date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-center min-w-[80px]">
               <span className="block text-3xl font-black leading-none">{nextExam.daysLeft}</span>
               <span className="text-[10px] font-bold uppercase tracking-wide">Gün Kaldı</span>
            </div>
          </div>
        </div>
      )}

      {/* Desktop View Table */}
      <div className="hidden xl:block overflow-hidden rounded-xl shadow-lg border border-slate-200 bg-white">
          <div className="grid grid-cols-[120px_1fr_1fr_1fr] bg-slate-50 border-b border-slate-200 sticky top-16 z-20">
             <div className="p-4 font-bold text-slate-500 text-xs uppercase tracking-wider flex items-center justify-center">Tarih</div>
             <div className="p-4 font-bold text-amber-600 text-xs uppercase tracking-wider border-l border-slate-200 flex items-center gap-2"><Sun size={16} /> Sabah / Öğle</div>
             <div className="p-4 font-bold text-orange-600 text-xs uppercase tracking-wider border-l border-slate-200 flex items-center gap-2"><Sunset size={16} /> Öğle Arası</div>
             <div className="p-4 font-bold text-indigo-600 text-xs uppercase tracking-wider border-l border-slate-200 flex items-center gap-2"><Moon size={16} /> Akşam</div>
          </div>
          <div className="divide-y divide-slate-100">
            {SCHEDULE_DATA.map((day, idx) => {
               const isCurrentDay = isToday(day.date);
               return (
                <div key={day.date} className={`grid grid-cols-[120px_1fr_1fr_1fr] transition-colors ${
                  isCurrentDay ? 'bg-indigo-50/60 ring-inset ring-2 ring-indigo-200' : (idx % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/30 hover:bg-slate-50')
                }`}>
                  <div className="p-4 flex flex-col justify-center items-center text-center border-r border-slate-100">
                    <span className={`text-2xl font-bold ${isCurrentDay ? 'text-indigo-700' : 'text-slate-700'}`}>{day.date.split(' ')[0]}</span>
                    <span className="text-xs font-semibold uppercase text-slate-400 mb-1">{day.date.split(' ')[1]}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${day.dayName === 'Cumartesi' || day.dayName === 'Pazar' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>{day.dayName}</span>
                    {isCurrentDay && <span className="mt-2 text-xs font-mono font-bold text-indigo-500">{currentTime.toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}</span>}
                  </div>
                  <div className="p-3 border-r border-slate-100 flex flex-col gap-2">
                    {day.morning.map((item, i) => {
                       const { status, progress } = getCourseStatusAndProgress(item, day.date);
                       return <CourseBadge key={item.id} item={item} onClick={handleCourseClick} status={status} progress={progress} index={i} />;
                    })}
                  </div>
                  <div className="p-3 border-r border-slate-100 flex flex-col gap-2">
                    {day.afternoon.map((item, i) => {
                       const { status, progress } = getCourseStatusAndProgress(item, day.date);
                       return <CourseBadge key={item.id} item={item} onClick={handleCourseClick} status={status} progress={progress} index={i + 1} />;
                    })}
                  </div>
                  <div className="p-3 flex flex-col gap-2">
                    {day.evening.map((item, i) => {
                       const { status, progress } = getCourseStatusAndProgress(item, day.date);
                       return <CourseBadge key={item.id} item={item} onClick={handleCourseClick} status={status} progress={progress} index={i + 2} />;
                    })}
                  </div>
                </div>
              );
            })}
          </div>
      </div>

      {/* Mobile View List */}
      <div className="xl:hidden flex flex-col gap-6">
          {SCHEDULE_DATA.map((day) => {
            const isCurrentDay = isToday(day.date);
            
            return (
              <div 
                key={day.date} 
                ref={isCurrentDay ? activeDayRef : null}
                className={`
                  relative rounded-2xl overflow-hidden transition-all duration-300
                  ${isCurrentDay 
                    ? 'bg-white shadow-xl ring-2 ring-indigo-500 ring-offset-2 scale-[1.01]' 
                    : 'bg-white shadow-sm border border-slate-200 opacity-95'
                  }
                `}
              >
                {/* Card Header */}
                <div className={`px-5 py-4 border-b border-slate-100 flex justify-between items-center ${
                   day.dayName === 'Cumartesi' || day.dayName === 'Pazar' ? 'bg-rose-50 text-rose-700' : 'bg-slate-50 text-slate-700'
                }`}>
                  <div className="flex flex-col">
                    <span className="font-extrabold text-xl tracking-tight">{day.date}</span>
                    <span className="text-xs font-semibold uppercase opacity-70 tracking-wider">{day.dayName}</span>
                  </div>
                  {isCurrentDay && (
                    <div className="flex flex-col items-end">
                       <span className="bg-indigo-600 text-white text-[10px] px-2 py-1 rounded-full font-bold shadow-sm animate-pulse mb-1">BUGÜN</span>
                       <span className="text-xs font-mono font-medium text-slate-500">{currentTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-6">
                  {/* Morning */}
                  <div className="relative pl-4 border-l-2 border-slate-200">
                     <div className="absolute -left-[9px] top-0 bg-amber-400 rounded-full p-1 border-2 border-white shadow-sm">
                        <Sun size={12} className="text-white" />
                     </div>
                     <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">Sabah</h4>
                     <div className="space-y-3">
                       {day.morning.length > 0 ? day.morning.map((item, i) => {
                         const { status, progress } = getCourseStatusAndProgress(item, day.date);
                         return <CourseBadge key={item.id} item={item} onClick={handleCourseClick} status={status} progress={progress} index={i} />;
                       }) : <span className="text-xs text-slate-400 italic pl-1">Boş</span>}
                     </div>
                  </div>

                  {/* Afternoon */}
                  <div className="relative pl-4 border-l-2 border-slate-200">
                     <div className="absolute -left-[9px] top-0 bg-orange-500 rounded-full p-1 border-2 border-white shadow-sm">
                        <Sunset size={12} className="text-white" />
                     </div>
                     <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">Öğle</h4>
                     <div className="space-y-3">
                       {day.afternoon.length > 0 ? day.afternoon.map((item, i) => {
                         const { status, progress } = getCourseStatusAndProgress(item, day.date);
                         return <CourseBadge key={item.id} item={item} onClick={handleCourseClick} status={status} progress={progress} index={i+1} />;
                       }) : <span className="text-xs text-slate-400 italic pl-1">Boş</span>}
                     </div>
                  </div>

                  {/* Evening */}
                  <div className="relative pl-4 border-l-2 border-slate-200">
                     <div className="absolute -left-[9px] top-0 bg-indigo-600 rounded-full p-1 border-2 border-white shadow-sm">
                        <Moon size={12} className="text-white" />
                     </div>
                     <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">Akşam</h4>
                     <div className="space-y-3">
                       {day.evening.length > 0 ? day.evening.map((item, i) => {
                         const { status, progress } = getCourseStatusAndProgress(item, day.date);
                         return <CourseBadge key={item.id} item={item} onClick={handleCourseClick} status={status} progress={progress} index={i+2} />;
                       }) : <span className="text-xs text-slate-400 italic pl-1">Boş</span>}
                     </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
    </div>
  );

  const renderDetail = () => {
    if (!selectedCourseType) return null;
    const theme = getThemeColors(selectedCourseType);
    const courseLogs = logs.filter(l => l.courseName.includes(selectedCourseType) || l.courseName === selectedCourseType);
    const totalTime = courseLogs.reduce((acc, curr) => acc + curr.durationMinutes, 0);
    const courseTasks = tasks.filter(t => t.courseType === selectedCourseType).sort((a,b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));
    const isCourseCurrentlyActive = activeCourse?.type === selectedCourseType;

    return (
      <div className="animate-in slide-in-from-bottom-8 duration-500 ease-out">
        {/* Navigation */}
        <button 
          onClick={() => setView('HOME')}
          className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium px-2 py-1 -ml-2 rounded-lg hover:bg-slate-100 w-fit"
        >
          <ChevronLeft size={20} /> Geri Dön
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Header, Notes & Tasks */}
          <div className="lg:col-span-2 space-y-8">
             
             {/* Header Card */}
             <div className={`${theme.bg} rounded-3xl p-8 text-white shadow-xl shadow-slate-200 relative overflow-hidden group`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
                <div className="relative z-10">
                  <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-bold tracking-wider mb-4 backdrop-blur-sm">DERS DETAYI</span>
                  <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">{selectedCourseType}</h1>
                  <p className="text-white/80 font-medium text-lg">Toplam Çalışma: {totalTime} dakika</p>
                  
                  <div className="mt-8 flex gap-3">
                    <button 
                      onClick={isCourseCurrentlyActive ? startActiveCourseTimer : undefined}
                      disabled={!isCourseCurrentlyActive}
                      className={`
                        px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg
                        ${isCourseCurrentlyActive 
                          ? 'bg-white text-slate-900 hover:bg-slate-100 active:scale-95 cursor-pointer hover:shadow-xl' 
                          : 'bg-black/20 text-white/40 cursor-not-allowed shadow-none'
                        }
                      `}
                    >
                      {isCourseCurrentlyActive ? <Play size={20} fill="currentColor" /> : <Lock size={20} />}
                      {isCourseCurrentlyActive ? 'Dersi Başlat' : 'Ders Saati Değil'}
                    </button>
                  </div>
                </div>
             </div>

             {/* Tabbed Content (Notes vs Tasks) */}
             <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="flex border-b border-slate-100">
                   <button 
                     onClick={() => setDetailTab('NOTES')}
                     className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${detailTab === 'NOTES' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
                   >
                     <Edit3 size={16} /> Notlar
                   </button>
                   <button 
                     onClick={() => setDetailTab('TASKS')}
                     className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${detailTab === 'TASKS' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
                   >
                     <ListTodo size={16} /> Görevler
                   </button>
                </div>
                
                <div className="p-1">
                   {detailTab === 'NOTES' ? (
                     <textarea
                       value={notes[selectedCourseType] || ''}
                       onChange={(e) => handleNoteChange(e.target.value)}
                       placeholder={`${selectedCourseType} için notlarını buraya alabilirsin...`}
                       className="w-full h-80 p-6 resize-none focus:outline-none text-slate-600 leading-relaxed"
                     />
                   ) : (
                     <div className="p-4 min-h-[320px]">
                        <div className="flex gap-2 mb-4">
                           <input 
                              type="text" 
                              value={newTaskText}
                              onChange={(e) => setNewTaskText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleAddTask(newTaskText);
                                  setNewTaskText('');
                                }
                              }}
                              placeholder="Yeni görev ekle..."
                              className="flex-1 border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                           />
                           <button 
                             onClick={() => { handleAddTask(newTaskText); setNewTaskText(''); }}
                             className="bg-indigo-600 text-white rounded-lg px-4 py-2 hover:bg-indigo-700 transition-colors"
                           >
                              <Plus size={20} />
                           </button>
                        </div>
                        <div className="space-y-2 max-h-[250px] overflow-y-auto">
                           {courseTasks.length > 0 ? courseTasks.map(task => (
                             <div key={task.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg group">
                                <button onClick={() => toggleTask(task.id)} className="text-slate-400 hover:text-indigo-600 transition-colors">
                                   {task.completed ? <CheckSquare size={20} className="text-emerald-500" /> : <Square size={20} />}
                                </button>
                                <span className={`flex-1 text-sm ${task.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{task.text}</span>
                                <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity">
                                   <Trash2 size={16} />
                                </button>
                             </div>
                           )) : (
                             <div className="text-center py-10 text-slate-400">
                                <ListTodo size={32} className="mx-auto mb-2 opacity-50" />
                                <p>Henüz görev eklenmedi.</p>
                             </div>
                           )}
                        </div>
                     </div>
                   )}
                </div>
             </div>
          </div>

          {/* Right Column: Stats & History */}
          <div className="space-y-6">
             {/* Mini Stat */}
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                <div className={`${theme.light} p-3 rounded-xl ${theme.text}`}>
                   <Award size={24} />
                </div>
                <div>
                   <p className="text-slate-400 text-xs font-bold uppercase">Tamamlanan Oturum</p>
                   <p className="text-2xl font-black text-slate-800">{courseLogs.length}</p>
                </div>
             </div>

             {/* History List */}
             <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                  <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <History size={18} /> Geçmiş Çalışmalar
                  </h3>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                   {courseLogs.length > 0 ? (
                     <div className="divide-y divide-slate-50">
                       {courseLogs.map((log) => (
                         <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div>
                               <p className="text-xs text-slate-400 font-medium mb-0.5">
                                 {new Date(log.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                               </p>
                               <p className="text-xs text-slate-300">
                                 {new Date(log.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                               </p>
                            </div>
                            <span className={`font-mono font-bold ${theme.text} ${theme.light} px-2 py-1 rounded text-sm`}>
                              {log.durationMinutes} dk
                            </span>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <div className="p-8 text-center">
                        <History className="mx-auto text-slate-200 mb-2" size={32} />
                        <p className="text-slate-400 text-sm">Henüz bu ders için kayıt yok.</p>
                     </div>
                   )}
                </div>
             </div>
          </div>

        </div>

        {/* Mobile Action Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[70] bg-white border-t border-slate-200 shadow-lg" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
            <button
              onClick={toggleTimer}
              aria-label={isTimerRunning ? 'Duraklat' : 'Başlat'}
              className={`flex-1 h-14 rounded-2xl font-extrabold text-base tracking-tight flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition ${isTimerRunning ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
            >
              {isTimerRunning ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
              {isTimerRunning ? 'Duraklat' : 'Başlat'}
            </button>
            {isTimerRunning && (
              <button
                onClick={finishSessionEarly}
                aria-label="Bitir"
                className="h-14 px-4 rounded-2xl font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <CheckCircle size={20} /> Bitir
              </button>
            )}
            <button
              onClick={resetTimer}
              aria-label="Sıfırla"
              className="h-14 px-4 rounded-2xl font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <RotateCcw size={20} />
              <span className="hidden sm:inline">Sıfırla</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSession = () => {
    const theme = selectedCourseType ? getThemeColors(selectedCourseType) : { bg: 'bg-indigo-600', light: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' };
    const title = activeCourse?.text || (selectedCourseType ? String(selectedCourseType) : 'Odak Oturumu');
    const label = getTimerLabel();
    const percent = initialDuration > 0 ? Math.max(0, Math.min(100, (timerSeconds / initialDuration) * 100)) : 0;
    return (
      <div className="space-y-6 pb-32 md:pb-0">
        <div className={`${theme.bg} rounded-3xl p-6 text-white shadow-xl relative overflow-hidden`}>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-bold tracking-wider mb-2">{label}</span>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight">{title}</h2>
              {activeCourseDateStr && (
                <p className="text-white/80 text-sm font-medium mt-1">{activeCourseDateStr}</p>
              )}
              {currentSessionKey && (
                <p className="text-white/60 text-[10px] font-mono mt-1">#{currentSessionKey}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => (isFullscreen ? exitFullscreen() : enterFullscreen())} className="px-3 py-2 bg-white/20 rounded-lg text-white hover:bg-white/30 font-bold flex items-center gap-2">
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button onClick={() => setView(selectedCourseType ? 'DETAIL' : 'HOME')} className="px-3 py-2 bg-white/20 rounded-lg text-white hover:bg-white/30 font-bold flex items-center gap-2">
                <ChevronLeft size={16} /> Geri
              </button>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="md:col-span-2 flex flex-col items-center">
              <div className="text-6xl md:text-7xl font-black tracking-tighter tabular-nums font-mono drop-shadow-sm">{formatTime(timerSeconds)}</div>
              <div className="mt-4 hidden md:flex items-center gap-3">
                <button 
                  onClick={toggleTimer}
                  className={`px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${isTimerRunning ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-white text-slate-900 hover:bg-slate-100'}`}
                >
                  {isTimerRunning ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                  {isTimerRunning ? 'Duraklat' : 'Başlat'}
                </button>
                {isTimerRunning && (
                  <button onClick={finishSessionEarly} className="px-4 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 font-bold flex items-center gap-2"><CheckCircle size={18} /> Bitir</button>
                )}
                <button onClick={resetTimer} className="px-4 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 font-bold flex items-center gap-2"><RotateCcw size={18} /> Sıfırla</button>
              </div>

              {/* Mobile inline controls fallback (visible on small screens) */}
              <div className="mt-4 flex md:hidden items-center gap-2 w-full">
                <button
                  onClick={toggleTimer}
                  className={`flex-1 h-12 rounded-xl font-extrabold text-sm tracking-tight flex items-center justify-center gap-2 active:scale-[0.98] transition ${isTimerRunning ? 'bg-amber-500 text-white' : 'bg-indigo-600 text-white'}`}
                >
                  {isTimerRunning ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                  {isTimerRunning ? 'Duraklat' : 'Başlat'}
                </button>
                {isTimerRunning && (
                  <button onClick={finishSessionEarly} className="h-12 px-3 rounded-xl font-bold bg-emerald-50 text-emerald-700 active:scale-[0.98] flex items-center justify-center gap-2">
                    <CheckCircle size={18} />
                    <span className="hidden xs:inline">Bitir</span>
                  </button>
                )}
                <button onClick={resetTimer} className="h-12 px-3 rounded-xl font-bold bg-slate-100 text-slate-700 active:scale-[0.98] flex items-center justify-center gap-2">
                  <RotateCcw size={18} />
                  <span className="hidden xs:inline">Sıfırla</span>
                </button>
              </div>
            </div>
            <div className="space-y-3 bg-white/10 rounded-2xl p-4">
              {!isTimerRunning && timerMode !== 'COURSE' && (
                <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-2">
                  <Settings size={14} />
                  <span className="text-xs font-semibold">Süre (dk):</span>
                  <input 
                    type="number" min="1" max="180" value={customWorkMinutes}
                    onChange={(e) => { const val = parseInt(e.target.value); if (!isNaN(val)) setCustomWorkMinutes(Math.max(1, val)); }}
                    className="w-14 bg-white/90 text-slate-800 border-0 rounded px-2 py-1 text-center text-sm font-bold focus:outline-none"
                  />
                </div>
              )}
              <div className="text-xs opacity-90 font-semibold">Sesler</div>
              <div className="grid grid-cols-3 gap-2">
                {AMBIENT_SOUNDS.map(sound => (
                  <button key={sound.id} onClick={() => setActiveSoundId(activeSoundId === sound.id ? null : sound.id)} className={`p-3 rounded-xl border ${activeSoundId === sound.id ? 'bg-white text-slate-900' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}>
                    <div className="flex flex-col items-center">
                      <Volume2 size={18} className="mb-1" />
                      <span className="text-[10px] font-bold">{sound.name}</span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-[10px] font-bold opacity-90">
                  <span>Ses Seviyesi</span>
                  <span>{Math.round(soundVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={soundVolume}
                  onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                  className="w-full accent-yellow-300"
                />
              </div>
            </div>
          </div>
          <div className="mt-6 h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-300" style={{ width: `${percent}%` }}></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-slate-500 font-bold text-sm"><Timer size={16} /> Oturum</div>
                <div className="text-xs text-slate-400 font-mono">Mod: {timerMode}</div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 rounded-xl bg-slate-50">
                  <div className="text-xs text-slate-400 font-semibold">Başlangıç</div>
                  <div className="text-lg font-black text-slate-800">{new Date(Date.now() - (initialDuration - timerSeconds) * 1000).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50">
                  <div className="text-xs text-slate-400 font-semibold">Hedef</div>
                  <div className="text-lg font-black text-slate-800">{Math.ceil(initialDuration/60)} dk</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50">
                  <div className="text-xs text-slate-400 font-semibold">Geçen</div>
                  <div className="text-lg font-black text-slate-800">{Math.ceil((initialDuration - timerSeconds)/60)} dk</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50">
                  <div className="text-xs text-slate-400 font-semibold">Kalan</div>
                  <div className="text-lg font-black text-slate-800">{Math.ceil(timerSeconds/60)} dk</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-slate-500 font-bold text-sm"><Edit3 size={16} /> Notlar</div>
              </div>
              <textarea
                value={selectedCourseType ? (notes[selectedCourseType] || '') : ''}
                onChange={(e) => selectedCourseType && handleNoteChange(e.target.value)}
                placeholder={selectedCourseType ? `${selectedCourseType} için notlarını buraya alabilirsin...` : 'Notlarını buraya alabilirsin...'}
                className="w-full h-48 p-4 resize-none focus:outline-none text-slate-600 leading-relaxed border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
              <div className={`${theme.light} p-3 rounded-xl ${theme.text}`}>
                <Award size={24} />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase">Seviye</p>
                <p className="text-slate-800 font-black">{currentLevel.name}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><ListTodo size={16} /> Görevler</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {['Özet çıkar', 'Soru çöz', 'Konuyu tekrar et', 'Zor sorular'].map(preset => (
                  <button key={preset} onClick={() => handleAddTask(preset)} className="px-3 py-1.5 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold">
                    + {preset}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { handleAddTask(newTaskText); setNewTaskText(''); }}}
                  placeholder="Yeni görev ekle..."
                  className="flex-1 border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button onClick={() => { handleAddTask(newTaskText); setNewTaskText(''); }} className="bg-indigo-600 text-white rounded-lg px-4 py-2 hover:bg-indigo-700 transition-colors">
                  <Plus size={20} />
                </button>
              </div>
              <div className="space-y-2 max-h-[250px] overflow-y-auto">
                {(selectedCourseType ? tasks.filter(t => t.courseType === selectedCourseType) : tasks).map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg group">
                    <button onClick={() => toggleTask(task.id)} className="text-slate-400 hover:text-indigo-600 transition-colors">
                      {task.completed ? <CheckSquare size={20} className="text-emerald-500" /> : <Square size={20} />}
                    </button>
                    <span className={`flex-1 text-sm ${task.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{task.text}</span>
                    <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans relative">
      
      {/* --- SAVE/DISCARD MODAL --- */}
      {pendingSession && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center transform scale-100 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                 <CheckCircle size={32} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">Oturum Bitti!</h2>
              <p className="text-slate-500 mb-8">
                <span className="font-bold text-slate-800">{pendingSession.duration} dakika</span> boyunca odaklandın. Bu süreyi kaydetmek ister misin?
              </p>
              <div className="flex gap-3">
                 <button 
                   onClick={discardSession}
                   className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 hover:text-red-500 transition-colors flex items-center justify-center gap-2"
                 >
                   <Trash2 size={18} /> Sil
                 </button>
                 <button 
                   onClick={saveSession}
                   className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
                 >
                   <Save size={18} /> Kaydet
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* --- SIDE MENU (DRAWER) --- */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/20 z-40 transition-opacity" onClick={() => setIsMenuOpen(false)} />
      )}

      <div className={`fixed top-0 right-0 h-full w-[85%] max-w-md bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
            <h2 className="font-bold text-lg flex items-center gap-2"><Timer size={20} /> Kontrol Paneli</h2>
            <button onClick={() => setIsMenuOpen(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X size={24} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-8">
            
            {/* FEATURE: Gamification Level */}
            <div className="bg-gradient-to-r from-violet-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg">
               <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                     <Trophy size={20} className="text-yellow-300" />
                     <span className="font-bold text-sm opacity-90">Seviye</span>
                  </div>
                  <span className="text-xs font-mono opacity-70">{totalMinutesStudied} XP</span>
               </div>
               <h3 className="text-2xl font-black mb-4">{currentLevel.name}</h3>
               <div className="relative h-2 bg-black/20 rounded-full overflow-hidden">
                  <div className="absolute left-0 top-0 h-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)] transition-all duration-1000" style={{ width: `${progressToNextLevel}%` }}></div>
               </div>
               {nextLevel && (
                 <p className="text-[10px] mt-2 text-right opacity-80">Sonraki: {nextLevel.name} ({nextLevel.minMinutes - totalMinutesStudied} dk kaldı)</p>
               )}
            </div>

            {/* Active Course Status */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Şu Anki Durum</h3>
              {activeCourse ? (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                  <div className="flex items-start gap-3 mb-3">
                    <CheckCircle className="text-emerald-600 shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="text-xs text-emerald-600 font-bold uppercase mb-1">Ders Aktif</p>
                      <p className="text-sm font-bold text-slate-800">{activeCourse.text}</p>
                    </div>
                  </div>
                  {!isTimerRunning && (
                    <button onClick={startActiveCourseTimer} className="w-full py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm flex items-center justify-center gap-2">
                      <Play size={16} fill="currentColor" /> Dersi Başlat (Süre İşlesin)
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-slate-100 border border-slate-200 p-4 rounded-xl flex items-center gap-3 opacity-70">
                  <Lock className="text-slate-400 shrink-0" size={18} />
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase">Ders Yok</p>
                    <p className="text-xs text-slate-400">Başlat butonu ders saatinde aktif olur.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Timer */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center relative overflow-hidden">
              <div className="mb-4 flex items-center gap-2 relative z-10">
                 <span className={`w-2.5 h-2.5 rounded-full ${isTimerRunning ? 'bg-green-500 animate-pulse ring-2 ring-green-200' : 'bg-slate-300'}`}></span>
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{getTimerLabel()}</span>
              </div>
              
              <div className="text-6xl font-black text-slate-800 tracking-tighter tabular-nums mb-4 relative z-10 font-mono">
                {formatTime(timerSeconds)}
              </div>
              
              {!isTimerRunning && timerMode !== 'COURSE' && (
                <div className="relative z-10 mb-6 flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                   <Settings size={14} className="text-slate-400" />
                   <span className="text-xs font-semibold text-slate-500">Süre (dk):</span>
                   <input 
                      type="number" 
                      min="1" 
                      max="180" 
                      value={customWorkMinutes} 
                      onChange={(e) => {
                         const val = parseInt(e.target.value);
                         if (!isNaN(val)) setCustomWorkMinutes(Math.max(1, val));
                      }}
                      className="w-12 bg-white border border-slate-300 rounded px-1 py-0.5 text-center text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                   />
                </div>
              )}

              <div className="absolute bottom-0 left-0 h-1.5 bg-slate-100 w-full">
                 <div 
                   className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-width duration-1000 ease-linear shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
                   style={{ width: `${(timerSeconds / initialDuration) * 100}%` }}
                 />
              </div>

              <div className="flex gap-4 w-full relative z-10 mt-2">
                <button 
                  onClick={toggleTimer}
                  className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all transform active:scale-95 ${
                    isTimerRunning ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
                  }`}
                >
                  {isTimerRunning ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                  {isTimerRunning ? 'Duraklat' : 'Başlat'}
                </button>
                {isTimerRunning && (
                   <button onClick={finishSessionEarly} className="p-3 rounded-xl bg-slate-100 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors transform active:scale-95" title="Bitir"><CheckCircle size={20} /></button>
                )}
                <button onClick={resetTimer} className="p-3 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors transform active:scale-95" title="Sıfırla"><RotateCcw size={20} /></button>
              </div>
            </div>

            {/* FEATURE: Ambient Sounds */}
            <div className="space-y-3">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Headphones size={14} /> Odak Sesleri</h3>
               <div className="grid grid-cols-3 gap-2">
                  {AMBIENT_SOUNDS.map(sound => (
                    <button
                      key={sound.id}
                      onClick={() => setActiveSoundId(activeSoundId === sound.id ? null : sound.id)}
                      className={`
                        flex flex-col items-center justify-center p-3 rounded-xl border transition-all
                        ${activeSoundId === sound.id 
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-inner scale-[0.98]' 
                          : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50 hover:-translate-y-0.5'
                        }
                      `}
                    >
                       <Volume2 size={18} className="mb-1" />
                       <span className="text-[10px] font-bold">{sound.name}</span>
                    </button>
                  ))}
               </div>
            </div>

            {/* FEATURE: Stats Visualization */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><TrendingUp size={14} /> Dağılım</h3>
              <div className="bg-white border border-slate-100 rounded-xl p-4 space-y-4">
                 {[CourseType.COMP100, CourseType.PHYS101, CourseType.MATH106].map(type => {
                    const typeLogs = logs.filter(l => l.courseName.includes(type));
                    const mins = typeLogs.reduce((a,b) => a + b.durationMinutes, 0);
                    const percent = totalMinutesStudied > 0 ? (mins / totalMinutesStudied) * 100 : 0;
                    const color = getThemeColors(type).bg;
                    
                    if (mins === 0) return null;

                    return (
                       <div key={type}>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                             <span className="text-slate-600">{type}</span>
                             <span className="text-slate-400">{mins} dk</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                             <div className={`h-full ${color}`} style={{ width: `${percent}%` }}></div>
                          </div>
                       </div>
                    )
                 })}
                 {totalMinutesStudied === 0 && <p className="text-xs text-slate-400 italic text-center">Henüz veri yok.</p>}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Mini Player Widget (HOME/DETAIL) */}
      {view !== 'SESSION' && (isTimerRunning || timerSeconds !== initialDuration) && (
        <div className="fixed bottom-4 right-4 left-4 md:left-auto z-[65]">
          <div className="md:min-w-[340px] bg-white/95 backdrop-blur rounded-2xl shadow-xl border border-slate-200 p-3 flex items-center gap-3">
            <div className="flex-1">
              <div className="text-[10px] font-bold uppercase text-slate-400">{getTimerLabel()}</div>
              <div className="text-xl font-black tracking-tight font-mono">{formatTime(timerSeconds)}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTimer}
                className={`px-3 py-2 rounded-xl font-bold text-sm flex items-center gap-2 ${isTimerRunning ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                aria-label={isTimerRunning ? 'Duraklat' : 'Başlat'}
              >
                {isTimerRunning ? <Pause size={16} /> : <Play size={16} />}
                <span className="hidden sm:inline">{isTimerRunning ? 'Duraklat' : 'Başlat'}</span>
              </button>
              {isTimerRunning && (
                <button onClick={finishSessionEarly} className="px-3 py-2 rounded-xl font-bold text-sm bg-emerald-50 text-emerald-700 hover:bg-emerald-100" aria-label="Bitir">
                  <CheckCircle size={16} />
                  <span className="hidden sm:inline ml-1">Bitir</span>
                </button>
              )}
              <button onClick={resetTimer} className="px-3 py-2 rounded-xl font-bold text-sm bg-slate-100 text-slate-700 hover:bg-slate-200" aria-label="Sıfırla">
                <RotateCcw size={16} />
              </button>
              <button onClick={() => setView('SESSION')} className="px-3 py-2 rounded-xl font-bold text-sm bg-slate-900 text-white hover:bg-black/80" aria-label="Aç">
                <Timer size={16} />
                <span className="hidden sm:inline ml-1">Aç</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- HEADER --- */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm/50 backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('HOME')}>
            <div className="flex flex-col">
              <h1 className="text-lg md:text-xl font-bold text-slate-900 leading-none tracking-tight">Ders Programı</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] md:text-xs text-slate-500 font-medium">03 Aralık - 16 Aralık</span>
                <span className="text-[10px] md:text-xs font-mono font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded ml-1 hidden md:inline-block">
                  {currentTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
             <div className="md:hidden text-xs font-mono font-bold text-slate-400 mr-2">
                {currentTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
             </div>

             <button onClick={requestNotificationPermission} className={`p-2 rounded-full transition-all ${notificationsEnabled ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-50'}`} title="Bildirimler">
               {notificationsEnabled ? <CheckCircle size={20} /> : <Bell size={20} />}
             </button>

             <button onClick={() => setIsMenuOpen(true)} className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg relative">
                <Menu size={24} />
                {isTimerRunning && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full animate-pulse"></span>}
             </button>
          </div>
        </div>
      </header>

      {/* --- CONTENT --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 min-h-[calc(100vh-4rem)]">
         {view === 'HOME' ? renderHome() : view === 'DETAIL' ? renderDetail() : renderSession()}
      </main>
    </div>
  );
}

export default App;