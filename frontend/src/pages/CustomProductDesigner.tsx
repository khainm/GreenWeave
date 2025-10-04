import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import ProductSelector from '../components/designer/ProductSelector';
import CanvasArea from '../components/designer/CanvasArea';
import ToolsPanel from '../components/designer/ToolsPanel';
import type { ProductResponseDto, CustomDesign, UploadMode } from '../components/designer/types';

const CustomProductDesigner: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<ProductResponseDto | null>(null);
  const [selectedColorCode, setSelectedColorCode] = useState<string | undefined>();
  const [uploadMode, setUploadMode] = useState<UploadMode>('image');
  const [design, setDesign] = useState<CustomDesign | null>(null);

  // Initialize global custom designer methods
  useEffect(() => {
    window.customDesigner = {
      addImage: () => {},
      exportImage: () => {},
    };
  }, []);

  // Handle product selection
  const handleProductSelect = (product: ProductResponseDto) => {
    setSelectedProduct(product);
    
    // Reset design when changing product
    setDesign(null);
    
    // Set default color if product has colors (choose first color)
    if (product.colors && product.colors.length > 0) {
      setSelectedColorCode(product.colors[0].colorCode);
    } else {
      setSelectedColorCode(undefined);
    }
    
    console.log('Product selected:', {
      name: product.name,
      colors: product.colors?.length || 0,
      stickers: product.stickers?.length || 0,
      images: product.images?.length || 0
    });
  };

  // Handle color selection
  const handleColorSelect = (colorCode: string) => {
    setSelectedColorCode(colorCode);
    
    // Update design with new color if design exists
    if (design) {
      setDesign({
        ...design,
        selectedColorCode: colorCode,
      });
    }
  };

  // Handle design changes
  const handleDesignChange = (newDesign: CustomDesign) => {
    setDesign(newDesign);
  };

  // Handle image upload
  const handleImageUpload = (file: File) => {
    console.log('Image uploaded:', file.name);
  };

  // Handle sticker selection from library
  const handleStickerSelect = (stickerUrl: string) => {
    if (window.customDesigner?.addImage) {
      window.customDesigner.addImage(stickerUrl);
    }
  };

  // Clear design
  const handleClearDesign = () => {
    if (selectedProduct) {
      setDesign({
        productId: selectedProduct.id,
        selectedColorCode,
        elements: [],
        canvasWidth: 600,
        canvasHeight: 400,
      });
    }
  };

  // Export PNG
  const handleExportPNG = () => {
    if (window.customDesigner?.exportImage) {
      window.customDesigner.exportImage();
    }
  };

  // Save JSON
  const handleSaveJSON = () => {
    if (design) {
      const dataStr = JSON.stringify(design, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `custom-design-${selectedProduct?.name || 'product'}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <>
      {/* Fixed Header */}
      <Header />
      
      {/* Main Content */}
      <div className="flex min-h-screen bg-gray-50 pt-4">
        {/* Left Sidebar - Product Selector */}
        <ProductSelector
          selectedProduct={selectedProduct}
          onProductSelect={handleProductSelect}
        />

        {/* Main Canvas Area */}
        <CanvasArea
          selectedProduct={selectedProduct}
          selectedColorCode={selectedColorCode}
          design={design}
          onDesignChange={handleDesignChange}
        />

        {/* Right Sidebar - Tools Panel */}
        <ToolsPanel
          selectedProduct={selectedProduct}
          selectedColorCode={selectedColorCode}
          onColorSelect={handleColorSelect}
          uploadMode={uploadMode}
          onUploadModeChange={setUploadMode}
          onImageUpload={handleImageUpload}
          onStickerSelect={handleStickerSelect}
          onClearDesign={handleClearDesign}
          onExportPNG={handleExportPNG}
          onSaveJSON={handleSaveJSON}
        />
      </div>
    </>
  );
};

export default CustomProductDesigner;
