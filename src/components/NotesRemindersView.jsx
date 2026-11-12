import React, { useState, useEffect, useRef } from 'react';
import { 
  BellRing, 
  Plus, 
  Pin, 
  Trash2, 
  Edit3, 
  Clock, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  Sparkles, 
  Users, 
  User, 
  Search, 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Heading1, 
  Heading2, 
  List, 
  ListOrdered, 
  Code, 
  Quote, 
  Tag, 
  Volume2,
  Zap,
  Repeat
} from 'lucide-react';
import { playChime, playSuccess } from '../utils/audio';
import { useModuleTheme } from '../utils/useModuleTheme';

export default function NotesRemindersView({ 
  notes = [], 
  setNotes, 
  reminders = [], 
  setReminders, 
  companyConfig = {}, 
  addAuditLog = () => {},
  onTriggerAlert = () => {}
}) {
  const [activeTab, setActiveTab] = useState('notes'); // 'notes' | 'reminders'
  const [noteScope, setNoteScope] = useState('all'); // 'all' | 'individual' | 'team' | 'pinned'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Note Modal state
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteForm, setNoteForm] = useState({
    title: '',
    content: '',
    isTeam: false,
    category: 'Strategic Intel',
    colorTag: '#ff2a5f',
    tags: 'Shinobi, Protocol, Confidential'
  });

  // Reminder Modal state
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderForm, setReminderForm] = useState({
    title: '',
    noteId: '',
    date: new Date().toISOString().slice(0, 10),
    time: '21:00',
    recurringInterval: 'none', // 'none' | 'daily' | 'weekly' | 'monthly' | 'custom'
    priority: 'High' // 'Low' | 'Normal' | 'High' | 'Critical S-Rank'
  });

  // Textarea ref for rich text insertion
  const textareaRef = useRef(null);

  // Module theming
  const { style: moduleThemeStyle } = useModuleTheme('notesReminders', companyConfig.moduleThemes);

  // Rich Text formatting helper
  const applyFormatting = (prefix, suffix = '') => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = noteForm.content;
    const selected = text.substring(start, end) || 'text';
    const replacement = `${prefix}${selected}${suffix}`;
    const newContent = text.substring(0, start) + replacement + text.substring(end);
    
    setNoteForm(prev => ({ ...prev, content: newContent }));
    playChime();

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 50);
  };

  // Open note for create or edit
  const openCreateNoteModal = () => {
    setEditingNoteId(null);
    setNoteForm({
      title: '',
      content: '',
      isTeam: noteScope === 'team',
      category: 'Strategic Intel',
      colorTag: '#ff2a5f',
      tags: 'Kamui, Priority'
    });
    setShowNoteModal(true);
    playChime();
  };

  const openEditNoteModal = (note) => {
    setEditingNoteId(note.id);
    setNoteForm({
      title: note.title,
      content: note.content,
      isTeam: note.isTeam,
      category: note.category || 'General',
      colorTag: note.colorTag || '#ff2a5f',
      tags: Array.isArray(note.tags) ? note.tags.join(', ') : (note.tags || '')
    });
    setShowNoteModal(true);
    playChime();
  };

  // Save Note
  const handleSaveNote = (e) => {
    e.preventDefault();
    if (!noteForm.title.trim()) return;

    playSuccess();
    const parsedTags = noteForm.tags.split(',').map(t => t.trim()).filter(Boolean);

    if (editingNoteId) {
      setNotes(prev => prev.map(n => {
        if (n.id === editingNoteId) {
          return {
            ...n,
            title: noteForm.title,
            content: noteForm.content,
            isTeam: noteForm.isTeam,
            category: noteForm.category,
            colorTag: noteForm.colorTag,
            tags: parsedTags,
            updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
          };
        }
        return n;
      }));

      addAuditLog({
        user: companyConfig.leader,
        action: 'NOTE_UPDATED',
        details: `Updated ${noteForm.isTeam ? 'team' : 'individual'} note: '${noteForm.title}'`
      });
    } else {
      const newNote = {
        id: `NOTE-${Date.now().toString().slice(-4)}`,
        title: noteForm.title,
        content: noteForm.content,
        isTeam: noteForm.isTeam,
        author: companyConfig.leader,
        category: noteForm.category,
        colorTag: noteForm.colorTag,
        tags: parsedTags,
        isPinned: false,
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
      };

      setNotes(prev => [newNote, ...prev]);

      addAuditLog({
        user: companyConfig.leader,
        action: 'NOTE_CREATED',
        details: `Created new ${noteForm.isTeam ? 'clan team' : 'individual'} note: '${noteForm.title}'`
      });
    }

    setShowNoteModal(false);
  };

  // Delete Note
  const handleDeleteNote = (noteId, noteTitle) => {
    playChime();
    setNotes(prev => prev.filter(n => n.id !== noteId));
    addAuditLog({
      user: companyConfig.leader,
      action: 'NOTE_DELETED',
      details: `Deleted note: '${noteTitle}'`
    });
  };

  // Toggle Pin
  const handleTogglePin = (noteId) => {
    playChime();
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, isPinned: !n.isPinned } : n));
  };

  // Save Reminder
  const handleSaveReminder = (e) => {
    e.preventDefault();
    if (!reminderForm.title.trim()) return;

    playSuccess();
    const targetTimestamp = `${reminderForm.date}T${reminderForm.time}:00`;

    const newReminder = {
      id: `REM-${Date.now().toString().slice(-4)}`,
      title: reminderForm.title,
      noteId: reminderForm.noteId || null,
      timestamp: targetTimestamp,
      recurringInterval: reminderForm.recurringInterval,
      priority: reminderForm.priority,
      status: 'pending',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    setReminders(prev => [newReminder, ...prev]);
    setShowReminderModal(false);

    addAuditLog({
      user: companyConfig.leader,
      action: 'REMINDER_SCHEDULED',
      details: `Scheduled reminder '${reminderForm.title}' for ${targetTimestamp} (${reminderForm.priority})`
    });
  };

  // Trigger Instant Test Banner Alert (for live user demonstration)
  const handleSimulateAlert = (reminder) => {
    playChime();
    onTriggerAlert({
      id: reminder.id,
      title: reminder.title,
      priority: reminder.priority,
      time: reminder.timestamp
    });
  };

  // Filter Notes
  const filteredNotes = notes.filter(n => {
    if (noteScope === 'individual' && n.isTeam) return false;
    if (noteScope === 'team' && !n.isTeam) return false;
    if (noteScope === 'pinned' && !n.isPinned) return false;

    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return n.title.toLowerCase().includes(q) || 
      n.content.toLowerCase().includes(q) || 
      (n.tags && n.tags.some(t => t.toLowerCase().includes(q)));
  });

  return (
    <div className="page-container" id="notes-reminders-module-page" style={moduleThemeStyle}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 900, color: '#ffffff' }}>
              Notes & Tactical Reminders
            </h2>
            <span className="status-badge s_rank" style={{ fontSize: '11px' }}>
              <Zap size={11} /> RICH TEXT & ALERT TELEMETRY
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: 4 }}>
            Synchronized knowledge archive for individual operatives and cross-functional clan divisions.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Tab Switcher */}
          <div style={{ display: 'flex', background: 'var(--bg-surface)', padding: 4, borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)' }}>
            <button
              id="tab-notes-view-btn"
              className={`btn-secondary ${activeTab === 'notes' ? 'active' : ''}`}
              onClick={() => { playChime(); setActiveTab('notes'); }}
              style={{
                fontSize: '12px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                background: activeTab === 'notes' ? 'var(--accent-crimson)' : 'transparent',
                color: activeTab === 'notes' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                fontWeight: activeTab === 'notes' ? 700 : 500
              }}
            >
              Notes ({notes.length})
            </button>
            <button
              id="tab-reminders-view-btn"
              className={`btn-secondary ${activeTab === 'reminders' ? 'active' : ''}`}
              onClick={() => { playChime(); setActiveTab('reminders'); }}
              style={{
                fontSize: '12px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                background: activeTab === 'reminders' ? 'var(--accent-crimson)' : 'transparent',
                color: activeTab === 'reminders' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                fontWeight: activeTab === 'reminders' ? 700 : 500
              }}
            >
              Reminders ({reminders.length})
            </button>
          </div>

          {activeTab === 'notes' ? (
            <button
              id="create-new-note-btn"
              className="btn-primary"
              onClick={openCreateNoteModal}
            >
              <Plus size={16} />
              <span>Create Note</span>
            </button>
          ) : (
            <button
              id="create-new-reminder-btn"
              className="btn-primary"
              onClick={() => { playChime(); setShowReminderModal(true); }}
            >
              <Clock size={16} />
              <span>Set Reminder</span>
            </button>
          )}
        </div>
      </div>

      {/* View Content */}
      {activeTab === 'notes' ? (
        /* NOTES TAB */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Sub Navigation Scopes & Search */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'All Notes', icon: Sparkles },
                { id: 'individual', label: 'My Personal Notes', icon: User },
                { id: 'team', label: 'Clan & Team Notes', icon: Users },
                { id: 'pinned', label: 'Pinned Priority', icon: Pin }
              ].map(scope => {
                const IconComp = scope.icon;
                return (
                  <button
                    key={scope.id}
                    id={`notes-filter-${scope.id}-btn`}
                    className={`btn-secondary ${noteScope === scope.id ? 'active' : ''}`}
                    onClick={() => { playChime(); setNoteScope(scope.id); }}
                    style={{
                      fontSize: '12px',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-full)',
                      background: noteScope === scope.id ? 'var(--accent-crimson)' : 'var(--bg-surface)',
                      color: noteScope === scope.id ? '#ffffff' : 'var(--text-secondary)',
                      borderColor: noteScope === scope.id ? 'var(--accent-crimson)' : 'var(--border-subtle)',
                      fontWeight: noteScope === scope.id ? 700 : 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <IconComp size={13} />
                    <span>{scope.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Note search input */}
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Search notes, tags, content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '32px', fontSize: '12.5px' }}
              />
            </div>
          </div>

          {/* Notes Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {filteredNotes.length === 0 ? (
              <div className="glass-panel" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
                <Edit3 size={32} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
                <h3>No notes found under this view</h3>
                <p style={{ fontSize: '13px', marginTop: 4 }}>
                  Click "+ Create Note" above to draft a rich formatted intelligence note or memo.
                </p>
              </div>
            ) : (
              filteredNotes.map(note => (
                <div 
                  key={note.id}
                  className="glass-panel"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderLeft: `4px solid ${note.colorTag || '#ff2a5f'}`,
                    position: 'relative'
                  }}
                >
                  {/* Card Header */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="status-badge" style={{ fontSize: '10px', padding: '2px 8px' }}>
                          {note.isTeam ? 'Team Note' : 'Individual'}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {note.category}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button
                          onClick={() => handleTogglePin(note.id)}
                          title={note.isPinned ? "Unpin Note" : "Pin Note"}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: note.isPinned ? '#eab308' : 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: 4
                          }}
                        >
                          <Pin size={15} fill={note.isPinned ? '#eab308' : 'none'} />
                        </button>
                        <button
                          onClick={() => openEditNoteModal(note)}
                          title="Edit Note"
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id, note.title)}
                          title="Delete Note"
                          style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: 4 }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', marginBottom: 10 }}>
                      {note.title}
                    </h3>

                    {/* Rich text display rendering */}
                    <div 
                      style={{ 
                        fontSize: '13px', 
                        color: 'var(--text-secondary)', 
                        lineHeight: 1.6,
                        maxHeight: '140px',
                        overflowY: 'auto',
                        whiteSpace: 'pre-wrap',
                        background: 'rgba(0, 0, 0, 0.2)',
                        padding: '10px',
                        borderRadius: 'var(--radius-sm)',
                        fontFamily: 'inherit'
                      }}
                    >
                      {note.content}
                    </div>
                  </div>

                  {/* Card Footer with Tags & Meta */}
                  <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {Array.isArray(note.tags) && note.tags.map((t, idx) => (
                        <span key={idx} style={{ fontSize: '10px', background: 'rgba(255, 42, 95, 0.12)', color: 'var(--accent-crimson-light)', padding: '2px 6px', borderRadius: 4 }}>
                          #{t}
                        </span>
                      ))}
                    </div>
                    <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {note.createdAt}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* REMINDERS TAB */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="glass-panel">
            <div className="panel-header">
              <div className="panel-title">
                <BellRing size={18} color="var(--accent-crimson)" />
                <span>Active Reminders & Automated Alert Subsystem</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                CRIMSON CHRONO DISPATCHER
              </span>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Reminder Title</th>
                    <th>Target Date & Time</th>
                    <th>Interval</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reminders.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                        No scheduled reminders. Click "+ Set Reminder" to add timed push alerts.
                      </td>
                    </tr>
                  ) : (
                    reminders.map(rem => (
                      <tr key={rem.id}>
                        <td data-label="Reminder Title">
                          <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '13.5px' }}>
                            {rem.title}
                          </div>
                          {rem.noteId && (
                            <div style={{ fontSize: '11px', color: 'var(--accent-purple)' }}>
                              Linked to Note: {rem.noteId}
                            </div>
                          )}
                        </td>
                        <td data-label="Target Date & Time" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-primary)' }}>
                          <Clock size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                          {rem.timestamp.replace('T', ' ')}
                        </td>
                        <td data-label="Interval">
                          <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Repeat size={12} />
                            {rem.recurringInterval || 'Once'}
                          </span>
                        </td>
                        <td data-label="Priority">
                          <span className={`status-badge ${rem.priority.toLowerCase().includes('critical') || rem.priority.toLowerCase().includes('high') ? 's_rank' : 'in_progress'}`}>
                            {rem.priority}
                          </span>
                        </td>
                        <td data-label="Status">
                          <span style={{ fontSize: '11.5px', color: rem.status === 'triggered' ? '#f87171' : '#34d399', fontWeight: 600 }}>
                            {rem.status.toUpperCase()}
                          </span>
                        </td>
                        <td data-label="Actions" style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            {/* Test alert trigger */}
                            <button
                              className="btn-secondary"
                              onClick={() => handleSimulateAlert(rem)}
                              title="Test trigger banner alert now"
                              style={{ fontSize: '11px', padding: '4px 8px', color: 'var(--accent-crimson)' }}
                            >
                              <Volume2 size={12} />
                              <span>Test Alert</span>
                            </button>
                            <button
                              className="btn-secondary"
                              onClick={() => {
                                playChime();
                                setReminders(prev => prev.filter(r => r.id !== rem.id));
                              }}
                              title="Remove Reminder"
                              style={{ fontSize: '11px', padding: '4px 8px', color: '#f87171' }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT NOTE MODAL WITH RICH TEXT TOOLBAR */}
      {showNoteModal && (
        <div className="modal-overlay" id="note-crud-modal">
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <h3>{editingNoteId ? 'Edit Strategic Note' : 'Draft Intelligence Note'}</h3>
              <button 
                onClick={() => setShowNoteModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNote}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Note Title</label>
                  <input 
                    type="text" 
                    required
                    className="form-control"
                    placeholder="e.g. Mastermind Strategic Directives Q4"
                    value={noteForm.title}
                    onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Scope / Clearance</label>
                    <select 
                      className="form-control"
                      value={noteForm.isTeam ? 'team' : 'individual'}
                      onChange={(e) => setNoteForm({ ...noteForm, isTeam: e.target.value === 'team' })}
                    >
                      <option value="individual">Personal / Individual Note</option>
                      <option value="team">Clan / Team Shared Note</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Category</label>
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="e.g. Tactical Intel, R&D, Financial"
                      value={noteForm.category}
                      onChange={(e) => setNoteForm({ ...noteForm, category: e.target.value })}
                    />
                  </div>
                </div>

                {/* 2.3 Rich Text Formatting Toolbar */}
                <div className="form-group">
                  <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Rich Text Content</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Markdown & Rich Formatting Enabled</span>
                  </label>

                  <div 
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 4,
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderBottom: 'none',
                      borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                      padding: '6px'
                    }}
                  >
                    <button type="button" className="action-icon-btn" style={{ width: 28, height: 28 }} onClick={() => applyFormatting('**', '**')} title="Bold">
                      <Bold size={13} />
                    </button>
                    <button type="button" className="action-icon-btn" style={{ width: 28, height: 28 }} onClick={() => applyFormatting('*', '*')} title="Italic">
                      <Italic size={13} />
                    </button>
                    <button type="button" className="action-icon-btn" style={{ width: 28, height: 28 }} onClick={() => applyFormatting('<u>', '</u>')} title="Underline">
                      <Underline size={13} />
                    </button>
                    <button type="button" className="action-icon-btn" style={{ width: 28, height: 28 }} onClick={() => applyFormatting('~~', '~~')} title="Strikethrough">
                      <Strikethrough size={13} />
                    </button>
                    <button type="button" className="action-icon-btn" style={{ width: 28, height: 28 }} onClick={() => applyFormatting('# ', '')} title="Heading 1">
                      <Heading1 size={13} />
                    </button>
                    <button type="button" className="action-icon-btn" style={{ width: 28, height: 28 }} onClick={() => applyFormatting('## ', '')} title="Heading 2">
                      <Heading2 size={13} />
                    </button>
                    <button type="button" className="action-icon-btn" style={{ width: 28, height: 28 }} onClick={() => applyFormatting('- ', '')} title="Bullet List">
                      <List size={13} />
                    </button>
                    <button type="button" className="action-icon-btn" style={{ width: 28, height: 28 }} onClick={() => applyFormatting('1. ', '')} title="Numbered List">
                      <ListOrdered size={13} />
                    </button>
                    <button type="button" className="action-icon-btn" style={{ width: 28, height: 28 }} onClick={() => applyFormatting('`', '`')} title="Inline Code">
                      <Code size={13} />
                    </button>
                    <button type="button" className="action-icon-btn" style={{ width: 28, height: 28 }} onClick={() => applyFormatting('> ', '')} title="Quote Block">
                      <Quote size={13} />
                    </button>
                  </div>

                  <textarea 
                    ref={textareaRef}
                    rows="6"
                    required
                    className="form-control"
                    style={{ borderRadius: '0 0 var(--radius-md) var(--radius-md)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}
                    placeholder="Enter strategic note details using rich text syntax..."
                    value={noteForm.content}
                    onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Tags (comma separated)</label>
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="e.g. Shinobi, Kamui, High Priority"
                      value={noteForm.tags}
                      onChange={(e) => setNoteForm({ ...noteForm, tags: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Accent Color Tag</label>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                      {['#ff2a5f', '#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'].map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setNoteForm({ ...noteForm, colorTag: color })}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            background: color,
                            border: noteForm.colorTag === color ? '2px solid #ffffff' : 'none',
                            cursor: 'pointer',
                            boxShadow: noteForm.colorTag === color ? `0 0 8px ${color}` : 'none'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowNoteModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" id="save-note-submit-btn">
                  {editingNoteId ? 'Update Note' : 'Create Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE REMINDER MODAL */}
      {showReminderModal && (
        <div className="modal-overlay" id="reminder-modal">
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>Set Tactical Push Reminder</h3>
              <button 
                onClick={() => setShowReminderModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveReminder}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Reminder Title / Directive</label>
                  <input 
                    type="text" 
                    required
                    className="form-control"
                    placeholder="e.g. Review Q4 Treasury & Operative Payroll"
                    value={reminderForm.title}
                    onChange={(e) => setReminderForm({ ...reminderForm, title: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Reminder Date</label>
                    <input 
                      type="date" 
                      required
                      className="form-control"
                      value={reminderForm.date}
                      onChange={(e) => setReminderForm({ ...reminderForm, date: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Reminder Time</label>
                    <input 
                      type="time" 
                      required
                      className="form-control"
                      value={reminderForm.time}
                      onChange={(e) => setReminderForm({ ...reminderForm, time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Recurring Interval</label>
                    <select 
                      className="form-control"
                      value={reminderForm.recurringInterval}
                      onChange={(e) => setReminderForm({ ...reminderForm, recurringInterval: e.target.value })}
                    >
                      <option value="none">None (One-time)</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="custom">Custom Recurrence</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Priority Tag</label>
                    <select 
                      className="form-control"
                      value={reminderForm.priority}
                      onChange={(e) => setReminderForm({ ...reminderForm, priority: e.target.value })}
                    >
                      <option value="Low">Low Priority</option>
                      <option value="Normal">Normal Priority</option>
                      <option value="High">High Priority</option>
                      <option value="Critical S-Rank">Critical S-Rank</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowReminderModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" id="save-reminder-submit-btn">
                  Arm Push Notification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
