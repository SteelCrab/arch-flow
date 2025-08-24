import React, { useState } from 'react';
import { FileText, Bot, BookOpen, Split, Clock } from 'lucide-react';

const BlockSidebar = ({ onAddBlock, isOpen, onToggle, executionResults = [], isExecuting = false }) => {
  const [tooltip, setTooltip] = useState({ show: false, text: '', x: 0, y: 0 });
  const blockTypes = [
    {
      type: 'inputBlock',
      label: '입력',
      icon: FileText,
      color: '#28a745',
      description: '텍스트 입력',
      tooltip: '사용자로부터 텍스트, 파일 또는 매개변수를 입력받아 워크플로우를 시작하는 기본 블록입니다. 모든 워크플로우의 시작점이 됩니다.'
    },
    {
      type: 'aiAgentBlock',
      label: 'AWS Bedrock',
      icon: Bot,
      color: '#FF9900',
      description: 'AI 모델 호출',
      tooltip: 'AWS Bedrock을 통해 Claude 3, Titan, Llama 2 등 다양한 파운데이션 모델을 사용하여 텍스트 생성, 요약, 번역, 분석 등의 작업을 수행하는 핵심 블록입니다.'
    },
    {
      type: 'notionBlock',
      label: 'Notion',
      icon: FileText,
      color: '#000000',
      description: '페이지 생성',
      tooltip: 'Notion 워크스페이스에 새 페이지를 생성하거나 기존 페이지를 업데이트하는 블록입니다. 데이터베이스 연동도 지원합니다.'
    },
    {
      type: 'scheduleBlock',
      label: '스케줄러',
      icon: Clock,
      color: '#6f42c1',
      description: '자동 실행 예약',
      tooltip: 'Cron 표현식, 반복 간격, 또는 일정 주기로 워크플로우를 자동 실행하는 스케줄링 블록입니다.'
    },
    {
      type: 'routeBlock',
      label: '스마트 라우터',
      icon: Split,
      color: '#17a2b8',
      description: '지능형 경로 선택',
      tooltip: 'AI 기반 콘텐츠 분석으로 입력 데이터를 자동 분류하고 적절한 경로로 라우팅하는 지능형 블록입니다.'
    }
  ];

  const handleDragStart = (event, blockType) => {
    event.dataTransfer.setData('application/reactflow', blockType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className={`block-sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <h3>블록</h3>
      </div>
      <div className="block-list">
        {blockTypes.map((block) => {
          const IconComponent = block.icon;
          return (
            <div
              key={block.type}
              className="block-item"
              draggable
              onDragStart={(event) => handleDragStart(event, block.type)}
              onClick={() => onAddBlock(block.type)}
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setTooltip({
                  show: true,
                  text: block.tooltip,
                  x: rect.right + 10,
                  y: rect.top + rect.height / 2
                });
              }}
              onMouseLeave={() => setTooltip({ show: false, text: '', x: 0, y: 0 })}
              style={{ borderLeftColor: block.color }}
            >
              <div className="block-icon" style={{ color: block.color }}>
                <IconComponent size={20} />
              </div>
              <div className="block-info">
                <div className="block-label">{block.label}</div>
                <div className="block-description">{block.description}</div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* 실행 결과 영역 */}
      <div className="execution-results-section">
        <div className="section-header">
          <h4>실행 결과</h4>
          {isExecuting && <div className="loading-spinner">⚡</div>}
        </div>
        
        <div className="results-container">
          {executionResults.length === 0 && !isExecuting ? (
            <div className="no-results">
              <span>워크플로우를 실행하면 결과가 여기에 표시됩니다.</span>
            </div>
          ) : (
            executionResults.map((result, index) => (
              <div key={result.id || index} className={`result-item ${result.success ? 'success' : 'error'}`}>
                <div className="result-header">
                  <span className="result-title">{result.title}</span>
                  <span className="result-time">{result.timestamp}</span>
                </div>
                <div className="result-content">
                  {result.content}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {tooltip.show && (
        <div 
          className="tooltip-overlay"
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translateY(-50%)',
            background: 'white',
            color: '#333',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            maxWidth: '280px',
            lineHeight: '1.4',
            zIndex: 1001,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.2)',
            pointerEvents: 'none',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
};

export default BlockSidebar;