import React from 'react';
import { CloudArrowDownIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface ExportOptionsProps {
  onExportPNG: () => void;
  onSaveJSON: () => void;
}

const ExportOptions: React.FC<ExportOptionsProps> = ({
  onExportPNG,
  onSaveJSON,
}) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Xuất file</h3>
      <div className="space-y-2">
        <button 
          className="w-full py-3 px-4 bg-green-50 border border-green-200 text-green-600 rounded-lg font-medium hover:bg-green-100 transition-colors"
          onClick={onExportPNG}
        >
          <CloudArrowDownIcon className="w-4 h-4 inline mr-2" />
          Xuất PNG
        </button>
        <button 
          className="w-full py-3 px-4 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors"
          onClick={onSaveJSON}
        >
          <DocumentTextIcon className="w-4 h-4 inline mr-2" />
          Lưu JSON
        </button>
      </div>
    </div>
  );
};

export default ExportOptions;