import { useState } from 'react';
import { useStore } from '../store';
import { Character, Volume, Chapter } from '../types';
import {
  generateWithAI,
  generateCharacterPrompt,
  generateWorldviewPrompt,
  generateOutlinePrompt,
  generateVolumeOutlinePrompt,
  generateChaptersPrompt,
  generateChapterContentPrompt,
  generateOrganizationPrompt,
  generateOptimizeContentPrompt,
  generateForeshadowsPrompt,
} from '../aiService';

type Tab = 'characters' | 'organizations' | 'worldview' | 'outlines' | 'volumes' | 'writing' | 'styles' | 'foreshadows' | 'stats';

export const ProjectDashboard = () => {
  const {
    currentProject,
    selectProject,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    addOrganization,
    updateOrganization,
    deleteOrganization,
    addWorldview,
    updateWorldview,
    deleteWorldview,
    addOutline,
    updateOutline,
    addVolume,
    updateVolume,
    deleteVolume,
    addChapter,
    updateChapter,
    deleteChapter,
    addWritingStyle,
    updateWritingStyle,
    deleteWritingStyle,
    selectWritingStyle,
    addForeshadow,
    updateForeshadow,
    deleteForeshadow,
    getDefaultApiConfig,
  } = useStore();

  const [activeTab, setActiveTab] = useState<Tab>('stats');
  const [showModal, setShowModal] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<{
    name?: string;
    alias?: string;
    gender?: string;
    age?: string;
    appearance?: string;
    personality?: string;
    background?: string;
    skills?: string;
    relationships?: string;
    role?: string;
    tags?: string[];
    category?: string;
    title?: string;
    content?: string;
    type?: string;
    leader?: string;
    members?: string;
    description?: string;
    history?: string;
    location?: string;
    powerLevel?: number;
    parentOrganizationId?: string;
    chapterCount?: number;
    wordCount?: string;
    foreshadowVolumeId?: string;
    foreshadowCount?: number;
    aiResult?: string;
    volumeId?: string;
    status?: 'set' | 'unresolved' | 'resolved';
    resolutionDescription?: string;
    resolvedInVolumeId?: string;
    resolvedInChapterId?: string;
    examples?: string[];
    number?: number;
  }>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [aiHint, setAiHint] = useState('');
  const [selectedVolume, setSelectedVolume] = useState<Volume | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<{ volume: Volume; chapter: Chapter } | null>(null);
  const [chapterContent, setChapterContent] = useState('');
  const [editingChapter, setEditingChapter] = useState<{ volume: Volume; chapter: Chapter } | null>(null);
  const [optimizedContent, setOptimizedContent] = useState('');
  const [showOptimization, setShowOptimization] = useState(false);
  const [expandedVolumes, setExpandedVolumes] = useState<Record<string, boolean>>({});
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [selectedVolumeForOutline, setSelectedVolumeForOutline] = useState<Volume | null>(null);
  const [volumeOutlineContent, setVolumeOutlineContent] = useState('');
  const [selectedWritingTechnique, setSelectedWritingTechnique] = useState('unspecified');

  if (!currentProject) return null;

  const apiConfig = getDefaultApiConfig();
  const totalWords = currentProject.volumes.reduce(
    (sum, v) => sum + v.chapters.reduce((s, c) => s + (c.content?.length || 0), 0),
    0
  );
  const totalChapters = currentProject.volumes.reduce((sum, v) => sum + v.chapters.length, 0);
  const completedChapters = currentProject.volumes.reduce(
    (sum, v) => sum + v.chapters.filter(c => c.status === 'completed').length,
    0
  );

  const handleGenerateCharacter = async () => {
    if (!apiConfig) {
      alert('请先配置 API');
      return;
    }
    setIsGenerating(true);
    setGeneratedContent('生成中，请稍候...');
    try {
      const prompt = generateCharacterPrompt(currentProject, aiHint, formData.role, formData.tags);
      const result = await generateWithAI(apiConfig, prompt, setGeneratedContent);
      
      // 尝试解析 JSON 格式的人物数据
      let formDataObj = {
        name: '',
        alias: '',
        gender: '',
        age: '',
        appearance: '',
        personality: '',
        background: '',
        skills: '',
        relationships: '',
        role: formData.role || '',
        tags: formData.tags || [],
        aiResult: result,
      };
      
      try {
        // 尝试匹配 JSON 数据
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          formDataObj = {
            ...formDataObj,
            name: parsed.name || '',
            alias: parsed.alias || '',
            gender: parsed.gender || '',
            age: parsed.age || '',
            appearance: parsed.appearance || '',
            personality: parsed.personality || '',
            background: parsed.background || '',
            skills: parsed.skills || '',
            relationships: parsed.relationships || '',
          };
        }
      } catch (e) {
        console.error('人物 JSON 解析失败:', e);
      }
      
      setFormData(formDataObj);
      setShowModal('character');
    } catch (e) {
      alert('生成失败: ' + (e as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateOrganization = async () => {
    if (!apiConfig) {
      alert('请先配置 API');
      return;
    }
    setIsGenerating(true);
    setGeneratedContent('');
    try {
      const prompt = generateOrganizationPrompt(currentProject, aiHint, formData.powerLevel, formData.parentOrganizationId);
      const result = await generateWithAI(apiConfig, prompt, setGeneratedContent);
      
      // 尝试解析 JSON 格式的组织数据
      let formDataObj = {
        name: '',
        type: '',
        leader: '',
        members: '',
        description: '',
        history: '',
        location: '',
        powerLevel: formData.powerLevel || 1,
        parentOrganizationId: formData.parentOrganizationId || '',
        aiResult: result,
      };
      
      try {
        // 尝试匹配 JSON 数据
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          formDataObj = {
            ...formDataObj,
            name: parsed.name || '',
            type: parsed.type || '',
            leader: parsed.leader || '',
            members: parsed.members || '',
            description: parsed.description || '',
            history: parsed.history || '',
            location: parsed.location || '',
          };
        }
      } catch (e) {
        console.error('组织 JSON 解析失败:', e);
      }
      
      setFormData(formDataObj);
      setShowModal('organization');
    } catch (e) {
      alert('生成失败: ' + (e as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateWorldview = async () => {
    if (!apiConfig) {
      alert('请先配置 API');
      return;
    }
    setIsGenerating(true);
    setGeneratedContent('');
    try {
      const prompt = generateWorldviewPrompt(currentProject, formData.category, aiHint);
      const result = await generateWithAI(apiConfig, prompt, setGeneratedContent);
      setFormData({ ...formData, aiResult: result });
      setShowModal('worldview');
    } catch (e) {
      alert('生成失败: ' + (e as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const [outlineContent, setOutlineContent] = useState('');
  const [selectedOutlineWritingTechnique, setSelectedOutlineWritingTechnique] = useState('unspecified');

  const handleGenerateOutline = () => {
    if (!apiConfig) {
      alert('请先配置 API');
      return;
    }
    setOutlineContent('');
    setSelectedOutlineWritingTechnique('unspecified');
    setShowModal('outlineGenerator');
  };

  const handleGenerateOutlineConfirm = async () => {
    if (!apiConfig) return;
    
    setIsGenerating(true);
    setGeneratedContent('');
    try {
      const prompt = generateOutlinePrompt(currentProject, aiHint, outlineContent, selectedOutlineWritingTechnique);
      const result = await generateWithAI(apiConfig, prompt, setGeneratedContent);
      setFormData({ title: '主大纲', content: '', aiResult: result });
      setShowModal('outline');
    } catch (e) {
      alert('生成失败: ' + (e as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateVolumeOutline = (volume: Volume) => {
    if (!apiConfig) {
      alert('请先配置 API');
      return;
    }
    setSelectedVolumeForOutline(volume);
    setVolumeOutlineContent('');
    setSelectedWritingTechnique('unspecified');
    setShowModal('volumeOutline');
  };

  const handleGenerateVolumeOutlineConfirm = async () => {
    if (!selectedVolumeForOutline || !apiConfig) return;
    
    setIsGenerating(true);
    setGeneratedContent('');
    try {
      const prompt = generateVolumeOutlinePrompt(currentProject, selectedVolumeForOutline.number, aiHint, volumeOutlineContent, selectedWritingTechnique);
      const result = await generateWithAI(apiConfig, prompt, setGeneratedContent);
      updateVolume(selectedVolumeForOutline.id, { summary: result });
      setShowModal(null);
    } catch (e) {
      alert('生成失败: ' + (e as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateForeshadows = async (volume?: Volume) => {
    if (!apiConfig) {
      alert('请先配置 API');
      return;
    }
    setIsGenerating(true);
    setGeneratedContent('生成中，请稍候...');
    try {
      const prompt = generateForeshadowsPrompt(currentProject, volume, formData.foreshadowCount || 3, aiHint);
      const result = await generateWithAI(apiConfig, prompt, undefined, false);
      
      try {
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.foreshadows && Array.isArray(parsed.foreshadows)) {
            parsed.foreshadows.forEach((foreshadow: { title: string; description: string }) => {
              addForeshadow({
                title: foreshadow.title,
                description: foreshadow.description,
                volumeId: volume?.id,
                status: 'unresolved'
              });
            });
          }
        }
      } catch (e) {
        console.log('解析AI生成的伏笔失败:', e);
      }
    } catch (e) {
      alert('生成失败: ' + (e as Error).message);
    } finally {
      setIsGenerating(false);
      setGeneratedContent('');
    }
  };

  const handleGenerateChapters = async (volume: Volume, count: number) => {
    if (!apiConfig) {
      alert('请先配置 API');
      return;
    }
    setIsGenerating(true);
    setGeneratedContent('');
    try {
      const prompt = generateChaptersPrompt(currentProject, volume, count, aiHint);
      const result = await generateWithAI(apiConfig, prompt, setGeneratedContent);
      setFormData({ volumeId: volume.id, aiResult: result, chapterCount: count });
      setShowModal('addChapters');
    } catch (e) {
      alert('生成失败: ' + (e as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateChapterContent = async (volume: Volume, chapter: Chapter) => {
    if (!apiConfig) {
      alert('请先配置 API');
      return;
    }
    setIsGenerating(true);
    setGeneratedContent('生成中，请稍候...');
    try {
      const writingStyle = currentProject.selectedWritingStyleId 
        ? currentProject.writingStyles.find(style => style.id === currentProject.selectedWritingStyleId)
        : undefined;
      const prompt = generateChapterContentPrompt(currentProject, volume, chapter, aiHint, formData.wordCount, writingStyle);
      console.log('生成提示词:', prompt); // 调试用
      const result = await generateWithAI(apiConfig, prompt, undefined, false);
      
      let content = result;
      let attributeUpdates: Array<{ characterName: string; attributeName: string; newValue: string }> = [];
      let foreshadowResolves: Array<{ foreshadowTitle: string; resolutionDescription: string }> = [];
      
      try {
        let jsonStr = result.trim();
        
        if (jsonStr.startsWith('```json')) {
          jsonStr = jsonStr.substring(7).trim();
        } else if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.substring(3).trim();
        }
        
        if (jsonStr.endsWith('```')) {
          jsonStr = jsonStr.substring(0, jsonStr.length - 3).trim();
        }
        
        if (jsonStr.startsWith('[')) {
          let bracketCount = 0;
          let endIndex = -1;
          
          for (let i = 0; i < jsonStr.length; i++) {
            if (jsonStr[i] === '[') bracketCount++;
            else if (jsonStr[i] === ']') {
              bracketCount--;
              if (bracketCount === 0) {
                endIndex = i;
                break;
              }
            }
          }
          
          if (endIndex !== -1) {
            jsonStr = jsonStr.substring(0, endIndex + 1);
            const parsed = JSON.parse(jsonStr);
            if (Array.isArray(parsed)) {
              let foundContent = false;
              parsed.forEach((item: any) => {
                if (item.type === 'content' && item.data) {
                  content = item.data;
                  foundContent = true;
                } else if (item.type === 'attribute_update' && Array.isArray(item.data)) {
                  attributeUpdates = item.data;
                } else if (item.type === 'foreshadow_resolve' && Array.isArray(item.data)) {
                  foreshadowResolves = item.data;
                }
              });
              
              if (!foundContent) {
                console.log('JSON中没有找到content，使用原始内容');
                content = result;
              }
            }
          } else {
            console.log('JSON不完整，使用原始内容');
            content = result;
          }
        } else {
          console.log('不是JSON格式，使用原始内容');
          content = result;
        }
      } catch (e) {
        console.log('JSON解析失败，使用原始内容:', e);
        content = result;
      }
      
      updateChapter(volume.id, chapter.id, {
        content: content,
        wordCount: content.length,
        status: 'completed',
      });
      
      if (attributeUpdates.length > 0) {
        const characterUpdates: Record<string, { character: Character; attributes: any[] }> = {};
        
        attributeUpdates.forEach((update: { characterName: string; attributeName: string; newValue: string }) => {
          const character = currentProject.characters.find(c => c.name === update.characterName);
          if (character) {
            if (!characterUpdates[character.id]) {
              characterUpdates[character.id] = {
                character: character,
                attributes: [...(character.attributes || [])]
              };
            }
            
            characterUpdates[character.id].attributes = characterUpdates[character.id].attributes.map(attr => {
              if (attr.name === update.attributeName && attr.isGrowing) {
                return { ...attr, value: update.newValue, updatedAt: Date.now() };
              }
              return attr;
            });
          }
        });
        
        Object.values(characterUpdates).forEach(({ character, attributes }) => {
          updateCharacter(character.id, { ...character, attributes });
        });
      }
      
      if (foreshadowResolves.length > 0) {
        foreshadowResolves.forEach((resolve: { foreshadowTitle: string; resolutionDescription: string }) => {
          const foreshadow = currentProject.foreshadows.find(f => f.title === resolve.foreshadowTitle && f.status !== 'resolved');
          if (foreshadow) {
            updateForeshadow(foreshadow.id, {
              status: 'resolved',
              resolvedInChapterId: chapter.id,
              resolvedInVolumeId: volume.id,
              resolutionDescription: resolve.resolutionDescription
            });
          }
        });
      }
      
      setChapterContent(content);
      if (selectedChapter?.chapter.id === chapter.id) {
        setSelectedChapter({ volume, chapter: { ...chapter, content: content } });
      }
    } catch (e) {
      alert('生成失败: ' + (e as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOptimizeContent = async () => {
    if (!apiConfig) {
      alert('请先配置 API');
      return;
    }
    if (!currentProject.selectedWritingStyleId) {
      alert('请先选择一个文笔风格');
      return;
    }
    const writingStyle = currentProject.writingStyles.find(style => style.id === currentProject.selectedWritingStyleId);
    if (!writingStyle || writingStyle.examples.length === 0) {
      alert('选择的风格没有例句');
      return;
    }
    setIsGenerating(true);
    setGeneratedContent('');
    try {
      const prompt = generateOptimizeContentPrompt(chapterContent, writingStyle, aiHint);
      const result = await generateWithAI(apiConfig, prompt, setGeneratedContent);
      setOptimizedContent(result);
      setShowOptimization(true);
    } catch (e) {
      alert('优化失败: ' + (e as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveOptimized = () => {
    if (!selectedChapter) return;
    updateChapter(selectedChapter.volume.id, selectedChapter.chapter.id, {
      content: optimizedContent,
      wordCount: optimizedContent.length,
      status: 'completed',
    });
    setChapterContent(optimizedContent);
    if (selectedChapter) {
      setSelectedChapter({ 
        ...selectedChapter, 
        chapter: { ...selectedChapter.chapter, content: optimizedContent } 
      });
    }
    setShowOptimization(false);
  };

  const parseChaptersAndAdd = (volumeId: string, text: string) => {
    let chapters: Array<{ title: string; summary: string; number: number }> = [];
    
    try {
      // 尝试解析 JSON 格式
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.chapters && Array.isArray(parsed.chapters)) {
          chapters = parsed.chapters.map((ch: any) => ({
            number: ch.number,
            title: ch.title,
            summary: ch.summary || '',
          }));
        }
      }
    } catch (e) {
      console.error('JSON 解析失败:', e);
      // 如果 JSON 解析失败，尝试旧的文本解析方式
      const lines = text.split('\n').filter(l => l.trim());
      let currentChapter: Partial<Chapter> = {};
      let chapterNum = 0;

      lines.forEach(line => {
        const titleMatch = line.match(/^(?:第)?\s*(\d+)\s*[章节章].*[:：]?\s*(.+)$/i);
        if (titleMatch) {
          if (currentChapter.title) {
            chapters.push({
              number: ++chapterNum,
              title: currentChapter.title,
              summary: currentChapter.summary || '',
            });
          }
          currentChapter = { title: titleMatch[2].trim(), summary: '' };
        } else if (currentChapter.title && !line.startsWith('章节') && !line.startsWith('简介')) {
          currentChapter.summary = (currentChapter.summary || '') + line + '\n';
        }
      });

      if (currentChapter.title) {
        chapters.push({
          number: ++chapterNum,
          title: currentChapter.title,
          summary: currentChapter.summary || '',
        });
      }
    }

    if (chapters.length === 0) {
      alert('未能解析出章节，请手动添加');
      return;
    }

    const volume = currentProject.volumes.find(v => v.id === volumeId);
    if (volume) {
      const startNum = volume.chapters.length + 1;
      chapters.forEach((ch, i) => {
        addChapter(volumeId, {
          number: ch.number || (startNum + i),
          title: ch.title,
          summary: ch.summary,
          wordCount: 0,
          status: 'draft',
        });
      });
    }
    setShowModal(null);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'characters':
        return (
          <div>
            <div className="card-header">
              <h2>人物管理</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary" onClick={() => {
                  setAiHint('');
                  setFormData({ name: '', alias: '', gender: '', age: '', appearance: '', personality: '', background: '', skills: '', relationships: '', role: '', tags: [] });
                  setShowModal('character');
                }}>
                  + 添加人物
                </button>
              </div>
            </div>

            {apiConfig && (
              <div className="card">
                <div className="form-group">
                  <label>AI 生成提示（可选）</label>
                  <input
                    type="text"
                    value={aiHint}
                    onChange={(e) => setAiHint(e.target.value)}
                    placeholder="描述你想要的人物特点..."
                  />
                </div>
                <button className="btn btn-ai" onClick={handleGenerateCharacter} disabled={isGenerating}>
                  {isGenerating ? '生成中...' : '✨ AI 生成人物'}
                </button>
              </div>
            )}

            {isGenerating && (
              <div className="generating">
                <div className="spinner"></div>
                <div>
                  <p>正在生成...</p>
                  <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>{generatedContent}</p>
                </div>
              </div>
            )}

            <div className="grid">
              {currentProject.characters.map(char => (
                <div key={char.id} className="list-item">
                  <h3>{char.name}</h3>
                  {char.alias && <p style={{ color: '#888' }}>别名: {char.alias}</p>}
                  {char.role && (
                    <span className="tag" style={{ marginRight: '0.5rem' }}>
                      {{
                        'protagonist': '主角',
                        'supporting': '主角团',
                        'minor': '次要',
                        'side': '配角',
                        'antagonist': '反派'
                      }[char.role] || char.role}
                    </span>
                  )}
                  {char.tags && char.tags.length > 0 && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                      {char.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="tag" style={{ fontSize: '0.8rem', background: '#e5e7eb' }}>{tag}</span>
                      ))}
                      {char.tags.length > 3 && (
                        <span className="tag" style={{ fontSize: '0.8rem', background: '#e5e7eb' }}>...</span>
                      )}
                    </div>
                  )}
                  {char.personality && (
                    <p style={{ 
                      color: '#666', 
                      marginTop: '0.5rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {char.personality}
                    </p>
                  )}
                  <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-small btn-secondary" onClick={() => {
                      setEditingItem(char);
                      setFormData({ ...char });
                      setShowModal('character');
                    }}>
                      编辑
                    </button>
                    <button className="btn btn-small btn-danger" onClick={() => {
                      if (confirm('确定删除这个人物？')) deleteCharacter(char.id);
                    }}>
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'organizations':
        return (
          <div>
            <div className="card-header">
              <h2>组织/势力管理</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary" onClick={() => {
                  setFormData({ name: '', type: '', leader: '', members: '', description: '', history: '', location: '', powerLevel: 1, parentOrganizationId: '' });
                  setShowModal('organization');
                }}>
                  + 添加组织
                </button>
              </div>
            </div>

            {apiConfig && (
              <div className="card">
                <div className="form-group">
                  <label>AI 生成提示（可选）</label>
                  <input type="text" value={aiHint} onChange={(e) => setAiHint(e.target.value)} placeholder="描述你想要的组织特点..." />
                </div>
                <button className="btn btn-ai" onClick={handleGenerateOrganization} disabled={isGenerating}>
                  {isGenerating ? '生成中...' : '✨ AI 生成组织'}
                </button>
              </div>
            )}

            {isGenerating && (
              <div className="generating">
                <div className="spinner"></div>
                <div>
                  <p>正在生成...</p>
                  <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>{generatedContent}</p>
                </div>
              </div>
            )}

            <div className="grid">
              {currentProject.organizations.map(org => (
                <div key={org.id} className="list-item">
                  <h3>{org.name}</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    {org.type && <span className="tag">{org.type}</span>}
                    {org.powerLevel && (
                      <span className="tag" style={{ background: '#e5e7eb' }}>
                        实力: {org.powerLevel}/10
                      </span>
                    )}
                    {(() => {
                      if (org.parentOrganizationId) {
                        const parentOrg = currentProject.organizations.find(pOrg => pOrg.id === org.parentOrganizationId);
                        if (parentOrg) {
                          return (
                            <span className="tag" style={{ background: '#e5e7eb' }}>
                              上级: {parentOrg.name}
                            </span>
                          );
                        }
                      }
                      return null;
                    })()}
                  </div>
                  {org.description && (
                    <p style={{ 
                      color: '#666', 
                      marginTop: '0.5rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {org.description}
                    </p>
                  )}
                  <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-small btn-secondary" onClick={() => {
                      setEditingItem(org);
                      setFormData({
                        name: org.name,
                        type: org.type || '',
                        leader: org.leader || '',
                        members: Array.isArray(org.members) ? org.members.join(', ') : org.members || '',
                        description: org.description || '',
                        history: org.history || '',
                        location: org.location || '',
                        tags: org.tags || [],
                        powerLevel: org.powerLevel || 1,
                        parentOrganizationId: org.parentOrganizationId || ''
                      });
                      setShowModal('organization');
                    }}>
                      编辑
                    </button>
                    <button className="btn btn-small btn-danger" onClick={() => {
                      if (confirm('确定删除这个组织？')) deleteOrganization(org.id);
                    }}>
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'worldview':
        return (
          <div>
            <div className="card-header">
              <h2>世界观设定</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary" onClick={() => {
                  setFormData({ title: '', content: '', category: '' });
                  setShowModal('worldview');
                }}>
                  + 添加设定
                </button>
              </div>
            </div>

            {apiConfig && (
              <div className="card">
                <div className="form-row">
                  <div className="form-group">
                    <label>分类</label>
                    <input type="text" value={formData.category || ''} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="如：地理、历史、修炼体系等" />
                  </div>
                  <div className="form-group">
                    <label>AI 生成提示（可选）</label>
                    <input type="text" value={aiHint} onChange={(e) => setAiHint(e.target.value)} placeholder="补充说明..." />
                  </div>
                </div>
                <button className="btn btn-ai" onClick={handleGenerateWorldview} disabled={isGenerating}>
                  {isGenerating ? '生成中...' : '✨ AI 生成设定'}
                </button>
              </div>
            )}

            {isGenerating && (
              <div className="generating">
                <div className="spinner"></div>
                <div>
                  <p>正在生成...</p>
                  <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>{generatedContent}</p>
                </div>
              </div>
            )}

            <div className="grid">
              {currentProject.worldviews.map(wv => (
                <div key={wv.id} className="list-item">
                  <h3>{wv.title}</h3>
                  {wv.category && <span className="tag">{wv.category}</span>}
                  <p style={{ color: '#666', marginTop: '0.5rem' }}>{wv.content.slice(0, 150)}...</p>
                  <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-small btn-secondary" onClick={() => {
                      setEditingItem(wv);
                      setFormData({ ...wv });
                      setShowModal('worldview');
                    }}>
                      编辑
                    </button>
                    <button className="btn btn-small btn-danger" onClick={() => {
                      if (confirm('确定删除这个设定？')) deleteWorldview(wv.id);
                    }}>
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'outlines':
        // 确保只有一个大纲，如果没有则创建一个
        const mainOutline = currentProject.outlines.find(outline => outline.type === 'main') || currentProject.outlines[0];
        
        return (
          <div>
            <div className="card-header">
              <h2>大纲管理</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {apiConfig && (
                  <button className="btn btn-ai" onClick={() => {
                    setAiHint('');
                    handleGenerateOutline();
                  }}>
                    ✨ AI 生成大纲
                  </button>
                )}
                <button className="btn btn-primary" onClick={() => {
                  if (mainOutline) {
                    setEditingItem(mainOutline);
                    setFormData({ ...mainOutline });
                  } else {
                    setFormData({ title: '主大纲', content: '', type: 'main' });
                  }
                  setShowModal('outline');
                }}>
                  编辑大纲
                </button>
              </div>
            </div>

            {isGenerating && (
              <div className="generating">
                <div className="spinner"></div>
                <div>
                  <p>正在生成...</p>
                  <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>{generatedContent}</p>
                </div>
              </div>
            )}

            {mainOutline ? (
              <div className="card">
                <div className="card-header">
                  <h3>{mainOutline.title}</h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-small btn-secondary" onClick={() => {
                      setEditingItem(mainOutline);
                      setFormData({ ...mainOutline });
                      setShowModal('outline');
                    }}>
                      编辑
                    </button>
                  </div>
                </div>
                <pre style={{ whiteSpace: 'pre-wrap', background: '#f8f9fa', padding: '1rem', borderRadius: '8px', marginTop: '1rem', minHeight: '400px' }}>{mainOutline.content}</pre>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <h3>暂无大纲</h3>
                <p>点击"编辑大纲"按钮创建你的小说大纲</p>
              </div>
            )}
          </div>
        );

      case 'volumes':
        return (
          <div>
            <div className="card-header">
              <h2>卷管理</h2>
              <button className="btn btn-primary" onClick={() => {
                const num = currentProject.volumes.length + 1;
                setFormData({ number: num, title: `第${num}卷` });
                setShowModal('volume');
              }}>
                + 新建卷
              </button>
            </div>

            {currentProject.volumes.map(volume => {
              const isExpanded = expandedVolumes[volume.id] !== false;
              
              const toggleVolume = () => {
                setExpandedVolumes(prev => ({
                  ...prev,
                  [volume.id]: !isExpanded
                }));
              };
              
              return (
                <div key={volume.id} className="card">
                  <div 
                    className="card-header"
                    style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    onClick={toggleVolume}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>{isExpanded ? '▼' : '►'}</span>
                      <h3>第{volume.number}卷: {volume.title}</h3>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {apiConfig && (
                        <button 
                          className="btn btn-small btn-ai" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setAiHint('');
                            handleGenerateVolumeOutline(volume);
                          }}
                        >
                          AI 生成卷纲
                        </button>
                      )}
                      <button 
                        className="btn btn-small btn-secondary" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingItem(volume);
                          setFormData({ ...volume });
                          setShowModal('volume');
                        }}
                      >
                        编辑
                      </button>
                      <button 
                        className="btn btn-small btn-primary" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVolume(volume);
                          setFormData({ chapterCount: 10 });
                          setShowModal('addChapters');
                        }}
                      >
                        + 添加章节
                      </button>
                      <button 
                        className="btn btn-small btn-danger" 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('确定删除这一卷？')) deleteVolume(volume.id);
                        }}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div style={{ padding: '1rem' }}>
                      {volume.summary && <p style={{ color: '#666', marginBottom: '1rem' }}>{volume.summary}</p>}
                      <div>
                        <h4 style={{ marginBottom: '0.5rem' }}>章节 ({volume.chapters.length})</h4>
                        {volume.chapters.sort((a, b) => a.number - b.number).map(ch => (
                          <div key={ch.id} style={{ display: 'flex', alignItems: 'center', padding: '0.5rem 0.75rem', borderRadius: '4px' }}>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span className={`badge badge-${ch.status}`}>{ch.status === 'draft' ? '草稿' : ch.status === 'writing' ? '写作中' : '已完成'}</span>
                              <span>第{ch.number}章: {ch.title}</span>
                              <span style={{ color: '#888', fontSize: '0.85rem' }}>{ch.wordCount} 字</span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                className="btn btn-small btn-secondary"
                                onClick={() => setEditingChapter({ volume, chapter: ch })}
                              >
                                编辑
                              </button>
                              <button
                                className="btn btn-small btn-danger"
                                onClick={() => {
                                  if (confirm('确定删除这个章节？')) {
                                    deleteChapter(volume.id, ch.id);
                                  }
                                }}
                              >
                                删除
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );

      case 'writing':
        return (
          <div>
            <div style={{ display: 'flex', gap: '2rem' }}>
              <div style={{ width: '300px', flexShrink: 0 }}>
                <div className="card">
                  <h3 style={{ marginBottom: '1rem' }}>目录</h3>
                  {currentProject.volumes.sort((a, b) => a.number - b.number).map(volume => {
                    const isExpanded = expandedVolumes[volume.id] !== false;
                    
                    const toggleVolume = () => {
                      setExpandedVolumes(prev => ({
                        ...prev,
                        [volume.id]: !isExpanded
                      }));
                    };
                    
                    return (
                      <div key={volume.id}>
                        <div 
                          className="tree-item" 
                          style={{ fontWeight: 600, cursor: 'pointer' }}
                          onClick={toggleVolume}
                        >
                          <span>{isExpanded ? '▼' : '►'}</span>
                          📚 第{volume.number}卷: {volume.title}
                        </div>
                        {isExpanded && (
                          <div className="tree-children">
                            {volume.chapters.sort((a, b) => a.number - b.number).map(ch => (
                              <div
                                key={ch.id}
                                className={`tree-item ${selectedChapter?.chapter.id === ch.id ? 'active' : ''}`}
                                onClick={() => {
                                  setSelectedChapter({ volume, chapter: ch });
                                  setChapterContent(ch.content || '');
                                }}
                              >
                                <span className={`badge badge-${ch.status}`} style={{ fontSize: '0.7rem' }}>
                                  {ch.status === 'draft' ? '草' : ch.status === 'writing' ? '写' : '完'}
                                </span>
                                <span>第{ch.number}章</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ flex: 1 }}>
                {selectedChapter ? (
                  <div className="editor-container">
                    <div className="editor-toolbar">
                    <h3>第{selectedChapter.volume.number}卷 · 第{selectedChapter.chapter.number}章: {selectedChapter.chapter.title}</h3>
                    <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <div style={{ width: '200px' }}>
                          <select 
                            value={currentProject.selectedWritingStyleId || ''} 
                            onChange={(e) => selectWritingStyle(e.target.value || null)}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                          >
                            <option value="">选择文笔风格</option>
                            {currentProject.writingStyles.map(style => (
                              <option key={style.id} value={style.id}>
                                {style.name} {style.isPreset ? '(预设)' : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      {saveMessage && (
                        <div style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '4px',
                          background: saveMessage === '保存成功' ? '#d1fae5' : '#fef3c7',
                          color: saveMessage === '保存成功' ? '#065f46' : '#92400e',
                          fontSize: '0.85rem',
                          fontWeight: '500'
                        }}>
                          {saveMessage}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {apiConfig && (
                          <>
                            <button
                              className="btn btn-ai"
                              onClick={() => {
                                handleGenerateChapterContent(selectedChapter.volume, selectedChapter.chapter);
                              }}
                              disabled={isGenerating}
                            >
                              {isGenerating ? '生成中...' : '✨ AI 生成'}
                            </button>
                            {chapterContent && currentProject.selectedWritingStyleId && (
                              <button
                                className="btn btn-secondary"
                                onClick={handleOptimizeContent}
                                disabled={isGenerating}
                              >
                                {isGenerating ? '优化中...' : '✨ 优化'}
                              </button>
                            )}
                          </>
                        )}
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            // 检查内容是否有变化（考虑undefined和空字符串的情况）
                            const originalContent = selectedChapter.chapter.content || '';
                            const currentContent = chapterContent || '';
                            
                            if (originalContent === currentContent) {
                              // 内容无变化，显示提示
                              setSaveMessage('内容无变化');
                              setTimeout(() => setSaveMessage(null), 500);
                            } else {
                              // 内容有变化，执行保存
                              updateChapter(selectedChapter.volume.id, selectedChapter.chapter.id, {
                                content: chapterContent,
                                wordCount: chapterContent.length,
                                status: chapterContent ? 'completed' : 'draft',
                              });
                              // 更新selectedChapter状态，确保下次比较正确
                              setSelectedChapter({
                                ...selectedChapter,
                                chapter: {
                                  ...selectedChapter.chapter,
                                  content: chapterContent,
                                  wordCount: chapterContent.length,
                                  status: chapterContent ? 'completed' : 'draft',
                                }
                              });
                              // 显示保存成功提示
                              setSaveMessage('保存成功');
                              setTimeout(() => setSaveMessage(null), 500);
                            }
                          }}
                        >
                          保存
                        </button>
                      </div>
                    </div>
                  </div>

                  {isGenerating && (
                    <div className="generating">
                      <div className="spinner"></div>
                      <div>
                        <p>正在生成...</p>
                        <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem', maxHeight: '100px', overflow: 'auto' }}>{generatedContent}</p>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <input 
                        type="text" 
                        value={aiHint} 
                        onChange={(e) => setAiHint(e.target.value)} 
                        placeholder="AI写作要求（优先度最高）..."
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                      />
                    </div>
                    <div style={{ width: '120px' }}>
                      <input 
                        type="text" 
                        value={formData.wordCount || ''} 
                        onChange={(e) => setFormData({ ...formData, wordCount: e.target.value })} 
                        placeholder="字数（可选）"
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                      />
                    </div>
                  </div>

                  {selectedChapter.chapter.summary && (
                    <div style={{ background: '#eef2ff', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                      <strong>章节简介:</strong> {selectedChapter.chapter.summary}
                    </div>
                  )}

                  {showOptimization ? (
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ marginBottom: '0.5rem' }}>原文</h4>
                        <textarea
                          style={{
                            width: '100%',
                            height: '400px',
                            padding: '1rem',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            resize: 'vertical',
                            background: '#f8f9fa'
                          }}
                          value={chapterContent}
                          readOnly
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ marginBottom: '0.5rem' }}>优化后</h4>
                        <textarea
                          style={{
                            width: '100%',
                            height: '400px',
                            padding: '1rem',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            resize: 'vertical'
                          }}
                          value={optimizedContent}
                          onChange={(e) => setOptimizedContent(e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    <textarea
                      className="editor"
                      value={chapterContent}
                      onChange={(e) => setChapterContent(e.target.value)}
                      placeholder="开始写作..."
                    />
                  )}
                  <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ color: '#888', fontSize: '0.85rem' }}>
                      {showOptimization ? `原文: ${chapterContent.length} 字 | 优化后: ${optimizedContent.length} 字` : `${chapterContent.length} 字`}
                    </div>
                    {showOptimization && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary" onClick={() => setShowOptimization(false)}>
                          取消
                        </button>
                        <button className="btn btn-primary" onClick={handleSaveOptimized}>
                          保存优化版本
                        </button>
                      </div>
                    )}
                  </div>
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-state-icon">✍️</div>
                    <h3>选择章节开始写作</h3>
                    <p>从左侧目录选择一个章节，或者先去"卷管理"中添加章节</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'styles':
        return (
          <div>
            <div className="card-header">
              <h2>文笔风格管理</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary" onClick={() => {
                  setFormData({ name: '', examples: ['', '', ''] });
                  setShowModal('writingStyle');
                }}>
                  + 新建风格
                </button>
              </div>
            </div>

            <div className="grid">
              {currentProject.writingStyles.map(style => (
                <div key={style.id} className="list-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3>{style.name}</h3>
                      {style.isPreset && <span className="tag">预设</span>}
                      {currentProject.selectedWritingStyleId === style.id && (
                        <span className="tag" style={{ background: '#eef2ff', color: '#4f46e5' }}>已选择</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      {currentProject.selectedWritingStyleId !== style.id && (
                        <button className="btn btn-small btn-secondary" onClick={() => selectWritingStyle(style.id)}>
                          选择
                        </button>
                      )}
                      <button className="btn btn-small btn-secondary" onClick={() => {
                        setEditingItem(style);
                        setFormData({ ...style, examples: [...style.examples] });
                        setShowModal('writingStyle');
                      }}>
                        编辑
                      </button>
                      {!style.isPreset && (
                        <button className="btn btn-small btn-danger" onClick={() => {
                          if (confirm('确定删除这个风格？')) deleteWritingStyle(style.id);
                        }}>
                          删除
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{ marginTop: '0.75rem' }}>
                    <strong>例句:</strong>
                    <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem' }}>
                      {style.examples.slice(0, 3).map((example, i) => (
                        <li key={i} style={{ 
                          color: '#666', 
                          fontSize: '0.9rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {example || '(空)'}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'foreshadows':
        const setForeshadows = currentProject.foreshadows.filter(f => f.status === 'set');
        const unresolvedForeshadows = currentProject.foreshadows.filter(f => f.status === 'unresolved');
        const resolvedForeshadows = currentProject.foreshadows.filter(f => f.status === 'resolved');
        
        return (
          <div>
            <div className="card-header">
              <h2>伏笔管理</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary" onClick={() => {
                  setFormData({ title: '', description: '', volumeId: '', status: 'unresolved' });
                  setShowModal('foreshadow');
                }}>
                  + 添加伏笔
                </button>
              </div>
            </div>

            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
              <div className="stat-card">
                <h4>已设置伏笔</h4>
                <p>{setForeshadows.length + unresolvedForeshadows.length}</p>
              </div>
              <div className="stat-card">
                <h4>未回收伏笔</h4>
                <p style={{ color: '#f59e0b' }}>{unresolvedForeshadows.length}</p>
              </div>
              <div className="stat-card">
                <h4>已回收伏笔</h4>
                <p style={{ color: '#10b981' }}>{resolvedForeshadows.length}</p>
              </div>
            </div>

            {apiConfig && (
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="form-row">
                  <div className="form-group">
                    <label>选择卷（可选）</label>
                    <select 
                      value={formData.foreshadowVolumeId || ''} 
                      onChange={(e) => setFormData({ ...formData, foreshadowVolumeId: e.target.value })}
                    >
                      <option value="">不指定卷</option>
                      {currentProject.volumes.map(v => (
                        <option key={v.id} value={v.id}>第{v.number}卷: {v.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>生成伏笔数量</label>
                    <input 
                      type="number" 
                      value={formData.foreshadowCount || 3} 
                      onChange={(e) => setFormData({ ...formData, foreshadowCount: parseInt(e.target.value) || 3 })} 
                      min="1" 
                      max="10" 
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>AI 生成提示（可选）</label>
                  <input 
                    type="text" 
                    value={aiHint} 
                    onChange={(e) => setAiHint(e.target.value)} 
                    placeholder="补充说明..." 
                  />
                </div>
                <button 
                  className="btn btn-ai" 
                  onClick={() => {
                    const volume = formData.foreshadowVolumeId ? currentProject.volumes.find(v => v.id === formData.foreshadowVolumeId) : undefined;
                    handleGenerateForeshadows(volume);
                  }} 
                  disabled={isGenerating}
                >
                  {isGenerating ? '生成中...' : '✨ AI 生成伏笔'}
                </button>
              </div>
            )}

            {isGenerating && (
              <div className="generating">
                <div className="spinner"></div>
                <div>
                  <p>正在生成...</p>
                  <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>{generatedContent}</p>
                </div>
              </div>
            )}

            <div className="grid">
              {[...currentProject.foreshadows].reverse().map(foreshadow => (
                <div key={foreshadow.id} className="list-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <h3>{foreshadow.title}</h3>
                      <span className={`tag ${foreshadow.status === 'resolved' ? 'tag-success' : foreshadow.status === 'unresolved' ? 'tag-warning' : ''}`}>
                        {foreshadow.status === 'set' ? '已设置' : foreshadow.status === 'unresolved' ? '未回收' : '已回收'}
                      </span>
                      {foreshadow.volumeId && (
                        <span className="tag">
                          第{currentProject.volumes.find(v => v.id === foreshadow.volumeId)?.number}卷
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      <button className="btn btn-small btn-secondary" onClick={() => {
                        setEditingItem(foreshadow);
                        setFormData({ ...foreshadow });
                        setShowModal('foreshadow');
                      }}>
                        编辑
                      </button>
                      <button className="btn btn-small btn-danger" onClick={() => {
                        if (confirm('确定删除这个伏笔？')) deleteForeshadow(foreshadow.id);
                      }}>
                        删除
                      </button>
                    </div>
                  </div>
                  <p style={{ 
                    color: '#666', 
                    marginTop: '0.5rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {foreshadow.description}
                  </p>
                  {foreshadow.status === 'resolved' && foreshadow.resolutionDescription && (
                    <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#d1fae5', borderRadius: '4px' }}>
                      <strong style={{ color: '#065f46' }}>回收说明:</strong>
                      <p style={{ color: '#065f46', marginTop: '0.25rem', fontSize: '0.9rem' }}>
                        {foreshadow.resolutionDescription}
                      </p>
                      {foreshadow.resolvedInVolumeId && (
                        <p style={{ color: '#065f46', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                          回收位置: 第{currentProject.volumes.find(v => v.id === foreshadow.resolvedInVolumeId)?.number}卷
                          {foreshadow.resolvedInChapterId && currentProject.volumes.find(v => v.id === foreshadow.resolvedInVolumeId)?.chapters.find(c => c.id === foreshadow.resolvedInChapterId) && 
                            `第${currentProject.volumes.find(v => v.id === foreshadow.resolvedInVolumeId)?.chapters.find(c => c.id === foreshadow.resolvedInChapterId)?.number}章`
                          }
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'stats':
        const totalForeshadows = currentProject.foreshadows.length;
        const unresolvedForeshadowsCount = currentProject.foreshadows.filter(f => f.status !== 'resolved').length;
        
        const handleExportNovel = () => {
          let content = '';
          content += `${currentProject.name}\n\n`;
          
          currentProject.volumes.sort((a, b) => a.number - b.number).forEach(volume => {
            const sortedChapters = volume.chapters.sort((a, b) => a.number - b.number);
            sortedChapters.forEach((chapter, index) => {
              if (index === 0) {
                content += `第${volume.number}卷: ${volume.title}\n\n`;
              }
              content += `第${chapter.number}章: ${chapter.title}\n\n`;
              if (chapter.content) {
                content += chapter.content;
                content += '\n\n';
              }
            });
          });
          
          const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${currentProject.name}.txt`;
          a.click();
          URL.revokeObjectURL(url);
        };
        
        return (
          <div>
            <div className="card-header">
              <h2>统计数据</h2>
              <button className="btn btn-primary" onClick={handleExportNovel}>
                📥 导出小说
              </button>
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <h4>总字数</h4>
                <p>{totalWords.toLocaleString()}</p>
              </div>
              <div className="stat-card">
                <h4>人物数量</h4>
                <p>{currentProject.characters.length}</p>
              </div>
              <div className="stat-card">
                <h4>组织数量</h4>
                <p>{currentProject.organizations.length}</p>
              </div>
              <div className="stat-card">
                <h4>世界观设定</h4>
                <p>{currentProject.worldviews.length}</p>
              </div>
              <div className="stat-card">
                <h4>伏笔数</h4>
                <p>{totalForeshadows}</p>
              </div>
              <div className="stat-card">
                <h4>未回收伏笔</h4>
                <p style={{ color: '#f59e0b' }}>{unresolvedForeshadowsCount}</p>
              </div>
              <div className="stat-card">
                <h4>卷数</h4>
                <p>{currentProject.volumes.length}</p>
              </div>
              <div className="stat-card">
                <h4>章节数</h4>
                <p>{totalChapters}</p>
              </div>
              <div className="stat-card">
                <h4>已完成章节</h4>
                <p>{completedChapters}</p>
              </div>
              <div className="stat-card">
                <h4>完成率</h4>
                <p>{totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0}%</p>
              </div>
            </div>

            <div className="card">
              <h3>各卷进度</h3>
              {currentProject.volumes.sort((a, b) => a.number - b.number).map(volume => {
                const volChapters = volume.chapters.length;
                const volCompleted = volume.chapters.filter(c => c.status === 'completed').length;
                const volWords = volume.chapters.reduce((sum, c) => sum + (c.content?.length || 0), 0);
                return (
                  <div key={volume.id} style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>第{volume.number}卷: {volume.title}</strong>
                      <span style={{ color: '#888' }}>{volWords.toLocaleString()} 字</span>
                    </div>
                    <div style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
                      {volCompleted} / {volChapters} 章已完成
                      {volChapters > 0 && (
                        <div style={{ marginTop: '0.5rem', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${(volCompleted / volChapters) * 100}%`, height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}></div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>{currentProject.name}</h2>
          <p>{currentProject.genre || '未分类'}</p>
        </div>
        <nav className="sidebar-nav">
          <button className={activeTab === 'stats' ? 'active' : ''} onClick={() => setActiveTab('stats')}>
            📊 概览
          </button>
          <button className={activeTab === 'worldview' ? 'active' : ''} onClick={() => setActiveTab('worldview')}>
            🌍 世界观
          </button>
          <button className={activeTab === 'outlines' ? 'active' : ''} onClick={() => setActiveTab('outlines')}>
            📋 大纲
          </button>
          <button className={activeTab === 'organizations' ? 'active' : ''} onClick={() => setActiveTab('organizations')}>
            🏛️ 组织
          </button>
          <button className={activeTab === 'characters' ? 'active' : ''} onClick={() => setActiveTab('characters')}>
            👤 人物
          </button>
          <button className={activeTab === 'foreshadows' ? 'active' : ''} onClick={() => setActiveTab('foreshadows')}>
            🔮 伏笔
          </button>
          <button className={activeTab === 'styles' ? 'active' : ''} onClick={() => setActiveTab('styles')}>
            ✨ 文笔风格
          </button>
          <button className={activeTab === 'volumes' ? 'active' : ''} onClick={() => setActiveTab('volumes')}>
            📚 卷/章节
          </button>
          <button className={activeTab === 'writing' ? 'active' : ''} onClick={() => setActiveTab('writing')}>
            ✍️ 写作
          </button>
        </nav>
        <div className="sidebar-footer">
          <button className="btn btn-secondary" onClick={() => selectProject(null)}>
            ← 返回项目列表
          </button>
        </div>
      </aside>

      <main className="content">
        <div className="content-body">
          {renderTabContent()}
        </div>
      </main>

      {showModal === 'character' && (
        <div className="modal-overlay" onClick={() => { setShowModal(null); setEditingItem(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3>{editingItem ? '编辑人物' : '新建人物'}</h3>
              <button className="btn btn-secondary btn-small" onClick={() => { setShowModal(null); setEditingItem(null); }}>×</button>
            </div>
            {formData.aiResult && (
              <div className="card" style={{ marginBottom: '1rem', background: '#eef2ff' }}>
                <strong>AI 生成结果：</strong>
                <pre style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>{formData.aiResult}</pre>
              </div>
            )}
            <div className="form-row">
              <div className="form-group">
                <label>姓名 *</label>
                <input type="text" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>别名</label>
                <input type="text" value={formData.alias || ''} onChange={(e) => setFormData({ ...formData, alias: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>性别</label>
                <input type="text" value={formData.gender || ''} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} />
              </div>
              <div className="form-group">
                <label>年龄</label>
                <input type="text" value={formData.age || ''} onChange={(e) => setFormData({ ...formData, age: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>角色定位</label>
                <select value={formData.role || ''} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                  <option value="">请选择</option>
                  <option value="protagonist">主角</option>
                  <option value="supporting">主角团角色</option>
                  <option value="minor">次要角色</option>
                  <option value="side">配角</option>
                  <option value="antagonist">反派</option>
                  <option value="custom">自定义</option>
                </select>
              </div>
              <div className="form-group">
                <label>标签（逗号分隔）</label>
                <input type="text" value={Array.isArray(formData.tags) ? formData.tags.join(', ') : formData.tags || ''} onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) })} placeholder="如：勇敢, 聪明, 神秘" />
              </div>
            </div>
            <div className="form-group">
              <label>外貌</label>
              <textarea value={formData.appearance || ''} onChange={(e) => setFormData({ ...formData, appearance: e.target.value })} />
            </div>
            <div className="form-group">
              <label>性格</label>
              <textarea value={formData.personality || ''} onChange={(e) => setFormData({ ...formData, personality: e.target.value })} />
            </div>
            <div className="form-group">
              <label>背景</label>
              <textarea value={formData.background || ''} onChange={(e) => setFormData({ ...formData, background: e.target.value })} />
            </div>
            <div className="form-group">
              <label>技能</label>
              <textarea value={formData.skills || ''} onChange={(e) => setFormData({ ...formData, skills: e.target.value })} />
            </div>
            <div className="form-group">
              <label>关系</label>
              <textarea value={formData.relationships || ''} onChange={(e) => setFormData({ ...formData, relationships: e.target.value })} />
            </div>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label>属性</label>
                <button 
                  className="btn btn-small btn-secondary" 
                  onClick={() => {
                    const newAttr = {
                      id: Date.now().toString(36),
                      name: '',
                      value: '',
                      isGrowing: false,
                      createdAt: Date.now(),
                      updatedAt: Date.now()
                    };
                    setFormData({
                      ...formData,
                      ...(formData as any),
                      attributes: [...((formData as any).attributes || []), newAttr]
                    });
                  }}
                >
                  + 添加属性
                </button>
              </div>
              {(formData as any).attributes?.map((attr: any, index: number) => (
                <div key={attr.id || index} style={{ 
                  display: 'flex', 
                  gap: '0.5rem', 
                  alignItems: 'center', 
                  marginBottom: '0.5rem',
                  padding: '0.5rem',
                  background: '#f8f9fa',
                  borderRadius: '4px'
                }}>
                  <div style={{ flex: 1 }}>
                    <input 
                      type="text" 
                      value={attr.name} 
                      onChange={(e) => {
                        const newAttrs = [...(formData as any).attributes || []];
                        newAttrs[index] = { ...newAttrs[index], name: e.target.value };
                        setFormData(prev => ({ ...prev, attributes: newAttrs }));
                      }}
                      placeholder="属性名"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <input 
                      type="text" 
                      value={attr.value} 
                      onChange={(e) => {
                        const newAttrs = [...((formData as any).attributes || [])];
                        newAttrs[index] = { ...newAttrs[index], value: e.target.value };
                        setFormData(prev => ({ ...prev, attributes: newAttrs }));
                      }}
                      placeholder="属性值"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}>
                    <input 
                      type="checkbox" 
                      checked={attr.isGrowing} 
                      onChange={(e) => {
                        const newAttrs = [...((formData as any).attributes || [])];
                        newAttrs[index] = { ...newAttrs[index], isGrowing: e.target.checked };
                        setFormData(prev => ({ ...prev, attributes: newAttrs }));
                      }}
                    />
                    随主线成长
                  </label>
                  <button 
                    className="btn btn-small btn-danger" 
                    onClick={() => {
                      const newAttrs = ((formData as any).attributes || []).filter((_: any, i: number) => i !== index);
                      setFormData(prev => ({ ...prev, attributes: newAttrs }));
                    }}
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowModal(null); setEditingItem(null); }}>取消</button>
              <button className="btn btn-primary" onClick={() => {
                if (editingItem) {
                  updateCharacter(editingItem.id, formData);
                } else {
                  addCharacter({
                    name: formData.name || '',
                    alias: formData.alias || '',
                    gender: formData.gender || '',
                    age: formData.age || '',
                    appearance: formData.appearance || '',
                    personality: formData.personality || '',
                    background: formData.background || '',
                    skills: formData.skills || '',
                    relationships: formData.relationships || '',
                    role: formData.role || 'minor',
                    tags: formData.tags || [],
                    attributes: (formData as any).attributes || []
                  });
                }
                setShowModal(null);
                setEditingItem(null);
              }}>保存</button>
            </div>
          </div>
        </div>
      )}

      {showModal === 'foreshadow' && (
        <div className="modal-overlay" onClick={() => { setShowModal(null); setEditingItem(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3>{editingItem ? '编辑伏笔' : '添加伏笔'}</h3>
              <button className="btn btn-secondary btn-small" onClick={() => { setShowModal(null); setEditingItem(null); }}>×</button>
            </div>
            <div className="form-group">
              <label>标题 *</label>
              <input 
                type="text" 
                value={formData.title || ''} 
                onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
              />
            </div>
            <div className="form-group">
              <label>描述 *</label>
              <textarea 
                value={formData.description || ''} 
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{ minHeight: '150px' }}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>设置卷（可选）</label>
                <select 
                  value={formData.volumeId || ''} 
                  onChange={(e) => setFormData({ ...formData, volumeId: e.target.value })}
                >
                  <option value="">不指定</option>
                  {currentProject.volumes.map(v => (
                    <option key={v.id} value={v.id}>第{v.number}卷: {v.title}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>状态</label>
                <select 
                  value={formData.status || 'unresolved'} 
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <option value="set">已设置</option>
                  <option value="unresolved">未回收</option>
                  <option value="resolved">已回收</option>
                </select>
              </div>
            </div>
            {formData.status === 'resolved' && (
              <>
                <div className="form-group">
                  <label>回收说明</label>
                  <textarea 
                    value={formData.resolutionDescription || ''} 
                    onChange={(e) => setFormData({ ...formData, resolutionDescription: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>回收卷</label>
                    <select 
                      value={formData.resolvedInVolumeId || ''} 
                      onChange={(e) => setFormData({ ...formData, resolvedInVolumeId: e.target.value })}
                    >
                      <option value="">不指定</option>
                      {currentProject.volumes.map(v => (
                        <option key={v.id} value={v.id}>第{v.number}卷: {v.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>回收章节</label>
                    <select 
                      value={formData.resolvedInChapterId || ''} 
                      onChange={(e) => setFormData({ ...formData, resolvedInChapterId: e.target.value })}
                    >
                      <option value="">不指定</option>
                      {formData.resolvedInVolumeId && currentProject.volumes.find(v => v.id === formData.resolvedInVolumeId)?.chapters.map(c => (
                        <option key={c.id} value={c.id}>第{c.number}章: {c.title}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowModal(null); setEditingItem(null); }}>取消</button>
              <button className="btn btn-primary" onClick={() => {
                if (!formData.title) {
                  alert('请输入标题');
                  return;
                }
                if (!formData.description) {
                  alert('请输入描述');
                  return;
                }
                if (editingItem) {
                  updateForeshadow(editingItem.id, formData);
                } else {
                  addForeshadow({
                    title: formData.title || '',
                    description: formData.description || '',
                    volumeId: formData.volumeId || undefined,
                    status: formData.status || 'unresolved',
                    resolutionDescription: formData.resolutionDescription || undefined,
                    resolvedInVolumeId: formData.resolvedInVolumeId || undefined,
                    resolvedInChapterId: formData.resolvedInChapterId || undefined
                  });
                }
                setShowModal(null);
                setEditingItem(null);
              }}>保存</button>
            </div>
          </div>
        </div>
      )}

      {showModal === 'organization' && (
        <div className="modal-overlay" onClick={() => { setShowModal(null); setEditingItem(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3>{editingItem ? '编辑组织' : '新建组织'}</h3>
              <button className="btn btn-secondary btn-small" onClick={() => { setShowModal(null); setEditingItem(null); }}>×</button>
            </div>
            {formData.aiResult && (
              <div className="card" style={{ marginBottom: '1rem', background: '#eef2ff' }}>
                <strong>AI 生成结果：</strong>
                <pre style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>{formData.aiResult}</pre>
              </div>
            )}
            <div className="form-row">
              <div className="form-group">
                <label>名称 *</label>
                <input type="text" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>类型</label>
                <input type="text" value={formData.type || ''} onChange={(e) => setFormData({ ...formData, type: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>实力等级 ({formData.powerLevel || 1})</label>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={formData.powerLevel || 1} 
                  onChange={(e) => setFormData({ ...formData, powerLevel: parseInt(e.target.value) })} 
                  style={{ width: '100%' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#666' }}>
                  <span>1</span>
                  <span>5</span>
                  <span>10</span>
                </div>
              </div>
              <div className="form-group">
                <label>上级势力</label>
                <select 
                  value={formData.parentOrganizationId || ''} 
                  onChange={(e) => setFormData({ ...formData, parentOrganizationId: e.target.value })} 
                >
                  <option value="">无</option>
                  {currentProject.organizations
                    .filter(org => !editingItem || org.id !== editingItem.id) // 排除当前组织
                    .map(org => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))
                  }
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>首领</label>
              <input type="text" value={formData.leader || ''} onChange={(e) => setFormData({ ...formData, leader: e.target.value })} />
            </div>
            <div className="form-group">
              <label>地点</label>
              <input type="text" value={formData.location || ''} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
            </div>
            <div className="form-group">
              <label>描述</label>
              <textarea value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="form-group">
              <label>历史</label>
              <textarea value={formData.history || ''} onChange={(e) => setFormData({ ...formData, history: e.target.value })} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowModal(null); setEditingItem(null); }}>取消</button>
              <button className="btn btn-primary" onClick={() => {
                if (editingItem) {
                  updateOrganization(editingItem.id, {
                    ...formData,
                    members: typeof formData.members === 'string'
                      ? (formData.members as string).split(',').map(s => s.trim()).filter(Boolean)
                      : formData.members
                  });
                } else {
                  addOrganization({
                    name: formData.name || '',
                    type: formData.type || '',
                    powerLevel: formData.powerLevel || 1,
                    parentOrganizationId: formData.parentOrganizationId || undefined,
                    leader: formData.leader || '',
                    location: formData.location || '',
                    description: formData.description || '',
                    history: formData.history || '',
                    members: typeof formData.members === 'string'
                      ? (formData.members as string).split(',').map(s => s.trim()).filter(Boolean)
                      : formData.members || []
                  });
                }
                setShowModal(null);
                setEditingItem(null);
              }}>保存</button>
            </div>
          </div>
        </div>
      )}

      {showModal === 'worldview' && (
        <div className="modal-overlay" onClick={() => { setShowModal(null); setEditingItem(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3>{editingItem ? '编辑世界观' : '新建世界观'}</h3>
              <button className="btn btn-secondary btn-small" onClick={() => { setShowModal(null); setEditingItem(null); }}>×</button>
            </div>
            {formData.aiResult && (
              <div className="card" style={{ marginBottom: '1rem', background: '#eef2ff' }}>
                <strong>AI 生成结果：</strong>
                <pre style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>{formData.aiResult}</pre>
              </div>
            )}
            <div className="form-group">
              <label>标题 *</label>
              <input type="text" value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
            </div>
            <div className="form-group">
              <label>分类</label>
              <input type="text" value={formData.category || ''} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
            </div>
            <div className="form-group">
              <label>内容 *</label>
              <textarea style={{ minHeight: '200px' }} value={formData.content || ''} onChange={(e) => setFormData({ ...formData, content: e.target.value })} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowModal(null); setEditingItem(null); }}>取消</button>
              <button className="btn btn-primary" onClick={() => {
                if (editingItem) {
                  updateWorldview(editingItem.id, formData);
                } else {
                  addWorldview({
                    title: formData.title || '',
                    category: formData.category || '',
                    content: formData.content || ''
                  });
                }
                setShowModal(null);
                setEditingItem(null);
              }}>保存</button>
            </div>
          </div>
        </div>
      )}

      {showModal === 'outline' && (
        <div className="modal-overlay" onClick={() => { setShowModal(null); setEditingItem(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3>{editingItem ? '编辑大纲' : '新建大纲'}</h3>
              <button className="btn btn-secondary btn-small" onClick={() => { setShowModal(null); setEditingItem(null); }}>×</button>
            </div>
            {formData.aiResult && (
              <div className="card" style={{ marginBottom: '1rem', background: '#eef2ff' }}>
                <strong>AI 生成结果：</strong>
                <pre style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>{formData.aiResult}</pre>
              </div>
            )}
            <div className="form-group">
              <label>标题 *</label>
              <input type="text" value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
            </div>
            <div className="form-group">
              <label>内容 *</label>
              <textarea style={{ minHeight: '300px' }} value={formData.content || ''} onChange={(e) => setFormData({ ...formData, content: e.target.value })} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowModal(null); setEditingItem(null); }}>取消</button>
              <button className="btn btn-primary" onClick={() => {
                if (editingItem) {
                  updateOutline(editingItem.id, { ...formData, type: (formData.type as "volume" | "main" | undefined) });
                } else {
                  addOutline({ title: formData.title || '', content: formData.content || '', type: 'main' });
                }
                setShowModal(null);
                setEditingItem(null);
              }}>保存</button>
            </div>
          </div>
        </div>
      )}

      {showModal === 'writingStyle' && (
        <div className="modal-overlay" onClick={() => { setShowModal(null); setEditingItem(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3>{editingItem ? '编辑风格' : '新建风格'}</h3>
              <button className="btn btn-secondary btn-small" onClick={() => { setShowModal(null); setEditingItem(null); }}>×</button>
            </div>
            <div className="form-group">
              <label>风格名称 *</label>
              <input 
                type="text" 
                value={formData.name || ''} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                disabled={editingItem?.isPreset}
              />
            </div>
            <div className="form-group">
              <label>例句 1 *</label>
              <textarea 
                value={formData.examples?.[0] || ''} 
                onChange={(e) => {
                  const newExamples = [...(formData.examples || ['', '', ''])];
                  newExamples[0] = e.target.value;
                  setFormData({ ...formData, examples: newExamples });
                }}
              />
            </div>
            <div className="form-group">
              <label>例句 2</label>
              <textarea 
                value={formData.examples?.[1] || ''} 
                onChange={(e) => {
                  const newExamples = [...(formData.examples || ['', '', ''])];
                  newExamples[1] = e.target.value;
                  setFormData({ ...formData, examples: newExamples });
                }}
              />
            </div>
            <div className="form-group">
              <label>例句 3</label>
              <textarea 
                value={formData.examples?.[2] || ''} 
                onChange={(e) => {
                  const newExamples = [...(formData.examples || ['', '', ''])];
                  newExamples[2] = e.target.value;
                  setFormData({ ...formData, examples: newExamples });
                }}
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowModal(null); setEditingItem(null); }}>取消</button>
              <button className="btn btn-primary" onClick={() => {
                if (!formData.name) {
                  alert('请输入风格名称');
                  return;
                }
                if (!formData.examples?.[0]) {
                  alert('请至少添加一个例句');
                  return;
                }
                const filteredExamples = (formData.examples || []).filter(ex => ex.trim());
                if (editingItem) {
                  updateWritingStyle(editingItem.id, { ...formData, examples: filteredExamples });
                } else {
                  addWritingStyle({ name: formData.name || '', examples: filteredExamples, isPreset: false });
                }
                setShowModal(null);
                setEditingItem(null);
              }}>保存</button>
            </div>
          </div>
        </div>
      )}

      {showModal === 'volume' && (
        <div className="modal-overlay" onClick={() => { setShowModal(null); setEditingItem(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingItem ? '编辑卷' : '新建卷'}</h3>
              <button className="btn btn-secondary btn-small" onClick={() => { setShowModal(null); setEditingItem(null); }}>×</button>
            </div>
            <div className="form-group">
              <label>卷号</label>
              <input type="number" value={formData.number || ''} onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) })} />
            </div>
            <div className="form-group">
              <label>标题</label>
              <input type="text" value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
            </div>
            <div className="form-group">
              <label>卷纲</label>
              <textarea value={(formData as any).summary || ''} onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowModal(null); setEditingItem(null); }}>取消</button>
              <button className="btn btn-primary" onClick={() => {
                if (editingItem) {
                  updateVolume(editingItem.id, formData);
                } else {
                  addVolume({
                    number: formData.number ?? 0,
                    title: formData.title || '',
                    summary: (formData as any).summary || ''
                  });
                }
                setShowModal(null);
                setEditingItem(null);
              }}>保存</button>
            </div>
          </div>
        </div>
      )}

      {showModal === 'addChapters' && selectedVolume && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3>添加章节</h3>
              <button className="btn btn-secondary btn-small" onClick={() => setShowModal(null)}>×</button>
            </div>
            <div className="form-group">
              <label>章节数量</label>
              <input type="number" value={formData.chapterCount || 10} onChange={(e) => setFormData({ ...formData, chapterCount: parseInt(e.target.value) })} />
            </div>
            {apiConfig && (
              <div className="form-group">
                <label>AI 生成提示（可选）</label>
                <input type="text" value={aiHint} onChange={(e) => setAiHint(e.target.value)} placeholder="补充说明..." />
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              {apiConfig && (
                <button className="btn btn-ai" onClick={() => handleGenerateChapters(selectedVolume, formData.chapterCount || 10)} disabled={isGenerating}>
                  {isGenerating ? '生成中...' : '✨ AI 生成章节'}
                </button>
              )}
            </div>
            {isGenerating && (
              <div className="generating">
                <div className="spinner"></div>
                <div>
                  <p>正在生成...</p>
                  <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem', maxHeight: '150px', overflow: 'auto' }}>{generatedContent}</p>
                </div>
              </div>
            )}
            {formData.aiResult && (
              <div className="card" style={{ marginBottom: '1rem', background: '#eef2ff' }}>
                <strong>AI 生成结果：</strong>
                <pre style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem', maxHeight: '300px', overflow: 'auto' }}>{formData.aiResult}</pre>
              </div>
            )}
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(null)}>取消</button>
              {formData.aiResult && (
                <button className="btn btn-primary" onClick={() => parseChaptersAndAdd(selectedVolume.id, formData.aiResult!)}>
                  解析并添加
                </button>
              )}
              <button className="btn btn-primary" onClick={() => {
                const startNum = selectedVolume.chapters.length + 1;
                const count = formData.chapterCount || 10;
                for (let i = 0; i < count; i++) {
                  addChapter(selectedVolume.id, {
                    number: startNum + i,
                    title: `第${startNum + i}章`,
                    wordCount: 0,
                    status: 'draft',
                  });
                }
                setShowModal(null);
              }}>
                批量创建空章节
              </button>
            </div>
          </div>
        </div>
      )}

      {editingChapter && (
        <div className="modal-overlay" onClick={() => setEditingChapter(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>编辑章节</h3>
              <button className="btn btn-secondary btn-small" onClick={() => setEditingChapter(null)}>×</button>
            </div>
            <div className="form-group">
              <label>章节编号</label>
              <input
                type="number"
                value={editingChapter.chapter.number}
                onChange={(e) => setEditingChapter({
                  ...editingChapter,
                  chapter: { ...editingChapter.chapter, number: parseInt(e.target.value) }
                })}
              />
            </div>
            <div className="form-group">
              <label>标题</label>
              <input
                type="text"
                value={editingChapter.chapter.title}
                onChange={(e) => setEditingChapter({
                  ...editingChapter,
                  chapter: { ...editingChapter.chapter, title: e.target.value }
                })}
              />
            </div>
            <div className="form-group">
              <label>章节简介</label>
              <textarea
                value={editingChapter.chapter.summary || ''}
                onChange={(e) => setEditingChapter({
                  ...editingChapter,
                  chapter: { ...editingChapter.chapter, summary: e.target.value }
                })}
              />
            </div>
            <div className="form-group">
              <label>状态</label>
              <select
                value={editingChapter.chapter.status}
                onChange={(e) => setEditingChapter({
                  ...editingChapter,
                  chapter: { ...editingChapter.chapter, status: e.target.value as any }
                })}
              >
                <option value="draft">草稿</option>
                <option value="writing">写作中</option>
                <option value="completed">已完成</option>
              </select>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditingChapter(null)}>取消</button>
              <button className="btn btn-primary" onClick={() => {
                updateChapter(editingChapter.volume.id, editingChapter.chapter.id, editingChapter.chapter);
                setEditingChapter(null);
              }}>保存</button>
            </div>
          </div>
        </div>
      )}

      {showModal === 'volumeOutline' && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3>AI 生成卷纲</h3>
              <button className="btn btn-secondary btn-small" onClick={() => setShowModal(null)}>×</button>
            </div>
            <div className="form-group">
              <label>卷纲内容提示（可选）</label>
              <textarea
                value={volumeOutlineContent}
                onChange={(e) => setVolumeOutlineContent(e.target.value)}
                placeholder="输入卷纲的大致内容，例如：主角踏上复仇之路，遇到了新的伙伴，发现了更大的阴谋..."
                style={{ minHeight: '100px' }}
              />
            </div>
            <div className="form-group">
              <label>写作手法</label>
              <select
                value={selectedWritingTechnique}
                onChange={(e) => setSelectedWritingTechnique(e.target.value)}
              >
                <option value="unspecified">未指定</option>
                <option value="three_act_structure">三幕式结构</option>
                <option value="hook">钩子式</option>
                <option value="in_media_res">开门见山</option>
                <option value="frame_story">框架故事</option>
                <option value="nonlinear">非线性叙事</option>
              </select>
            </div>
            <div className="form-group">
              <label>写作手法说明</label>
              <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '4px', fontSize: '0.9rem' }}>
                {selectedWritingTechnique === 'three_act_structure' && (
                  <div>
                    <strong>三幕式结构：</strong>分为开头、中段和结尾。开头介绍人物和冲突，中段发展情节和增加张力，结尾解决冲突。
                  </div>
                )}
                {selectedWritingTechnique === 'hook' && (
                  <div>
                    <strong>钩子式：</strong>以引人入胜的场景或问题开头，立即抓住读者的注意力，激发他们继续阅读的兴趣。
                  </div>
                )}
                {selectedWritingTechnique === 'in_media_res' && (
                  <div>
                    <strong>开门见山：</strong>直接从故事的核心事件开始，不做过多铺垫，让读者迅速进入情节。
                  </div>
                )}
                {selectedWritingTechnique === 'frame_story' && (
                  <div>
                    <strong>框架故事：</strong>通过一个外层故事来引出内层故事，形成嵌套结构，增加故事的层次感。
                  </div>
                )}
                {selectedWritingTechnique === 'nonlinear' && (
                  <div>
                    <strong>非线性叙事：</strong>不按照时间顺序讲述故事，通过闪回、倒叙等手法，增加故事的悬念和复杂度。
                  </div>
                )}
                {selectedWritingTechnique === 'unspecified' && (
                  <div>
                    <strong>未指定：</strong>由AI根据内容自行选择合适的写作手法。
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(null)}>取消</button>
              <button className="btn btn-primary" onClick={handleGenerateVolumeOutlineConfirm} disabled={isGenerating}>
                {isGenerating ? '生成中...' : '生成卷纲'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal === 'outlineGenerator' && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3>AI 生成大纲</h3>
              <button className="btn btn-secondary btn-small" onClick={() => setShowModal(null)}>×</button>
            </div>
            <div className="form-group">
              <label>大纲内容提示（可选）</label>
              <textarea
                value={outlineContent}
                onChange={(e) => setOutlineContent(e.target.value)}
                placeholder="输入大纲的大致内容，例如：一个平凡少年意外获得修仙机会，经历各种挑战，最终成为一代仙尊..."
                style={{ minHeight: '100px' }}
              />
            </div>
            <div className="form-group">
              <label>写作手法</label>
              <select
                value={selectedOutlineWritingTechnique}
                onChange={(e) => setSelectedOutlineWritingTechnique(e.target.value)}
              >
                <option value="unspecified">未指定</option>
                <option value="three_act_structure">三幕式结构</option>
                <option value="hook">钩子式</option>
                <option value="in_media_res">开门见山</option>
                <option value="frame_story">框架故事</option>
                <option value="nonlinear">非线性叙事</option>
              </select>
            </div>
            <div className="form-group">
              <label>写作手法说明</label>
              <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '4px', fontSize: '0.9rem' }}>
                {selectedOutlineWritingTechnique === 'three_act_structure' && (
                  <div>
                    <strong>三幕式结构：</strong>分为开头、中段和结尾。开头介绍人物和冲突，中段发展情节和增加张力，结尾解决冲突。
                  </div>
                )}
                {selectedOutlineWritingTechnique === 'hook' && (
                  <div>
                    <strong>钩子式：</strong>以引人入胜的场景或问题开头，立即抓住读者的注意力，激发他们继续阅读的兴趣。
                  </div>
                )}
                {selectedOutlineWritingTechnique === 'in_media_res' && (
                  <div>
                    <strong>开门见山：</strong>直接从故事的核心事件开始，不做过多铺垫，让读者迅速进入情节。
                  </div>
                )}
                {selectedOutlineWritingTechnique === 'frame_story' && (
                  <div>
                    <strong>框架故事：</strong>通过一个外层故事来引出内层故事，形成嵌套结构，增加故事的层次感。
                  </div>
                )}
                {selectedOutlineWritingTechnique === 'nonlinear' && (
                  <div>
                    <strong>非线性叙事：</strong>不按照时间顺序讲述故事，通过闪回、倒叙等手法，增加故事的悬念和复杂度。
                  </div>
                )}
                {selectedOutlineWritingTechnique === 'unspecified' && (
                  <div>
                    <strong>未指定：</strong>由AI根据内容自行选择合适的写作手法。
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(null)}>取消</button>
              <button className="btn btn-primary" onClick={handleGenerateOutlineConfirm} disabled={isGenerating}>
                {isGenerating ? '生成中...' : '生成大纲'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
