import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      errorId: Date.now() // Unique ID for this error instance
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Store error details in state
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Report to error tracking service if available
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false
      });
    }

    // Log specific React error #185 information
    if (error.message && error.message.includes('Minified React error #185')) {
      console.error('React Error #185 Details:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    }
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null 
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state;
      const isReactError185 = error?.message?.includes('Minified React error #185');
      
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg border border-red-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-red-800">
                    {isReactError185 ? 'React 렌더링 오류 (Error #185)' : '애플리케이션 오류'}
                  </h3>
                  <p className="mt-1 text-sm text-red-600">
                    {isReactError185 
                      ? '컴포넌트 렌더링 중 오류가 발생했습니다. 이는 일반적으로 상태 관리나 컴포넌트 생명주기 문제로 인해 발생합니다.'
                      : '예상치 못한 오류가 발생했습니다.'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">오류 정보:</h4>
                  <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-700 font-mono">
                    {error?.message || '알 수 없는 오류'}
                  </div>
                </div>

                {process.env.NODE_ENV === 'development' && errorInfo && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">컴포넌트 스택:</h4>
                    <div className="bg-gray-50 rounded-md p-3 text-xs text-gray-600 font-mono max-h-40 overflow-y-auto">
                      {errorInfo.componentStack}
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">해결 방법:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• 페이지를 새로고침해 보세요</li>
                    <li>• 브라우저 캐시를 지워보세요</li>
                    <li>• 다른 브라우저에서 시도해 보세요</li>
                    {isReactError185 && (
                      <>
                        <li>• 워크플로우 데이터가 손상되었을 수 있습니다</li>
                        <li>• 로컬 스토리지를 지워보세요</li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={this.handleRetry}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    다시 시도
                  </button>
                  <button
                    onClick={this.handleReload}
                    className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    페이지 새로고침
                  </button>
                </div>

                <div className="text-center">
                  <a
                    href="https://github.com/SteelCrab/arch-flow/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    문제가 지속되면 GitHub에서 이슈를 신고해 주세요
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
