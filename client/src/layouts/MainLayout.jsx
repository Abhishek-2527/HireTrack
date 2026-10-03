import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import ThemeToggle from '../components/ThemeToggle';

const navIcons = {
  Dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></>,
  Applications: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  Kanban: <><rect x="3" y="4" width="5" height="16" rx="1.5" /><rect x="10" y="4" width="5" height="10" rx="1.5" /><rect x="17" y="4" width="5" height="13" rx="1.5" /></>,
  Interviews: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18M8 15h3" /></>,
  'Saved Jobs': <><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z" /></>,
  'Follow-Ups': <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  Analytics: <><path d="M4 19V5M4 19h17" /><path d="m7 15 4-4 3 2 5-6" /></>,
  Profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
};

const NavIcon = ({ name }) => (
  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {navIcons[name]}
  </svg>
);

const MainLayout = ({ children }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navigation = [
    { to: '/dashboard', label: 'Dashboard', end: true },
    { to: '/applications', label: 'Applications' },
    { to: '/kanban', label: 'Kanban' },
    { to: '/interviews', label: 'Interviews' },
    { to: '/saved-jobs', label: 'Saved Jobs' },
    { to: '/follow-ups', label: 'Follow-Ups' },
    { to: '/analytics', label: 'Analytics' },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link to="/dashboard" className="brand" aria-label="HireTrack dashboard">
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span className="brand-copy"><strong>HireTrack</strong><small>Job search command center</small></span>
        </Link>
        <nav className="nav-list" aria-label="Main navigation">
          {navigation.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => isActive ? 'active' : undefined}>
              <NavIcon name={label} /><span>{label}</span>
            </NavLink>
          ))}
          <NavLink to="/profile" className={({ isActive }) => isActive ? 'active profile-nav-link' : 'profile-nav-link'}><NavIcon name="Profile" /><span>Profile</span></NavLink>
        </nav>
        {user && <div className="sidebar-account">
          <span className="account-avatar" aria-hidden="true">{user.name?.trim()?.charAt(0)?.toUpperCase() || 'U'}</span>
          <span className="account-copy"><strong>{user.name}</strong><small>{user.email}</small></span>
          <button type="button" className="nav-logout" onClick={handleLogout}>Logout</button>
        </div>}
      </aside>

      <div className="main-panel">
        <header className="topbar">
          <div>
            <span className="eyebrow">Your job search command center</span>
            <h2>Keep your next move in view.</h2>
          </div>
          <div className="topbar-actions">
            <span className="welcome-label">{user ? `Welcome back, ${user.name?.split(' ')[0]}` : 'Welcome'}</span>
            <ThemeToggle />
            <button type="button" className="secondary-btn" onClick={() => navigate('/applications')}>
              List View
            </button>
            <button type="button" className="primary-btn" onClick={() => navigate('/interviews/new')}>
              Schedule Interview
            </button>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
};

export default MainLayout;
