import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <section className="page-shell">
      <div className="page-header-row">
        <div>
          <p className="eyebrow">Profile</p>
          <h1>My Account</h1>
        </div>
      </div>

      <div className="card detail-card">
        <div className="detail-list">
          <div>
            <span>Name</span>
            <strong>{user?.name || '—'}</strong>
          </div>
          <div>
            <span>Email</span>
            <strong>{user?.email || '—'}</strong>
          </div>
        </div>

        <div className="form-actions" style={{ marginTop: '24px' }}>
          <button type="button" className="secondary-btn" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
          <button type="button" className="danger-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProfilePage;
