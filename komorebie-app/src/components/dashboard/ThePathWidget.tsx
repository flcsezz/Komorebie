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
import { Plus, BookOpen, ChevronDown, Loader2 } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import TaskItem, { type Task, type TaskStatus } from './TaskItem';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

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
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overContainerId, setOverContainerId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Fetch tasks from Supabase
  const fetchTasks = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
    } else if (data) {
      // Map Supabase fields to our local Task type
      const mappedTasks: Task[] = data.map(t => ({
        id: t.id,
        title: t.title,
        category: t.category || 'General',
        status: t.status as TaskStatus,
        isCompleted: t.is_completed
      }));
      setTasks(mappedTasks);
    }
    setLoading(false);
  }, [user]);

  React.useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

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

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !user) {
      setIsAdding(false);
      return;
    }

    const title = newTaskTitle.trim();
    setNewTaskTitle('');
    setIsAdding(false);

    const { data, error } = await supabase
      .from('tasks')
      .insert([
        { 
          user_id: user.id,
          title, 
          status: 'todo',
          category: 'General',
          sort_order: 0 // New tasks go to top
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error adding task:', error);
    } else if (data) {
      const newTask: Task = {
        id: data.id,
        title: data.title,
        category: data.category || 'General',
        status: data.status as TaskStatus,
        isCompleted: data.is_completed
      };
      setTasks([newTask, ...tasks]);
    }
  };

  const handleToggle = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const nextState = !task.isCompleted;
    
    // Optimistic update
    setTasks(tasks.map(t => t.id === id ? { ...t, isCompleted: nextState } : t));

    const { error } = await supabase
      .from('tasks')
      .update({ is_completed: nextState })
      .eq('id', id);

    if (error) {
      console.error('Error toggling task:', error);
      // Rollback on error
      setTasks(tasks.map(t => t.id === id ? { ...t, isCompleted: !nextState } : t));
    }
  };

  const handleEdit = async (id: string, newTitle: string) => {
    // Optimistic update
    setTasks(tasks.map(t => t.id === id ? { ...t, title: newTitle } : t));

    const { error } = await supabase
      .from('tasks')
      .update({ title: newTitle })
      .eq('id', id);

    if (error) {
      console.error('Error updating task:', error);
      fetchTasks(); // Refresh on error
    }
  };

  const handleDelete = async (id: string) => {
    // Optimistic update
    setTasks(tasks.filter(t => t.id !== id));

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting task:', error);
      fetchTasks();
    }
  };

  const handleMove = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const nextStatus: TaskStatus = task.status === 'todo' ? 'in-progress' : 'todo';
    
    // Optimistic update
    setTasks(tasks.map(t => t.id === id ? { ...t, status: nextStatus } : t));

    const { error } = await supabase
      .from('tasks')
      .update({ status: nextStatus })
      .eq('id', id);

    if (error) {
      console.error('Error moving task:', error);
      fetchTasks();
    }
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverContainerId(null);

    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);

    if (!activeContainer || !overContainer) return;

    let newTasks = [...tasks];

    // Same container reorder
    if (activeContainer === overContainer) {
      const containerItems = tasks.filter(t => t.status === activeContainer);
      const oldIndex = containerItems.findIndex(t => t.id === active.id);
      const newIndex = containerItems.findIndex(t => t.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reordered = arrayMove(containerItems, oldIndex, newIndex);
        const inProgressItems = activeContainer === 'in-progress' ? reordered : tasks.filter(t => t.status === 'in-progress');
        const todoItems = activeContainer === 'todo' ? reordered : tasks.filter(t => t.status === 'todo');
        const rest = tasks.filter(t => t.status !== 'in-progress' && t.status !== 'todo');
        newTasks = [...inProgressItems, ...todoItems, ...rest];
        setTasks(newTasks);
      }
    } else {
      // Cross-container move is already visually handled in DragOver state
      // but let's ensure the final state is captured
      const movedTask = tasks.find(t => t.id === active.id);
      if (movedTask) {
        newTasks = tasks.map(t => t.id === active.id ? { ...t, status: overContainer } : t);
        setTasks(newTasks);
      }
    }

    // Sync all affected tasks with their new sort order/status
    // In a production app, we'd use a single 'upsert' or a stored procedure for efficiency
    const updates = newTasks.map((t, index) => ({
      id: t.id,
      user_id: user?.id,
      title: t.title,
      status: t.status,
      sort_order: index,
      is_completed: t.isCompleted
    }));

    const { error } = await supabase
      .from('tasks')
      .upsert(updates);

    if (error) {
      console.error('Error syncing task order:', error);
    }
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
          {loading && <Loader2 className="w-3.5 h-3.5 text-sage-200 animate-spin" />}
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
