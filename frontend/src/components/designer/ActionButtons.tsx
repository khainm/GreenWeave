import React from 'react'

interface ActionButtonsProps {
  selectedId: string | null
  onRemoveSelected: () => void
  onResetDesign: () => void
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  selectedId, 
  onRemoveSelected, 
  onResetDesign 
}) => {
  return (
    <div className="glass-morphism rounded-2xl shadow-xl border border-white/30 p-4 card-hover-effect">
      <h3 className="text-lg font-black text-gradient mb-4 flex items-center gap-2">
        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Thao tác
      </h3>
      <div className="space-y-3">
        <button 
          onClick={onRemoveSelected} 
          disabled={!selectedId}
          className="w-full px-4 py-3 rounded-xl border-2 border-red-200/60 text-red-600 text-xs font-bold hover:bg-red-50/80 hover:border-red-300/60 transition-all duration-300 flex items-center justify-center gap-2 transform hover:-translate-y-1 hover:shadow-lg backdrop-blur-sm click-effect relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          {selectedId ? 'Xóa sticker' : 'Chọn để xóa'}
        </button>
        <button 
          onClick={onResetDesign} 
          className="w-full px-4 py-3 rounded-xl border-2 border-orange-200/60 text-orange-600 text-xs font-bold hover:bg-orange-50/80 hover:border-orange-300/60 transition-all duration-300 flex items-center justify-center gap-2 transform hover:-translate-y-1 hover:shadow-lg backdrop-blur-sm click-effect relative overflow-hidden"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Làm mới
        </button>
      </div>
    </div>
  )
}

export default ActionButtons
