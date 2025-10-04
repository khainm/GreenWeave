import React from 'react';
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
  return (
    <div className="w-80 bg-white border-l border-gray-200 p-6 space-y-6 min-h-screen">
      <UploadSection
        uploadMode={uploadMode}
        onUploadModeChange={onUploadModeChange}
        onImageUpload={onImageUpload}
      />

      {selectedProduct && (
        <ColorPicker
          product={selectedProduct}
          selectedColorCode={selectedColorCode}
          onColorSelect={onColorSelect}
        />
      )}

      {selectedProduct && (
        <StickerLibrary
          product={selectedProduct}
          onStickerSelect={onStickerSelect}
        />
      )}

      <ActionButtons
        onClearDesign={onClearDesign}
      />

      <ExportOptions
        onExportPNG={onExportPNG}
        onSaveJSON={onSaveJSON}
      />
    </div>
  );
};

export default ToolsPanel;