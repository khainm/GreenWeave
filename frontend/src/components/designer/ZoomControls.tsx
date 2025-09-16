import React from 'react'

interface ZoomControlsProps {
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onResetZoom: () => void
  onFitToScreen?: () => void
}

const ZoomControls: React.FC<ZoomControlsProps> = ({ 
  zoom, 
  onZoomIn, 
  onZoomOut, 
  onResetZoom,
  onFitToScreen
}) => {
  return (
    <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-xl p-1 border border-white/60 shadow-lg">
      <button
        onClick={onZoomOut}
        disabled={zoom <= 0.5}
        className="p-2 hover:bg-blue-50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
        title="Thu nhỏ (Ctrl + -)"
      >
        <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
        </svg>
      </button>
      
      <div className="px-3 py-1 text-sm font-mono min-w-[4rem] text-center text-gray-800 font-semibold bg-gray-50 rounded-lg border">
        {Math.round(zoom * 100)}%
      </div>
      
      <button
        onClick={onZoomIn}
        disabled={zoom >= 2.0}
        className="p-2 hover:bg-blue-50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
        title="Phóng to (Ctrl + +)"
      >
        <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>
      
      <div className="w-px h-6 bg-gray-300 mx-1"></div>
      
      <button
        onClick={onResetZoom}
        className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 hover:scale-105 active:scale-95 shadow-md"
        title="Đặt lại zoom về 100%"
      >
        100%
      </button>
      
      {onFitToScreen && (
        <button
          onClick={onFitToScreen}
          className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 hover:scale-105 active:scale-95 shadow-md"
          title="Vừa màn hình"
        >
          Fit
        </button>
      )}
    </div>
  )
}

export default ZoomControls
