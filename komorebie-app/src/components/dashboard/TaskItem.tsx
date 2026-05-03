import React, { useState, useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, Circle, Edit2, Trash2, ArrowRightLeft } from 'lucide-react';

export type TaskStatus = 'todo' | 'in-progress';
export interface Task {
  id: string;
  title: string;
  category: string;
  status: TaskStatus;
  isCompleted: boolean;
}

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string) => void;
  isOverlay?: boolean;
}

const TaskItem: React.FC<TaskItemProps> = ({ 
  task, onToggle, onEdit, onDelete, onMove, isOverlay 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: 'Task', task }, disabled: isOverlay });

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const style: React.CSSProperties = {
    transform: isOverlay ? undefined : CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging || isOverlay ? 999 : 'auto',
    position: 'relative' as const,
    ...(isOverlay ? { 
      cursor: 'grabbing',
      boxShadow: '0 20px 60px -12px rgba(0, 0, 0, 0.6)',
    } : {}),
  };

  const handleEditSubmit = () => {
    if (editTitle.trim() !== '') {
      onEdit(task.id, editTitle.trim());
    } else {
      setEditTitle(task.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleEditSubmit();
    if (e.key === 'Escape') {
      setEditTitle(task.title);
      setIsEditing(false);
    }
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      {...(!isOverlay ? attributes : {})} 
      {...(!isOverlay ? listeners : {})}
      className={`group flex items-center gap-3 p-3 rounded-2xl border transition-colors duration-300 ${
        isOverlay ? 'cursor-grabbing' : 'cursor-grab active:cursor-grabbing'
      } ${
        isOverlay ? 'bg-white/10 border-white/20 shadow-2xl backdrop-blur-xl scale-105' :
        task.isCompleted 
          ? 'bg-white/[0.02] border-transparent opacity-40' 
          : 'bg-white/[0.04] border-white/5 hover:border-white/10 hover:bg-white/[0.06]'
      }`}
    >
      <button 
        onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
        onPointerDown={(e) => e.stopPropagation()}
        className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all duration-500 cursor-pointer flex-shrink-0 ${
          task.isCompleted 
            ? 'bg-sage-200 border-sage-200 text-slate-900' 
            : 'border-white/20 text-transparent group-hover:border-sage-200/50'
        }`}
      >
        {task.isCompleted ? <Check className="w-2.5 h-2.5" strokeWidth={3} /> : <Circle className="w-2.5 h-2.5" />}
      </button>

      <div className="flex-1 flex flex-col gap-0.5 overflow-hidden">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleEditSubmit}
            onKeyDown={handleKeyDown}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-xs font-light text-white focus:outline-none focus:border-sage-200/50"
          />
        ) : (
          <span 
            onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
            className={`text-[13px] font-medium transition-all duration-500 truncate ${task.isCompleted ? 'line-through text-white/30' : 'text-white/95'}`}
          >
            {task.title}
          </span>
        )}
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40">
            {task.category}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="p-1.5 text-white/20 hover:text-sage-200 hover:bg-white/5 rounded-md transition-all cursor-pointer"
          title="Edit Task"
        >
          <Edit2 className="w-3 h-3" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onMove(task.id); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="p-1.5 text-white/20 hover:text-blue-300 hover:bg-white/5 rounded-md transition-all cursor-pointer"
          title={task.status === 'todo' ? 'Move to IN PROGRESS' : 'Move to TASKS'}
        >
          <ArrowRightLeft className="w-3 h-3" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="p-1.5 text-white/20 hover:text-red-400 hover:bg-white/5 rounded-md transition-all cursor-pointer"
          title="Delete Task"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default TaskItem;
