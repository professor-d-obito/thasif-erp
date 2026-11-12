import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Package, 
  HardDrive, 
  Menu,
  BellRing
} from 'lucide-react';
import { playChime } from '../utils/audio';

export default function MobileBottomTabBar({ 
  activeTab, 
  setActiveTab = () => {}, 
  onOpenMenu = () => {},
  inventoryCount = 0,
  activeTasksCount = 0,
  isStaff = false,
  currentStaffAccount = null
}) {
  const handleTabClick = (tabKey) => {
    playChime();
    setActiveTab(tabKey);
  };

  // Check if current active tab is one of the primary mobile tabs
  const isDashboard = activeTab === 'dashboard';
  const isProjects = activeTab === 'projects';
  const isInventory = activeTab === 'inventory';
  const isDriveOrNotes = activeTab === 'googleDrive' || activeTab === 'notesReminders';
  const isOtherTab = !isDashboard && !isProjects && !isInventory && !isDriveOrNotes;

  // Determine which cloud/productivity tool to show based on permissions
  const showDrive = !isStaff || currentStaffAccount?.allowedModules?.includes('googleDrive');

  return (
    <nav className="mobile-bottom-tab-bar" aria-label="Mobile Navigation Bar" id="mobile-bottom-nav">
      {/* 1. Dashboard Tab */}
      <button 
        id="mobile-nav-dashboard-btn"
        className={`mobile-tab-btn ${isDashboard ? 'active' : ''}`}
        onClick={() => handleTabClick('dashboard')}
        aria-label="Dashboard"
      >
        <div className="mobile-tab-icon-wrap">
          <LayoutDashboard size={20} />
        </div>
        <span className="mobile-tab-label">Dashboard</span>
      </button>

      {/* 2. Strategic Initiatives / Projects Tab */}
      <button 
        id="mobile-nav-projects-btn"
        className={`mobile-tab-btn ${isProjects ? 'active' : ''}`}
        onClick={() => handleTabClick('projects')}
        aria-label="Projects"
      >
        <div className="mobile-tab-icon-wrap">
          <CheckSquare size={20} />
          {activeTasksCount > 0 && (
            <span className="mobile-tab-badge">{activeTasksCount}</span>
          )}
        </div>
        <span className="mobile-tab-label">Projects</span>
      </button>

      {/* 3. Stadium Infrastructure / Inventory Tab */}
      <button 
        id="mobile-nav-inventory-btn"
        className={`mobile-tab-btn ${isInventory ? 'active' : ''}`}
        onClick={() => handleTabClick('inventory')}
        aria-label="Inventory"
      >
        <div className="mobile-tab-icon-wrap">
          <Package size={20} />
          {inventoryCount > 0 && (
            <span className="mobile-tab-badge">{inventoryCount}</span>
          )}
        </div>
        <span className="mobile-tab-label">Stadium Stock</span>
      </button>

      {/* 4. Corporate Drive / Notes Tab */}
      <button 
        id="mobile-nav-drive-btn"
        className={`mobile-tab-btn ${isDriveOrNotes ? 'active' : ''}`}
        onClick={() => handleTabClick(showDrive ? 'googleDrive' : 'notesReminders')}
        aria-label={showDrive ? 'Corporate Drive' : 'Operational Notes'}
      >
        <div className="mobile-tab-icon-wrap">
          {showDrive ? <HardDrive size={20} /> : <BellRing size={20} />}
        </div>
        <span className="mobile-tab-label">{showDrive ? 'Drive' : 'Notes'}</span>
      </button>

      {/* 5. More / Full Menu Drawer Opener */}
      <button 
        id="mobile-nav-more-menu-btn"
        className={`mobile-tab-btn ${isOtherTab ? 'active' : ''}`}
        onClick={() => {
          playChime();
          onOpenMenu();
        }}
        aria-label="Open Navigation Drawer"
      >
        <div className="mobile-tab-icon-wrap">
          <Menu size={20} />
        </div>
        <span className="mobile-tab-label">More</span>
      </button>
    </nav>
  );
}
