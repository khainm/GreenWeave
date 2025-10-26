// 📝 Text Editor Component
// Add text to canvas with default styling

import React, { useState } from 'react';
import { PlusCircleIcon } from '@heroicons/react/24/outline';

interface TextEditorProps {
  onAddText: (textConfig: TextConfig) => void;
}

export interface TextConfig {
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textAlign: 'left' | 'center' | 'right';
  rotation: number;
  curveAmount?: number; // Độ cong của text (-100 to 100)
  letterSpacing?: number; // Khoảng cách giữa các chữ
}

const TextEditor: React.FC<TextEditorProps> = ({ onAddText }) => {
  const [text, setText] = useState('');

  const handleAddText = () => {
    if (!text.trim()) return;

    // Add text with default styling - user can edit later in TextEditPanel
    const textConfig: TextConfig = {
      text: text.trim(),
      fontSize: 32,
      fontFamily: 'Arial',
      color: '#000000',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'left',
      rotation: 0,
      curveAmount: 0,
      letterSpacing: 0
    };

    console.log('📝 Adding text to canvas:', textConfig);
    onAddText(textConfig);

    // Reset text input
    setText('');
  };

  return (
    <div className="space-y-4">
      {/* Text Input */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          📝 Nội dung văn bản
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nhập văn bản của bạn..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
          rows={3}
        />
      </div>

      {/* Add Text Button */}
      <button
        onClick={handleAddText}
        disabled={!text.trim()}
        className={`w-full px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 ${
          text.trim()
            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-sm hover:shadow-md'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        <PlusCircleIcon className="w-5 h-5" />
        <span>Thêm</span>
      </button>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-800 font-medium mb-1">💡 Mẹo sử dụng:</p>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Click vào text trên canvas để mở <strong>TextEditPanel</strong></li>
          <li>• Chỉnh sửa màu, font, cỡ chữ, bẻ cong... trong panel đó</li>
          <li>• <strong>Kéo thả</strong> để di chuyển text</li>
          <li>• <strong>Kéo góc</strong> để resize và xoay text</li>
        </ul>
      </div>
    </div>
  );
};

export default TextEditor;
