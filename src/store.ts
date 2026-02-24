import React, { useState, useEffect, createContext, useContext } from 'react';
import { AppState, Project, Character, Organization, Worldview, Outline, Volume, Chapter, ApiConfig, WritingStyle, Foreshadow } from './types';
import { getItem, setItem } from './localStorageService.ts';

const STORAGE_KEY = 'ai_author_data';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const getInitialState = (): AppState => {
  try {
    // 初始状态，后续会通过异步加载更新
    return {
      projects: [],
      currentProjectId: null,
      apiConfigs: [],
    };
  } catch (e) {
    console.error('Failed to initialize state:', e);
    return {
      projects: [],
      currentProjectId: null,
      apiConfigs: [],
    };
  }
};

const saveState = async (state: AppState) => {
  try {
    console.log('=== [store.ts] Saving state to storage... ===');
    console.log('State to save:', { 
      projectsCount: state.projects.length, 
      currentProjectId: state.currentProjectId,
      apiConfigsCount: state.apiConfigs.length
    });
    console.log('STORAGE_KEY:', STORAGE_KEY);
    await setItem(STORAGE_KEY, state);
    console.log('=== [store.ts] State saved successfully ===');
  } catch (e) {
    console.error('=== [store.ts] Failed to save data ===', e);
  }
};

const getPresetWritingStyles = (): WritingStyle[] => {
  const now = Date.now();
  return [
    {
      id: generateId(),
      name: '传统',
      examples: [
        '那是一个黄昏，夕阳将整个城市染成一片金红。',
        '岁月如梭，时光荏苒，转眼间已是数载春秋。',
        '此去经年，应是良辰好景虚设。'
      ],
      isPreset: true,
      createdAt: now,
      updatedAt: now
    },
    {
      id: generateId(),
      name: '古风',
      examples: [
        '暮春三月，江南草长，杂花生树，群莺乱飞。',
        '烟柳画桥，风帘翠幕，参差十万人家。',
        '青山依旧在，几度夕阳红。'
      ],
      isPreset: true,
      createdAt: now,
      updatedAt: now
    },
    {
      id: generateId(),
      name: '现代',
      examples: [
        '城市的霓虹灯闪烁，车流不息。',
        '手机屏幕亮起，是一条新的消息。',
        '他推了推眼镜，继续盯着电脑屏幕。'
      ],
      isPreset: true,
      createdAt: now,
      updatedAt: now
    },
    {
      id: generateId(),
      name: '网文',
      examples: [
        '我的天呐，这竟然是传说中的上古神器！',
        '就在此时，一道惊天动地的巨响传来。',
        '他的眼中闪过一丝寒芒，嘴角微微上扬。'
      ],
      isPreset: true,
      createdAt: now,
      updatedAt: now
    }
  ];
};

interface StoreContextType {
  state: AppState;
  setState: (state: AppState) => void;
  currentProject: Project | null;
  createProject: (projectData: { name: string; description?: string; genre?: string }) => Project;
  addProject: (project: Project) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  selectProject: (id: string | null) => void;
  addCharacter: (character: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>) => Character;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;
  addOrganization: (org: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>) => Organization;
  updateOrganization: (id: string, updates: Partial<Organization>) => void;
  deleteOrganization: (id: string) => void;
  addWorldview: (worldview: Omit<Worldview, 'id' | 'createdAt' | 'updatedAt'>) => Worldview;
  updateWorldview: (id: string, updates: Partial<Worldview>) => void;
  deleteWorldview: (id: string) => void;
  addOutline: (outline: Omit<Outline, 'id' | 'createdAt' | 'updatedAt'>) => Outline;
  updateOutline: (id: string, updates: Partial<Outline>) => void;
  deleteOutline: (id: string) => void;
  addVolume: (volume: Omit<Volume, 'id' | 'chapters' | 'createdAt' | 'updatedAt'>) => Volume;
  updateVolume: (id: string, updates: Partial<Volume>) => void;
  deleteVolume: (id: string) => void;
  addChapter: (volumeId: string, chapter: Omit<Chapter, 'id' | 'createdAt' | 'updatedAt'>) => Chapter;
  updateChapter: (volumeId: string, chapterId: string, updates: Partial<Chapter>) => void;
  deleteChapter: (volumeId: string, chapterId: string) => void;
  addWritingStyle: (style: Omit<WritingStyle, 'id' | 'createdAt' | 'updatedAt'>) => WritingStyle;
  updateWritingStyle: (id: string, updates: Partial<WritingStyle>) => void;
  deleteWritingStyle: (id: string) => void;
  selectWritingStyle: (styleId: string | null) => void;
  addForeshadow: (foreshadow: Omit<Foreshadow, 'id' | 'createdAt' | 'updatedAt'>) => Foreshadow;
  updateForeshadow: (id: string, updates: Partial<Foreshadow>) => void;
  deleteForeshadow: (id: string) => void;
  addApiConfig: (config: Omit<ApiConfig, 'id' | 'createdAt' | 'updatedAt'>) => ApiConfig;
  updateApiConfig: (id: string, updates: Partial<ApiConfig>) => void;
  deleteApiConfig: (id: string) => void;
  getDefaultApiConfig: () => ApiConfig | null;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AppState>(getInitialState);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // 异步加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('=== [store.ts] Loading data... ===');
        console.log('STORAGE_KEY:', STORAGE_KEY);
        const saved = await getItem(STORAGE_KEY);
        console.log('=== [store.ts] Loaded data:', saved ? { projectsCount: saved.projects?.length } : null, '===');
        if (saved) {
          // 数据迁移：为已有项目添加默认的writingStyles
          if (saved.projects && Array.isArray(saved.projects)) {
            saved.projects = saved.projects.map((project: any) => {
              const newProject = { ...project };
              if (!newProject.writingStyles) {
                newProject.writingStyles = getPresetWritingStyles();
                newProject.selectedWritingStyleId = undefined;
              }
              if (!newProject.foreshadows) {
                newProject.foreshadows = [];
              }
              return newProject;
            });
          }
          setState(saved);
          console.log('=== [store.ts] State updated from loaded data ===');
        } else {
          console.log('=== [store.ts] No saved data found ===');
        }
      } catch (e) {
        console.error('=== [store.ts] Failed to load data ===', e);
      } finally {
        setIsDataLoaded(true);
        console.log('=== [store.ts] Data loading complete, isDataLoaded set to true ===');
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    // 只有在数据加载完成后才开始保存
    if (!isDataLoaded) {
      console.log('=== [store.ts] Skipping save - data not loaded yet ===');
      return;
    }

    console.log('=== [store.ts] Data loaded, starting to watch for state changes ===');
    
    // 状态变化时保存数据
    const saveTimeout = setTimeout(() => {
      saveState(state);
    }, 100); // 防抖，避免频繁保存
    
    // 组件卸载时保存数据
    return () => {
      clearTimeout(saveTimeout);
      console.log('Component unmounting, saving final state...');
      saveState(state);
    };
  }, [state, isDataLoaded]);

  // 在 Electron 环境中，监听窗口关闭事件，确保数据保存
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).electron) {
      const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
        console.log('Window closing, saving data...');
        await saveState(state);
        console.log('Data saved before window close');
      };
      
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [state]);

  const currentProject = state.currentProjectId
    ? state.projects.find(p => p.id === state.currentProjectId) || null
    : null;

  const updateProjectState = (updater: (prev: AppState) => AppState) => {
    setState(prev => {
      const newState = updater(prev);
      return {
        ...newState,
        projects: newState.projects.map(p =>
          p.id === newState.currentProjectId ? { ...p, updatedAt: Date.now() } : p
        ),
      };
    });
  };

  const createProject = (projectData: { name: string; description?: string; genre?: string }): Project => {
    const project: Project = {
      id: generateId(),
      name: projectData.name,
      description: projectData.description,
      genre: projectData.genre,
      tags: [],
      characters: [],
      organizations: [],
      worldviews: [],
      outlines: [],
      volumes: [],
      writingStyles: getPresetWritingStyles(),
      selectedWritingStyleId: undefined,
      foreshadows: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    updateProjectState(prev => ({
      ...prev,
      projects: [...prev.projects, project],
      currentProjectId: project.id,
    }));
    return project;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    updateProjectState(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
      ),
    }));
  };

  const deleteProject = (id: string) => {
    updateProjectState(prev => ({
      ...prev,
      projects: prev.projects.filter(p => p.id !== id),
      currentProjectId: prev.currentProjectId === id ? null : prev.currentProjectId,
    }));
  };

  const addProject = (project: Project): Project => {
    updateProjectState(prev => ({
      ...prev,
      projects: [...prev.projects, project],
    }));
    return project;
  };

  const selectProject = (id: string | null) => {
    setState(prev => ({ ...prev, currentProjectId: id }));
  };

  const addCharacter = (character: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>): Character => {
    const newChar: Character = {
      ...character,
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    updateProjectState(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === prev.currentProjectId
          ? { ...p, characters: [...p.characters, newChar] }
          : p
      ),
    }));
    return newChar;
  };

  const updateCharacter = (id: string, updates: Partial<Character>) => {
    updateProjectState(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === prev.currentProjectId
          ? {
              ...p,
              characters: p.characters.map(c =>
                c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c
              ),
            }
          : p
      ),
    }));
  };

  const deleteCharacter = (id: string) => {
    updateProjectState(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === prev.currentProjectId
          ? { ...p, characters: p.characters.filter(c => c.id !== id) }
          : p
      ),
    }));
  };

  const addOrganization = (org: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): Organization => {
    const newOrg: Organization = {
      ...org,
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    updateProjectState(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === prev.currentProjectId
          ? { ...p, organizations: [...p.organizations, newOrg] }
          : p
      ),
    }));
    return newOrg;
  };

  const updateOrganization = (id: string, updates: Partial<Organization>) => {
    updateProjectState(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === prev.currentProjectId
          ? {
              ...p,
              organizations: p.organizations.map(o =>
                o.id === id ? { ...o, ...updates, updatedAt: Date.now() } : o
              ),
            }
          : p
      ),
    }));
  };

  const deleteOrganization = (id: string) => {
    updateProjectState(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === prev.currentProjectId
          ? { ...p, organizations: p.organizations.filter(o => o.id !== id) }
          : p
      ),
    }));
  };

  const addWorldview = (worldview: Omit<Worldview, 'id' | 'createdAt' | 'updatedAt'>): Worldview => {
    const newWv: Worldview = {
      ...worldview,
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    updateProjectState(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === prev.currentProjectId
          ? { ...p, worldviews: [...p.worldviews, newWv] }
          : p
      ),
    }));
    return newWv;
  };

  const updateWorldview = (id: string, updates: Partial<Worldview>) => {
    updateProjectState(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === prev.currentProjectId
          ? {
              ...p,
              worldviews: p.worldviews.map(w =>
                w.id === id ? { ...w, ...updates, updatedAt: Date.now() } : w
              ),
            }
          : p
      ),
    }));
  };

  const deleteWorldview = (id: string) => {
    updateProjectState(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === prev.currentProjectId
          ? { ...p, worldviews: p.worldviews.filter(w => w.id !== id) }
          : p
      ),
    }));
  };

  const addOutline = (outline: Omit<Outline, 'id' | 'createdAt' | 'updatedAt'>): Outline => {
    const newOutline: Outline = {
      ...outline,
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    updateProjectState(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === prev.currentProjectId
          ? { ...p, outlines: [...p.outlines, newOutline] }
          : p
      ),
    }));
    return newOutline;
  };

  const updateOutline = (id: string, updates: Partial<Outline>) => {
    updateProjectState(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === prev.currentProjectId
          ? {
              ...p,
              outlines: p.outlines.map(o =>
                o.id === id ? { ...o, ...updates, updatedAt: Date.now() } : o
              ),
            }
          : p
      ),
    }));
  };

  const deleteOutline = (id: string) => {
    updateProjectState(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === prev.currentProjectId
          ? { ...p, outlines: p.outlines.filter(o => o.id !== id) }
          : p
      ),
    }));
  };

  const addVolume = (volume: Omit<Volume, 'id' | 'chapters' | 'createdAt' | 'updatedAt'>): Volume => {
    const newVolume: Volume = {
      ...volume,
      id: generateId(),
      chapters: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    updateProjectState(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === prev.currentProjectId
          ? { ...p, volumes: [...p.volumes, newVolume] }
          : p
      ),
    }));
    return newVolume;
  };

  const updateVolume = (id: string, updates: Partial<Volume>) => {
    updateProjectState(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === prev.currentProjectId
          ? {
              ...p,
              volumes: p.volumes.map(v =>
                v.id === id ? { ...v, ...updates, updatedAt: Date.now() } : v
              ),
            }
          : p
      ),
    }));
  };

  const deleteVolume = (id: string) => {
    updateProjectState(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === prev.currentProjectId
          ? { ...p, volumes: p.volumes.filter(v => v.id !== id) }
          : p
      ),
    }));
  };

  const addChapter = (volumeId: string, chapter: Omit<Chapter, 'id' | 'createdAt' | 'updatedAt'>): Chapter => {
    const newChapter: Chapter = {
      ...chapter,
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    updateProjectState(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === prev.currentProjectId
          ? {
              ...p,
              volumes: p.volumes.map(v =>
                v.id === volumeId
                  ? { ...v, chapters: [...v.chapters, newChapter], updatedAt: Date.now() }
                  : v
              ),
            }
          : p
      ),
    }));
    return newChapter;
  };

  const updateChapter = (volumeId: string, chapterId: string, updates: Partial<Chapter>) => {
    updateProjectState(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === prev.currentProjectId
          ? {
              ...p,
              volumes: p.volumes.map(v =>
                v.id === volumeId
                  ? {
                      ...v,
                      chapters: v.chapters.map(c =>
                        c.id === chapterId ? { ...c, ...updates, updatedAt: Date.now() } : c
                      ),
                    }
                  : v
              ),
            }
          : p
      ),
    }));
  };

  const deleteChapter = (volumeId: string, chapterId: string) => {
    updateProjectState(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === prev.currentProjectId
          ? {
              ...p,
              volumes: p.volumes.map(v =>
                v.id === volumeId
                  ? { ...v, chapters: v.chapters.filter(c => c.id !== chapterId) }
                  : v
              ),
            }
          : p
      ),
    }));
  };

  const addWritingStyle = (style: Omit<WritingStyle, 'id' | 'createdAt' | 'updatedAt'>): WritingStyle => {
    const newStyle: WritingStyle = {
      ...style,
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    updateProjectState(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === prev.currentProjectId
          ? { ...p, writingStyles: [...p.writingStyles, newStyle] }
          : p
      ),
    }));
    return newStyle;
  };

  const updateWritingStyle = (id: string, updates: Partial<WritingStyle>) => {
    updateProjectState(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === prev.currentProjectId
          ? {
              ...p,
              writingStyles: p.writingStyles.map(s =>
                s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s
              ),
            }
          : p
      ),
    }));
  };

  const deleteWritingStyle = (id: string) => {
    updateProjectState(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === prev.currentProjectId
          ? { 
              ...p, 
              writingStyles: p.writingStyles.filter(s => s.id !== id),
              selectedWritingStyleId: p.selectedWritingStyleId === id ? undefined : p.selectedWritingStyleId
            }
          : p
      ),
    }));
  };

  const selectWritingStyle = (styleId: string | null) => {
    updateProjectState(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === prev.currentProjectId
          ? { ...p, selectedWritingStyleId: styleId || undefined }
          : p
      ),
    }));
  };

  const addForeshadow = (foreshadow: Omit<Foreshadow, 'id' | 'createdAt' | 'updatedAt'>): Foreshadow => {
    const newForeshadow: Foreshadow = {
      ...foreshadow,
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    updateProjectState(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === prev.currentProjectId
          ? { ...p, foreshadows: [...p.foreshadows, newForeshadow] }
          : p
      ),
    }));
    return newForeshadow;
  };

  const updateForeshadow = (id: string, updates: Partial<Foreshadow>) => {
    updateProjectState(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === prev.currentProjectId
          ? {
              ...p,
              foreshadows: p.foreshadows.map(f =>
                f.id === id ? { ...f, ...updates, updatedAt: Date.now() } : f
              ),
            }
          : p
      ),
    }));
  };

  const deleteForeshadow = (id: string) => {
    updateProjectState(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === prev.currentProjectId
          ? { ...p, foreshadows: p.foreshadows.filter(f => f.id !== id) }
          : p
      ),
    }));
  };

  const addApiConfig = (config: Omit<ApiConfig, 'id' | 'createdAt' | 'updatedAt'>): ApiConfig => {
    const newConfig: ApiConfig = {
      ...config,
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setState(prev => ({
      ...prev,
      apiConfigs: config.isDefault
        ? [...prev.apiConfigs.map(c => ({ ...c, isDefault: false })), newConfig]
        : [...prev.apiConfigs, newConfig],
    }));
    return newConfig;
  };

  const updateApiConfig = (id: string, updates: Partial<ApiConfig>) => {
    setState(prev => {
      let newConfigs = prev.apiConfigs.map(c =>
        c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c
      );
      if (updates.isDefault) {
        newConfigs = newConfigs.map(c =>
          c.id === id ? c : { ...c, isDefault: false }
        );
      }
      return { ...prev, apiConfigs: newConfigs };
    });
  };

  const deleteApiConfig = (id: string) => {
    setState(prev => ({
      ...prev,
      apiConfigs: prev.apiConfigs.filter(c => c.id !== id),
    }));
  };

  const getDefaultApiConfig = () => {
    return state.apiConfigs.find(c => c.isDefault) || state.apiConfigs[0] || null;
  };

  return React.createElement(
    StoreContext.Provider,
    {
      value: {
        state,
        setState,
        currentProject,
        createProject,
        addProject,
        updateProject,
        deleteProject,
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
        deleteOutline,
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
        addApiConfig,
        updateApiConfig,
        deleteApiConfig,
        getDefaultApiConfig,
      },
    },
    children
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
