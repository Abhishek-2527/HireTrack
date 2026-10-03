import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import AddApplication from './pages/AddApplication';
import ApplicationDetails from './pages/ApplicationDetails';
import Applications from './pages/Applications';
import DashboardPage from './pages/DashboardPage';
import EditApplication from './pages/EditApplication';
import Login from './pages/Login';
import NotFoundPage from './pages/NotFoundPage';
import ProfilePage from './pages/ProfilePage';
import KanbanBoard from './pages/KanbanBoard';
import Interviews from './pages/Interviews';
import AddInterview from './pages/AddInterview';
import EditInterview from './pages/EditInterview';
import InterviewDetails from './pages/InterviewDetails';
import Register from './pages/Register';
import AddSavedJob from './pages/AddSavedJob';
import EditSavedJob from './pages/EditSavedJob';
import SavedJobs from './pages/SavedJobs';
import SavedJobDetails from './pages/SavedJobDetails';
import FollowUps from './pages/FollowUps';
import AnalyticsPage from './pages/AnalyticsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout>
                <DashboardPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <MainLayout>
                <AnalyticsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/applications"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Applications />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/follow-ups"
          element={
            <ProtectedRoute>
              <MainLayout>
                <FollowUps />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/kanban"
          element={
            <ProtectedRoute>
              <MainLayout>
                <KanbanBoard />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <MainLayout>
                <ProfilePage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/applications/new"
          element={
            <ProtectedRoute>
              <MainLayout>
                <AddApplication />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/interviews"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Interviews />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/saved-jobs"
          element={
            <ProtectedRoute>
              <MainLayout>
                <SavedJobs />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/saved-jobs/new"
          element={
            <ProtectedRoute>
              <MainLayout>
                <AddSavedJob />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/saved-jobs/:id"
          element={
            <ProtectedRoute>
              <MainLayout>
                <SavedJobDetails />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/saved-jobs/:id/edit"
          element={
            <ProtectedRoute>
              <MainLayout>
                <EditSavedJob />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/interviews/new"
          element={
            <ProtectedRoute>
              <MainLayout>
                <AddInterview />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/interviews/:id"
          element={
            <ProtectedRoute>
              <MainLayout>
                <InterviewDetails />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/interviews/:id/edit"
          element={
            <ProtectedRoute>
              <MainLayout>
                <EditInterview />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/applications/:id"
          element={
            <ProtectedRoute>
              <MainLayout>
                <ApplicationDetails />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/applications/:id/edit"
          element={
            <ProtectedRoute>
              <MainLayout>
                <EditApplication />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
