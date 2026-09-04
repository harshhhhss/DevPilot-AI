import { useEffect, useState } from 'react';
import api from './services/api';

const statusCopy = {
  checking: 'Checking backend connection...',
  connected: 'Backend connected',
  error: 'Backend not reachable',
};

function App() {
  const [apiStatus, setApiStatus] = useState('checking');
  const [health, setHealth] = useState(null);

  useEffect(() => {
    const checkApi = async () => {
      try {
        const response = await api.get('/health');
        setHealth(response.data.data);
        setApiStatus('connected');
      } catch (error) {
        setApiStatus('error');
      }
    };

    checkApi();
  }, []);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">D</span>
          <div>
            <strong>DevPilot AI</strong>
            <span>Project OS</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Main navigation">
          {['Dashboard', 'Projects', 'Sprints', 'Tasks', 'Kanban', 'Bugs', 'AI Assistant'].map((item) => (
            <a href="/" key={item}>
              {item}
            </a>
          ))}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Foundation setup</p>
            <h1>Build software work from one calm command center.</h1>
          </div>
          <span className={`status-pill ${apiStatus}`}>{statusCopy[apiStatus]}</span>
        </header>

        <section className="dashboard-grid" aria-label="Foundation status">
          <article className="metric-card">
            <span>API Service</span>
            <strong>{health?.service || 'devpilot-ai-api'}</strong>
          </article>
          <article className="metric-card">
            <span>Environment</span>
            <strong>{health?.environment || 'development'}</strong>
          </article>
          <article className="metric-card">
            <span>Database</span>
            <strong>{health?.database || 'pending'}</strong>
          </article>
        </section>

        <section className="kanban-preview" aria-label="Sprint workflow preview">
          {['To Do', 'In Progress', 'In Review', 'Done'].map((column) => (
            <div className="kanban-column" key={column}>
              <h2>{column}</h2>
              <div className="task-card">
                <span>{column === 'To Do' ? 'Phase 1' : 'Upcoming'}</span>
                <strong>
                  {column === 'To Do'
                    ? 'Backend foundation'
                    : column === 'In Progress'
                      ? 'Authentication module'
                      : column === 'In Review'
                        ? 'Role-based routes'
                        : 'Health API'}
                </strong>
              </div>
            </div>
          ))}
        </section>
      </section>
    </main>
  );
}

export default App;
