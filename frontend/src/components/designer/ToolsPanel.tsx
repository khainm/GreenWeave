import React, { useState } from 'react';
import { 
  WrenchScrewdriverIcon, 
  SwatchIcon, 
  PhotoIcon, 
  ArrowDownTrayIcon,
  SparklesIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';
import UploadSection from './UploadSection';
import ColorPicker from './ColorPicker';
import GiphyStickerPicker from './GiphyStickerPicker';
import TextEditor from './TextEditor';
import type { TextConfig } from './TextEditor';
import ActionButtons from './ActionButtons';
import ExportOptions from './ExportOptions';
import type { ProductResponseDto } from './types';
import type { GiphySticker } from '../../services/giphyService';

interface ToolsPanelProps {
  selectedProduct: ProductResponseDto | null;
  selectedColorCode?: string;
  onColorSelect: (colorCode: string) => void;
  onImageUpload: (file: File) => void;
  onStickerSelect: (stickerUrl: string) => void;
  onTextAdd: (textConfig: TextConfig) => void;
  onClearDesign: () => void;
  onExportPNG: () => void;
}

const ToolsPanel: React.FC<ToolsPanelProps> = ({
  selectedProduct,
  selectedColorCode,
  onColorSelect,
  onImageUpload,
  onStickerSelect,
  onTextAdd,
  onClearDesign,
  onExportPNG,
}) => {
  // 🧸 Giphy Sticker Picker modal state
  const [showGiphyPicker, setShowGiphyPicker] = useState(false);

  const handleGiphyStickerSelect = (sticker: GiphySticker) => {
    console.log('🧸 [ToolsPanel] Giphy sticker selected:', sticker);
    onStickerSelect(sticker.url);
    setShowGiphyPicker(false);
  };

  // 📱 Simple section component without collapse
  const Section: React.FC<{
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    gradient?: string;
  }> = ({ title, icon, children, gradient = 'from-gray-50 to-gray-100' }) => {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        {/* Section Header - Always visible */}
        <div className={`bg-gradient-to-r ${gradient} px-4 py-3 border-b border-gray-200`}>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-700">
              {icon}
            </div>
            <h3 className="text-sm font-semibold text-gray-800">
              {title}
            </h3>
          </div>
        </div>

        {/* Section Content - Always visible */}
        <div className="p-4">
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full lg:w-80 bg-gray-50 border-l border-gray-200 flex flex-col h-screen lg:h-auto">
      {/* Header with Gradient Background */}
      <div className="flex-shrink-0 bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-4 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <WrenchScrewdriverIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Design Tools</h2>
            <p className="text-xs text-emerald-100">Customize your product</p>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area with extra bottom padding */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Upload Section */}
        <Section
          title="Upload Images"
          icon={<PhotoIcon className="w-5 h-5" />}
          gradient="from-blue-50 to-indigo-50"
        >
          <UploadSection
            onImageUpload={onImageUpload}
          />
        </Section>

        {/* Text Editor Section */}
        <Section
          title="Add Text"
          icon={<PencilSquareIcon className="w-5 h-5" />}
          gradient="from-amber-50 to-orange-50"
        >
          <TextEditor onAddText={onTextAdd} />
        </Section>

        {/* Color Selection */}
        {selectedProduct && (
          <Section
            title="Color Options"
            icon={<SwatchIcon className="w-5 h-5" />}
            gradient="from-purple-50 to-pink-50"
          >
            <ColorPicker
              product={selectedProduct}
              selectedColorCode={selectedColorCode}
              onColorSelect={onColorSelect}
            />
          </Section>
        )}

        {/* Giphy Sticker Library */}
        <Section
          title=" Stickers"
          icon={<SparklesIcon className="w-5 h-5" />}
          gradient="from-pink-50 to-rose-50"
        >
          <div className="space-y-3">
            <p className="text-xs text-gray-600">
              🎨 Tìm kiếm hàng triệu sticker miễn phí 
            </p>
            <button
              onClick={() => setShowGiphyPicker(true)}
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center space-x-2 shadow-sm hover:shadow-md"
            >
              <SparklesIcon className="w-5 h-5" />
              <span>Open Sticker Picker</span>
            </button>
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
              <span>🔍 Search</span>
              <span>•</span>
              <span>🔥 Trending</span>
            </div>
          </div>
        </Section>

        {/* Quick Actions */}
        <Section
          title="Quick Actions"
          icon={<WrenchScrewdriverIcon className="w-5 h-5" />}
          gradient="from-orange-50 to-amber-50"
        >
          <ActionButtons onClearDesign={onClearDesign} />
        </Section>

        {/* Export Options */}
        <Section
          title="Export & Save"
          icon={<ArrowDownTrayIcon className="w-5 h-5" />}
          gradient="from-green-50 to-emerald-50"
        >
          <ExportOptions
            onExportPNG={onExportPNG}
          />
        </Section>

        {/* Extra spacing at bottom to ensure all content is accessible */}
        <div className="h-20"></div>
      </div>

      {/* Giphy Sticker Picker Modal */}
      {showGiphyPicker && (
        <GiphyStickerPicker
          onStickerSelect={handleGiphyStickerSelect}
          onClose={() => setShowGiphyPicker(false)}
        />
      )}
    </div>
  );
};

export default ToolsPanel;