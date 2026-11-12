import React, { useState } from 'react';
import { 
  TrendingUp, 
  Package, 
  Receipt, 
  Users, 
  AlertTriangle, 
  ArrowUpRight, 
  Plus, 
  ShieldAlert, 
  Sparkles, 
  Zap,
  CheckCircle2,
  Clock,
  CheckSquare,
  DollarSign,
  Briefcase,
  Layers,
  ArrowRight,
  Filter,
  Calendar,
  Activity,
  Lock,
  Shield,
  UserCheck,
  HardDrive
} from 'lucide-react';
import { playChime, playSuccess } from '../utils/audio';
import TaskTrackingBoardWidget from './TaskTrackingBoardWidget';
import { useModuleTheme } from '../utils/useModuleTheme';

export default function DashboardView({ 
  companyConfig, 
  inventory = [], 
  invoices = [], 
  transactions = [], 
  operatives = [], 
  tasks = [],
  setTasks = () => {},
  projects = [],
  setActiveTab = () => {},
  onQuickRestock = () => {},
  onOpenQuickAction = () => {},
  addAuditLog = () => {},
  isStaff = false,
  currentStaffAccount = null,
  rolePermissions = {}
}) {
  const { style: moduleThemeStyle } = useModuleTheme('dashboard', companyConfig.moduleThemes);
  const [timeRange, setTimeRange] = useState('month'); // 'week' | 'month' | 'quarter' | 'year'

  // Staff Visibility & Access Control Enforcement
  const canViewFinance = !isStaff || (currentStaffAccount?.allowedModules?.includes('finance') || currentStaffAccount?.allowedModules?.includes('invoicing'));
  const canViewProjects = !isStaff || currentStaffAccount?.allowedModules?.includes('projects');
  const canViewInventory = !isStaff || currentStaffAccount?.allowedModules?.includes('inventory');

  // Staff Task Scoping
  const [taskScope, setTaskScope] = useState(isStaff ? 'assigned' : 'all');
  const myAssignedTasks = isStaff && currentStaffAccount?.name 
    ? tasks.filter(t => 
        (t.assignee && t.assignee.toLowerCase().includes(currentStaffAccount.name.toLowerCase())) ||
        (currentStaffAccount.department && t.module && t.module.toLowerCase().includes(currentStaffAccount.department.toLowerCase()))
      )
    : tasks;

  const displayedTasks = (isStaff && taskScope === 'assigned') ? myAssignedTasks : tasks;

  // ==========================================
  // 1. TASK COMPLETION RATE CALCULATIONS
  // ==========================================
  const totalTasksCount = displayedTasks.length;
  const completedTasks = displayedTasks.filter(t => t.stage === 'done');
  const inProgressTasks = displayedTasks.filter(t => t.stage === 'in_progress');
  const todoTasks = displayedTasks.filter(t => t.stage === 'todo');
  const blockedTasks = displayedTasks.filter(t => t.stage === 'blocked');

  const taskCompletionRate = totalTasksCount > 0 
    ? Math.round((completedTasks.length / totalTasksCount) * 100) 
    : 0;

  // Radial chart circumference math
  const radialRadius = 45;
  const radialCircumference = 2 * Math.PI * radialRadius;
  const radialStrokeDashoffset = radialCircumference - (taskCompletionRate / 100) * radialCircumference;

  // ==========================================
  // 2. PAYMENT SUMMARIES CALCULATIONS
  // ==========================================
  const totalInvoiced = invoices.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const paidInvoices = invoices.filter(inv => inv.status === 'Paid');
  const totalPaymentsReceived = paidInvoices.reduce((acc, curr) => acc + (curr.total || 0), 0);

  const pendingInvoices = invoices.filter(inv => inv.status === 'Pending');
  const totalPendingPayments = pendingInvoices.reduce((acc, curr) => acc + (curr.total || 0), 0);

  const overdueInvoices = invoices.filter(inv => inv.status === 'Overdue');
  const totalOverduePayments = overdueInvoices.reduce((acc, curr) => acc + (curr.total || 0), 0);

  const totalTreasury = transactions.reduce((acc, curr) => {
    return curr.type === 'Income' ? acc + curr.amount : acc - curr.amount;
  }, 125000);

  // ==========================================
  // 3. PROJECT PROGRESS CALCULATIONS
  // ==========================================
  const activeProjects = projects && projects.length > 0 ? projects : [
    {
      id: "PRJ-STAD-01",
      name: "Wi-Fi 7 Beamforming Arena Array",
      category: "Infrastructure",
      lead: "Marcus Vance",
      leadAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      progress: 88,
      status: "On Track",
      budget: 185000,
      spent: 142000,
      dueDate: "2026-11-15",
      milestonesCompleted: 5,
      totalMilestones: 6
    },
    {
      id: "PRJ-STAD-02",
      name: "Biometric Turnstile Fast-Pass Gateway",
      category: "Access & Security",
      lead: "David Miller",
      leadAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      progress: 94,
      status: "On Track",
      budget: 95000,
      spent: 81200,
      dueDate: "2026-10-31",
      milestonesCompleted: 4,
      totalMilestones: 4
    },
    {
      id: "PRJ-STAD-03",
      name: "Ultra-HD 4K Ribbon Display Synchronizer",
      category: "Media & Broadcast",
      lead: "Sarah Chen",
      leadAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      progress: 62,
      status: "At Risk",
      budget: 120000,
      spent: 79000,
      dueDate: "2026-11-20",
      milestonesCompleted: 3,
      totalMilestones: 5
    },
    {
      id: "PRJ-STAD-04",
      name: "Cashless RFID Concessions Architecture",
      category: "Commercial & POS",
      lead: companyConfig.leader || "Alexander Vance",
      leadAvatar: companyConfig.logoUrl || "/stadium_logo.svg",
      progress: 45,
      status: "Delayed",
      budget: 140000,
      spent: 62000,
      dueDate: "2026-12-05",
      milestonesCompleted: 2,
      totalMilestones: 6
    }
  ];

  const overallProjectAvgProgress = Math.round(
    activeProjects.reduce((acc, p) => acc + p.progress, 0) / (activeProjects.length || 1)
  );

  const inventoryValuation = inventory.reduce((acc, curr) => acc + (curr.stock * curr.sellingPrice), 0);
  const lowStockItems = inventory.filter(item => item.stock <= item.reorderLevel);

  // Quick toggle task status from dashboard
  const handleToggleTaskStatus = (taskId) => {
    playSuccess();
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const nextStage = t.stage === 'done' ? 'in_progress' : 'done';
        const nextProg = nextStage === 'done' ? 100 : 50;
        addAuditLog({
          user: isStaff ? (currentStaffAccount?.name || 'Staff') : companyConfig.leader,
          action: 'DASHBOARD_TASK_TOGGLE',
          details: `Updated task '${t.title}' to ${nextStage.toUpperCase()}`
        });
        return { ...t, stage: nextStage, progress: nextProg };
      }
      return t;
    }));
  };

  return (
    <div className="page-container" id="dashboard-command-center" style={moduleThemeStyle}>
      {/* Professional Work Stadium Hero Banner */}
      <div className="hero-banner">
        <img 
          src={companyConfig.bannerUrl || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1600&auto=format&fit=crop&q=80'} 
          alt="Work Stadium Operations Sanctuary" 
          className="hero-bg-img"
        />
        <div className="hero-gradient-overlay"></div>
        <div className="hero-content">
          <div className="hero-text">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className="status-badge s_rank" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Zap size={11} /> 
                {isStaff 
                  ? `RESTRICTED STAFF CLEARANCE // ${currentStaffAccount?.department?.toUpperCase() || 'OPERATIONS'}` 
                  : 'EXECUTIVE STADIUM OPERATIONS // CENTRAL HUB'}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                VENUE: {companyConfig.name || 'WORK STADIUM ERP'}
              </span>
            </div>
            <h2>Welcome Back, {isStaff ? currentStaffAccount?.name : companyConfig.leader}</h2>
            <p>
              {isStaff 
                ? `Work Stadium operations telemetry is scoped strictly to your assigned duties in ${currentStaffAccount?.department || 'Operations'}. Access to non-authorized modules and high-level financial ledgers is restricted.`
                : 'High-velocity work stadium operations telemetry is synchronized. Real-time task completion tracking, commercial payment liquidity, and cross-departmental facility initiatives are active.'}
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
              {canViewFinance && (
                <button 
                  id="hero-quick-invoice-btn"
                  className="btn-primary"
                  onClick={() => {
                    playChime();
                    onOpenQuickAction('new-invoice');
                  }}
                >
                  <Plus size={15} />
                  <span>Issue Commercial Invoice</span>
                </button>
              )}
              {canViewProjects && (
                <button 
                  id="hero-view-missions-btn"
                  className={canViewFinance ? "btn-secondary" : "btn-primary"}
                  onClick={() => {
                    playChime();
                    setActiveTab('projects');
                  }}
                >
                  <CheckSquare size={15} />
                  <span>{isStaff ? 'My Assigned Initiatives' : 'Strategic Initiatives'} ({totalTasksCount})</span>
                </button>
              )}
              {(!isStaff || currentStaffAccount?.allowedModules?.includes('googleDrive')) && (
                <button 
                  id="hero-view-gdrive-btn"
                  className="btn-secondary"
                  onClick={() => {
                    playChime();
                    setActiveTab('googleDrive');
                  }}
                >
                  <HardDrive size={15} />
                  <span>Corporate Drive</span>
                </button>
              )}
            </div>
          </div>

          <div className="hero-avatar-box">
            <img 
              src={isStaff ? (currentStaffAccount?.avatar || '/stadium_logo.svg') : (companyConfig.logoUrl || '/stadium_logo.svg')} 
              alt="Leader Avatar" 
              style={{ objectFit: 'contain' }}
            />
            <div>
              <div className="hero-tagline">{isStaff ? 'Authorized Staff Member' : 'Chief Executive Director'}</div>
              <div className="hero-name">{isStaff ? currentStaffAccount?.name : companyConfig.leader}</div>
              <div className="hero-sub">{isStaff ? currentStaffAccount?.role : companyConfig.leaderTitle}</div>
            </div>
          </div>
        </div>
      </div>

      {/* DASHBOARD ANALYTICS HEADER & TIMEFRAME FILTER */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 14,
        marginTop: 6,
        marginBottom: 4
      }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={20} color="var(--accent-crimson)" />
            <span>Executive Analytics & Performance Telemetry</span>
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Live aggregated metrics for tasks, payment cashflow, and active project lifecycles
          </p>
        </div>

        {/* Timeframe Filter Buttons */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-input)',
          padding: 4,
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}>
          {[
            { id: 'week', label: '7 Days' },
            { id: 'month', label: 'This Month' },
            { id: 'quarter', label: 'Quarter' },
            { id: 'year', label: 'YTD' },
          ].map(tf => (
            <button
              key={tf.id}
              onClick={() => { playChime(); setTimeRange(tf.id); }}
              style={{
                background: timeRange === tf.id ? 'var(--accent-crimson)' : 'transparent',
                color: timeRange === tf.id ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================================
          CORE SPECIFICATION FLAGSHIP 1: TASK COMPLETION RATES
          ========================================================================= */}
      <div className="dashboard-flagship-1-grid">
        {/* Radial Task Completion Gauge */}
        <div className="glass-panel" id="task-completion-rate-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div className="panel-header">
            <div className="panel-title">
              <CheckSquare size={18} color="var(--accent-emerald)" />
              <span>Task Completion Rate</span>
            </div>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)' }}>
              LIVE TELEMETRY
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 0' }}>
            <div style={{ position: 'relative', width: 140, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="140" height="140" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                {/* Background Track */}
                <circle
                  cx="60"
                  cy="60"
                  r={radialRadius}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="10"
                  fill="transparent"
                />
                {/* Animated Radial Fill */}
                <circle
                  cx="60"
                  cy="60"
                  r={radialRadius}
                  stroke="var(--accent-emerald)"
                  strokeWidth="10"
                  strokeDasharray={radialCircumference}
                  strokeDashoffset={radialStrokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  style={{
                    transition: 'stroke-dashoffset 0.8s ease-in-out',
                    filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.4))'
                  }}
                />
              </svg>
              {/* Center percentage readout */}
              <div style={{ position: 'absolute', textAlign: 'center' }}>
                <span style={{ fontSize: '26px', fontWeight: 900, fontFamily: 'var(--font-display)', color: '#ffffff' }}>
                  {taskCompletionRate}%
                </span>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Accomplished
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown Pills */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
            <div style={{ background: 'var(--bg-input)', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>COMPLETED</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                {completedTasks.length} <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>/ {totalTasksCount}</span>
              </div>
            </div>
            <div style={{ background: 'var(--bg-input)', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>IN DEPLOYMENT</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent-crimson)' }}>
                {inProgressTasks.length}
              </div>
            </div>
            <div style={{ background: 'var(--bg-input)', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>TACTICAL TO-DO</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#94a3b8' }}>
                {todoTasks.length}
              </div>
            </div>
            <div style={{ background: 'var(--bg-input)', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>IMPEDED / BLOCKED</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#ef4444' }}>
                {blockedTasks.length}
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Quick Task Board Snippet */}
        <div className="glass-panel" id="task-quick-list-panel">
          <div className="panel-header">
            <div className="panel-title">
              <CheckCircle2 size={18} color="var(--accent-purple)" />
              <span>{isStaff && taskScope === 'assigned' ? 'My Assigned Operational Tasks' : 'Priority Operational Directives'}</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isStaff && (
                <div style={{ display: 'flex', background: 'var(--bg-input)', padding: 2, borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                  <button
                    onClick={() => setTaskScope('assigned')}
                    style={{
                      border: 'none',
                      background: taskScope === 'assigned' ? 'var(--accent-purple)' : 'transparent',
                      color: '#ffffff',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                  >
                    My Tasks ({myAssignedTasks.length})
                  </button>
                  <button
                    onClick={() => setTaskScope('all')}
                    style={{
                      border: 'none',
                      background: taskScope === 'all' ? 'var(--accent-purple)' : 'transparent',
                      color: '#ffffff',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                  >
                    All Tasks ({tasks.length})
                  </button>
                </div>
              )}
              {canViewProjects && (
                <button 
                  className="btn-outline-danger" 
                  style={{ fontSize: '11px' }}
                  onClick={() => { playChime(); setActiveTab('projects'); }}
                >
                  Full Kanban <ArrowUpRight size={13} />
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '280px', overflowY: 'auto' }}>
            {displayedTasks.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No active tasks assigned in this scope.
              </div>
            ) : displayedTasks.map(task => {
              const isDone = task.stage === 'done';
              return (
                <div 
                  key={task.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: isDone ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${isDone ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)'}`,
                    borderRadius: '8px',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                      onClick={() => handleToggleTaskStatus(task.id)}
                      style={{
                        background: isDone ? 'var(--accent-emerald)' : 'transparent',
                        border: `2px solid ${isDone ? 'var(--accent-emerald)' : 'var(--text-muted)'}`,
                        width: 20,
                        height: 20,
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#ffffff'
                      }}
                      title={isDone ? 'Mark as In Progress' : 'Mark as Complete'}
                    >
                      {isDone && <CheckCircle2 size={13} />}
                    </button>
                    <div>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: isDone ? 'var(--text-muted)' : '#ffffff',
                        textDecoration: isDone ? 'line-through' : 'none'
                      }}>
                        {task.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: 8, marginTop: 2 }}>
                        <span>{task.module}</span>
                        <span>•</span>
                        <span>Assigned: {task.assignee}</span>
                        <span>•</span>
                        <span style={{ color: task.stage === 'blocked' ? '#ef4444' : 'inherit' }}>
                          Due: {task.dueDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className={`status-badge ${task.stage === 'done' ? 's_rank' : task.stage === 'blocked' ? 'b_rank' : 'a_rank'}`} style={{ fontSize: '10px' }}>
                    {task.stage.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================================================
          CORE SPECIFICATION FLAGSHIP 2: PAYMENT SUMMARIES OR STAFF OPERATIONAL SCOPE
          ========================================================================= */}
      {canViewFinance ? (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <DollarSign size={18} color="var(--accent-amber)" />
              <span>Payment Summaries & Commercial Liquidity</span>
            </h4>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              CURRENCY: {companyConfig.currency || '$'}
            </span>
          </div>

          {/* 4 Financial Payment KPI Cards */}
          <div className="kpi-grid">
            {/* Card 1: Total Invoiced */}
            <div className="kpi-card" id="kpi-total-invoiced-card">
              <div className="kpi-header">
                <span className="kpi-title">Total Invoiced Amount</span>
                <div className="kpi-icon-wrap" style={{ color: 'var(--accent-crimson)' }}>
                  <Receipt size={18} />
                </div>
              </div>
              <div className="kpi-value">
                {companyConfig.currency}{totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="kpi-footer">
                <span className="trend-pill trend-up">{invoices.length} Invoices</span>
                <span>issued this fiscal period</span>
              </div>
            </div>

            {/* Card 2: Payments Collected */}
            <div className="kpi-card" id="kpi-payments-received-card">
              <div className="kpi-header">
                <span className="kpi-title">Payments Collected</span>
                <div className="kpi-icon-wrap" style={{ color: 'var(--accent-emerald)' }}>
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className="kpi-value" style={{ color: 'var(--accent-emerald)' }}>
                {companyConfig.currency}{totalPaymentsReceived.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="kpi-footer">
                <span className="trend-pill trend-up">{paidInvoices.length} Settled</span>
                <span>100% liquidity secured</span>
              </div>
            </div>

            {/* Card 3: Pending Invoices */}
            <div className="kpi-card" id="kpi-pending-payments-card">
              <div className="kpi-header">
                <span className="kpi-title">Pending Receivables</span>
                <div className="kpi-icon-wrap" style={{ color: 'var(--accent-amber)' }}>
                  <Clock size={18} />
                </div>
              </div>
              <div className="kpi-value" style={{ color: 'var(--accent-amber)' }}>
                {companyConfig.currency}{totalPendingPayments.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="kpi-footer">
                <span className="trend-pill trend-down">{pendingInvoices.length} Pending</span>
                <span>awaiting client settlement</span>
              </div>
            </div>

            {/* Card 4: Treasury Capital Reserves */}
            <div className="kpi-card" id="kpi-treasury-balance-card">
              <div className="kpi-header">
                <span className="kpi-title">Treasury Cash Reserves</span>
                <div className="kpi-icon-wrap" style={{ color: 'var(--accent-purple)' }}>
                  <DollarSign size={18} />
                </div>
              </div>
              <div className="kpi-value">
                {companyConfig.currency}{totalTreasury.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="kpi-footer">
                <span className="trend-pill trend-up">+14.2%</span>
                <span>net operating margin</span>
              </div>
            </div>
          </div>

          {/* Visual Payment Stream SVG Trajectory & Hardware Distribution */}
          <div className="dashboard-flagship-2-grid">
            {/* SVG Cashflow Trajectory Chart */}
            <div className="glass-panel" id="payment-trend-chart-panel">
              <div className="panel-header">
                <div className="panel-title">
                  <TrendingUp size={18} color="var(--accent-crimson)" />
                  <span>Monthly Inflow & Payment Settlement Velocity</span>
                </div>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  FY 2026 // LIVE AUDIT
                </span>
              </div>

              <div style={{ height: '210px', width: '100%', position: 'relative' }}>
                <svg viewBox="0 0 600 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="paymentGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="pendingGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  <line x1="0" y1="40" x2="600" y2="40" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                  <line x1="0" y1="90" x2="600" y2="90" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                  <line x1="0" y1="140" x2="600" y2="140" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                  <line x1="0" y1="190" x2="600" y2="190" stroke="rgba(255,255,255,0.1)" />

                  <path
                    d="M 20 160 Q 120 130 200 110 T 360 70 T 480 45 T 580 30 L 580 190 L 20 190 Z"
                    fill="url(#paymentGradient)"
                  />
                  <path
                    d="M 20 160 Q 120 130 200 110 T 360 70 T 480 45 T 580 30"
                    fill="none"
                    stroke="var(--accent-emerald)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  <path
                    d="M 20 175 Q 120 155 200 140 T 360 120 T 480 100 T 580 85 L 580 190 L 20 190 Z"
                    fill="url(#pendingGradient)"
                  />
                  <path
                    d="M 20 175 Q 120 155 200 140 T 360 120 T 480 100 T 580 85"
                    fill="none"
                    stroke="var(--accent-amber)"
                    strokeWidth="2.5"
                    strokeDasharray="5 3"
                  />

                  {[
                    { x: 20, y: 160, label: 'May' },
                    { x: 130, y: 125, label: 'Jun' },
                    { x: 240, y: 95, label: 'Jul' },
                    { x: 350, y: 72, label: 'Aug' },
                    { x: 460, y: 50, label: 'Sep' },
                    { x: 580, y: 30, label: 'Oct' }
                  ].map((pt, idx) => (
                    <g key={idx}>
                      <circle cx={pt.x} cy={pt.y} r="5" fill="var(--accent-emerald)" stroke="#ffffff" strokeWidth="2" />
                      <text x={pt.x} y="208" textAnchor="middle" fill="var(--text-muted)" fontSize="10" fontFamily="var(--font-mono)">
                        {pt.label}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 14, fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 12, height: 4, background: 'var(--accent-emerald)', borderRadius: 2 }}></span>
                  <span style={{ color: 'var(--text-secondary)' }}>Collected Payments ($98.2k Peak)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 12, height: 4, background: 'var(--accent-amber)', borderRadius: 2 }}></span>
                  <span style={{ color: 'var(--text-secondary)' }}>Pending Invoices Pipeline ($31.1k)</span>
                </div>
              </div>
            </div>

            {/* Stadium Infrastructure Hardware Valuation */}
            <div className="glass-panel" id="armory-distribution-panel">
              <div className="panel-header">
                <div className="panel-title">
                  <Package size={18} color="var(--accent-purple)" />
                  <span>Stadium Assets & Hardware Valuation</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>TOTAL ASSET VALUATION</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff' }}>
                    {companyConfig.currency}{inventoryValuation.toLocaleString('en-US')}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: 2 }}>
                    {inventory.length} Verified Stadium Hardware Units
                  </div>
                </div>

                {lowStockItems.length > 0 && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    padding: '10px 12px',
                    borderRadius: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ef4444', fontSize: '12px', fontWeight: 700 }}>
                      <AlertTriangle size={14} />
                      <span>{lowStockItems.length} Low-Stock Replacement Alert</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: 4 }}>
                      {lowStockItems[0]?.name} (Only {lowStockItems[0]?.stock} units remaining)
                    </div>
                    <button
                      className="btn-secondary"
                      style={{ fontSize: '11px', padding: '4px 8px', marginTop: 8 }}
                      onClick={() => onQuickRestock(lowStockItems[0]?.id, 20)}
                    >
                      Restock +20
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Dedicated Staff Operational Workspace: Enforcing Access Restriction */
        <div style={{ marginTop: 20 }}>
          <div className="glass-panel" style={{ padding: '22px', border: '1px solid rgba(56, 189, 248, 0.3)', background: 'linear-gradient(180deg, rgba(14, 23, 42, 0.7) 0%, rgba(15, 23, 42, 0.5) 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
                  <Shield size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '15.5px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    Operational Department Workspace: {currentStaffAccount?.department || 'Operations'}
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                    Staff Access Policy: Financial ledgers and treasury accounts are restricted. Only authorized tools and assigned directives are displayed.
                  </p>
                </div>
              </div>
              <span className="status-badge s_rank" style={{ fontSize: '10.5px', padding: '3px 9px' }}>
                RBAC POLICY RESTRICTED
              </span>
            </div>

            {/* 4 Dedicated Staff Operational KPI Cards */}
            <div className="kpi-grid">
              <div className="kpi-card" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                <div className="kpi-header">
                  <span className="kpi-title">Assigned Directives</span>
                  <div className="kpi-icon-wrap" style={{ color: 'var(--accent-cyan)' }}>
                    <CheckSquare size={18} />
                  </div>
                </div>
                <div className="kpi-value" style={{ color: 'var(--accent-cyan)' }}>{myAssignedTasks.length}</div>
                <div className="kpi-footer">
                  <span className="trend-pill trend-up">Active</span>
                  <span>Directly assigned to {currentStaffAccount?.name}</span>
                </div>
              </div>

              <div className="kpi-card" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                <div className="kpi-header">
                  <span className="kpi-title">In-Progress Tasks</span>
                  <div className="kpi-icon-wrap" style={{ color: 'var(--accent-emerald)' }}>
                    <Activity size={18} />
                  </div>
                </div>
                <div className="kpi-value" style={{ color: 'var(--accent-emerald)' }}>
                  {myAssignedTasks.filter(t => t.stage === 'in_progress').length}
                </div>
                <div className="kpi-footer">
                  <span className="trend-pill trend-up">Underway</span>
                  <span>Execution within assigned sprint</span>
                </div>
              </div>

              <div className="kpi-card" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                <div className="kpi-header">
                  <span className="kpi-title">Authorized Tools</span>
                  <div className="kpi-icon-wrap" style={{ color: 'var(--accent-purple)' }}>
                    <Layers size={18} />
                  </div>
                </div>
                <div className="kpi-value">{currentStaffAccount?.allowedModules?.length || 0} Modules</div>
                <div className="kpi-footer">
                  <span>Accessible navigation features</span>
                </div>
              </div>

              <div className="kpi-card" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                <div className="kpi-header">
                  <span className="kpi-title">Facility Readiness</span>
                  <div className="kpi-icon-wrap" style={{ color: 'var(--accent-emerald)' }}>
                    <Zap size={18} />
                  </div>
                </div>
                <div className="kpi-value" style={{ color: 'var(--accent-emerald)' }}>99.8%</div>
                <div className="kpi-footer">
                  <span>Stadium infrastructure operational</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CORE SPECIFICATION FLAGSHIP 3: PROJECT PROGRESS AT A GLANCE
          ========================================================================= */}
      <div className="glass-panel" id="project-progress-at-a-glance" style={{ marginTop: 20 }}>
        <div className="panel-header">
          <div>
            <div className="panel-title">
              <Briefcase size={18} color="var(--accent-cyan)" />
              <span>Project Progress At A Glance</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 2 }}>
              Average Enterprise Velocity: <strong style={{ color: 'var(--accent-cyan)' }}>{overallProjectAvgProgress}%</strong> across {activeProjects.length} active initiatives
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              className="btn-primary" 
              style={{ fontSize: '11px', padding: '6px 12px' }}
              onClick={() => { playChime(); setActiveTab('projects'); }}
            >
              <Plus size={13} />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* Project Progress Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
          marginTop: 8
        }}>
          {activeProjects.map(prj => {
            const statusColor = prj.status === 'Completed' ? 'var(--accent-emerald)'
              : prj.status === 'On Track' ? 'var(--accent-cyan)'
              : prj.status === 'At Risk' ? 'var(--accent-amber)'
              : '#ef4444';

            return (
              <div 
                key={prj.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 14,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 42, 95, 0.35)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {prj.id}
                    </span>
                    <span 
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: `${statusColor}22`,
                        color: statusColor,
                        border: `1px solid ${statusColor}44`
                      }}
                    >
                      {prj.status}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '14.5px', fontWeight: 800, color: '#ffffff', lineHeight: 1.3 }}>
                    {prj.name}
                  </h4>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: 2 }}>
                    {prj.category}
                  </div>
                </div>

                {/* Progress Bar & Milestone Info */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Milestones: <strong>{prj.milestonesCompleted} / {prj.totalMilestones}</strong>
                    </span>
                    <span style={{ fontWeight: 800, color: statusColor, fontFamily: 'var(--font-mono)' }}>
                      {prj.progress}%
                    </span>
                  </div>

                  <div style={{
                    width: '100%',
                    height: 8,
                    background: 'var(--bg-input)',
                    borderRadius: 999,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${prj.progress}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${statusColor}, #a855f7)`,
                      borderRadius: 999,
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                </div>

                {/* Footer: Budget Spent & Lead */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: 10,
                  fontSize: '11.5px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <img 
                      src={prj.leadAvatar || '/anime/obito_avatar.jpg'} 
                      alt={prj.lead} 
                      style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{prj.lead.split(' ')[0]}</span>
                  </div>

                  <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Spent: <span style={{ color: '#ffffff', fontWeight: 700 }}>{companyConfig.currency}{(prj.spent / 1000).toFixed(1)}k</span> / {(prj.budget / 1000).toFixed(0)}k
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Table: Invoices (if finance authorized) or Operational Tasks Stream (if staff) */}
      {canViewFinance ? (
        <div className="glass-panel" id="recent-invoices-panel" style={{ marginTop: 20 }}>
          <div className="panel-header">
            <div className="panel-title">
              <Receipt size={18} color="var(--accent-crimson)" />
              <span>Recent High-Priority Invoices & Client Billings</span>
            </div>
            <button 
              className="btn-outline-danger" 
              style={{ fontSize: '11px' }}
              onClick={() => { playChime(); setActiveTab('invoicing'); }}
            >
              All Invoices <ArrowUpRight size={13} />
            </button>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Client / Entity</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.slice(0, 4).map(inv => (
                  <tr key={inv.id}>
                    <td data-label="Invoice #">
                      <span className="table-id-pill">{inv.id}</span>
                    </td>
                    <td data-label="Client / Entity" style={{ fontWeight: 600 }}>{inv.client}</td>
                    <td data-label="Issue Date" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{inv.issueDate}</td>
                    <td data-label="Due Date" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{inv.dueDate}</td>
                    <td data-label="Total Amount" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff' }}>
                      {companyConfig.currency}{inv.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td data-label="Status">
                      <span className={`status-badge ${inv.status.toLowerCase()}`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-panel" id="assigned-directives-panel" style={{ marginTop: 20 }}>
          <div className="panel-header">
            <div className="panel-title">
              <CheckSquare size={18} color="var(--accent-cyan)" />
              <span>Assigned Departmental Directives & Maintenance Roadmap</span>
            </div>
            {canViewProjects && (
              <button 
                className="btn-outline-danger" 
                style={{ fontSize: '11px' }}
                onClick={() => { playChime(); setActiveTab('projects'); }}
              >
                Go to Projects <ArrowUpRight size={13} />
              </button>
            )}
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task ID</th>
                  <th>Operational Directive</th>
                  <th>Department / Zone</th>
                  <th>Target SLA Due</th>
                  <th>Priority</th>
                  <th>Stage</th>
                </tr>
              </thead>
              <tbody>
                {myAssignedTasks.slice(0, 5).map(task => (
                  <tr key={task.id}>
                    <td data-label="Task ID">
                      <span className="table-id-pill">{task.id}</span>
                    </td>
                    <td data-label="Operational Directive" style={{ fontWeight: 600 }}>{task.title}</td>
                    <td data-label="Department / Zone">{task.module}</td>
                    <td data-label="Target SLA Due" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{task.dueDate}</td>
                    <td data-label="Priority">
                      <span className={`status-badge ${task.priority === 'Critical' ? 's_rank' : 'a_rank'}`} style={{ fontSize: '10px' }}>
                        {task.priority || 'Standard'}
                      </span>
                    </td>
                    <td data-label="Stage">
                      <span className={`status-badge ${task.stage === 'done' ? 's_rank' : task.stage === 'blocked' ? 'b_rank' : 'a_rank'}`} style={{ fontSize: '10px' }}>
                        {task.stage.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
