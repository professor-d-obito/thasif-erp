import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  ChevronRight, 
  ChevronLeft, 
  Calendar, 
  User, 
  Zap, 
  Trash2, 
  Clock, 
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { playChime, playSuccess } from '../utils/audio';
import { useModuleTheme } from '../utils/useModuleTheme';

export default function ProjectsView({ 
  tasks, 
  setTasks, 
  companyConfig, 
  operatives, 
  addAuditLog, 
  searchQuery 
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState('All');
  const { style: moduleThemeStyle } = useModuleTheme('projects', companyConfig.moduleThemes);

  const [formData, setFormData] = useState({
    title: '',
    module: 'Operations',
    priority: 'High',
    stage: 'in_progress',
    assignee: 'Professor D Obito',
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    progress: 50,
    description: ''
  });

  const columns = [
    { key: 'todo', title: 'Tactical To-Do', color: 'var(--text-muted)' },
    { key: 'in_progress', title: 'Active Deployment', color: 'var(--accent-crimson)' },
    { key: 'blocked', title: 'Impeded / Blocked', color: '#ef4444' },
    { key: 'done', title: 'Mission Accomplished', color: 'var(--accent-emerald)' }
  ];

  // Filtering
  const filteredTasks = tasks.filter(task => {
    const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter;
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch = !q ||
      task.title.toLowerCase().includes(q) ||
      task.assignee.toLowerCase().includes(q) ||
      task.module.toLowerCase().includes(q);
    return matchesPriority && matchesSearch;
  });

  // Move stage
  const moveTaskStage = (taskId, targetStage) => {
    playSuccess();
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const newProgress = targetStage === 'done' ? 100 : targetStage === 'backlog' ? 10 : t.progress;
        addAuditLog({
          user: companyConfig.leader,
          action: 'MISSION_STAGE_SHIFT',
          details: `Moved mission '${t.title}' to ${targetStage.replace('_', ' ').toUpperCase()}`
        });
        return { ...t, stage: targetStage, progress: newProgress };
      }
      return t;
    }));
  };

  const handleSaveTask = (e) => {
    e.preventDefault();
    playSuccess();

    const newTask = {
      id: `TSK-${String(tasks.length + 106).padStart(3, '0')}`,
      ...formData,
      progress: Number(formData.progress) || 0
    };

    setTasks(prev => [newTask, ...prev]);

    addAuditLog({
      user: companyConfig.leader,
      action: 'MISSION_CREATE',
      details: `Initialized mission '${newTask.title}' assigned to ${formData.assignee} (${formData.priority})`
    });

    setShowAddModal(false);
  };

  const handleDeleteTask = (id, title) => {
    if (window.confirm(`Cancel tactical mission '${title}'?`)) {
      playSuccess();
      setTasks(prev => prev.filter(t => t.id !== id));
      addAuditLog({
        user: companyConfig.leader,
        action: 'MISSION_CANCEL',
        details: `Aborted mission '${title}' (${id})`
      });
    }
  };

  return (
    <div className="page-container" id="tactical-missions-page" style={moduleThemeStyle}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 900, color: '#ffffff' }}>
            Tactical Missions & Kanban Boards
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px' }}>
            Operational project boards, priority task pipelines, operative assignments, and S-Rank mission tracking.
          </p>
        </div>

        <button 
          id="new-mission-btn"
          className="btn-primary" 
          onClick={() => { playChime(); setShowAddModal(true); }}
        >
          <Plus size={16} />
          <span>New Tactical Mission</span>
        </button>
      </div>

      {/* Priority Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {['All', 'S-Rank', 'High', 'Medium', 'Low'].map(p => (
          <button
            key={p}
            className={`btn-secondary ${priorityFilter === p ? 'active' : ''}`}
            onClick={() => { playChime(); setPriorityFilter(p); }}
            style={{
              fontSize: '12px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              background: priorityFilter === p ? 'var(--accent-crimson)' : 'var(--bg-surface)',
              color: priorityFilter === p ? '#ffffff' : 'var(--text-secondary)',
              borderColor: priorityFilter === p ? 'var(--accent-crimson)' : 'var(--border-subtle)',
              fontWeight: priorityFilter === p ? 700 : 500
            }}
          >
            {p === 'S-Rank' ? '⚡ S-Rank' : p}
          </button>
        ))}
      </div>

      {/* Kanban Board Columns */}
      <div className="kanban-grid" id="kanban-board-container">
        {columns.map(col => {
          const colTasks = filteredTasks.filter(t => col.key === 'todo' ? (t.stage === 'todo' || t.stage === 'backlog') : t.stage === col.key);

          return (
            <div key={col.key} className="kanban-column" id={`kanban-col-${col.key}`}>
              <div className="column-header">
                <div className="column-title" style={{ color: col.color }}>
                  <span>{col.title}</span>
                </div>
                <span className="nav-badge">{colTasks.length}</span>
              </div>

              <div className="kanban-cards">
                {colTasks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '12px' }}>
                    No missions in this stage.
                  </div>
                ) : (
                  colTasks.map(task => {
                    const isSRank = task.priority === 'S-Rank';

                    return (
                      <div 
                        key={task.id} 
                        className="task-card"
                        style={{
                          borderLeft: isSRank ? '3px solid var(--accent-crimson)' : '1px solid var(--border-subtle)',
                          boxShadow: isSRank ? '0 0 12px rgba(255, 42, 95, 0.2)' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="table-id-pill">{task.id}</span>
                          <span className={`status-badge ${isSRank ? 's_rank' : task.priority.toLowerCase()}`}>
                            {isSRank && <Zap size={11} />}
                            {task.priority}
                          </span>
                        </div>

                        <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#ffffff' }}>
                          {task.title}
                        </div>

                        {task.description && (
                          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                            {task.description}
                          </div>
                        )}

                        {/* Progress bar */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-muted)', marginBottom: 3 }}>
                            <span>Progress</span>
                            <span style={{ fontFamily: 'var(--font-mono)' }}>{task.progress}%</span>
                          </div>
                          <div style={{ width: '100%', height: 4, background: 'var(--bg-input)', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{ 
                              width: `${task.progress}%`, 
                              height: '100%', 
                              background: task.stage === 'done' ? 'var(--accent-emerald)' : 'var(--accent-crimson)' 
                            }}></div>
                          </div>
                        </div>

                        {/* Assignee & Due Date */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <User size={13} color="var(--accent-purple)" />
                            <span>{task.assignee}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)' }}>
                            <Clock size={12} color="var(--text-muted)" />
                            <span>{task.dueDate}</span>
                          </div>
                        </div>

                        {/* Stage Controls */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: 8, marginTop: 4 }}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {col.key !== 'backlog' && (
                              <button
                                className="action-icon-btn"
                                style={{ width: 26, height: 26 }}
                                title="Move to previous stage"
                                onClick={() => {
                                  const stages = ['backlog', 'in_progress', 'review', 'done'];
                                  const prevIdx = stages.indexOf(col.key) - 1;
                                  if (prevIdx >= 0) moveTaskStage(task.id, stages[prevIdx]);
                                }}
                              >
                                <ChevronLeft size={13} />
                              </button>
                            )}

                            {col.key !== 'done' && (
                              <button
                                className="action-icon-btn"
                                style={{ width: 26, height: 26 }}
                                title="Advance to next stage"
                                onClick={() => {
                                  const stages = ['backlog', 'in_progress', 'review', 'done'];
                                  const nextIdx = stages.indexOf(col.key) + 1;
                                  if (nextIdx < stages.length) moveTaskStage(task.id, stages[nextIdx]);
                                }}
                              >
                                <ChevronRight size={13} />
                              </button>
                            )}
                          </div>

                          <button
                            className="action-icon-btn"
                            style={{ width: 26, height: 26, color: 'var(--accent-crimson)' }}
                            title="Cancel task"
                            onClick={() => handleDeleteTask(task.id, task.title)}
                          >
                            <Trash2 size={12} />
                          </button>
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

      {/* Add Mission Modal */}
      {showAddModal && (
        <div className="modal-overlay" id="add-mission-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Dispatch Tactical Mission</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTask}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Mission Directive / Title</label>
                  <input 
                    type="text" 
                    required
                    className="form-control"
                    placeholder="e.g. Subspace Antenna Calibration"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Priority Rank</label>
                    <select 
                      className="form-control"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    >
                      <option value="S-Rank">⚡ S-Rank (Critical Mastermind)</option>
                      <option value="High">High Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="Low">Standard / Low</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Assigned Operative</label>
                    <select 
                      className="form-control"
                      value={formData.assignee}
                      onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                    >
                      {operatives.map(op => (
                        <option key={op.id} value={op.name}>{op.name} ({op.rank.split(' ')[0]})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Initial Pipeline Stage</label>
                    <select 
                      className="form-control"
                      value={formData.stage}
                      onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                    >
                      <option value="backlog">Tactical Backlog</option>
                      <option value="in_progress">Active Deployment</option>
                      <option value="review">Security & Quality Review</option>
                      <option value="done">Mission Accomplished</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Target Deadline</label>
                    <input 
                      type="date" 
                      required
                      className="form-control"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Initial Progress ({formData.progress}%)</label>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="5"
                    className="form-control"
                    value={formData.progress}
                    onChange={(e) => setFormData({ ...formData, progress: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Tactical Briefing / Description</label>
                  <textarea 
                    rows="3"
                    className="form-control"
                    placeholder="Provide operational directives for the assigned shinobi..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  id="save-mission-submit-btn"
                >
                  Dispatch Mission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
