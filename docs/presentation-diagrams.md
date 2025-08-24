# Arch Flow - Presentation Diagrams

## 🎯 **1. High-Level System Overview**

```mermaid
graph TB
    %% User Journey
    User[👤 사용자] --> |드래그 앤 드롭| Frontend[🎨 Arch Flow Frontend<br/>비주얼 워크플로우 에디터]
    
    %% Core Platform
    Frontend --> |HTTPS API| Gateway[🚪 AWS API Gateway<br/>보안 엔드포인트]
    Gateway --> |프록시| Backend[🐳 ECS Fargate Backend<br/>워크플로우 엔진]
    
    %% Data & AI
    Backend --> Database[(🗄️ DynamoDB<br/>워크플로우 저장소)]
    Backend --> AI[🤖 AI 서비스<br/>GPT, Claude, Gemini]
    Backend --> Integrations[🔌 외부 연동<br/>Notion, 스케줄러]
    
    %% Deployment
    subgraph "☁️ AWS 클라우드 인프라"
        Gateway
        Backend
        Database
    end
    
    subgraph "🌐 Vercel CDN"
        Frontend
    end
    
    %% Styling
    classDef user fill:#4CAF50,stroke:#2E7D32,stroke-width:3px,color:#fff
    classDef frontend fill:#2196F3,stroke:#1565C0,stroke-width:2px,color:#fff
    classDef aws fill:#FF9900,stroke:#232F3E,stroke-width:2px,color:#fff
    classDef ai fill:#9C27B0,stroke:#6A1B9A,stroke-width:2px,color:#fff
    
    class User user
    class Frontend frontend
    class Gateway,Backend,Database aws
    class AI,Integrations ai
```

## 🏗️ **2. AWS 인프라 상세 아키텍처**

```mermaid
graph TB
    %% Internet Gateway
    Internet[🌐 인터넷] --> CloudFront[☁️ CloudFront CDN<br/>글로벌 배포]
    
    %% API Gateway Layer
    CloudFront --> APIGateway[🚪 API Gateway<br/>utbs4laio6.execute-api<br/>us-east-1.amazonaws.com]
    
    %% VPC Network
    subgraph "🔒 VPC (Virtual Private Cloud)"
        subgraph "🌍 가용 영역 A"
            SubnetA[📍 Public Subnet A<br/>subnet-02b470df43f8ab1f2]
        end
        
        subgraph "🌍 가용 영역 B"
            SubnetB[📍 Public Subnet B<br/>subnet-0b2ece114104e9bd6]
        end
        
        subgraph "🛡️ 보안 그룹"
            SecurityGroup[🔐 arch-flow-ecs-sg<br/>포트 3001 허용<br/>HTTPS/HTTP 트래픽]
        end
    end
    
    %% Container Services
    APIGateway --> ECSCluster[📦 ECS 클러스터<br/>arch-flow-cluster]
    
    subgraph "🐳 컨테이너 서비스"
        ECSCluster --> Service[🔄 ECS 서비스<br/>arch-flow-backend-service]
        Service --> Task1[⚡ Fargate 태스크 1<br/>CPU: 256, RAM: 512MB]
        Service --> Task2[⚡ Fargate 태스크 2<br/>Auto Scaling]
        
        ECR[📦 ECR 레지스트리<br/>arch-flow-backend:v2] --> Task1
        ECR --> Task2
    end
    
    %% Database Layer
    Task1 --> DynamoDB1[(📊 DynamoDB<br/>arch-flow-workflows<br/>워크플로우 정의)]
    Task1 --> DynamoDB2[(📈 DynamoDB<br/>arch-flow-executions<br/>실행 이력)]
    
    Task2 --> DynamoDB1
    Task2 --> DynamoDB2
    
    %% External Integrations
    Task1 --> External[🔌 외부 API<br/>OpenAI, Anthropic<br/>Notion, 기타 서비스]
    Task2 --> External
    
    %% Network Interface
    Task1 --> ENI1[🔌 ENI<br/>98.81.108.10<br/>Public IP]
    Task2 --> ENI2[🔌 ENI<br/>Dynamic IP<br/>Auto-assigned]
    
    %% Styling
    classDef internet fill:#4CAF50,stroke:#2E7D32,stroke-width:2px,color:#fff
    classDef aws fill:#FF9900,stroke:#232F3E,stroke-width:2px,color:#fff
    classDef network fill:#2196F3,stroke:#1565C0,stroke-width:2px,color:#fff
    classDef compute fill:#9C27B0,stroke:#6A1B9A,stroke-width:2px,color:#fff
    classDef storage fill:#FF5722,stroke:#D84315,stroke-width:2px,color:#fff
    classDef external fill:#607D8B,stroke:#37474F,stroke-width:2px,color:#fff
    
    class Internet,CloudFront internet
    class APIGateway,ECR aws
    class SubnetA,SubnetB,SecurityGroup,ENI1,ENI2 network
    class ECSCluster,Service,Task1,Task2 compute
    class DynamoDB1,DynamoDB2 storage
    class External external
```

## 🔄 **3. 워크플로우 실행 프로세스**

```mermaid
sequenceDiagram
    participant 👤 as 사용자
    participant 🎨 as Frontend<br/>(Vercel)
    participant 🚪 as API Gateway
    participant 🐳 as ECS Backend
    participant 🗄️ as DynamoDB
    participant 🤖 as AI Services
    participant 📝 as Notion API
    
    Note over 👤,📝: 워크플로우 생성 및 실행 과정
    
    %% 워크플로우 생성
    👤->>🎨: 1. 드래그 앤 드롭으로 워크플로우 구성
    🎨->>🎨: 2. 블록 연결 및 설정
    👤->>🎨: 3. 저장 버튼 클릭 (Cmd+S)
    
    🎨->>🚪: 4. POST /api/workflows
    🚪->>🐳: 5. HTTP 프록시 요청
    🐳->>🗄️: 6. 워크플로우 데이터 저장
    🗄️-->>🐳: 7. 저장 완료 응답
    🐳-->>🚪: 8. 성공 응답
    🚪-->>🎨: 9. HTTPS 응답
    🎨-->>👤: 10. "저장 완료" 알림
    
    Note over 👤,📝: 워크플로우 실행
    
    👤->>🎨: 11. "워크플로우 실행" 버튼 클릭
    🎨->>🚪: 12. POST /api/execute
    🚪->>🐳: 13. 실행 요청 프록시
    
    %% 순차적 블록 실행
    🐳->>🐳: 14. 입력 블록 처리
    🐳->>🤖: 15. AI 블록 - GPT/Claude 호출
    🤖-->>🐳: 16. AI 응답 수신
    🐳->>📝: 17. Notion 블록 - 페이지 생성
    📝-->>🐳: 18. Notion 페이지 URL 반환
    
    🐳->>🗄️: 19. 실행 결과 저장
    🗄️-->>🐳: 20. 저장 완료
    🐳-->>🚪: 21. 실행 완료 응답
    🚪-->>🎨: 22. 결과 데이터 전송
    🎨-->>👤: 23. 실행 결과 표시
```

## 🧩 **4. 블록 시스템 아키텍처**

```mermaid
graph TD
    %% Core Block System
    subgraph "🧩 블록 시스템 코어"
        BlockEngine[⚙️ 블록 실행 엔진<br/>WorkflowExecutor]
        BlockRegistry[📋 블록 레지스트리<br/>타입별 블록 관리]
        DataFlow[🔄 데이터 플로우<br/>블록 간 데이터 전달]
    end
    
    %% Input/Output Blocks
    subgraph "📝 입출력 블록"
        InputBlock[📝 Input Block<br/>텍스트 입력]
        OutputBlock[📤 Output Block<br/>결과 출력]
    end
    
    %% AI Processing Blocks
    subgraph "🤖 AI 처리 블록"
        GPTBlock[🧠 GPT Block<br/>OpenAI GPT-4]
        ClaudeBlock[🎭 Claude Block<br/>Anthropic Claude]
        GeminiBlock[💎 Gemini Block<br/>Google Gemini]
        OllamaBlock[🦙 Ollama Block<br/>로컬 LLM]
    end
    
    %% Integration Blocks
    subgraph "🔌 연동 블록"
        NotionBlock[📄 Notion Block<br/>페이지 생성/수정]
        EmailBlock[📧 Email Block<br/>이메일 발송]
        WebhookBlock[🔗 Webhook Block<br/>HTTP 요청]
    end
    
    %% Logic Blocks
    subgraph "🔀 로직 블록"
        ConditionBlock[❓ Condition Block<br/>조건부 분기]
        LoopBlock[🔄 Loop Block<br/>반복 처리]
        DelayBlock[⏰ Delay Block<br/>지연 실행]
    end
    
    %% Scheduling Blocks
    subgraph "📅 스케줄링 블록"
        CronBlock[⏰ Cron Block<br/>정기 실행]
        TriggerBlock[⚡ Trigger Block<br/>이벤트 트리거]
    end
    
    %% Connections
    BlockEngine --> BlockRegistry
    BlockRegistry --> InputBlock
    BlockRegistry --> GPTBlock
    BlockRegistry --> NotionBlock
    BlockRegistry --> ConditionBlock
    BlockRegistry --> CronBlock
    
    DataFlow --> InputBlock
    DataFlow --> OutputBlock
    
    InputBlock --> GPTBlock
    GPTBlock --> NotionBlock
    NotionBlock --> OutputBlock
    
    ConditionBlock --> GPTBlock
    ConditionBlock --> NotionBlock
    
    %% Styling
    classDef core fill:#FF9900,stroke:#232F3E,stroke-width:2px,color:#fff
    classDef io fill:#4CAF50,stroke:#2E7D32,stroke-width:2px,color:#fff
    classDef ai fill:#9C27B0,stroke:#6A1B9A,stroke-width:2px,color:#fff
    classDef integration fill:#2196F3,stroke:#1565C0,stroke-width:2px,color:#fff
    classDef logic fill:#FF5722,stroke:#D84315,stroke-width:2px,color:#fff
    classDef schedule fill:#607D8B,stroke:#37474F,stroke-width:2px,color:#fff
    
    class BlockEngine,BlockRegistry,DataFlow core
    class InputBlock,OutputBlock io
    class GPTBlock,ClaudeBlock,GeminiBlock,OllamaBlock ai
    class NotionBlock,EmailBlock,WebhookBlock integration
    class ConditionBlock,LoopBlock,DelayBlock logic
    class CronBlock,TriggerBlock schedule
```

## 📊 **5. 성능 및 확장성 지표**

```mermaid
graph TB
    %% Performance Metrics
    subgraph "⚡ 성능 지표"
        ResponseTime[📈 API 응답 시간<br/>평균 < 500ms]
        LoadTime[🚀 프론트엔드 로딩<br/>초기 < 2초]
        Throughput[📊 처리량<br/>1000 req/min]
    end
    
    %% Scalability
    subgraph "📈 확장성"
        AutoScaling[🔄 오토 스케일링<br/>0-100 컨테이너]
        LoadBalancing[⚖️ 로드 밸런싱<br/>다중 AZ 분산]
        CDN[🌐 글로벌 CDN<br/>전세계 엣지 서버]
    end
    
    %% Reliability
    subgraph "🛡️ 안정성"
        Uptime[⏰ 가동률<br/>99.9% SLA]
        Backup[💾 백업<br/>자동 스냅샷]
        Monitoring[📊 모니터링<br/>실시간 알림]
    end
    
    %% Security
    subgraph "🔒 보안"
        Encryption[🔐 암호화<br/>TLS 1.3]
        IAM[👤 접근 제어<br/>IAM 역할]
        VPC[🏠 네트워크 격리<br/>VPC 보안]
    end
    
    %% Cost Optimization
    subgraph "💰 비용 최적화"
        Serverless[☁️ 서버리스<br/>사용량 기반 과금]
        Reserved[💳 예약 인스턴스<br/>장기 할인]
        Monitoring2[📊 비용 모니터링<br/>실시간 추적]
    end
    
    %% Styling
    classDef performance fill:#4CAF50,stroke:#2E7D32,stroke-width:2px,color:#fff
    classDef scalability fill:#2196F3,stroke:#1565C0,stroke-width:2px,color:#fff
    classDef reliability fill:#FF9900,stroke:#F57C00,stroke-width:2px,color:#fff
    classDef security fill:#F44336,stroke:#C62828,stroke-width:2px,color:#fff
    classDef cost fill:#9C27B0,stroke:#6A1B9A,stroke-width:2px,color:#fff
    
    class ResponseTime,LoadTime,Throughput performance
    class AutoScaling,LoadBalancing,CDN scalability
    class Uptime,Backup,Monitoring reliability
    class Encryption,IAM,VPC security
    class Serverless,Reserved,Monitoring2 cost
```

## 🎯 **발표 포인트 요약**

### 🏗️ **아키텍처 하이라이트**
1. **완전 서버리스**: ECS Fargate + API Gateway
2. **글로벌 배포**: Vercel CDN + AWS 멀티 AZ
3. **마이크로서비스**: 컨테이너 기반 확장 가능한 구조
4. **NoSQL 데이터베이스**: DynamoDB로 유연한 스키마

### 🚀 **기술적 우위**
1. **자동 확장**: 트래픽에 따른 무제한 스케일링
2. **고가용성**: 99.9% 업타임 보장
3. **보안**: 엔드투엔드 암호화 + VPC 격리
4. **성능**: 글로벌 CDN으로 빠른 응답속도

### 💡 **비즈니스 가치**
1. **비용 효율성**: 사용량 기반 과금으로 초기 비용 최소화
2. **개발 생산성**: 노코드/로우코드 워크플로우 구축
3. **확장성**: 스타트업부터 엔터프라이즈까지 대응
4. **통합성**: 다양한 외부 서비스와 연동 가능
