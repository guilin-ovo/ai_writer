import { useState } from 'react';
import { useStore } from '../store';
import { Project } from '../types';

export const ProjectList = () => {
  const { state, createProject, selectProject, deleteProject, updateProject, addProject } = useStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    genre: '',
    description: '',
  });
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [importFileContent, setImportFileContent] = useState('');

  const handleExportProject = (project: Project) => {
    const dataStr = JSON.stringify(project, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const safeProjectName = project.name.replace(/[<>:"/\\|?*]/g, '_');
    const exportFileDefaultName = `${safeProjectName}_project.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleExportAllProjects = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `ai_author_all_projects_${new Date().toISOString().slice(0, 10)}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setImportFileContent(content);
      };
      reader.readAsText(file);
    }
  };

  const handleImportProject = () => {
    try {
      const projectData = JSON.parse(importFileContent);
      
      const now = Date.now();
      const newProjectData = {
        ...projectData,
        id: now.toString(36) + Math.random().toString(36).substr(2),
        createdAt: now,
        updatedAt: now,
      };
      
      addProject(newProjectData as Project);
      
      setImportFileContent('');
      setShowImportModal(false);
    } catch (error) {
      alert('导入失败，请确保文件是有效的JSON格式');
      console.error('Import error:', error);
    }
  };

  const handleCreate = () => {
    if (newProject.name.trim()) {
      createProject(newProject);
      setNewProject({ name: '', genre: '', description: '' });
      setShowCreateModal(false);
    }
  };

  const handleEdit = () => {
    if (editingProject && editingProject.name.trim()) {
      updateProject(editingProject.id, editingProject);
      setEditingProject(null);
      setShowEditModal(false);
    }
  };

  return (
    <div>
      <div className="card-header">
        <h2>我的项目</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {state.projects.length > 0 && (
            <button className="btn btn-secondary" onClick={handleExportAllProjects}>
              📤 导出所有
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => setShowImportModal(true)}>
            📥 导入项目
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            + 新建项目
          </button>
        </div>
      </div>

      {state.projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <h3>还没有项目</h3>
          <p>点击上方的"新建项目"按钮开始你的创作之旅！</p>
        </div>
      ) : (
        <div className="grid">
          {state.projects.map(project => (
            <div 
              key={project.id} 
              className="list-item"
              style={{ cursor: 'pointer' }}
              onClick={() => selectProject(project.id)}
            >
              <h3>{project.name}</h3>
              {project.genre && <span className="tag">{project.genre}</span>}
              {project.description && (
                <p style={{ color: '#666', marginTop: '0.5rem' }}>
                  {project.description.slice(0, 100)}...
                </p>
              )}
              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-small btn-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    selectProject(project.id);
                  }}
                >
                  打开
                </button>
                <button
                  className="btn btn-small btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingProject({ ...project });
                    setShowEditModal(true);
                  }}
                >
                  编辑
                </button>
                <button
                  className="btn btn-small btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExportProject(project);
                  }}
                >
                  导出
                </button>
                <button
                  className="btn btn-small btn-danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('确定要删除这个项目吗？')) {
                      deleteProject(project.id);
                    }
                  }}
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>新建项目</h3>
              <button className="btn btn-secondary btn-small" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <div className="form-group">
              <label>项目名称 *</label>
              <input
                type="text"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                placeholder="输入小说名称"
              />
            </div>
            <div className="form-group">
              <label>类型</label>
              <input
                type="text"
                value={newProject.genre}
                onChange={(e) => setNewProject({ ...newProject, genre: e.target.value })}
                placeholder="如：玄幻、科幻、都市等"
              />
            </div>
            <div className="form-group">
              <label>简介</label>
              <textarea
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                placeholder="简要描述你的小说内容"
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleCreate}>创建</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingProject && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>编辑项目</h3>
              <button className="btn btn-secondary btn-small" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className="form-group">
              <label>项目名称 *</label>
              <input
                type="text"
                value={editingProject.name}
                onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                placeholder="输入小说名称"
              />
            </div>
            <div className="form-group">
              <label>类型</label>
              <input
                type="text"
                value={editingProject.genre || ''}
                onChange={(e) => setEditingProject({ ...editingProject, genre: e.target.value })}
                placeholder="如：玄幻、科幻、都市等"
              />
            </div>
            <div className="form-group">
              <label>简介</label>
              <textarea
                value={editingProject.description || ''}
                onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                placeholder="简要描述你的小说内容"
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleEdit}>保存</button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>导入项目</h3>
              <button className="btn btn-secondary btn-small" onClick={() => setShowImportModal(false)}>×</button>
            </div>
            <div className="form-group">
              <label>选择JSON文件 *</label>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFileChange}
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </div>
            {importFileContent && (
              <div className="form-group">
                <label>文件预览</label>
                <div style={{ 
                  background: '#f8f9fa', 
                  padding: '1rem', 
                  borderRadius: '4px', 
                  maxHeight: '200px', 
                  overflow: 'auto',
                  fontSize: '0.85rem'
                }}>
                  <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                    {(() => {
                      try {
                        const parsed = JSON.parse(importFileContent);
                        return `项目名称: ${parsed.name || '未知'}\n类型: ${parsed.genre || '未知'}\n章节数: ${parsed.volumes?.reduce((sum: number, v: any) => sum + (v.chapters?.length || 0), 0) || 0}`;
                      } catch {
                        return '无法解析JSON';
                      }
                    })()}
                  </pre>
                </div>
              </div>
            )}
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowImportModal(false)}>取消</button>
              <button 
                className="btn btn-primary" 
                onClick={handleImportProject}
                disabled={!importFileContent}
              >
                导入
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
