import { ApiConfig, Project,  Volume, Chapter, WritingStyle } from './types';

export const generateWithAI = async (
  config: ApiConfig,
  prompt: string,
  onProgress?: (text: string) => void,
  useStream: boolean = true
): Promise<string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.apiKey}`,
  };

  const body = {
    model: config.model || 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: '你是一个专业的小说创作助手，帮助用户创作各种类型的小说。' },
      { role: 'user', content: prompt },
    ],
    stream: !!onProgress && useStream,
  };

  try {
      let baseUrl = config.baseUrl || 'https://api.openai.com';
      if (baseUrl.endsWith('/v1')) {
        baseUrl = baseUrl.substring(0, baseUrl.length - 3);
      }
      const response = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status}`);
    }

    if (onProgress && useStream) {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let result = '';
      // let inReasoning = false; // 标记当前是否处于模型"思考"阶段，用于过滤 reasoning_content

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim() && !line.includes('[DONE]'));
          for (const line of lines) {
            try {
              const data = JSON.parse(line.replace('data: ', ''));
              const delta = data.choices[0]?.delta;
              
              // if (delta?.reasoning_content) {
              //   inReasoning = true;
              //   continue;
              // }
              
              if (delta?.content) {
                // inReasoning = false;
                result += delta.content;
                onProgress(result);
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
      return result;
    } else {
      const data = await response.json();
      const message = data.choices[0]?.message;
      
      if (message?.reasoning_content) {
        console.log('检测到深度思考过程，已过滤');
      }
      
      return message?.content || '';
    }
  } catch (error) {
    console.error('AI 生成失败:', error);
    throw error;
  }
};

export const buildProjectContext = (project: Project, volume?: Volume) => {
  const parts: string[] = [];
  parts.push(`小说名称: ${project.name}`);
  if (project.description) parts.push(`简介: ${project.description}`);
  if (project.genre) parts.push(`类型: ${project.genre}`);

  if (project.characters.length > 0) {
    parts.push('\n【人物设定】');
    project.characters.forEach(char => {
      parts.push(`- ${char.name}`);
      if (char.role) {
        const roleMap: Record<string, string> = {
          'protagonist': '主角',
          'supporting': '主角团角色',
          'minor': '次要角色',
          'side': '配角',
          'antagonist': '反派'
        };
        parts.push(`  角色定位: ${roleMap[char.role] || char.role}`);
      }
      if (char.tags && char.tags.length > 0) {
        parts.push(`  标签: ${char.tags.join(', ')}`);
      }
      if (char.attributes && char.attributes.length > 0) {
        parts.push(`  属性:`);
        char.attributes.forEach(attr => {
          if (attr.isGrowing) {
            parts.push(`    - ${attr.name}: ${attr.value} (此属性可随剧情发展而成长变化)`);
          } else {
            parts.push(`    - ${attr.name}: ${attr.value}`);
          }
        });
      }
      if (char.personality) parts.push(`  性格: ${char.personality}`);
      if (char.background) parts.push(`  背景: ${char.background}`);
      if (char.appearance) parts.push(`  外貌: ${char.appearance}`);
    });
  }

  if (project.organizations.length > 0) {
    parts.push('\n【组织/势力】');
    project.organizations.forEach(org => {
      parts.push(`- ${org.name}`);
      if (org.type) parts.push(`  类型: ${org.type}`);
      if (org.powerLevel) parts.push(`  实力等级: ${org.powerLevel}/10`);
      if (org.parentOrganizationId) {
        const parentOrg = project.organizations.find(pOrg => pOrg.id === org.parentOrganizationId);
        if (parentOrg) {
          parts.push(`  上级势力: ${parentOrg.name}`);
        }
      }
      if (org.leader) parts.push(`  首领: ${org.leader}`);
      if (org.description) parts.push(`  描述: ${org.description}`);
    });
  }

  if (project.worldviews.length > 0) {
    parts.push('\n【世界观设定】');
    project.worldviews.forEach(wv => {
      parts.push(`- ${wv.title}`);
      parts.push(`  ${wv.content}`);
    });
  }

  const unresolvedForeshadows = project.foreshadows.filter(f => f.status !== 'resolved');
  let relevantForeshadows = unresolvedForeshadows;
  if (volume) {
    relevantForeshadows = unresolvedForeshadows.filter(f => 
      !f.volumeId || f.volumeId === volume.id
    );
  }
  
  if (relevantForeshadows.length > 0) {
    parts.push('\n【未回收伏笔】');
    relevantForeshadows.forEach(foreshadow => {
      parts.push(`- ${foreshadow.title}`);
      parts.push(`  ${foreshadow.description}`);
      if (foreshadow.volumeId) {
        const fVolume = project.volumes.find(v => v.id === foreshadow.volumeId);
        if (fVolume) {
          parts.push(`  设置位置: 第${fVolume.number}卷${foreshadow.chapterId ? fVolume.chapters.find(c => c.id === foreshadow.chapterId) ? `第${fVolume.chapters.find(c => c.id === foreshadow.chapterId)?.number}章` : '' : ''}`);
        }
      }
    });
  }

  if (project.outlines.length > 0) {
    parts.push('\n【大纲】');
    project.outlines.forEach(outline => {
      parts.push(`- ${outline.title}`);
      parts.push(`  ${outline.content}`);
    });
  }

  if (volume?.summary) {
    parts.push(`\n【卷纲】`);
    parts.push(`第${volume.number}卷: ${volume.title}`);
    parts.push(`  ${volume.summary}`);
  }

  return parts.join('\n');
};

export const generateCharacterPrompt = (project: Project, hints?: string, role?: string, tags?: string[]) => {
  const context = buildProjectContext(project);
  let roleHint = '';
  if (role) {
    const roleMap: Record<string, string> = {
      'protagonist': '主角',
      'supporting': '主角团角色',
      'minor': '次要角色',
      'side': '配角',
      'antagonist': '反派'
    };
    roleHint = `角色定位: ${roleMap[role] || role}`;
  }
  
  let tagsHint = '';
  if (tags && tags.length > 0) {
    tagsHint = `标签: ${tags.join(', ')}`;
  }
  
  return `${context}

请基于以上设定，生成一个新的人物设定。

${roleHint ? `\n${roleHint}` : ''}
${tagsHint ? `\n${tagsHint}` : ''}

**返回格式要求**：
请严格按照以下JSON格式返回，不要有任何其他文字：
{
  "name": "人物姓名",
  "alias": "别名",
  "gender": "性别",
  "age": "年龄",
  "appearance": "外貌描述",
  "personality": "性格描述",
  "background": "背景故事",
  "skills": "技能",
  "relationships": "关系"
}

${hints ? `补充要求: ${hints}` : ''}

**重要**：只返回有效的JSON数据，不要包含其他说明文字。`;
};

export const generateWorldviewPrompt = (project: Project, category?: string, hints?: string) => {
  const context = buildProjectContext(project);
  return `${context}

请基于以上设定，生成一个新的世界观设定${category ? `，分类为"${category}"` : ''}。
${hints ? `补充要求: ${hints}` : ''}
请包含标题和详细内容。`;
};

export const generateOutlinePrompt = (project: Project, hints?: string, outlineContent?: string, selectedWritingTechnique?: string) => {
  const context = buildProjectContext(project);
  
  let writingTechniqueHint = '';
  if (selectedWritingTechnique && selectedWritingTechnique !== 'unspecified') {
    const techniqueMap: Record<string, string> = {
      'three_act_structure': '三幕式结构',
      'hook': '钩子式',
      'in_media_res': '开门见山',
      'frame_story': '框架故事',
      'nonlinear': '非线性叙事'
    };
    writingTechniqueHint = `写作手法: ${techniqueMap[selectedWritingTechnique] || selectedWritingTechnique}`;
  }
  
  return `${context}

请基于以上设定，生成一份完整的小说大纲。
${outlineContent ? `大纲内容提示: ${outlineContent}` : ''}
${writingTechniqueHint ? `
${writingTechniqueHint}` : ''}
${hints ? `
补充要求: ${hints}` : ''}
请包含主要情节线、关键事件、故事结构等。`;
};

export const generateVolumeOutlinePrompt = (project: Project, volumeNumber: number, hints?: string, volumeOutlineContent?: string, selectedWritingTechnique?: string) => {
  const context = buildProjectContext(project);
  
  let writingTechniqueHint = '';
  if (selectedWritingTechnique && selectedWritingTechnique !== 'unspecified') {
    const techniqueMap: Record<string, string> = {
      'three_act_structure': '三幕式结构',
      'hook': '钩子式',
      'in_media_res': '开门见山',
      'frame_story': '框架故事',
      'nonlinear': '非线性叙事'
    };
    writingTechniqueHint = `写作手法: ${techniqueMap[selectedWritingTechnique] || selectedWritingTechnique}`;
  }
  
  return `${context}

请基于以上设定，为第${volumeNumber}卷生成一份卷纲。
${volumeOutlineContent ? `卷纲内容提示: ${volumeOutlineContent}` : ''}
${writingTechniqueHint ? `
${writingTechniqueHint}` : ''}
${hints ? `
补充要求: ${hints}` : ''}
请包含本卷的主要剧情、关键事件、人物发展等。

【格式要求】
请使用以下格式生成卷纲，每部分描述一个段落或章节范围的内容：

- 第X章-第Y章：描述此范围内的大致剧情内容
- 第Y+1章-第Z章：描述此范围内的大致剧情内容
- ...

注意：不需要详细到每一章，只需要描述章节范围和大致内容即可。`;
};

export const generateChaptersPrompt = (project: Project, volume: Volume, chapterCount: number, hints?: string) => {
  const context = buildProjectContext(project);
  return `${context}

【第${volume.number}卷】${volume.title}
${volume.summary ? `卷纲: ${volume.summary}` : ''}

请为这一卷生成${chapterCount}个章节，严格按照以下 JSON 格式返回：

{
  "chapters": [
    {
      "number": 1,
      "title": "章节标题",
      "summary": "章节简介"
    },
    {
      "number": 2,
      "title": "章节标题",
      "summary": "章节简介"
    }
  ]
}

${hints ? `补充要求: ${hints}` : ''}

请确保返回的是有效的 JSON 格式，只包含章节信息，不要有其他文字。`;
};

export const generateChapterContentPrompt = (project: Project, volume: Volume, chapter: Chapter, hints?: string, wordCount?: string, writingStyle?: WritingStyle) => {
  const context = buildProjectContext(project, volume);
  let previousContent = '';
  const allChapters = volume.chapters.sort((a, b) => a.number - b.number);
  const prevChapter = allChapters.find(c => c.number === chapter.number - 1);
  const nextChapter = allChapters.find(c => c.number === chapter.number + 1);
  
  if (prevChapter?.content) {
    previousContent = `\n\n【上一章完整内容】\n${prevChapter.content}`;
  }

  let nextChapterHint = '';
  if (nextChapter?.summary) {
    nextChapterHint = `\n\n【下一章预告】
第${nextChapter.number}章: ${nextChapter.title}
简介: ${nextChapter.summary}

重要：请在本章结尾处为下一章的情节做好铺垫，确保章节之间自然过渡和衔接。`;
  }

  let wordCountHint = '';
  if (wordCount && !isNaN(Number(wordCount)) && Number(wordCount) > 0) {
    wordCountHint = `\n- 字数控制在约${wordCount}字左右`;
  }

  let writingStyleHint = '';
  if (writingStyle && writingStyle.examples.length > 0) {
    writingStyleHint = `\n\n【文笔风格要求】
请参考以下例句的写作风格进行创作：
${writingStyle.examples.map((example, i) => `${i + 1}. ${example}`).join('\n')}`;
  }

  const growingCharacters = project.characters.filter(char => 
    char.attributes && char.attributes.some(attr => attr.isGrowing)
  );

  const unresolvedForeshadows = project.foreshadows.filter(f => f.status !== 'resolved');

  let attributeGrowthHint = '';
  if (growingCharacters.length > 0) {
    attributeGrowthHint = `\n\n【属性成长追踪】
以下人物有"随主线成长"的属性，请在创作过程中留意这些属性的变化：
${growingCharacters.map(char => {
  const growingAttrs = char.attributes?.filter(attr => attr.isGrowing) || [];
  return `- ${char.name}: ${growingAttrs.map(attr => `${attr.name} (当前: ${attr.value})`).join(', ')}`;
}).join('\n')}

如果在本章节中，某个可成长属性发生了变化，请在返回结果中包含属性更新信息。`;
  }

  return `${context}${previousContent}

【当前章节】
第${volume.number}卷: ${volume.title}
第${chapter.number}章: ${chapter.title}
${chapter.summary ? `章节简介: ${chapter.summary}` : ''}
${nextChapterHint}

重要提示：
1. 请仔细阅读上一章内容，确保当前章节与上一章内容连贯
2. 严格按照小说设定（世界观、人物、大纲、卷纲等）进行创作
3. 保持人物性格一致，符合设定
4. 遵循世界观设定，不要出现设定外的内容
5. 保持文笔风格统一
6. 如果有下一章预告，请在本章结尾处为下一章的情节做好铺垫${writingStyleHint}${attributeGrowthHint}

请为当前章节撰写正文内容，要求：
- 内容连贯，与上一章自然衔接
- 符合人物性格和世界观设定
- 文笔流畅，情节合理
- 内容详细，有画面感${wordCountHint}
${hints ? `\n\n【特别要求】\n${hints}` : ''}

【返回格式】
请优先尝试以下JSON格式返回：
\`\`\`json
[
  {
    "type": "content",
    "data": "章节正文内容"
  }${growingCharacters.length > 0 ? `,
  {
    "type": "attribute_update",
    "data": [
      {
        "characterName": "人物姓名",
        "attributeName": "属性名称",
        "newValue": "新的属性值"
      }
    ]
  }` : ''}${unresolvedForeshadows.length > 0 ? `,
  {
    "type": "foreshadow_resolve",
    "data": [
      {
        "foreshadowTitle": "伏笔标题",
        "resolutionDescription": "伏笔回收说明"
      }
    ]
  }` : ''}
]
\`\`\`

如果无法使用JSON格式，请直接返回正文内容即可。

【属性更新说明】
${growingCharacters.length > 0 ? `如果在本章节中任何可成长属性发生了变化，请在JSON中包含attribute_update项，并在data数组中列出所有发生变化的属性。如果没有属性变化，只返回content项即可。

重要：
- 如果有多个人物的属性发生变化，都要包含在attribute_update中
- 如果同一个人物有多个属性发生变化，也要全部列出
- 只有标记为"随主线成长"的属性才需要更新` : '本章节没有需要追踪的成长属性。'}

【伏笔回收说明】
${unresolvedForeshadows.length > 0 ? `如果在本章节中某个未回收的伏笔得到了解答或回收，请在JSON中包含foreshadow_resolve项，并在data数组中列出所有被回收的伏笔。如果没有伏笔回收，只返回content项即可。

重要：
- 如果有多个伏笔被回收，都要包含在foreshadow_resolve中
- 请在resolutionDescription中说明伏笔是如何被回收的` : '本章节没有需要追踪的未回收伏笔。'}`;
};

export const generateOptimizeContentPrompt = (originalContent: string, writingStyle: WritingStyle, hints?: string) => {
  return `请优化以下文章，使其符合参考的文笔风格。

【参考的文笔风格例句】：
${writingStyle.examples.map((example, i) => `${i + 1}. ${example}`).join('\n')}

【原文】：
${originalContent}

${hints ? `【特别要求（优先度最高）】：
${hints}

` : ''}请根据以上参考例句的风格，优化原文。要求：
1. 保持原文的核心内容和情节不变
2. 调整文笔风格，使其与参考例句一致
3. 优化后的内容要流畅自然
4. 只返回优化后的内容，不要包含其他解释文字`;
};

export const generateForeshadowsPrompt = (project: Project, volume?: Volume, count?: number, hints?: string) => {
  const context = buildProjectContext(project, volume);
  return `${context}

请基于以上设定，为小说生成${count || 3}个伏笔。

要求：
1. 每个伏笔都要有一个清晰的标题
2. 详细描述伏笔的内容和设置方式
3. 伏笔要巧妙自然，不显得生硬
4. 伏笔要有后续回收的可能性
${hints ? `\n补充要求: ${hints}` : ''}

请严格按照以下JSON格式返回：
{
  "foreshadows": [
    {
      "title": "伏笔标题",
      "description": "伏笔详细描述"
    }
  ]
}

只返回JSON，不要包含其他文字。`;
};

export const generateOrganizationPrompt = (project: Project, hints?: string, powerLevel?: number, parentOrganizationId?: string) => {
  const context = buildProjectContext(project);
  
  let powerLevelHint = '';
  if (powerLevel) {
    powerLevelHint = `实力等级: ${powerLevel}/10`;
  }
  
  let parentOrgHint = '';
  if (parentOrganizationId) {
    const parentOrg = project.organizations.find(org => org.id === parentOrganizationId);
    if (parentOrg) {
      parentOrgHint = `上级势力: ${parentOrg.name}`;
    }
  }
  
  return `${context}

请基于以上设定，生成一个新的组织/势力设定。

${powerLevelHint ? `\n${powerLevelHint}` : ''}
${parentOrgHint ? `\n${parentOrgHint}` : ''}

**返回格式要求**：
请严格按照以下JSON格式返回，不要有任何其他文字：
{
  "name": "组织名称",
  "type": "组织类型",
  "leader": "首领",
  "members": "成员",
  "description": "描述",
  "history": "历史",
  "location": "地点"
}

${hints ? `补充要求: ${hints}` : ''}

**重要**：只返回有效的JSON数据，不要包含其他说明文字。`;
};
