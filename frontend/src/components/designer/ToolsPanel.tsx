import React, { useState } from 'react';
import { 
  WrenchScrewdriverIcon, 
  SwatchIcon, 
  PhotoIcon, 
  CogIcon,
  ArrowDownTrayIcon,
  ChevronDownIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import UploadSection from './UploadSection';
import ColorPicker from './ColorPicker';
import StickerLibrary from './StickerLibrary';
import ActionButtons from './ActionButtons';
import ExportOptions from './ExportOptions';
import type { ProductResponseDto, UploadMode } from './types';

interface ToolsPanelProps {
  selectedProduct: ProductResponseDto | null;
  selectedColorCode?: string;
  onColorSelect: (colorCode: string) => void;
  uploadMode: UploadMode;
  onUploadModeChange: (mode: UploadMode) => void;
  onImageUpload: (file: File) => void;
  onStickerSelect: (stickerUrl: string) => void;
  onClearDesign: () => void;
  onExportPNG: () => void;
  onSaveJSON: () => void;
}

interface ToolsPanelProps {
  selectedProduct: ProductResponseDto | null;
  selectedColorCode?: string;
  onColorSelect: (colorCode: string) => void;
  uploadMode: UploadMode;
  onUploadModeChange: (mode: UploadMode) => void;
  onImageUpload: (file: File) => void;
  onStickerSelect: (stickerUrl: string) => void;
  onClearDesign: () => void;
  onExportPNG: () => void;
  onSaveJSON: () => void;
}

const ToolsPanel: React.FC<ToolsPanelProps> = ({
  selectedProduct,
  selectedColorCode,
  onColorSelect,
  uploadMode,
  onUploadModeChange,
  onImageUpload,
  onStickerSelect,
  onClearDesign,
  onExportPNG,
  onSaveJSON,
}) => {
  // 🎨 Collapsible sections state for better UX
  const [expandedSections, setExpandedSections] = useState({
    upload: true,
    colors: true,
    stickers: true,
    actions: true,
    export: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // 📱 Responsive section component with glassmorphism
  const Section: React.FC<{
    title: string;
    icon: React.ReactNode;
    sectionKey: keyof typeof expandedSections;
    children: React.ReactNode;
  }> = ({ title, icon, sectionKey, children }) => {
    const isExpanded = expandedSections[sectionKey];
    
    return (
      <div className="group animate-fade-in">
        <div className={`
          glass-card-strong rounded-xl shadow-lg hover:shadow-xl 
          transition-all duration-300 hover:scale-[1.02] overflow-hidden
          hover:animate-glass-shimmer
        `}>
          {/* Section Header with Toggle */}
          <button
            onClick={() => toggleSection(sectionKey)}
            className="w-full px-4 py-3 flex items-center justify-between 
                     text-left hover:bg-white/10 transition-colors duration-200
                     focus:outline-none focus:ring-2 focus:ring-emerald-500/50 rounded-t-xl
                     active:scale-98 transform"
            aria-expanded={isExpanded}
            aria-controls={`section-${sectionKey}`}
            aria-label={`Toggle ${title} section`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg glass-card
                            flex items-center justify-center text-gray-700 
                            group-hover:scale-110 transition-transform duration-200
                            group-hover:rotate-3">
                {icon}
              </div>
              <h3 className="text-sm font-semibold text-gray-800 sm:text-base
                           group-hover:text-gray-900 transition-colors">
                {title}
              </h3>
            </div>
            <div className={`
              transform transition-all duration-300 text-gray-600
              ${isExpanded ? 'rotate-180 text-emerald-600' : 'rotate-0'}
              hover:scale-110
            `}>
              <ChevronDownIcon className="w-5 h-5" />
            </div>
          </button>

          {/* Section Content with Smooth Animation */}
          <div
            id={`section-${sectionKey}`}
            className={`
              overflow-hidden transition-all duration-500 ease-in-out
              ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
            `}
          >
            <div className="px-4 pb-4">
              <div className={`
                pt-2 transform transition-all duration-300
                ${isExpanded ? 'translate-y-0' : '-translate-y-2'}
              `}>
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="
      w-full lg:w-80 bg-gradient-to-b from-gray-50/80 to-white/80 
      backdrop-blur-xl border-l border-gray-200/50 
      min-h-screen lg:min-h-0 relative
    ">
      {/* Header with Gradient Background */}
      <div className="
        sticky top-0 z-10 bg-gradient-to-r from-emerald-500 to-teal-600 
        px-4 py-6 lg:px-6 shadow-lg
      ">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm 
                        flex items-center justify-center">
            <WrenchScrewdriverIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Design Tools</h2>
            <p className="text-xs text-emerald-100 hidden sm:block">
              Customize your product design
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="
        h-full overflow-y-auto px-4 py-6 lg:px-6 space-y-4 
        scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent
      ">
        {/* Upload Section */}
        <Section
          title="Upload Images"
          icon={<PhotoIcon className="w-5 h-5" />}
          sectionKey="upload"
        >
          <UploadSection
            uploadMode={uploadMode}
            onUploadModeChange={onUploadModeChange}
            onImageUpload={onImageUpload}
          />
        </Section>

        {/* Color Selection */}
        {selectedProduct && (
          <Section
            title="Color Options"
            icon={<SwatchIcon className="w-5 h-5" />}
            sectionKey="colors"
          >
            <ColorPicker
              product={selectedProduct}
              selectedColorCode={selectedColorCode}
              onColorSelect={onColorSelect}
            />
          </Section>
        )}

        {/* Sticker Library */}
        {selectedProduct && (
          <Section
            title="Sticker Library"
            icon={<SparklesIcon className="w-5 h-5" />}
            sectionKey="stickers"
          >
            <StickerLibrary
              product={selectedProduct}
              onStickerSelect={onStickerSelect}
            />
          </Section>
        )}

        {/* Quick Actions */}
        <Section
          title="Quick Actions"
          icon={<CogIcon className="w-5 h-5" />}
          sectionKey="actions"
        >
          <ActionButtons onClearDesign={onClearDesign} />
        </Section>

        {/* Export Options */}
        <Section
          title="Export & Save"
          icon={<ArrowDownTrayIcon className="w-5 h-5" />}
          sectionKey="export"
        >
          <ExportOptions
            onExportPNG={onExportPNG}
            onSaveJSON={onSaveJSON}
          />
        </Section>
      </div>

      {/* Decorative Bottom Gradient */}
      <div className="
        absolute bottom-0 left-0 right-0 h-16 
        bg-gradient-to-t from-white/80 to-transparent 
        pointer-events-none
      " />
    </div>
  );
};

export default ToolsPanel;