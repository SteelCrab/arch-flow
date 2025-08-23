// 조건 평가 엔진
export class ConditionEvaluator {
  static async evaluateCondition(inputData, conditionPrompt, apiKey) {
    if (!conditionPrompt.trim()) return true;

    const prompt = `
입력 데이터: "${inputData}"

조건: ${conditionPrompt}

위 조건을 평가하여 True 또는 False로만 답변하세요. 다른 설명은 하지 마세요.
`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 10,
          temperature: 0
        })
      });

      const data = await response.json();
      const result = data.choices[0].message.content.trim().toLowerCase();
      
      return result.includes('true') || result.includes('참');
    } catch (error) {
      console.error('조건 평가 오류:', error);
      return false;
    }
  }

  // 로컬 조건 평가 (API 키 없을 때)
  static evaluateLocalCondition(inputData, conditionPrompt) {
    const text = inputData.toLowerCase();
    const condition = conditionPrompt.toLowerCase();

    // 간단한 키워드 매칭
    if (condition.includes('개') || condition.includes('강아지')) {
      return text.includes('개') || text.includes('강아지') || text.includes('멍멍');
    }
    
    if (condition.includes('고양이') || condition.includes('냥이')) {
      return text.includes('고양이') || text.includes('냥이') || text.includes('야옹');
    }

    if (condition.includes('긴급')) {
      return text.includes('긴급') || text.includes('즉시') || text.includes('빨리');
    }

    if (condition.includes('긍정')) {
      return text.includes('좋') || text.includes('만족') || text.includes('훌륭');
    }

    if (condition.includes('부정')) {
      return text.includes('나쁘') || text.includes('불만') || text.includes('싫');
    }

    // 길이 조건
    if (condition.includes('길면') || condition.includes('긴')) {
      return text.length > 50;
    }

    return false;
  }
}