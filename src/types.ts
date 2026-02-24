export interface CharacterAttribute {
  id: string;
  name: string;
  value: string;
  isGrowing: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Character {
  id: string;
  name: string;
  alias?: string;
  gender?: string;
  age?: string;
  appearance?: string;
  personality?: string;
  background?: string;
  skills?: string;
  relationships?: string;
  role?: 'protagonist' | 'supporting' | 'minor' | 'side' | 'antagonist' | string;
  tags?: string[];
  attributes?: CharacterAttribute[];
  createdAt: number;
  updatedAt: number;
}

export interface Organization {
  id: string;
  name: string;
  type?: string;
  leader?: string;
  members?: string[];
  description?: string;
  history?: string;
  location?: string;
  tags?: string[];
  powerLevel?: number;
  parentOrganizationId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Worldview {
  id: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  summary?: string;
  content?: string;
  wordCount: number;
  status: 'draft' | 'writing' | 'completed';
  createdAt: number;
  updatedAt: number;
}

export interface Volume {
  id: string;
  number: number;
  title: string;
  summary?: string;
  chapters: Chapter[];
  createdAt: number;
  updatedAt: number;
}

export interface Outline {
  id: string;
  title: string;
  content: string;
  type: 'main' | 'volume';
  volumeId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface WritingStyle {
  id: string;
  name: string;
  examples: string[];
  isPreset: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Foreshadow {
  id: string;
  title: string;
  description: string;
  volumeId?: string;
  chapterId?: string;
  status: 'set' | 'unresolved' | 'resolved';
  resolvedInChapterId?: string;
  resolvedInVolumeId?: string;
  resolutionDescription?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  genre?: string;
  tags?: string[];
  characters: Character[];
  organizations: Organization[];
  worldviews: Worldview[];
  outlines: Outline[];
  volumes: Volume[];
  writingStyles: WritingStyle[];
  selectedWritingStyleId?: string;
  foreshadows: Foreshadow[];
  createdAt: number;
  updatedAt: number;
}

export interface ApiConfig {
  id: string;
  provider: string;
  apiKey: string;
  baseUrl?: string;
  model?: string;
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface AppState {
  projects: Project[];
  currentProjectId: string | null;
  apiConfigs: ApiConfig[];
}
