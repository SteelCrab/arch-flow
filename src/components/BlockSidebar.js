import React, { useState } from 'react';
import { FileText, Bot, BookOpen, Split, Clock } from 'lucide-react';

const BlockSidebar = ({ onAddBlock, isOpen, onToggle }) => {
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
      label: 'AI 에이전트',
      icon: Bot,
      color: '#007bff',
      description: 'AI 모델 호출',
      tooltip: 'OpenAI GPT, Claude, Gemini 등 다양한 AI 모델을 사용하여 텍스트 생성, 요약, 번역, 분석 등의 작업을 수행하는 핵심 블록입니다.'
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
      type: 'conditionBlock',
      label: '조건 분기',
      icon: Split,
      color: '#fd7e14',
      description: '규칙 기반 분기',
      tooltip: '입력 데이터를 기반으로 조건을 평가하여 True/False 경로로 분기하는 블록입니다. 다양한 연산자를 지원합니다.'
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
      label: '라우터',
      icon: Split,
      color: '#17a2b8',
      description: '동적 경로 선택',
      tooltip: '입력 데이터의 내용에 따라 동적으로 다음 실행 경로를 선택하는 라우팅 블록입니다.'
    }
      label: 'Notion',
      icon: BookOpen,
      color: '#6c757d',
      description: 'Notion 저장',
      tooltip: 'AI로 처리된 결과를 Notion 페이지 생성, 데이터베이스 추가, 또는 기존 페이지 업데이트 방식으로 자동 저장하는 출력 블록입니다.'
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