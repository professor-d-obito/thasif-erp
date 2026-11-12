import React, { useState } from 'react';
import { 
  CheckSquare, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Filter, 
  Plus, 
  ArrowRight, 
  ArrowLeft, 
  User, 
  Calendar, 
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  XCircle,
  Sparkles
} from 'lucide-react';
import { playChime, playSuccess } from '../utils/audio';

const COLUMNS = [
  { id: 'todo', label: 'To-Do', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)' },
  { id: 'in_progress', label: 'In Progress', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.1)' },
  { id: 'blocked', label: 'Blocked', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
  { id: 'done', label: 'Completed', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' }
];

export default function TaskTrackingBoardWidget({ 
  tasks = [], 
  setTasks = () => {}, 
  operatives = [], 
  companyConfig = {}, 
  addAuditLog = () => {}
}) {
  const [filterStaff, setFilterStaff] = useState('All');
  const [filterModule, setFilterModule] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBlockReasonModal, setShowBlockReasonModal] = useState(false);
  const [taskToBlock, setTaskToBlock] = useState(null);
  const [blockerReasonInput, setBlockerReasonInput] = useState('');

  // New task form state
  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    module: 'Infrastructure',
    priority: 'High',
    stage: 'todo',
    assignee: companyConfig.leader || 'Professor D Obito',
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
    description: ''
  });

  // Calculate Aggregated Metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.stage === 'done').length;
  const inProgressTasks = tasks.filter(t => t.stage === 'in_progress').length;
  const blockedTasks = tasks.filter(t => t.stage === 'blocked').length;
  const todoTasks = tasks.filter(t => t.stage === 'todo' || t.stage === 'backlog').length;
  const totalPending = todoTasks + inProgressTasks + blockedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Extract unique modules and staff for filter dropdowns
  const uniqueModules = Array.from(new Set(tasks.map(t => t.module || 'General')));
  const staffList = operatives.length > 0 ? operatives.map(o => o.name) : ['Professor D Obito', 'Kakashi Hatake', 'Itachi Uchiha', 'Shikamaru Nara'];

  // Apply filters
  const filteredTasks = tasks.filter(t => {
    const matchesStaff = filterStaff === 'All' || t.assignee === filterStaff;
    const matchesModule = filterModule === 'All' || t.module === filterModule;
    return matchesStaff && matchesModule;
  });

  // Advance task stage
  const updateTaskStage = (taskId, newStage, reason = '') => {
    playSuccess();
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const isNowDone = newStage === 'done';
        const updated = {
          ...t,
          stage: newStage,
          progress: isNowDone ? 100 : (newStage === 'in_progress' ? 50 : t.progress),
          completedAt: isNowDone ? new Date().toISOString().replace('T', ' ').slice(0, 16) : (newStage === 'todo' ? null : t.completedAt),
          blockedReason: newStage === 'blocked' ? (reason || t.blockedReason || 'Blocked by external dependency') : null
        };

        addAuditLog({
          user: companyConfig.leader,
          action: 'TASK_STAGE_TRANSITION',
          details: `Moved task '${t.title}' to ${newStage.toUpperCase()}${reason ? ` (Reason: ${reason})` : ''}`
        });

        return updated;
      }
      return t;
    }));
  };

  // Handle stage change prompt
  const handleStageSelect = (taskId, targetStage) => {
    if (targetStage === 'blocked') {
      const task = tasks.find(t => t.id === taskId);
      setTaskToBlock(task);
      setBlockerReasonInput(task?.blockedReason || 'Awaiting clearance from higher council');
      setShowBlockReasonModal(true);
      return;
    }
    updateTaskStage(taskId, targetStage);
  };

  // Confirm blocker modal
  const handleConfirmBlocker = (e) => {
    e.preventDefault();
    if (taskToBlock) {
      updateTaskStage(taskToBlock.id, 'blocked', blockerReasonInput);
    }
    setShowBlockReasonModal(false);
    setTaskToBlock(null);
  };

  // Add new task
  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTaskForm.title.trim()) return;

    playSuccess();
    const newTask = {
      id: `TSK-${Date.now().toString().slice(-3)}`,
      ...newTaskForm,
      progress: newTaskForm.stage === 'done' ? 100 : 0,
      completedAt: newTaskForm.stage === 'done' ? new Date().toISOString().replace('T', ' ').slice(0, 16) : null
    };

    setTasks(prev => [newTask, ...prev]);
    setShowAddModal(false);
    setNewTaskForm({
      title: '',
      module: 'Infrastructure',
      priority: 'High',
      stage: 'todo',
      assignee: companyConfig.leader || 'Professor D Obito',
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
      description: ''
    });

    addAuditLog({
      user: companyConfig.leader,
      action: 'TASK_CREATED',
      details: `Created new tactical task '${newTask.title}' assigned to ${newTask.assignee}`
    });
  };

  return (
    <div className="glass-panel" id="super-admin-task-dashboard-widget" style={{ borderColor: 'rgba(255, 42, 95, 0.3)' }}>
      {/* Widget Header & Aggregated Metrics Display */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16, marginBottom: 18 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-crimson)', boxShadow: '0 0 10px var(--accent-crimson)' }}></span>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.5px' }}>
              Super Admin Tactical Task Tracking Board
            </h3>
            <span className="status-badge s_rank" style={{ fontSize: '10.5px' }}>
              LIVE STATUS BOARD
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12.5px', marginTop: 4 }}>
            Real-time status board across To-Do, In Progress, Blocked, and Completed operations with assigned staff tracking.
          </p>
        </div>

        {/* Aggregated Metrics Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ background: 'var(--bg-surface)', padding: '6px 14px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>TOTAL TASKS:</span>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>{totalTasks}</span>
          </div>

          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '6px 14px', borderRadius: 'var(--radius-full)', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '11px', color: '#fbbf24' }}>TOTAL PENDING:</span>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>{totalPending}</span>
          </div>

          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '6px 14px', borderRadius: 'var(--radius-full)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '11px', color: '#34d399' }}>COMPLETED:</span>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)' }}>{completedTasks} ({completionRate}%)</span>
          </div>

          <button 
            id="superadmin-add-task-btn"
            className="btn-primary"
            onClick={() => { playChime(); setShowAddModal(true); }}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            <Plus size={14} />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Interactive Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Staff Member Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <User size={14} color="var(--accent-purple)" />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Filter Staff:</span>
            <select
              id="task-filter-staff-select"
              className="form-control"
              style={{ padding: '4px 8px', fontSize: '12px', width: 'auto' }}
              value={filterStaff}
              onChange={(e) => setFilterStaff(e.target.value)}
            >
              <option value="All">All Staff Members ({operatives.length || 6})</option>
              {staffList.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Project / Module Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={14} color="var(--accent-cyan)" />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Filter Module:</span>
            <select
              id="task-filter-module-select"
              className="form-control"
              style={{ padding: '4px 8px', fontSize: '12px', width: 'auto' }}
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
            >
              <option value="All">All Modules ({uniqueModules.length})</option>
              {uniqueModules.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Completion Progress Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: '220px' }}>
          <div style={{ width: '100%', height: 7, background: 'var(--bg-input)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: `${completionRate}%`, height: '100%', background: 'linear-gradient(90deg, #38bdf8 0%, #10b981 100%)', borderRadius: 999 }}></div>
          </div>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {completionRate}% Done
          </span>
        </div>
      </div>

      {/* 2.5 4-Column Status Board (To-Do, In Progress, Blocked, Completed) */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, minmax(260px, 1fr))', 
          gap: '16px',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: '8px'
        }}
        id="task-kanban-board-grid"
      >
        {COLUMNS.map(col => {
          const colTasks = filteredTasks.filter(t => {
            if (col.id === 'todo') return t.stage === 'todo' || t.stage === 'backlog';
            return t.stage === col.id;
          });

          return (
            <div 
              key={col.id}
              style={{
                background: 'rgba(10, 11, 16, 0.45)',
                border: `1px solid ${col.color}33`,
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                minHeight: '340px',
                scrollSnapAlign: 'start'
              }}
            >
              {/* Column Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${col.color}`, paddingBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }}></span>
                  <span style={{ fontWeight: 800, fontSize: '13px', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {col.label}
                  </span>
                </div>
                <span 
                  style={{ 
                    fontSize: '11px', 
                    fontFamily: 'var(--font-mono)', 
                    background: col.bg, 
                    color: col.color, 
                    padding: '2px 8px', 
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 700
                  }}
                >
                  {colTasks.length}
                </span>
              </div>

              {/* Task Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, overflowY: 'auto' }}>
                {colTasks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '11.5px' }}>
                    No tasks in {col.label}
                  </div>
                ) : (
                  colTasks.map(task => {
                    const isBlocked = task.stage === 'blocked';
                    const isDone = task.stage === 'done';

                    return (
                      <div 
                        key={task.id}
                        className="task-card-item"
                        style={{
                          background: 'var(--bg-surface)',
                          border: `1px solid ${isBlocked ? 'rgba(239, 68, 68, 0.5)' : (isDone ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)')}`,
                          borderRadius: 'var(--radius-sm)',
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                          boxShadow: isBlocked ? '0 0 12px rgba(239, 68, 68, 0.15)' : 'none',
                          transition: 'border-color 0.2s ease, transform 0.2s ease'
                        }}
                      >
                        {/* Top Task Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                          <span className="table-id-pill" style={{ fontSize: '10px' }}>{task.id}</span>
                          <span 
                            className={`status-badge ${task.priority === 'S-Rank' ? 's_rank' : (task.priority === 'High' ? 'overdue' : 'in_progress')}`}
                            style={{ fontSize: '9.5px', padding: '1px 6px' }}
                          >
                            {task.priority}
                          </span>
                        </div>

                        {/* Title */}
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', lineHeight: 1.4 }}>
                          {task.title}
                        </div>

                        {/* Visual Indicators: Assigned Staff & Due Date */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                          {/* Staff Assignee */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--accent-purple)', color: '#fff', fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                              {task.assignee.charAt(0)}
                            </div>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{task.assignee}</span>
                          </div>

                          {/* Due Date Indicator */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                            <Calendar size={12} color="var(--text-muted)" />
                            <span>Due: {task.dueDate}</span>
                          </div>
                        </div>

                        {/* Visual Indicator: Blocked Reason if Blocked */}
                        {isBlocked && (
                          <div 
                            style={{
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              borderRadius: '4px',
                              padding: '6px 8px',
                              fontSize: '11px',
                              color: '#fca5a5',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 6
                            }}
                          >
                            <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                            <span><strong>Blocker:</strong> {task.blockedReason || 'External impediment'}</span>
                          </div>
                        )}

                        {/* Visual Indicator: Completion Timestamp if Completed */}
                        {isDone && (
                          <div 
                            style={{
                              background: 'rgba(16, 185, 129, 0.15)',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              fontSize: '10.5px',
                              fontFamily: 'var(--font-mono)',
                              color: '#34d399',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                          >
                            <CheckCircle2 size={12} />
                            <span>Done: {task.completedAt || 'Recently'}</span>
                          </div>
                        )}

                        {/* Stage Selector Action Bar */}
                        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 8, marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Move to:</span>
                          <select
                            value={task.stage === 'backlog' ? 'todo' : task.stage}
                            onChange={(e) => handleStageSelect(task.id, e.target.value)}
                            style={{
                              background: 'var(--bg-input)',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--text-primary)',
                              fontSize: '11px',
                              borderRadius: '4px',
                              padding: '2px 6px'
                            }}
                          >
                            <option value="todo">To-Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="blocked">Blocked</option>
                            <option value="done">Completed</option>
                          </select>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: REASON FOR BLOCKER */}
      {showBlockReasonModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={18} color="#ef4444" />
                <h3>Flag Task as Blocked</h3>
              </div>
              <button onClick={() => setShowBlockReasonModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleConfirmBlocker}>
              <div className="modal-body">
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 12 }}>
                  Provide explicit impediment justification for task <strong>{taskToBlock?.title}</strong>:
                </p>
                <div className="form-group">
                  <label>Blocker Reason / Dependency</label>
                  <textarea 
                    rows="3" 
                    required 
                    className="form-control" 
                    placeholder="e.g. Awaiting council authorization, parts supply backordered..."
                    value={blockerReasonInput}
                    onChange={(e) => setBlockerReasonInput(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowBlockReasonModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ background: '#ef4444', borderColor: '#dc2626' }}>Confirm Blocked State</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD TACTICAL TASK */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3>Create Tactical Task</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Task Title</label>
                  <input 
                    type="text" 
                    required 
                    className="form-control"
                    placeholder="e.g. Deploy Subspace Relay #9"
                    value={newTaskForm.title}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Module / Category</label>
                    <input 
                      type="text" 
                      required 
                      className="form-control"
                      placeholder="e.g. Infrastructure, Security, Logistics"
                      value={newTaskForm.module}
                      onChange={(e) => setNewTaskForm({ ...newTaskForm, module: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Assigned Staff Member</label>
                    <select
                      className="form-control"
                      value={newTaskForm.assignee}
                      onChange={(e) => setNewTaskForm({ ...newTaskForm, assignee: e.target.value })}
                    >
                      {staffList.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Priority Rank</label>
                    <select
                      className="form-control"
                      value={newTaskForm.priority}
                      onChange={(e) => setNewTaskForm({ ...newTaskForm, priority: e.target.value })}
                    >
                      <option value="S-Rank">S-Rank (Supreme Priority)</option>
                      <option value="High">High Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="Low">Low Priority</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Initial Status</label>
                    <select
                      className="form-control"
                      value={newTaskForm.stage}
                      onChange={(e) => setNewTaskForm({ ...newTaskForm, stage: e.target.value })}
                    >
                      <option value="todo">To-Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="blocked">Blocked</option>
                      <option value="done">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Due Date</label>
                  <input 
                    type="date" 
                    required 
                    className="form-control"
                    value={newTaskForm.dueDate}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, dueDate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Description / Directives</label>
                  <textarea 
                    rows="2" 
                    className="form-control"
                    placeholder="Enter task scope and objectives..."
                    value={newTaskForm.description}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Add Task to Board</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
