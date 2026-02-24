import { useState } from 'react';
import { useStore } from '../store';
import { ApiConfig } from '../types';

export const ApiConfigPanel = () => {
  const { state, addApiConfig, updateApiConfig, deleteApiConfig } = useStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ApiConfig | null>(null);
  const [newConfig, setNewConfig] = useState({
    provider: 'OpenAI',
    apiKey: '',
    baseUrl: 'https://api.openai.com',
    model: 'gpt-3.5-turbo',
    isDefault: false,
  });

  const providers = [
    { value: 'OpenAI', label: 'OpenAI', baseUrl: 'https://api.openai.com' },
    { value: 'Gemini', label: 'Gemini', baseUrl: 'https://generativelanguage.googleapis.com' },
    { value: '硅基流动', label: '硅基流动', baseUrl: 'https://api.siliconflow.cn' },
    { value: 'DeepSeek', label: 'DeepSeek', baseUrl: 'https://api.deepseek.com' },
    { value: '自定义', label: '自定义', baseUrl: '' }
  ];

  const handleAdd = () => {
    if (newConfig.apiKey.trim()) {
      addApiConfig(newConfig);
      setNewConfig({ provider: 'OpenAI', apiKey: '', baseUrl: '', model: 'gpt-3.5-turbo', isDefault: false });
      setShowAddModal(false);
    }
  };

  const handleSaveEdit = () => {
    if (editingConfig) {
      updateApiConfig(editingConfig.id, editingConfig);
      setEditingConfig(null);
    }
  };

  return (
    <div>
      <div className="card-header">
        <h2>API 配置</h2>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          + 添加配置
        </button>
      </div>

      {state.apiConfigs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔑</div>
          <h3>还没有配置 API</h3>
          <p>添加你的 AI API 配置，开始使用 AI 辅助创作！</p>
        </div>
      ) : (
        <div className="grid">
          {state.apiConfigs.map(config => (
            <div key={config.id} className="list-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h3>{config.provider}</h3>
                  {config.isDefault && <span className="badge badge-completed">默认</span>}
                </div>
              </div>
              <p style={{ color: '#666', marginTop: '0.5rem' }}>
                模型: {config.model}
              </p>
              {config.baseUrl && (
                <p style={{ color: '#888', fontSize: '0.85rem' }}>
                  {config.baseUrl}
                </p>
              )}
              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-small btn-secondary"
                  onClick={() => setEditingConfig({ ...config })}
                >
                  编辑
                </button>
                {!config.isDefault && (
                  <button
                    className="btn btn-small btn-primary"
                    onClick={() => updateApiConfig(config.id, { isDefault: true })}
                  >
                    设为默认
                  </button>
                )}
                <button
                  className="btn btn-small btn-danger"
                  onClick={() => {
                    if (confirm('确定要删除这个配置吗？')) {
                      deleteApiConfig(config.id);
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

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>添加 API 配置</h3>
              <button className="btn btn-secondary btn-small" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="form-group">
              <label>服务商</label>
              <select
                value={newConfig.provider}
                onChange={(e) => {
                  const selectedProvider = providers.find(p => p.value === e.target.value);
                  setNewConfig({
                    ...newConfig,
                    provider: e.target.value,
                    baseUrl: selectedProvider?.baseUrl || ''
                  });
                }}
              >
                {providers.map(provider => (
                  <option key={provider.value} value={provider.value}>
                    {provider.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>API Key</label>
              <input
                type="password"
                value={newConfig.apiKey}
                onChange={(e) => setNewConfig({ ...newConfig, apiKey: e.target.value })}
                placeholder="输入你的 API Key"
              />
            </div>
            <div className="form-group">
              <label>Base URL（可选）</label>
              <input
                type="text"
                value={newConfig.baseUrl}
                onChange={(e) => setNewConfig({ ...newConfig, baseUrl: e.target.value })}
                placeholder="如：https://api.openai.com"
              />
            </div>
            <div className="form-group">
              <label>模型</label>
              <input
                type="text"
                value={newConfig.model}
                onChange={(e) => setNewConfig({ ...newConfig, model: e.target.value })}
                placeholder="如：gpt-3.5-turbo、gpt-4"
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={newConfig.isDefault}
                  onChange={(e) => setNewConfig({ ...newConfig, isDefault: e.target.checked })}
                />
                设为默认配置
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleAdd}>添加</button>
            </div>
          </div>
        </div>
      )}

      {editingConfig && (
        <div className="modal-overlay" onClick={() => setEditingConfig(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>编辑 API 配置</h3>
              <button className="btn btn-secondary btn-small" onClick={() => setEditingConfig(null)}>×</button>
            </div>
            <div className="form-group">
              <label>服务商</label>
              <select
                value={editingConfig.provider}
                onChange={(e) => {
                  const selectedProvider = providers.find(p => p.value === e.target.value);
                  setEditingConfig({
                    ...editingConfig,
                    provider: e.target.value,
                    baseUrl: selectedProvider?.baseUrl || ''
                  });
                }}
              >
                {providers.map(provider => (
                  <option key={provider.value} value={provider.value}>
                    {provider.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>API Key</label>
              <input
                type="password"
                value={editingConfig.apiKey}
                onChange={(e) => setEditingConfig({ ...editingConfig, apiKey: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Base URL（可选）</label>
              <input
                type="text"
                value={editingConfig.baseUrl || ''}
                onChange={(e) => setEditingConfig({ ...editingConfig, baseUrl: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>模型</label>
              <input
                type="text"
                value={editingConfig.model || ''}
                onChange={(e) => setEditingConfig({ ...editingConfig, model: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={editingConfig.isDefault}
                  onChange={(e) => setEditingConfig({ ...editingConfig, isDefault: e.target.checked })}
                />
                设为默认配置
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditingConfig(null)}>取消</button>
              <button className="btn btn-primary" onClick={handleSaveEdit}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
