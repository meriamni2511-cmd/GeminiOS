
import React, { useState } from 'react';
import { OSContextType, Task, TaskStatus } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const BoardApp: React.FC<{ os: OSContextType }> = ({ os }) => {
  const [newTaskInput, setNewTaskInput] = useState('');
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [draggingColId, setDraggingColId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);

  const [columns, setColumns] = useState<{ id: TaskStatus; label: string; color: string }[]>(() => {
    const saved = localStorage.getItem('gemini_os_board_columns');
    return saved ? JSON.parse(saved) : [
      { id: 'todo', label: 'To Do', color: 'border-white/20' },
      { id: 'progress', label: 'In Progress', color: 'border-blue-500/50' },
      { id: 'done', label: 'Completed', color: 'border-emerald-500/50' }
    ];
  });

  const updateColumns = (newCols: typeof columns) => {
    setColumns(newCols);
    localStorage.setItem('gemini_os_board_columns', JSON.stringify(newCols));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    os.addTask(newTaskInput, 'todo', 'medium');
    setNewTaskInput('');
  };

  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const handleTaskDragStart = (e: React.DragEvent, taskId: string) => {
    e.stopPropagation();
    e.dataTransfer.setData('type', 'task');
    e.dataTransfer.setData('taskId', taskId);
    setDraggingTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleColumnDragStart = (e: React.DragEvent, colId: string) => {
    e.dataTransfer.setData('type', 'column');
    e.dataTransfer.setData('colId', colId);
    setDraggingColId(colId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColId !== colId) {
        setDragOverColId(colId);
    }
  };

  const handleDrop = (e: React.DragEvent, targetColId: TaskStatus, taskTargetIndex?: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverColId(null);
    setDraggingTaskId(null);
    setDraggingColId(null);
    
    const type = e.dataTransfer.getData('type');

    if (type === 'column') {
        const sourceColId = e.dataTransfer.getData('colId');
        if (sourceColId && sourceColId !== targetColId) {
            const newCols = [...columns];
            const sourceIndex = newCols.findIndex(c => c.id === sourceColId);
            const targetIndex = newCols.findIndex(c => c.id === targetColId);
            
            const [moved] = newCols.splice(sourceIndex, 1);
            newCols.splice(targetIndex, 0, moved);
            updateColumns(newCols);
        }
    } else if (type === 'task') {
        const taskId = e.dataTransfer.getData('taskId');
        if (taskId) {
            let finalIndex = taskTargetIndex;
            if (finalIndex === undefined) {
                const tasksInColumn = os.tasks.filter(t => t.status === targetColId);
                finalIndex = tasksInColumn.length;
            }
            os.moveTask(taskId, targetColId, finalIndex);
        }
    }
  };

  return (
    <div className="h-full bg-[#0a0c10] text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-white/5 border-b border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg">
             <span className="material-symbols-outlined text-white text-[18px]">view_kanban</span>
          </div>
          <h2 className="text-xs font-black uppercase tracking-[0.2em]">Workflow Engine</h2>
        </div>
        <form onSubmit={handleAddTask} className="flex gap-2">
           <input 
             className="bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500 transition-colors w-48"
             placeholder="Add new task..."
             value={newTaskInput}
             onChange={(e) => setNewTaskInput(e.target.value)}
           />
           <button type="submit" className="w-8 h-8 rounded-lg bg-white/5 hover:bg-pink-500 hover:text-white flex items-center justify-center transition-all">
              <span className="material-symbols-outlined text-[16px]">add</span>
           </button>
        </form>
      </div>

      {/* Kanban Columns */}
      <div className="flex-1 overflow-x-auto p-6 flex gap-6">
        {columns.map(col => {
          const colTasks = os.tasks
            .filter(t => t.status === col.id)
            .sort((a, b) => a.order - b.order);
          
          const isDragTarget = dragOverColId === col.id && draggingColId !== col.id;
          const isTaskDragTarget = dragOverColId === col.id && draggingTaskId !== null;
          
          return (
            <motion.div 
                key={col.id}
                layout
                draggable
                onDragStart={(e) => handleColumnDragStart(e as unknown as React.DragEvent<HTMLDivElement>, col.id)}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`
                    flex-1 min-w-[280px] flex flex-col transition-all rounded-xl cursor-default border
                    ${draggingColId === col.id ? 'opacity-40 scale-95 border-dashed border-white/20 bg-white/5 grayscale' : 'border-transparent'}
                    ${isDragTarget ? 'bg-white/10 ring-2 ring-blue-500/30 scale-[1.02]' : ''}
                    ${isTaskDragTarget ? 'bg-blue-500/5 border-blue-500/20' : ''}
                `}
            >
               <div className={`flex items-center justify-between mb-4 pb-2 border-b-2 ${col.color} cursor-grab active:cursor-grabbing`}>
                  <div className="flex items-center gap-2">
                     <span className="material-symbols-outlined text-[14px] text-white/30">drag_indicator</span>
                     <span className="text-[10px] font-black uppercase tracking-widest text-white/60 select-none">{col.label}</span>
                  </div>
                  <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-bold select-none">{colTasks.length}</span>
               </div>

               <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin pb-10">
                 <AnimatePresence>
                   {colTasks.length === 0 && (
                      <div className={`text-center py-10 pointer-events-none transition-opacity ${isTaskDragTarget ? 'opacity-50' : 'opacity-20'}`}>
                         <span className="material-symbols-outlined text-3xl">inbox</span>
                         {isTaskDragTarget && <p className="text-[10px] mt-2 uppercase tracking-widest text-blue-300">Drop Here</p>}
                      </div>
                   )}
                   {colTasks.map((task, index) => (
                     <motion.div
                       key={task.id}
                       layout
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, scale: 0.9 }}
                       draggable
                       onDragStart={(e: any) => handleTaskDragStart(e, task.id)}
                       onDrop={(e: any) => handleDrop(e, col.id, index)}
                       onDragOver={(e: any) => handleDragOver(e, col.id)} // Bubble up to column
                       className={`
                           p-4 glass rounded-xl border group hover:border-white/20 transition-all relative cursor-grab active:cursor-grabbing
                           ${draggingTaskId === task.id ? 'opacity-30 border-dashed border-white/40 bg-transparent shadow-none grayscale' : 'border-white/5'}
                       `}
                     >
                       <div className="flex justify-between items-start mb-2">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold tracking-wider ${getPriorityColor(task.priority)}`}>
                             {task.priority}
                          </span>
                          <button 
                             onClick={(e) => { e.stopPropagation(); os.deleteTask(task.id); }}
                             className="text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                          >
                             <span className="material-symbols-outlined text-[14px]">close</span>
                          </button>
                       </div>
                       
                       <p className="text-sm font-bold text-white/90 leading-snug mb-3 pointer-events-none">{task.title}</p>
                       
                       <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-2">
                          <span className="text-[9px] text-white/30 font-mono">
                             {new Date(task.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                          
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                               onClick={() => {
                                   const currentIndex = columns.findIndex(c => c.id === col.id);
                                   const prevCol = columns[currentIndex - 1];
                                   if (prevCol) os.updateTask(task.id, { status: prevCol.id });
                               }}
                               disabled={columns.findIndex(c => c.id === col.id) === 0}
                               className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center disabled:opacity-30 disabled:hover:bg-white/5"
                               title="Move Back"
                             >
                                <span className="material-symbols-outlined text-[14px]">chevron_left</span>
                             </button>
                             <button 
                               onClick={() => {
                                   const currentIndex = columns.findIndex(c => c.id === col.id);
                                   const nextCol = columns[currentIndex + 1];
                                   if (nextCol) os.updateTask(task.id, { status: nextCol.id });
                               }}
                               disabled={columns.findIndex(c => c.id === col.id) === columns.length - 1}
                               className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center disabled:opacity-30 disabled:hover:bg-white/5"
                               title="Move Forward"
                             >
                                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                             </button>
                          </div>
                       </div>
                     </motion.div>
                   ))}
                 </AnimatePresence>
               </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default BoardApp;
