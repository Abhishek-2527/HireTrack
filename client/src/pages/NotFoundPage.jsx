import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

const NotFoundPage = () => {
  return (
    <main className="page-shell">
      <ThemeToggle className="auth-theme-toggle" />
      <div className="card hero-card center-card">
        <p className="eyebrow">404 Error</p>
        <h1>Page not found</h1>
        <p className="muted-text">
          The page you are looking for does not exist.
        </p>
        <Link to="/dashboard" className="primary-btn">
          Go to dashboard
        </Link>
      </div>
    </main>
  );
};

export default NotFoundPage;
