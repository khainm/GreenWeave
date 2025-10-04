import React from 'react';
import { ArrowPathIcon, TrashIcon } from '@heroicons/react/24/outline';

interface ActionButtonsProps {
  onClearDesign: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onClearDesign,
}) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Thao tác</h3>
      <div className="flex space-x-2">
        <button 
          className="flex-1 py-2 px-4 bg-red-50 border border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
          onClick={onClearDesign}
        >
          <TrashIcon className="w-4 h-4 inline mr-2" />
          Xóa tất cả
        </button>
        <button 
          className="flex-1 py-2 px-4 bg-green-50 border border-green-200 text-green-600 rounded-lg font-medium hover:bg-green-100 transition-colors"
          onClick={onClearDesign}
        >
          <ArrowPathIcon className="w-4 h-4 inline mr-2" />
          Làm mới
        </button>
      </div>
    </div>
  );
};

export default ActionButtons;