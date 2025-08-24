# AWS Bedrock 설정 가이드

## 🚀 AWS Bedrock AI Agent 블록 설정

Arch Flow의 AI Agent 블록은 AWS Bedrock 서비스를 사용하여 다양한 파운데이션 모델에 접근할 수 있습니다.

## 📋 지원되는 모델

### 🤖 Anthropic Claude 3 시리즈
- **Claude 3 Opus** (`anthropic.claude-3-opus-20240229-v1:0`)
  - 가장 강력한 모델, 복잡한 추론과 창작에 최적
- **Claude 3 Sonnet** (`anthropic.claude-3-sonnet-20240229-v1:0`)
  - 균형잡힌 성능과 속도, 대부분의 작업에 적합
- **Claude 3 Haiku** (`anthropic.claude-3-haiku-20240307-v1:0`)
  - 빠른 응답 속도, 간단한 작업에 최적

### 🏢 Amazon Titan 시리즈
- **Titan Text Premier** (`amazon.titan-text-premier-v1:0`)
- **Titan Text Express** (`amazon.titan-text-express-v1`)

### 🦙 Meta Llama 2 시리즈
- **Llama 2 70B Chat** (`meta.llama2-70b-chat-v1`)
- **Llama 2 13B Chat** (`meta.llama2-13b-chat-v1`)

### 🔬 기타 모델
- **Cohere Command Text** (`cohere.command-text-v14`)
- **AI21 Jurassic-2 Ultra** (`ai21.j2-ultra-v1`)
- **AI21 Jurassic-2 Mid** (`ai21.j2-mid-v1`)

## 🔧 AWS 설정

### 1. AWS 계정 및 권한 설정

```bash
# AWS CLI 설치 (이미 설치된 경우 생략)
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# AWS 자격 증명 설정
aws configure
```

### 2. IAM 권한 설정

다음 권한이 필요합니다:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "bedrock:InvokeModel",
                "bedrock:InvokeModelWithResponseStream"
            ],
            "Resource": [
                "arn:aws:bedrock:*::foundation-model/*"
            ]
        }
    ]
}
```

### 3. 모델 액세스 활성화

AWS 콘솔에서 Bedrock 서비스로 이동하여 사용할 모델들의 액세스를 활성화해야 합니다:

1. AWS 콘솔 → Amazon Bedrock
2. 왼쪽 메뉴에서 "Model access" 선택
3. 사용할 모델들에 대해 "Request model access" 클릭
4. 승인 대기 (일부 모델은 즉시 승인, 일부는 검토 필요)

## 🔐 환경 변수 설정

### 개발 환경 (.env.local)

```bash
# AWS 자격 증명 (선택사항 - AWS CLI 설정이 있으면 불필요)
REACT_APP_AWS_ACCESS_KEY_ID=your_access_key_here
REACT_APP_AWS_SECRET_ACCESS_KEY=your_secret_key_here
REACT_APP_AWS_REGION=us-east-1

# Bedrock 기본 설정
REACT_APP_BEDROCK_DEFAULT_MODEL=anthropic.claude-3-sonnet-20240229-v1:0
REACT_APP_BEDROCK_DEFAULT_REGION=us-east-1
```

### 프로덕션 환경

프로덕션에서는 IAM 역할을 사용하는 것이 권장됩니다:

```bash
# ECS 태스크 역할 또는 EC2 인스턴스 역할 사용
# 환경 변수로 자격 증명을 설정하지 않음
REACT_APP_AWS_REGION=us-east-1
REACT_APP_BEDROCK_DEFAULT_MODEL=anthropic.claude-3-sonnet-20240229-v1:0
```

## 💰 비용 최적화

### 모델별 비용 (2024년 기준)

| 모델 | 입력 토큰 (1K당) | 출력 토큰 (1K당) |
|------|------------------|------------------|
| Claude 3 Opus | $15.00 | $75.00 |
| Claude 3 Sonnet | $3.00 | $15.00 |
| Claude 3 Haiku | $0.25 | $1.25 |
| Titan Text Express | $0.13 | $0.17 |
| Llama 2 70B | $0.65 | $0.80 |

### 비용 절약 팁

1. **적절한 모델 선택**: 작업 복잡도에 맞는 모델 사용
2. **토큰 제한**: `maxTokens` 설정으로 출력 길이 제한
3. **배치 처리**: 여러 요청을 하나로 결합
4. **캐싱**: 동일한 요청 결과 재사용

## 🧪 테스트 및 디버깅

### Mock 모드

AWS 자격 증명이 없어도 Mock 응답으로 테스트 가능:

```javascript
// 환경 변수가 없으면 자동으로 Mock 모드로 동작
// 실제 API 호출 없이 시뮬레이션된 응답 반환
```

### 로깅 활성화

```bash
# 디버그 로그 활성화
REACT_APP_DEBUG_BEDROCK=true
```

## 🔍 문제 해결

### 일반적인 오류

1. **AccessDeniedException**
   - IAM 권한 확인
   - 모델 액세스 활성화 확인

2. **ValidationException**
   - 모델 ID 확인
   - 요청 형식 검증

3. **ThrottlingException**
   - 요청 빈도 조절
   - 재시도 로직 구현

### 지원되는 리전

- us-east-1 (N. Virginia)
- us-west-2 (Oregon)
- ap-southeast-1 (Singapore)
- ap-northeast-1 (Tokyo)
- eu-west-1 (Ireland)
- eu-central-1 (Frankfurt)

## 📚 추가 리소스

- [AWS Bedrock 공식 문서](https://docs.aws.amazon.com/bedrock/)
- [Bedrock 모델 카탈로그](https://docs.aws.amazon.com/bedrock/latest/userguide/model-catalog.html)
- [Bedrock 가격 정보](https://aws.amazon.com/bedrock/pricing/)
- [AWS SDK for JavaScript](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-bedrock-runtime/)

## 🚀 시작하기

1. AWS 계정 생성 및 Bedrock 액세스 활성화
2. 환경 변수 설정
3. Arch Flow에서 AI Agent 블록 추가
4. 모델 선택 및 프롬프트 입력
5. 테스트 실행으로 동작 확인
6. 워크플로우에 통합하여 자동화 구현
