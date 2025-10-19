// 📝 Text Editor Component
// Add text to canvas with customization options: color, font, size, rotation

import React, { useState } from 'react';
import { 
  PlusCircleIcon,
  SwatchIcon,
  ArrowsPointingOutIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

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
  const [fontSize, setFontSize] = useState(32);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [color, setColor] = useState('#000000');
  const [fontWeight, setFontWeight] = useState<'normal' | 'bold'>('normal');
  const [fontStyle, setFontStyle] = useState<'normal' | 'italic'>('normal');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');
  const [rotation, setRotation] = useState(0);
  const [curveAmount, setCurveAmount] = useState(0); // Độ cong: -100 (cong xuống) to 100 (cong lên)
  const [letterSpacing, setLetterSpacing] = useState(0); // Khoảng cách chữ: 0-50px

  // Predefined colors for quick selection
  const quickColors = [
    '#000000', // Black
    '#FFFFFF', // White
    '#FF0000', // Red
    '#00FF00', // Green
    '#0000FF', // Blue
    '#FFFF00', // Yellow
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#FFA500', // Orange
    '#800080', // Purple
    '#FFC0CB', // Pink
    '#A52A2A', // Brown
  ];

  // Popular fonts
  const fonts = [
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Georgia',
    'Verdana',
    'Courier New',
    'Comic Sans MS',
    'Impact',
    'Trebuchet MS',
    'Palatino'
  ];

  const handleAddText = () => {
    if (!text.trim()) {
      alert('⚠️ Vui lòng nhập nội dung văn bản!');
      return;
    }

    const textConfig: TextConfig = {
      text: text.trim(),
      fontSize,
      fontFamily,
      color,
      fontWeight,
      fontStyle,
      textAlign,
      rotation,
      curveAmount,
      letterSpacing
    };

    console.log('📝 Adding text to canvas:', textConfig);
    onAddText(textConfig);

    // Reset text input but keep styling options
    setText('');
    
    // Show success feedback
    alert('✅ Văn bản đã được thêm vào canvas!');
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

      {/* Font Family */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          🔤 Font chữ
        </label>
        <select
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
          <span className="text-purple-600 font-bold">{fontSize}px</span>
        </label>
        <input
          type="range"
          min="12"
          max="120"
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
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
          {quickColors.map((qColor) => (
            <button
              key={qColor}
              onClick={() => setColor(qColor)}
              className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 ${
                color === qColor 
                  ? 'border-purple-600 ring-2 ring-purple-300 shadow-lg' 
                  : 'border-gray-300 hover:border-purple-400'
              }`}
              style={{ backgroundColor: qColor }}
              title={qColor}
            >
              {color === qColor && (
                <span className="text-white text-xl drop-shadow-lg">✓</span>
              )}
            </button>
          ))}
        </div>

        {/* Custom Color Picker */}
        <div className="flex items-center space-x-3">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-16 h-10 border-2 border-gray-300 rounded-lg cursor-pointer"
          />
          <input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono uppercase"
            placeholder="#000000"
          />
        </div>
      </div>

      {/* Font Style & Weight */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => setFontWeight(fontWeight === 'normal' ? 'bold' : 'normal')}
          className={`px-3 py-2 rounded-lg border-2 font-bold transition-all ${
            fontWeight === 'bold'
              ? 'bg-purple-600 text-white border-purple-600'
              : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
          }`}
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => setFontStyle(fontStyle === 'normal' ? 'italic' : 'normal')}
          className={`px-3 py-2 rounded-lg border-2 italic transition-all ${
            fontStyle === 'italic'
              ? 'bg-purple-600 text-white border-purple-600'
              : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
          }`}
        >
          <em>I</em>
        </button>
        <select
          value={textAlign}
          onChange={(e) => setTextAlign(e.target.value as 'left' | 'center' | 'right')}
          className="px-2 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
        >
          <option value="left">⬅️ Trái</option>
          <option value="center">⬆️ Giữa</option>
          <option value="right">➡️ Phải</option>
        </select>
      </div>

      {/* Rotation */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2 flex items-center justify-between">
          <span><ArrowPathIcon className="w-4 h-4 inline mr-1" />Xoay chữ</span>
          <span className="text-purple-600 font-bold">{rotation}°</span>
        </label>
        <input
          type="range"
          min="-180"
          max="180"
          value={rotation}
          onChange={(e) => setRotation(Number(e.target.value))}
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
          <span className="text-pink-600 font-bold">{curveAmount > 0 ? `↑${curveAmount}` : curveAmount < 0 ? `↓${Math.abs(curveAmount)}` : '0'}</span>
        </label>
        <input
          type="range"
          min="-100"
          max="100"
          value={curveAmount}
          onChange={(e) => setCurveAmount(Number(e.target.value))}
          className="w-full h-2 bg-gradient-to-r from-pink-200 via-purple-200 to-pink-200 rounded-lg appearance-none cursor-pointer accent-pink-600"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Cong xuống ⌄</span>
          <span>Thẳng</span>
          <span>Cong lên ⌃</span>
        </div>
      </div>

      {/* Letter Spacing */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2 flex items-center justify-between">
          <span>↔️ Khoảng cách chữ</span>
          <span className="text-blue-600 font-bold">{letterSpacing}px</span>
        </label>
        <input
          type="range"
          min="0"
          max="50"
          value={letterSpacing}
          onChange={(e) => setLetterSpacing(Number(e.target.value))}
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
          className="bg-white rounded-lg p-4 min-h-[120px] flex items-center justify-center overflow-hidden"
          style={{ textAlign }}
        >
          {text ? (
            <div style={{ position: 'relative', display: 'inline-block' }}>
              {curveAmount !== 0 ? (
                // Curved text preview using SVG
                (() => {
                  const textWidth = text.length * fontSize * 0.6;
                  const svgWidth = Math.max(400, textWidth + 100);
                  const svgHeight = Math.max(150, fontSize * 3);
                  const centerY = svgHeight / 2;
                  
                  // Calculate curve similar to canvas algorithm
                  const baseRadius = textWidth / 2;
                  const curveFactor = Math.abs(curveAmount) / 50;
                  const radius = baseRadius / Math.max(0.3, curveFactor);
                  
                  // Create arc path
                  const startX = (svgWidth - textWidth) / 2;
                  const endX = startX + textWidth;
                  
                  let pathD: string;
                  if (curveAmount > 0) {
                    // Curve up
                    const controlY = centerY - radius * 0.5;
                    pathD = `M ${startX} ${centerY} Q ${svgWidth / 2} ${controlY} ${endX} ${centerY}`;
                  } else {
                    // Curve down
                    const controlY = centerY + radius * 0.5;
                    pathD = `M ${startX} ${centerY} Q ${svgWidth / 2} ${controlY} ${endX} ${centerY}`;
                  }

                  return (
                    <svg 
                      width={svgWidth}
                      height={svgHeight}
                      style={{ overflow: 'visible' }}
                    >
                      <defs>
                        <path
                          id="textcurve"
                          d={pathD}
                          fill="transparent"
                        />
                      </defs>
                      <text
                        style={{
                          fontSize: `${fontSize}px`,
                          fontFamily: fontFamily,
                          fill: color,
                          fontWeight: fontWeight,
                          fontStyle: fontStyle,
                          letterSpacing: `${letterSpacing}px`
                        }}
                      >
                        <textPath href="#textcurve" startOffset="50%" textAnchor="middle">
                          {text}
                        </textPath>
                      </text>
                    </svg>
                  );
                })()
              ) : (
                // Straight text preview
                <p
                  style={{
                    fontSize: `${fontSize}px`,
                    fontFamily: fontFamily,
                    color: color,
                    fontWeight: fontWeight,
                    fontStyle: fontStyle,
                    letterSpacing: `${letterSpacing}px`,
                    transform: `rotate(${rotation}deg)`,
                    transition: 'all 0.3s ease',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                >
                  {text}
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-400 italic text-sm">
              Văn bản của bạn sẽ hiển thị ở đây...
            </p>
          )}
        </div>
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
        <span>Thêm văn bản vào canvas</span>
      </button>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-800 font-medium mb-1">💡 Mẹo sử dụng:</p>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• <strong>Bẻ cong chữ 🌈:</strong> Kéo thanh "Bẻ cong" để tạo text cong như "Ms Ngọc Hoa"</li>
          <li>• <strong>Double-click</strong> vào text trên canvas để chỉnh sửa trực tiếp</li>
          <li>• <strong>Kéo thả</strong> để di chuyển text</li>
          <li>• <strong>Kéo góc</strong> để resize và xoay text</li>
          <li>• <strong>Khoảng cách chữ:</strong> Tăng để tạo hiệu ứng rộng rãi</li>
        </ul>
      </div>
    </div>
  );
};

export default TextEditor;
