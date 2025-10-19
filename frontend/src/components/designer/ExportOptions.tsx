import React from 'react';
import { CloudArrowDownIcon } from '@heroicons/react/24/outline';

interface ExportOptionsProps {
  onExportPNG: () => void;
}

const ExportOptions: React.FC<ExportOptionsProps> = ({
  onExportPNG,
}) => {
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-600">
        💾 Xuất thiết kế của bạn
      </p>
      <button 
        className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center space-x-2 shadow-sm hover:shadow-md"
        onClick={onExportPNG}
      >
        <CloudArrowDownIcon className="w-5 h-5" />
        <span>Xuất file PNG</span>
      </button>
      <p className="text-xs text-gray-500">
        ✓ Export ảnh PNG chất lượng cao để sử dụng
      </p>
    </div>
  );
};

export default ExportOptions;