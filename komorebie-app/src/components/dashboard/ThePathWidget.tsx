import React, { useState, useCallback } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  pointerWithin,
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  type DragStartEvent, 
  type DragOverEvent, 
  type DragEndEvent,
  useDroppable,
  type CollisionDetection,
  rectIntersection,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { 
  SortableContext, 
  arrayMove, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { Plus, BookOpen, ChevronDown } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import TaskItem, { type Task, type TaskStatus } from './TaskItem';

const DroppableArea: React.FC<{ id: string; children: React.ReactNode; className?: string; isOver?: boolean }> = ({ id, children, className, isOver }) => {
  const { setNodeRef, isOver: droppableIsOver } = useDroppable({ id });
  const active = isOver || droppableIsOver;
  return (
    <div 
      ref={setNodeRef} 
      className={`${className} ${active ? 'bg-sage-200/5 border border-dashed border-sage-200/20' : 'border border-transparent'}`}
      style={{ transition: 'background-color 200ms, border-color 200ms' }}
    >
      {children}
    </div>
  );
};

const ThePathWidget: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('zen-tasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overContainerId, setOverContainerId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Persistence
  React.useEffect(() => {
    localStorage.setItem('zen-tasks', JSON.stringify(tasks));
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
  const todoTasks = tasks.filter(t => t.status === 'todo');

  // Helper: find which container a given id belongs to
  const findContainer = useCallback((id: UniqueIdentifier): TaskStatus | null => {
    // Check if the id IS a container
    if (id === 'in-progress') return 'in-progress';
    if (id === 'todo') return 'todo';
    // Otherwise find the task
    const task = tasks.find(t => t.id === id);
    return task?.status ?? null;
  }, [tasks]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      setIsAdding(false);
      return;
    }
    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      category: 'General',
      status: 'todo',
      isCompleted: false
    };
    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');
    setIsAdding(false);
  };

  const handleToggle = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t));
  };

  const handleEdit = (id: string, newTitle: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, title: newTitle } : t));
  };

  const handleDelete = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleMove = (id: string) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        return { ...t, status: t.status === 'todo' ? 'in-progress' : 'todo' };
      }
      return t;
    }));
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) {
      setOverContainerId(null);
      return;
    }

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);

    if (!activeContainer || !overContainer) {
      setOverContainerId(null);
      return;
    }

    setOverContainerId(overContainer);

    // Only process cross-container moves
    if (activeContainer === overContainer) return;

    setTasks((prev) => {
      const activeItems = prev.filter(t => t.status === activeContainer);
      const overItems = prev.filter(t => t.status === overContainer);
      const otherItems = prev.filter(t => t.status !== activeContainer && t.status !== overContainer);

      const activeIndex = activeItems.findIndex(t => t.id === active.id);
      if (activeIndex === -1) return prev;

      const movedTask = { ...activeItems[activeIndex], status: overContainer };
      
      // Remove from source
      const newActiveItems = activeItems.filter(t => t.id !== active.id);

      // Determine insertion index in target
      let overIndex = overItems.findIndex(t => t.id === over.id);
      
      if (overIndex === -1) {
        // Dropping on the container itself, add to end
        overIndex = overItems.length;
      } else {
        // Check if we should insert after the over item
        const isBelowOverItem = 
          active.rect.current.translated &&
          over.rect &&
          active.rect.current.translated.top > over.rect.top + over.rect.height / 2;
        
        if (isBelowOverItem) {
          overIndex += 1;
        }
      }

      const newOverItems = [...overItems];
      newOverItems.splice(overIndex, 0, movedTask);

      // Rebuild tasks array preserving container order
      const result: Task[] = [];
      const inProgressItems = activeContainer === 'in-progress' ? newActiveItems : 
                             overContainer === 'in-progress' ? newOverItems : 
                             prev.filter(t => t.status === 'in-progress');
      const todoItems = activeContainer === 'todo' ? newActiveItems : 
                       overContainer === 'todo' ? newOverItems : 
                       prev.filter(t => t.status === 'todo');
      
      result.push(...inProgressItems, ...todoItems, ...otherItems);
      return result;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverContainerId(null);

    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);

    if (!activeContainer || !overContainer) return;

    // Same container reorder
    if (activeContainer === overContainer) {
      setTasks((prev) => {
        const containerItems = prev.filter(t => t.status === activeContainer);

        const oldIndex = containerItems.findIndex(t => t.id === active.id);
        const newIndex = containerItems.findIndex(t => t.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return prev;
        if (oldIndex === newIndex) return prev;

        const reordered = arrayMove(containerItems, oldIndex, newIndex);

        // Rebuild preserving section order
        const inProgressItems = activeContainer === 'in-progress' ? reordered : prev.filter(t => t.status === 'in-progress');
        const todoItems = activeContainer === 'todo' ? reordered : prev.filter(t => t.status === 'todo');
        const rest = prev.filter(t => t.status !== 'in-progress' && t.status !== 'todo');
        
        return [...inProgressItems, ...todoItems, ...rest];
      });
    }
    // Cross-container move is already handled in handleDragOver
  };

  // Custom collision detection: prefer droppable containers when not directly over a task
  const customCollisionDetection: CollisionDetection = useCallback((args) => {
    // First try pointer-within for precise detection
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    // Fallback to rect intersection
    return rectIntersection(args);
  }, []);

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  return (
    <GlassCard variant="icy" className="flex flex-col p-5 w-full overflow-visible relative">
      <div className="flex justify-between items-center mb-6">
        <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-white/40">TASKS</div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsAdding(true)}
            className="w-6 h-6 flex items-center justify-center rounded-full bg-sage-200/10 text-sage-200 hover:bg-sage-200/20 transition-all cursor-pointer"
            title="Add Task"
          >
            <Plus className="w-3 h-3" />
          </button>
          <button className="text-white/20 hover:text-sage-200 transition-colors cursor-pointer">
            <BookOpen className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleAddTask} className="mb-6 px-1">
          <input
            autoFocus
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onBlur={() => { if(!newTaskTitle) setIsAdding(false); }}
            placeholder="Type task and press Enter..."
            className="w-full bg-white/5 border border-sage-200/30 rounded-xl px-4 py-3 text-xs font-light text-white focus:outline-none focus:bg-white/10 transition-all"
          />
        </form>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        autoScroll={false}
      >
        <div className="overflow-y-auto overflow-x-hidden custom-scrollbar pr-1 flex flex-col gap-8 max-h-[600px]">
          
          {/* IN PROGRESS SECTION */}
          <DroppableArea id="in-progress" className="min-h-[80px] transition-all rounded-2xl p-2" isOver={overContainerId === 'in-progress'}>
            <div className="flex items-center gap-2 text-[10px] text-sage-200/80 font-bold uppercase tracking-[0.3em] mb-4">
              <ChevronDown className="w-3.5 h-3.5 text-sage-200" />
              IN PROGRESS
            </div>
            <SortableContext items={inProgressTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {inProgressTasks.map(task => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    onToggle={handleToggle}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onMove={handleMove}
                  />
                ))}
                {inProgressTasks.length === 0 && (
                  <div className="text-xs text-white/20 font-light italic px-4 py-2 border border-dashed border-white/10 rounded-xl flex items-center justify-center h-16">
                    Drop tasks here
                  </div>
                )}
              </div>
            </SortableContext>
          </DroppableArea>
          
          {/* TODO SECTION */}
          <DroppableArea id="todo" className="min-h-[80px] transition-all rounded-2xl p-2" isOver={overContainerId === 'todo'}>
            <div className="flex items-center gap-2 text-[10px] text-white/30 font-bold uppercase tracking-[0.3em] mb-4">
              <ChevronDown className="w-3.5 h-3.5 text-white/30" />
              Task List
            </div>
            <SortableContext items={todoTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {todoTasks.map(task => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    onToggle={handleToggle}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onMove={handleMove}
                  />
                ))}
                {todoTasks.length === 0 && (
                  <div className="text-xs text-white/20 font-light italic px-4 py-2 border border-dashed border-white/10 rounded-xl flex items-center justify-center h-16">
                    Empty
                  </div>
                )}
              </div>
            </SortableContext>
          </DroppableArea>

        </div>

        <DragOverlay 
          dropAnimation={null}
          style={{ zIndex: 9999 }}
        >
          {activeTask ? (
            <TaskItem 
              task={activeTask} 
              onToggle={() => {}} 
              onEdit={() => {}} 
              onDelete={() => {}} 
              onMove={() => {}}
              isOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </GlassCard>
  );
};

export default ThePathWidget;
