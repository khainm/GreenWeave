import React from 'react'

interface ExportButtonsProps {
  onExportPNG: () => void
  onExportJSON: () => void
}

const ExportButtons: React.FC<ExportButtonsProps> = ({ 
  onExportPNG, 
  onExportJSON 
}) => {
  return (
    <div className="glass-morphism rounded-2xl shadow-xl border border-white/30 p-4 card-hover-effect">
      <h3 className="text-lg font-black text-gradient mb-4 flex items-center gap-2">
        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Xuất file
      </h3>
      <div className="space-y-3">
        <button 
          onClick={onExportPNG} 
          className="w-full px-4 py-3 rounded-xl gradient-bg-accent text-white text-xs font-bold hover:shadow-lg transition-all duration-300 shadow-lg flex items-center justify-center gap-2 transform hover:-translate-y-1 hover:scale-105 click-effect relative overflow-hidden"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Xuất PNG
        </button>
        <button 
          onClick={onExportJSON} 
          className="w-full px-4 py-3 rounded-xl gradient-bg-primary text-white text-xs font-bold hover:shadow-lg transition-all duration-300 shadow-lg flex items-center justify-center gap-2 transform hover:-translate-y-1 hover:scale-105 click-effect relative overflow-hidden"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          Lưu JSON
        </button>
      </div>
    </div>
  )
}

export default ExportButtons
