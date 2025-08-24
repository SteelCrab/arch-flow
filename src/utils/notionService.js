// Notion API 서비스
export class NotionService {
  static async createPage(apiToken, parentId, title, content) {
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        parent: {
          type: 'page_id',
          page_id: parentId
        },
        properties: {
          title: {
            title: [
              {
                text: {
                  content: title
                }
              }
            ]
          }
        },
        children: [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: content
                  }
                }
              ]
            }
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Notion API 오류: ${error.message}`);
    }

    return await response.json();
  }

  static async updatePage(apiToken, pageId, title, content) {
    // 페이지 제목 업데이트
    const titleResponse = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        properties: {
          title: {
            title: [
              {
                text: {
                  content: title
                }
              }
            ]
          }
        }
      })
    });

    if (!titleResponse.ok) {
      const error = await titleResponse.json();
      throw new Error(`페이지 제목 업데이트 오류: ${error.message}`);
    }

    // 페이지 내용 추가
    const contentResponse = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        children: [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: content
                  }
                }
              ]
            }
          }
        ]
      })
    });

    if (!contentResponse.ok) {
      const error = await contentResponse.json();
      throw new Error(`페이지 내용 업데이트 오류: ${error.message}`);
    }

    return await titleResponse.json();
  }

  static async addToDatabase(apiToken, databaseId, title, content, properties = {}) {
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        parent: {
          type: 'database_id',
          database_id: databaseId
        },
        properties: {
          Name: {
            title: [
              {
                text: {
                  content: title
                }
              }
            ]
          },
          ...properties
        },
        children: [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: content
                  }
                }
              ]
            }
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`데이터베이스 추가 오류: ${error.message}`);
    }

    return await response.json();
  }

  static formatNotionId(id) {
    // Notion ID를 올바른 형식으로 변환 (하이픈 제거)
    return id.replace(/-/g, '');
  }

  static validateNotionId(id) {
    // Notion ID 유효성 검사 (32자리 영숫자)
    const cleanId = this.formatNotionId(id);
    return /^[a-f0-9]{32}$/i.test(cleanId);
  }
}