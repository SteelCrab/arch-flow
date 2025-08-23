import React from 'react';
import './App.css';
import WorkflowCanvas from './components/WorkflowCanvas';

function App() {
  return (
    <div className="App">
      <h1>🚀 Arch Flow - 워크플로우 빌더</h1>
      <p>앱이 정상적으로 로드되었습니다!</p>
      <WorkflowCanvas />
    </div>
  );
}

export default App;