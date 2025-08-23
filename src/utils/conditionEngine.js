// 빠른 규칙 기반 조건 평가 엔진
export class ConditionEngine {
  static evaluateCondition(inputData, conditionType, conditionValue) {
    const text = String(inputData).toLowerCase();
    const value = String(conditionValue).toLowerCase();

    switch (conditionType) {
      case 'contains':
        return text.includes(value);
      
      case 'equals':
        return text === value;
      
      case 'length':
        const lengthThreshold = parseInt(conditionValue) || 0;
        return text.length > lengthThreshold;
      
      case 'number':
        const numInput = parseFloat(inputData);
        const numThreshold = parseFloat(conditionValue);
        return !isNaN(numInput) && !isNaN(numThreshold) && numInput > numThreshold;
      
      case 'starts':
        return text.startsWith(value);
      
      case 'empty':
        return !text.trim();
      
      default:
        return false;
    }
  }

  static getConditionDescription(conditionType, conditionValue) {
    switch (conditionType) {
      case 'contains':
        return `'${conditionValue}' 포함`;
      case 'equals':
        return `'${conditionValue}'와 같음`;
      case 'length':
        return `길이가 ${conditionValue}보다 큼`;
      case 'number':
        return `${conditionValue}보다 큰 숫자`;
      case 'starts':
        return `'${conditionValue}'로 시작`;
      case 'empty':
        return '비어있음';
      default:
        return '조건 없음';
    }
  }
}