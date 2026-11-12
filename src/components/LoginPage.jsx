import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  RotateCcw, 
  KeyRound, 
  Briefcase, 
  Crown, 
  Users, 
  CheckCircle, 
  Shield, 
  Layers, 
  ArrowRightCircle 
} from 'lucide-react';
import { playChime, playSuccess, playKamuiWarp } from '../utils/audio';
import { verifyPassword, checkLoginRateLimit, recordFailedLogin, recordSuccessfulLogin } from '../utils/security';

export default function LoginPage({ 
  onLoginSuccess, 
  onReplayLoading, 
  companyConfig = {},
  staffAccounts = []
}) {
  const [loginMode, setLoginMode] = useState('admin'); // 'admin' | 'staff'
  
  // Super Admin form state
  const [adminUsername, setAdminUsername] = useState(companyConfig.leader || 'Alexander Vance');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Team Login form state
  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showStaffPassword, setShowStaffPassword] = useState(false);

  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleModeSwitch = (mode) => {
    playChime();
    setLoginMode(mode);
    setErrorMsg('');
  };

  const handleAdminLogin = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    // Rate limiting check
    const rateCheck = checkLoginRateLimit('admin');
    if (!rateCheck.allowed) {
      setErrorMsg(rateCheck.message);
      return;
    }

    if (!adminUsername.trim()) {
      setErrorMsg('Please enter your Super Admin username.');
      return;
    }
    if (!adminPassword.trim()) {
      setErrorMsg('Please enter your Super Admin master password.');
      return;
    }

    const defaultAdminHash = "ff77a877d6b2ba5fa8c684cd96fbf74424b4895976c5de0e8a0a9bacf8fc0af4";
    const targetHash = companyConfig.adminPasswordHash || defaultAdminHash;
    
    // Check either hash verification or legacy plaintext if not yet migrated
    let isPasswordCorrect = false;
    if (companyConfig.adminPassword) {
      isPasswordCorrect = (adminPassword === companyConfig.adminPassword);
    } else {
      isPasswordCorrect = await verifyPassword(adminPassword, targetHash);
    }

    if (!isPasswordCorrect) {
      const failResult = recordFailedLogin('admin');
      if (failResult.locked) {
        setErrorMsg(`Too many failed attempts. Super Admin access locked for ${failResult.remainingSeconds}s.`);
      } else {
        setErrorMsg(`Invalid credentials. ${failResult.remainingAttempts} attempt(s) remaining.`);
      }
      return;
    }

    // Success
    recordSuccessfulLogin('admin');
    setIsAuthenticating(true);
    playSuccess();

    setTimeout(() => {
      playKamuiWarp();
      onLoginSuccess({
        username: adminUsername,
        role: companyConfig.currentRole || 'Alexander Vance (Chief Executive Director)',
        isStaff: false,
        account: null
      });
    }, 450);
  };

  const handleStaffLogin = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    // Rate limiting check
    const rateCheck = checkLoginRateLimit('staff');
    if (!rateCheck.allowed) {
      setErrorMsg(rateCheck.message);
      return;
    }

    if (!staffUsername.trim()) {
      setErrorMsg('Please enter your Team Member username or work email.');
      return;
    }
    if (!staffPassword.trim()) {
      setErrorMsg('Please enter your Team Member password.');
      return;
    }

    const userQuery = staffUsername.trim().toLowerCase();
    const matchedStaff = staffAccounts.find(s => 
      s.username.toLowerCase() === userQuery || 
      s.email.toLowerCase() === userQuery
    );

    // Uniform authentication validation to prevent User Enumeration (CWE-204)
    let isStaffValid = false;
    if (matchedStaff && matchedStaff.status === 'Active') {
      if (matchedStaff.passwordHash) {
        isStaffValid = await verifyPassword(staffPassword, matchedStaff.passwordHash);
      } else if (matchedStaff.password) {
        isStaffValid = (matchedStaff.password === staffPassword);
      }
    }

    if (!isStaffValid) {
      const failResult = recordFailedLogin('staff');
      if (failResult.locked) {
        setErrorMsg(`Too many failed attempts. Team login portal locked for ${failResult.remainingSeconds}s.`);
      } else {
        setErrorMsg(`Invalid team member credentials. ${failResult.remainingAttempts} attempt(s) remaining.`);
      }
      return;
    }

    // Success
    recordSuccessfulLogin('staff');
    setIsAuthenticating(true);
    playSuccess();

    setTimeout(() => {
      playKamuiWarp();
      onLoginSuccess({
        username: matchedStaff.name,
        role: matchedStaff.role,
        isStaff: true,
        account: matchedStaff
      });
    }, 450);
  };

  // Secure Quick Select: Only sets username and prompts for password (NO auto-login bypass)
  const handleSelectStaffAccount = (staff) => {
    playChime();
    setStaffUsername(staff.username);
    setStaffPassword('');
    setErrorMsg('');
    const inputEl = document.getElementById('staff-password-input');
    if (inputEl) inputEl.focus();
  };

  return (
    <div className="login-page-container" id="kamui-login-page">
      {/* Background Ambience with Hero Wallpaper */}
      <div className="login-bg-media">
        <img 
          src={companyConfig.loginBgUrl || companyConfig.bannerUrl || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1600&auto=format&fit=crop&q=80'} 
          alt="Login Background" 
          className="login-bg-img"
        />
        <div className="login-bg-overlay"></div>
      </div>

      {/* Top Bar */}
      <div className="login-top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            overflow: 'hidden',
            border: '2px solid var(--accent-crimson)',
            boxShadow: '0 0 12px var(--accent-crimson)',
            background: 'var(--bg-card)'
          }}>
            <img 
              src={companyConfig.logoUrl || '/stadium_logo.svg'} 
              alt="Logo"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '15px', color: '#ffffff', letterSpacing: '0.5px' }}>
              {companyConfig.name || 'WORK STADIUM ERP'}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--accent-crimson-light)', fontFamily: 'var(--font-mono)' }}>
              ROLE-BASED ACCESS CONTROL (RBAC) PORTAL
            </span>
          </div>
        </div>

        <button 
          id="replay-loading-screen-btn"
          className="btn-secondary"
          onClick={() => { playChime(); onReplayLoading(); }}
          style={{ fontSize: '12px', padding: '7px 14px', borderRadius: 'var(--radius-full)' }}
          title="Replay the Customizable Splash/Loading Screen"
        >
          <RotateCcw size={14} />
          <span>Replay Loading Splash</span>
        </button>
      </div>

      {/* Centerpiece Login Glass Card */}
      <div className="login-card-wrapper">
        <div className="login-glass-card">
          {/* Card Header */}
          <div className="login-card-header">
            <div className="login-avatar-seal-box">
              <img 
                src={companyConfig.loginAvatarUrl || companyConfig.logoUrl || '/stadium_logo.svg'} 
                alt="Avatar Seal"
                className="login-avatar-seal"
                style={{ objectFit: 'contain' }}
              />
              <div className="login-onepiece-badge" style={{ background: loginMode === 'admin' ? 'var(--accent-crimson)' : 'var(--accent-purple)' }}>
                {loginMode === 'admin' ? <Crown size={20} color="#ffffff" /> : <Users size={20} color="#ffffff" />}
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span className={`status-badge ${loginMode === 'admin' ? 's_rank' : 'a_rank'}`} style={{ fontSize: '11px', padding: '3px 10px' }}>
                  {loginMode === 'admin' ? (
                    <>
                      <Crown size={12} /> SUPER ADMIN // TOTAL SYSTEM CONTROL
                    </>
                  ) : (
                    <>
                      <Users size={12} /> TEAM LOGIN // STAFF OPERATIONAL ACCESS
                    </>
                  )}
                </span>
              </div>
              <h2 className="login-title" style={{ fontSize: '22px', fontWeight: 800, textTransform: 'uppercase' }}>
                {loginMode === 'admin' ? 'Super Admin Gateway' : 'Team Member Login'}
              </h2>
              <p className="login-desc" style={{ fontSize: '12.5px', maxWidth: 440, margin: '6px auto 0 auto', color: 'var(--text-secondary)' }}>
                {loginMode === 'admin' 
                  ? 'Access total system customization, live system renaming, loading screen studio, RBAC permission matrix, and custom module building.'
                  : 'Log in to view your assigned operational workspaces, tactical tasks, notes, and client Google Drive files as configured by the Super Admin.'}
              </p>
            </div>
          </div>

          {/* TWO DISTINCT INTERFACES SELECTOR */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            background: 'var(--bg-input)',
            padding: 6,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            marginBottom: 18
          }}>
            <button
              id="admin-login-tab-btn"
              type="button"
              className={`login-role-btn ${loginMode === 'admin' ? 'active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '11px 10px',
                borderRadius: '8px',
                background: loginMode === 'admin' ? 'linear-gradient(135deg, rgba(255, 42, 95, 0.2) 0%, rgba(204, 24, 69, 0.4) 100%)' : 'transparent',
                borderColor: loginMode === 'admin' ? 'var(--accent-crimson)' : 'transparent'
              }}
              onClick={() => handleModeSwitch('admin')}
            >
              <Crown size={16} color={loginMode === 'admin' ? 'var(--accent-crimson)' : 'var(--text-muted)'} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 800, fontSize: '13px', color: loginMode === 'admin' ? '#ffffff' : 'var(--text-secondary)' }}>Super Admin</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Full System Customization</div>
              </div>
            </button>

            <button
              id="staff-login-tab-btn"
              type="button"
              className={`login-role-btn ${loginMode === 'staff' ? 'active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '11px 10px',
                borderRadius: '8px',
                background: loginMode === 'staff' ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(109, 40, 217, 0.4) 100%)' : 'transparent',
                borderColor: loginMode === 'staff' ? 'var(--accent-purple)' : 'transparent'
              }}
              onClick={() => handleModeSwitch('staff')}
            >
              <Users size={16} color={loginMode === 'staff' ? 'var(--accent-purple)' : 'var(--text-muted)'} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 800, fontSize: '13px', color: loginMode === 'staff' ? '#ffffff' : 'var(--text-secondary)' }}>Team Login</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Staff Restricted Access</div>
              </div>
            </button>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="login-error-banner" id="login-error-message" style={{ marginBottom: 16 }}>
              {errorMsg}
            </div>
          )}

          {/* =========================================================================
              INTERFACE 1: SUPER ADMIN LOGIN (TOTAL SYSTEM CUSTOMIZATION)
              ========================================================================= */}
          {loginMode === 'admin' ? (
            <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#e2e8f0' }}>Super Admin Username</label>
                <div className="input-with-icon">
                  <User size={16} className="input-icon" />
                  <input 
                    id="admin-username-input"
                    type="text" 
                    required
                    className="form-control"
                    style={{ paddingLeft: '38px' }}
                    placeholder="Enter Super Admin Username"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#e2e8f0' }}>Master Admin Password</label>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    🔒 Enterprise Encrypted
                  </span>
                </div>
                <div className="input-with-icon">
                  <KeyRound size={16} className="input-icon" />
                  <input 
                    id="admin-password-input"
                    type={showAdminPassword ? "text" : "password"} 
                    required
                    className="form-control"
                    style={{ paddingLeft: '38px', paddingRight: '38px' }}
                    placeholder="Enter Master Password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    title={showAdminPassword ? "Hide password" : "Show password"}
                  >
                    {showAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Remember Admin Session
                </label>
                <span style={{ color: 'var(--accent-crimson)', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  Tier 5: Total Customization
                </span>
              </div>

              <button 
                id="admin-login-submit-btn"
                type="submit" 
                className="btn-primary"
                disabled={isAuthenticating}
                style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '14px', marginTop: 4 }}
              >
                {isAuthenticating ? (
                  <>
                    <span className="brand-pulse-dot"></span>
                    <span>Unlocking Total System Customization...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>Log In as Super Admin</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

            </form>
          ) : (
            /* =========================================================================
                INTERFACE 2: TEAM LOGIN (STAFF WITH RBAC CLEARANCES)
                ========================================================================= */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <form onSubmit={handleStaffLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#e2e8f0' }}>Team Member Username or Work Email</label>
                  <div className="input-with-icon">
                    <Briefcase size={16} className="input-icon" />
                    <input 
                      id="staff-username-input"
                      type="text" 
                      required
                      className="form-control"
                      style={{ paddingLeft: '38px' }}
                      placeholder="e.g. david, sarah, or marcus"
                      value={staffUsername}
                      onChange={(e) => setStaffUsername(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#e2e8f0' }}>Assigned Staff Password</label>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      🔒 Authorized Staff Clearance
                    </span>
                  </div>
                  <div className="input-with-icon">
                    <KeyRound size={16} className="input-icon" />
                    <input 
                      id="staff-password-input"
                      type={showStaffPassword ? "text" : "password"} 
                      required
                      className="form-control"
                      style={{ paddingLeft: '38px', paddingRight: '38px' }}
                      placeholder="Enter assigned password"
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowStaffPassword(!showStaffPassword)}
                      title={showStaffPassword ? "Hide password" : "Show password"}
                    >
                      {showStaffPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button 
                  id="staff-login-submit-btn"
                  type="submit" 
                  className="btn-primary"
                  disabled={isAuthenticating}
                  style={{ 
                    width: '100%', 
                    justifyContent: 'center', 
                    padding: '12px', 
                    fontSize: '14px', 
                    marginTop: 2,
                    background: 'linear-gradient(135deg, var(--accent-purple) 0%, #6d28d9 100%)',
                    boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)'
                  }}
                >
                  {isAuthenticating ? (
                    <>
                      <span className="brand-pulse-dot" style={{ background: 'var(--accent-purple)' }}></span>
                      <span>Verifying Staff Clearance Matrix...</span>
                    </>
                  ) : (
                    <>
                      <Users size={16} />
                      <span>Log In to Team Workspace</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              {/* QUICK SELECT TEAM MEMBER CARDS (Managed by Super Admin) */}
              <div style={{
                marginTop: 6,
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: 12
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8
                }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                    Select Staff (Password Required):
                  </span>
                  <span style={{ fontSize: '10.5px', color: 'var(--accent-purple)', fontFamily: 'var(--font-mono)' }}>
                    🔒 Zero-Bypass Enforced
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '160px', overflowY: 'auto' }}>
                  {staffAccounts.map((staff) => (
                    <div
                      key={staff.id}
                      onClick={() => handleSelectStaffAccount(staff)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(139, 92, 246, 0.12)';
                        e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: 'rgba(139, 92, 246, 0.25)',
                          color: 'var(--accent-purple)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 700
                        }}>
                          {staff.name.slice(0, 1)}
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                            {staff.name}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            {staff.role} • {staff.department}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          fontSize: '10px',
                          fontFamily: 'var(--font-mono)',
                          background: 'rgba(16, 185, 129, 0.12)',
                          color: '#10b981',
                          padding: '2px 6px',
                          borderRadius: 4
                        }}>
                          {staff.allowedModules?.length || 6} Modules
                        </span>
                        <ArrowRightCircle size={14} color="var(--accent-purple)" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Footer note */}
          <div style={{ textAlign: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: 14, marginTop: 10 }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              SUPER ADMIN GOVERNANCE • ROLE-BASED ACCESS CONTROL MATRIX ACTIVE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
