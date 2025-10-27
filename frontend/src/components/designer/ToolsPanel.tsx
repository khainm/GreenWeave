import React, { useState } from "react";
import {
  SwatchIcon,
  PhotoIcon,
  ArrowDownTrayIcon,
  SparklesIcon,
  PencilSquareIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import UploadSection from "./UploadSection";
import ColorPicker from "./ColorPicker";
import GiphyStickerPicker from "./GiphyStickerPicker";
import TextEditor, { type TextConfig } from "./TextEditor";
import ActionButtons from "./ActionButtons";
import ExportOptions from "./ExportOptions";
import type { ProductResponseDto } from "./types";
import type { GiphySticker } from "../../services/giphyService";

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
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [showGiphyPicker, setShowGiphyPicker] = useState(false);

  const handleGiphyStickerSelect = (sticker: GiphySticker) => {
    onStickerSelect(sticker.url);
    setShowGiphyPicker(false);
  };

  const toggleTool = (tool: string) => {
    setActiveTool((prev) => (prev === tool ? null : tool));
  };

  const tools = [
    {
      id: "upload",
      icon: <PhotoIcon className="w-5 h-5" />,
      label: "Ảnh",
      color: "text-blue-500",
      gradient: "from-blue-500 to-indigo-500",
    },
    {
      id: "text",
      icon: <PencilSquareIcon className="w-5 h-5" />,
      label: "Văn bản",
      color: "text-amber-500",
      gradient: "from-amber-400 to-orange-500",
    },
    {
      id: "color",
      icon: <SwatchIcon className="w-5 h-5" />,
      label: "Màu",
      color: "text-purple-500",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      id: "sticker",
      icon: <SparklesIcon className="w-5 h-5" />,
      label: "Sticker",
      color: "text-pink-500",
      gradient: "from-pink-500 to-rose-500",
    },
    {
      id: "action",
      icon: <WrenchScrewdriverIcon className="w-5 h-5" />,
      label: "Hành động",
      color: "text-orange-500",
      gradient: "from-orange-500 to-yellow-500",
    },
    {
      id: "export",
      icon: <ArrowDownTrayIcon className="w-5 h-5" />,
      label: "Xuất",
      color: "text-green-500",
      gradient: "from-green-500 to-emerald-500",
    },
  ];

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200 shadow-inner">
      {/* 🔹 Toolbar Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 p-3 bg-gray-50/80 border-b border-gray-200 backdrop-blur-sm">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => toggleTool(tool.id)}
            className={`relative flex flex-col items-center justify-center rounded-xl p-2 transition-all duration-300 border group ${
              activeTool === tool.id
                ? "bg-gradient-to-br " + tool.gradient + " text-white shadow-lg border-transparent scale-105"
                : "bg-white hover:bg-gray-100 border-gray-200 hover:shadow-md"
            }`}
          >
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                activeTool === tool.id
                  ? "bg-white/20 text-white"
                  : `${tool.color} bg-gray-50`
              }`}
            >
              {tool.icon}
            </div>
            <span
              className={`mt-1 text-[11px] font-medium ${
                activeTool === tool.id ? "text-white" : "text-gray-700"
              }`}
            >
              {tool.label}
            </span>

            {/* Tooltip on hover */}
            <div className="absolute bottom-12 opacity-0 group-hover:opacity-100 bg-gray-900 text-white text-xs rounded-md px-2 py-1 transition-opacity">
              {tool.label}
            </div>
          </button>
        ))}
      </div>

      {/* 🔸 Animated Content Area */}
      <div
        className={`flex-1 overflow-y-auto p-4 transition-all duration-300 ease-in-out ${
          activeTool ? "opacity-100" : "opacity-0 h-0 p-0"
        }`}
      >
        {activeTool === "upload" && (
          <div className="animate-fadeIn">
            <UploadSection onImageUpload={onImageUpload} />
          </div>
        )}

        {activeTool === "text" && (
          <div className="animate-fadeIn">
            <TextEditor onAddText={onTextAdd} />
          </div>
        )}

        {activeTool === "color" && selectedProduct && (
          <div className="animate-fadeIn">
            <ColorPicker
              product={selectedProduct}
              selectedColorCode={selectedColorCode}
              onColorSelect={onColorSelect}
            />
          </div>
        )}

        {activeTool === "sticker" && (
          <div className="space-y-3 text-center animate-fadeIn">
            <p className="text-xs text-gray-600">
              🎨 Chọn sticker miễn phí từ Giphy
            </p>
            <button
              onClick={() => setShowGiphyPicker(true)}
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
            >
              <SparklesIcon className="w-5 h-5" />
              <span>Mở thư viện Sticker</span>
            </button>
          </div>
        )}

        {activeTool === "action" && (
          <div className="animate-fadeIn">
            <ActionButtons onClearDesign={onClearDesign} />
          </div>
        )}

        {activeTool === "export" && (
          <div className="animate-fadeIn">
            <ExportOptions onExportPNG={onExportPNG} />
          </div>
        )}
      </div>

      {/* Giphy Picker Modal */}
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
