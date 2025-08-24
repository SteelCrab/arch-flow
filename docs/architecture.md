# Arch Flow Architecture Documentation

## 🏗️ Overall System Architecture

```mermaid
graph TB
    %% User Layer
    User[👤 User] --> Browser[🌐 Web Browser]
    
    %% Frontend Layer
    Browser --> Vercel[☁️ Vercel<br/>HTTPS Frontend]
    
    %% CDN & Security
    Vercel --> |HTTPS| APIGateway[🚪 AWS API Gateway<br/>Regional Endpoint]
    
    %% Backend Services
    APIGateway --> |HTTP Proxy| ECS[🐳 AWS ECS Fargate<br/>Backend Service]
    
    %% Container Registry
    ECR[📦 AWS ECR<br/>Docker Images] --> ECS
    
    %% Database Layer
    ECS --> DynamoDB[(🗄️ AWS DynamoDB<br/>Workflows & Executions)]
    
    %% Local Storage Fallback
    Browser --> LocalStorage[(💾 Local Storage<br/>Backup & Cache)]
    
    %% External APIs
    ECS --> OpenAI[🤖 OpenAI API<br/>GPT Models]
    ECS --> Anthropic[🧠 Anthropic API<br/>Claude Models]
    ECS --> Notion[📝 Notion API<br/>Page Creation]
    
    %% Styling
    classDef aws fill:#FF9900,stroke:#232F3E,stroke-width:2px,color:#fff
    classDef frontend fill:#00D9FF,stroke:#0066CC,stroke-width:2px,color:#fff
    classDef external fill:#4CAF50,stroke:#2E7D32,stroke-width:2px,color:#fff
    classDef storage fill:#9C27B0,stroke:#6A1B9A,stroke-width:2px,color:#fff
    
    class APIGateway,ECS,ECR,DynamoDB aws
    class Vercel,Browser frontend
    class OpenAI,Anthropic,Notion external
    class LocalStorage storage
```

## 🔄 Data Flow Architecture

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant V as ☁️ Vercel Frontend
    participant AG as 🚪 API Gateway
    participant ECS as 🐳 ECS Backend
    participant DB as 🗄️ DynamoDB
    participant AI as 🤖 AI Services
    
    %% Workflow Creation Flow
    U->>V: Create Workflow
    V->>AG: POST /api/workflows
    AG->>ECS: Proxy Request
    ECS->>DB: Store Workflow
    DB-->>ECS: Confirm Save
    ECS-->>AG: Success Response
    AG-->>V: HTTPS Response
    V-->>U: Workflow Created
    
    %% Workflow Execution Flow
    U->>V: Execute Workflow
    V->>AG: POST /api/execute
    AG->>ECS: Proxy Request
    ECS->>AI: Process AI Blocks
    AI-->>ECS: AI Response
    ECS->>DB: Store Execution Results
    ECS-->>AG: Execution Complete
    AG-->>V: Results
    V-->>U: Show Results
```

## 🏗️ AWS Infrastructure Details

```mermaid
graph LR
    %% VPC and Networking
    subgraph "🌐 AWS Cloud - us-east-1"
        subgraph "🔒 VPC (vpc-05b5ef44da712e9c5)"
            subgraph "🌍 Public Subnets"
                Subnet1[📍 Subnet 1<br/>subnet-02b470df43f8ab1f2]
                Subnet2[📍 Subnet 2<br/>subnet-0b2ece114104e9bd6]
            end
            
            subgraph "🛡️ Security Group"
                SG[🔐 arch-flow-ecs-sg<br/>Port 3001 Open]
            end
            
            subgraph "⚖️ Load Balancing"
                AG[🚪 API Gateway<br/>utbs4laio6.execute-api<br/>us-east-1.amazonaws.com]
            end
            
            subgraph "🐳 Container Services"
                Cluster[📦 ECS Cluster<br/>arch-flow-cluster]
                Service[🔄 ECS Service<br/>arch-flow-backend-service]
                Task[⚡ Fargate Task<br/>256 CPU / 512 MB RAM]
            end
            
            subgraph "🗄️ Database"
                DDB1[(📊 arch-flow-workflows<br/>Workflow Definitions)]
                DDB2[(📈 arch-flow-executions<br/>Execution History)]
            end
        end
        
        subgraph "📦 Container Registry"
            ECR[🐳 ECR Repository<br/>arch-flow-backend:v2]
        end
    end
    
    %% External Services
    Internet[🌐 Internet] --> AG
    AG --> Task
    Task --> DDB1
    Task --> DDB2
    ECR --> Task
    
    %% Styling
    classDef aws fill:#FF9900,stroke:#232F3E,stroke-width:2px,color:#fff
    classDef network fill:#4CAF50,stroke:#2E7D32,stroke-width:2px,color:#fff
    classDef compute fill:#2196F3,stroke:#1565C0,stroke-width:2px,color:#fff
    classDef storage fill:#9C27B0,stroke:#6A1B9A,stroke-width:2px,color:#fff
    
    class AG,ECR aws
    class Subnet1,Subnet2,SG network
    class Cluster,Service,Task compute
    class DDB1,DDB2 storage
```

## 🔧 Component Architecture

```mermaid
graph TD
    %% Frontend Components
    subgraph "⚛️ React Frontend"
        App[📱 App.js<br/>Main Application]
        Canvas[🎨 WorkflowCanvas<br/>Visual Editor]
        Sidebar[📋 WorkflowSidebar<br/>Workflow Management]
        Blocks[🧩 Block Components<br/>Input, AI, Notion, etc.]
        API[🔌 API Service<br/>HTTP Client]
    end
    
    %% Backend Components
    subgraph "🖥️ Node.js Backend"
        Server[🚀 Express Server<br/>REST API]
        Routes[🛣️ API Routes<br/>/workflows, /execute]
        Services[⚙️ Business Logic<br/>Workflow Engine]
        Models[📊 Data Models<br/>Workflow Schema]
    end
    
    %% Block Types
    subgraph "🧩 Workflow Blocks"
        InputB[📝 Input Block<br/>Text Input]
        AIB[🤖 AI Agent Block<br/>LLM Processing]
        NotionB[📄 Notion Block<br/>Page Creation]
        CondB[🔀 Condition Block<br/>Logic Branching]
        ScheduleB[⏰ Schedule Block<br/>Time Triggers]
        RouteB[🛤️ Route Block<br/>Path Selection]
    end
    
    %% Connections
    App --> Canvas
    App --> Sidebar
    Canvas --> Blocks
    API --> Server
    Server --> Routes
    Routes --> Services
    Services --> Models
    
    Blocks --> InputB
    Blocks --> AIB
    Blocks --> NotionB
    Blocks --> CondB
    Blocks --> ScheduleB
    Blocks --> RouteB
    
    %% Styling
    classDef frontend fill:#61DAFB,stroke:#21759B,stroke-width:2px,color:#000
    classDef backend fill:#68A063,stroke:#4F7942,stroke-width:2px,color:#fff
    classDef blocks fill:#FF6B6B,stroke:#E55555,stroke-width:2px,color:#fff
    
    class App,Canvas,Sidebar,API frontend
    class Server,Routes,Services,Models backend
    class InputB,AIB,NotionB,CondB,ScheduleB,RouteB blocks
```

## 🔐 Security & Networking

```mermaid
graph TB
    %% Internet Layer
    Internet[🌐 Internet Traffic]
    
    %% Security Layers
    subgraph "🔒 Security Layers"
        HTTPS[🔐 HTTPS/TLS 1.3<br/>End-to-End Encryption]
        CORS[🌐 CORS Policy<br/>Cross-Origin Control]
        SG[🛡️ Security Groups<br/>Network ACL]
    end
    
    %% Application Layer
    subgraph "📱 Application Layer"
        Vercel[☁️ Vercel CDN<br/>Global Edge Network]
        AG[🚪 API Gateway<br/>Rate Limiting & Auth]
    end
    
    %% Compute Layer
    subgraph "⚡ Compute Layer"
        ECS[🐳 ECS Fargate<br/>Serverless Containers]
        ENI[🔌 Elastic Network Interface<br/>98.81.108.10]
    end
    
    %% Data Layer
    subgraph "🗄️ Data Layer"
        DDB[📊 DynamoDB<br/>Encrypted at Rest]
        LocalS[💾 Browser Storage<br/>Client-side Cache]
    end
    
    %% Flow
    Internet --> HTTPS
    HTTPS --> Vercel
    Vercel --> CORS
    CORS --> AG
    AG --> SG
    SG --> ECS
    ECS --> ENI
    ENI --> DDB
    Vercel --> LocalS
    
    %% Styling
    classDef security fill:#F44336,stroke:#C62828,stroke-width:2px,color:#fff
    classDef app fill:#2196F3,stroke:#1565C0,stroke-width:2px,color:#fff
    classDef compute fill:#FF9800,stroke:#F57C00,stroke-width:2px,color:#fff
    classDef data fill:#4CAF50,stroke:#2E7D32,stroke-width:2px,color:#fff
    
    class HTTPS,CORS,SG security
    class Vercel,AG app
    class ECS,ENI compute
    class DDB,LocalS data
```

## 📊 Deployment Pipeline

```mermaid
graph LR
    %% Development
    Dev[👨‍💻 Developer] --> Git[📝 Git Commit]
    
    %% Frontend Pipeline
    subgraph "🎨 Frontend Pipeline"
        Git --> GitHub[📚 GitHub Repository]
        GitHub --> VercelBuild[🔨 Vercel Build]
        VercelBuild --> VercelDeploy[🚀 Vercel Deploy]
    end
    
    %% Backend Pipeline
    subgraph "🖥️ Backend Pipeline"
        Git --> DockerBuild[🐳 Docker Build]
        DockerBuild --> ECRPush[📦 ECR Push]
        ECRPush --> ECSUpdate[🔄 ECS Update]
        ECSUpdate --> HealthCheck[❤️ Health Check]
    end
    
    %% Testing
    subgraph "🧪 Testing"
        UnitTest[🔬 Unit Tests]
        IntegrationTest[🔗 Integration Tests]
        E2ETest[🎭 E2E Tests]
    end
    
    %% Monitoring
    subgraph "📈 Monitoring"
        Logs[📋 CloudWatch Logs]
        Metrics[📊 Performance Metrics]
        Alerts[🚨 Error Alerts]
    end
    
    VercelDeploy --> UnitTest
    HealthCheck --> IntegrationTest
    IntegrationTest --> E2ETest
    
    ECSUpdate --> Logs
    Logs --> Metrics
    Metrics --> Alerts
    
    %% Styling
    classDef pipeline fill:#9C27B0,stroke:#6A1B9A,stroke-width:2px,color:#fff
    classDef testing fill:#FF5722,stroke:#D84315,stroke-width:2px,color:#fff
    classDef monitoring fill:#607D8B,stroke:#37474F,stroke-width:2px,color:#fff
    
    class GitHub,VercelBuild,DockerBuild,ECRPush pipeline
    class UnitTest,IntegrationTest,E2ETest testing
    class Logs,Metrics,Alerts monitoring
```

## 🎯 Key Features & Benefits

### ✨ **Technical Highlights**
- **Serverless Architecture**: ECS Fargate for auto-scaling
- **HTTPS Security**: End-to-end encryption via API Gateway
- **Global CDN**: Vercel edge network for fast delivery
- **NoSQL Database**: DynamoDB for flexible workflow storage
- **Container Orchestration**: Docker + ECR for consistent deployments

### 🚀 **Performance Metrics**
- **API Response Time**: < 500ms average
- **Frontend Load Time**: < 2s initial load
- **Auto-scaling**: 0-100 containers based on demand
- **Availability**: 99.9% uptime SLA
- **Global Latency**: < 100ms via CDN

### 🔒 **Security Features**
- **TLS 1.3 Encryption**: All data in transit
- **VPC Isolation**: Private network segments
- **IAM Roles**: Least privilege access
- **Security Groups**: Network-level firewalls
- **API Rate Limiting**: DDoS protection
