// 📝 Text Edit Panel - Floating panel to edit selected text on canvas
// Shows when text element is selected, allows real-time editing

import React from 'react';
import { 
  SwatchIcon,
  ArrowsPointingOutIcon,
  ArrowPathIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import type { DesignElement } from './types';

interface TextEditPanelProps {
  element: DesignElement;
  onUpdate: (updates: Partial<DesignElement>) => void;
  onClose: () => void;
}

const TextEditPanel: React.FC<TextEditPanelProps> = ({ element, onUpdate, onClose }) => {
  // Predefined colors
  const quickColors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
    '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB', '#A52A2A',
  ];

  // Popular fonts
  const fonts = [
    'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana',
    'Courier New', 'Comic Sans MS', 'Impact', 'Trebuchet MS', 'Palatino'
  ];

  return (
    <div className="fixed top-20 right-4 w-80 bg-white rounded-xl shadow-2xl border-2 border-purple-200 z-50 max-h-[calc(100vh-100px)] overflow-y-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-t-xl flex items-center justify-between sticky top-0 z-10">
        <div>
          <h3 className="font-bold text-lg">✏️ Edit Text</h3>
          <p className="text-xs text-purple-100">Chỉnh sửa trực tiếp</p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Text Content */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            📝 Nội dung
          </label>
          <textarea
            value={element.text || ''}
            onChange={(e) => onUpdate({ text: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
            rows={3}
          />
        </div>

        {/* Font Family */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            🔤 Font chữ
          </label>
          <select
            value={element.fontFamily || 'Arial'}
            onChange={(e) => onUpdate({ fontFamily: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            {fonts.map((font) => (
              <option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </option>
            ))}
          </select>
        </div>

        {/* Font Size */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2 flex items-center justify-between">
            <span><ArrowsPointingOutIcon className="w-4 h-4 inline mr-1" />Cỡ chữ</span>
            <span className="text-purple-600 font-bold">{element.fontSize || 32}px</span>
          </label>
          <input
            type="range"
            min="12"
            max="120"
            value={element.fontSize || 32}
            onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>12px</span>
            <span>120px</span>
          </div>
        </div>

        {/* Text Color */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            <SwatchIcon className="w-4 h-4 inline mr-1" />Màu chữ
          </label>
          
          {/* Quick Color Palette */}
          <div className="grid grid-cols-6 gap-2 mb-3">
            {quickColors.map((color) => (
              <button
                key={color}
                onClick={() => onUpdate({ fill: color })}
                className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 ${
                  element.fill === color 
                    ? 'border-purple-600 ring-2 ring-purple-300 shadow-lg' 
                    : 'border-gray-300 hover:border-purple-400'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              >
                {element.fill === color && (
                  <span className="text-white text-xl drop-shadow-lg">✓</span>
                )}
              </button>
            ))}
          </div>

          {/* Custom Color Picker */}
          <div className="flex items-center space-x-3">
            <input
              type="color"
              value={element.fill || '#000000'}
              onChange={(e) => onUpdate({ fill: e.target.value })}
              className="w-16 h-10 border-2 border-gray-300 rounded-lg cursor-pointer"
            />
            <input
              type="text"
              value={element.fill || '#000000'}
              onChange={(e) => onUpdate({ fill: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono uppercase"
              placeholder="#000000"
            />
          </div>
        </div>

        {/* Font Style & Weight */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onUpdate({ 
              fontWeight: element.fontWeight === 'bold' ? 'normal' : 'bold' 
            })}
            className={`px-3 py-2 rounded-lg border-2 font-bold transition-all ${
              element.fontWeight === 'bold'
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
            }`}
          >
            <strong>B</strong>
          </button>
          <button
            onClick={() => onUpdate({ 
              fontStyle: element.fontStyle === 'italic' ? 'normal' : 'italic' 
            })}
            className={`px-3 py-2 rounded-lg border-2 italic transition-all ${
              element.fontStyle === 'italic'
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
            }`}
          >
            <em>I</em>
          </button>
          <select
            value={element.align || 'left'}
            onChange={(e) => onUpdate({ align: e.target.value })}
            className="px-2 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
          >
            <option value="left">⬅️</option>
            <option value="center">⬆️</option>
            <option value="right">➡️</option>
          </select>
        </div>

        {/* Rotation */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2 flex items-center justify-between">
            <span><ArrowPathIcon className="w-4 h-4 inline mr-1" />Xoay chữ</span>
            <span className="text-purple-600 font-bold">{Math.round(element.rotation || 0)}°</span>
          </label>
          <input
            type="range"
            min="-180"
            max="180"
            value={element.rotation || 0}
            onChange={(e) => onUpdate({ rotation: Number(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>-180°</span>
            <span>0°</span>
            <span>+180°</span>
          </div>
        </div>

        {/* Curve Amount - BẺ CONG CHỮ */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2 flex items-center justify-between">
            <span>🌈 Bẻ cong chữ</span>
            <span className="text-pink-600 font-bold">
              {(element.curveAmount || 0) > 0 
                ? `↑${element.curveAmount}` 
                : (element.curveAmount || 0) < 0 
                  ? `↓${Math.abs(element.curveAmount || 0)}` 
                  : '0'}
            </span>
          </label>
          <input
            type="range"
            min="-100"
            max="100"
            value={element.curveAmount || 0}
            onChange={(e) => onUpdate({ curveAmount: Number(e.target.value) })}
            className="w-full h-2 bg-gradient-to-r from-pink-200 via-purple-200 to-pink-200 rounded-lg appearance-none cursor-pointer accent-pink-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Cong xuống ⌄</span>
            <span>Thẳng</span>
            <span>Cong lên ⌃</span>
          </div>
        </div>

        {/* Letter Spacing - KHOẢNG CÁCH CHỮ */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2 flex items-center justify-between">
            <span>↔️ Khoảng cách chữ</span>
            <span className="text-blue-600 font-bold">{element.letterSpacing || 0}px</span>
          </label>
          <input
            type="range"
            min="0"
            max="50"
            value={element.letterSpacing || 0}
            onChange={(e) => onUpdate({ letterSpacing: Number(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0px</span>
            <span>50px</span>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border-2 border-dashed border-gray-300">
          <p className="text-xs text-gray-600 mb-2 font-medium">👁️ Xem trước:</p>
          <div 
            className="bg-white rounded-lg p-4 min-h-[100px] flex items-center justify-center overflow-hidden"
            style={{ textAlign: (element.align as any) || 'left' }}
          >
            {element.text ? (
              (element.curveAmount || 0) !== 0 ? (
                // Curved text preview using SVG - MATCH CANVAS ALGORITHM
                (() => {
                  const curveAmount = element.curveAmount || 0;
                  const textWidth = (element.text?.length || 0) * (element.fontSize || 32) * 0.6;
                  const svgWidth = Math.max(300, textWidth + 100);
                  const svgHeight = Math.max(120, (element.fontSize || 32) * 2 + Math.abs(curveAmount) * 2);
                  const centerY = svgHeight / 2;
                  
                  // Match canvas curve calculation
                  const baseRadius = textWidth / 2;
                  const curveFactor = Math.abs(curveAmount) / 50;
                  const radius = baseRadius / Math.max(0.3, curveFactor);
                  
                  // Create arc path
                  const startX = (svgWidth - textWidth) / 2;
                  const endX = startX + textWidth;
                  const midX = svgWidth / 2;
                  
                  let pathD: string;
                  if (curveAmount > 0) {
                    // Curve UP (⌃): control point goes UP
                    const controlY = centerY - Math.min(radius * 0.3, svgHeight * 0.3);
                    pathD = `M ${startX} ${centerY} Q ${midX} ${controlY} ${endX} ${centerY}`;
                  } else {
                    // Curve DOWN (⌄): control point goes DOWN  
                    const controlY = centerY + Math.min(radius * 0.3, svgHeight * 0.3);
                    pathD = `M ${startX} ${centerY} Q ${midX} ${controlY} ${endX} ${centerY}`;
                  }

                  return (
                    <svg 
                      width={svgWidth}
                      height={svgHeight}
                      style={{ overflow: 'visible' }}
                    >
                      <defs>
                        <path
                          id="curve-preview"
                          d={pathD}
                          fill="transparent"
                        />
                      </defs>
                      <text
                        style={{
                          fontSize: `${element.fontSize || 32}px`,
                          fontFamily: element.fontFamily || 'Arial',
                          fill: element.fill || '#000000',
                          fontWeight: element.fontWeight || 'normal',
                          fontStyle: element.fontStyle || 'normal',
                          letterSpacing: `${element.letterSpacing || 0}px`
                        }}
                      >
                        <textPath href="#curve-preview" startOffset="50%" textAnchor="middle">
                          {element.text}
                        </textPath>
                      </text>
                    </svg>
                  );
                })()
              ) : (
                // Straight text preview
                <p
                  style={{
                    fontSize: `${element.fontSize || 32}px`,
                    fontFamily: element.fontFamily || 'Arial',
                    color: element.fill || '#000000',
                    fontWeight: element.fontWeight || 'normal',
                    fontStyle: element.fontStyle || 'normal',
                    letterSpacing: `${element.letterSpacing || 0}px`,
                    transform: `rotate(${element.rotation || 0}deg)`,
                    transition: 'all 0.3s ease',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                >
                  {element.text}
                </p>
              )
            ) : (
              <p className="text-gray-400 italic text-sm">
                Text preview...
              </p>
            )}
          </div>
        </div>

        {/* Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800 font-medium mb-1">💡 Mẹo sử dụng:</p>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• <strong>🌈 Bẻ cong:</strong> Kéo thanh để tạo text cong như "Ms Ngọc Hoa"</li>
            <li>• <strong>↔️ Khoảng cách:</strong> Tăng để text rộng hơn</li>
            <li>• <strong>Kéo thả:</strong> Di chuyển text trên canvas</li>
            <li>• <strong>Handles:</strong> Resize và xoay text</li>
            <li>• Mọi thay đổi cập nhật ngay lập tức!</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TextEditPanel;
