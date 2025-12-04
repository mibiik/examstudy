import React from 'react';
import { CourseType, ScheduleItem } from '../types';
import { AlertTriangle, ChevronRight, Clock, Radio } from 'lucide-react';

interface CourseBadgeProps {
  item: ScheduleItem;
  onClick?: (item: ScheduleItem) => void;
  status?: 'PAST' | 'PRESENT' | 'FUTURE';
  progress?: number; // 0 to 100
  index?: number; // For staggered animation
}

export const CourseBadge: React.FC<CourseBadgeProps> = ({ item, onClick, status = 'FUTURE', progress = 0, index = 0 }) => {
  const getStyles = (type: CourseType, isExam?: boolean, status?: string) => {
    // Past items are greyed out regardless of type
    if (status === 'PAST') {
      return 'bg-slate-50 text-slate-400 border-slate-100 grayscale opacity-60 line-through decoration-slate-300 decoration-1';
    }

    if (isExam) {
      return 'bg-gradient-to-br from-red-50 to-red-100 text-red-900 border-red-200 shadow-sm hover:shadow-red-100 hover:border-red-300';
    }

    switch (type) {
      case CourseType.COMP100:
        return 'bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-800 border-emerald-200 hover:border-emerald-300';
      case CourseType.COMP106:
        return 'bg-gradient-to-br from-teal-50 to-teal-100 text-teal-800 border-teal-200 hover:border-teal-300';
      case CourseType.PHYS101:
        return 'bg-gradient-to-br from-violet-50 to-violet-100 text-violet-800 border-violet-200 hover:border-violet-300';
      case CourseType.MATH106:
        return 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-800 border-blue-200 hover:border-blue-300';
      case CourseType.BUSY:
        return 'bg-slate-100 text-slate-500 border-slate-200 italic shadow-inner';
      case CourseType.FREE:
        return 'bg-white text-green-600 border-dashed border-green-200 hover:bg-green-50';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const isInteractive = item.type !== CourseType.FREE && item.type !== CourseType.BUSY && item.type !== CourseType.OTHER;
  
  // Calculate delay based on index (cap at some point)
  const delayClass = `delay-${Math.min((index % 5) * 75, 300)}`;

  return (
    <div 
      onClick={() => isInteractive && onClick && onClick(item)}
      className={`
        relative flex flex-col gap-1 p-3.5 rounded-xl border text-sm font-medium overflow-hidden
        animate-card-entry ${delayClass}
        transition-all duration-300 ease-out
        ${getStyles(item.type, item.isExam, status)}
        ${status === 'PRESENT' ? 'animate-breathe ring-4 ring-indigo-500/10 z-10 bg-white border-indigo-400 transform scale-[1.02] shadow-lg shadow-indigo-200/50' : ''}
        ${isInteractive && status !== 'PAST' ? 'cursor-pointer hover:-translate-y-1 hover:shadow-md active:scale-[0.98] group' : ''}
      `}
    >
      {/* Shimmer Effect for Present Item */}
      {status === 'PRESENT' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 animate-shimmer-slide w-full h-full" style={{ width: '200%', left: '-50%' }}></div>
        </div>
      )}

      {/* Progress Bar for Current Item */}
      {status === 'PRESENT' && progress > 0 && (
        <div className="absolute bottom-0 left-0 w-full h-1.5 bg-slate-100/50 backdrop-blur-sm z-20">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-width duration-1000 ease-linear shadow-[0_0_10px_rgba(99,102,241,0.6)]" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      )}

      {/* Improved "Live" Indicator */}
      {status === 'PRESENT' && (
        <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-indigo-600 text-white text-[10px] px-2.5 py-1 rounded-full shadow-md z-30 font-bold tracking-wide">
          <Radio size={12} className="animate-pulse" />
          CANLI
        </div>
      )}

      {item.isExam && status !== 'PAST' && (
         <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-bl-lg rounded-tr-lg flex items-center shadow-sm z-10 font-bold tracking-wide">
           <AlertTriangle size={10} className="mr-1" />
           SINAV
         </div>
      )}
      
      <div className="flex items-start gap-2 justify-between mt-1 relative z-10">
        <span className={`leading-tight break-words w-[90%] font-semibold ${status === 'PRESENT' ? 'text-indigo-900' : ''}`}>
          {item.text}
        </span>
        {isInteractive && status !== 'PAST' && (
          <ChevronRight size={16} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 self-center shrink-0 text-current/50" />
        )}
      </div>
      
      {/* Time Badge if parsed from text (optional enhancement) */}
      {item.time && status !== 'PAST' && (
         <div className="mt-1 flex items-center text-[10px] opacity-70 font-mono gap-1 relative z-10">
           <Clock size={10} /> {item.time}
         </div>
      )}
    </div>
  );
};