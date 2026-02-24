import { useState } from 'react';
import { StoreProvider, useStore } from './store';
import { ProjectList } from './components/ProjectList';
import { ProjectDashboard } from './components/ProjectDashboard';
import { ApiConfigPanel } from './components/ApiConfigPanel';
import './App.css';

const AppContent = () => {
  const { currentProject, state } = useStore();
  const [activeTab, setActiveTab] = useState<'projects' | 'settings'>('projects');

  if (!currentProject) {
    return (
      <div className="app">
        <header className="header">
          <h1>📖 AI 辅助写作工具</h1>
          <nav>
            <button
              className={activeTab === 'projects' ? 'active' : ''}
              onClick={() => setActiveTab('projects')}
            >
              项目列表
            </button>
            <button
              className={activeTab === 'settings' ? 'active' : ''}
              onClick={() => setActiveTab('settings')}
            >
              API 设置
            </button>
          </nav>
        </header>
        <main className="main">
          {activeTab === 'projects' ? <ProjectList /> : <ApiConfigPanel />}
        </main>
      </div>
    );
  }

  return <ProjectDashboard />;
};

function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}

export default App;
