import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import ProjectsList from './pages/projects/ProjectsList';
import ProjectDetailLayout from './pages/projects/ProjectDetailLayout';
import ProjectOverview from './pages/projects/ProjectOverview';
import ProjectSprints from './pages/projects/ProjectSprints';
import ProjectKanban from './pages/projects/ProjectKanban';
import ProjectBugs from './pages/projects/ProjectBugs';
import ProjectChat from './pages/projects/ProjectChat';
import ProjectMeetings from './pages/projects/ProjectMeetings';
import ProjectTeam from './pages/projects/ProjectTeam';
import ProjectAnalytics from './pages/projects/ProjectAnalytics';
import TasksList from './pages/tasks/TasksList';
import TaskDetail from './pages/tasks/TaskDetail';
import BugsList from './pages/bugs/BugsList';
import BugDetail from './pages/bugs/BugDetail';
import AIAssistant from './pages/AIAssistant';
import Team from './pages/Team';
import Analytics from './pages/Analytics';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { ROLES } from './utils/roles';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/projects" element={<ProjectsList />} />
          <Route path="/projects/:id" element={<ProjectDetailLayout />}>
            <Route index element={<ProjectOverview />} />
            <Route path="sprints" element={<ProjectSprints />} />
            <Route path="kanban" element={<ProjectKanban />} />
            <Route path="bugs" element={<ProjectBugs />} />
            <Route path="chat" element={<ProjectChat />} />
            <Route path="meetings" element={<ProjectMeetings />} />
            <Route path="team" element={<ProjectTeam />} />
            <Route path="analytics" element={<ProjectAnalytics />} />
          </Route>

          <Route path="/tasks" element={<TasksList />} />
          <Route path="/tasks/:id" element={<TaskDetail />} />

          <Route path="/bugs" element={<BugsList />} />
          <Route path="/bugs/:id" element={<BugDetail />} />

          <Route path="/ai-assistant" element={<AIAssistant />} />
          <Route path="/team" element={<Team />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />

          <Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
