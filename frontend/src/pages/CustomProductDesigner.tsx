// 🎨 Custom Product Designer - Main Component
// Senior Frontend Engineer - Production Ready

import React, { useState, useEffect, useCallback } from 'react';
import Header from '../components/layout/Header';
import ProductSelector from '../components/designer/ProductSelector';
import CanvasArea from '../components/designer/CanvasArea';
import ToolsPanel from '../components/designer/ToolsPanel';
import ConsultationModal from '../components/designer/ConsultationModal';
import GeminiPreviewModal from '../components/designer/GeminiPreviewModal';
import TextEditPanel from '../components/designer/TextEditPanel';
import { CustomProductService } from '../services/customProductService';

// 🎨 Heroicons - Official Tailwind CSS Icon Library
import {
  CubeIcon, ArchiveBoxIcon, ShoppingCartIcon, ChatBubbleBottomCenterTextIcon,
  ArrowUturnLeftIcon, ArrowUturnRightIcon, ArrowUpTrayIcon, Squares2X2Icon,
  BoltIcon, CheckCircleIcon, CurrencyDollarIcon, ChartBarIcon,
  CogIcon, EyeIcon, ViewColumnsIcon, SparklesIcon, PaintBrushIcon
} from '@heroicons/react/24/outline';import type { 
  ProductResponseDto, 
  CustomDesign, 
  UploadMode, 
  CanvasState,
  ContactInfo,
  ConsultationRequest
} from '../components/designer/types';

const CustomProductDesigner: React.FC = () => {
  // 🎯 Core state management
  const [selectedProduct, setSelectedProduct] = useState<ProductResponseDto | null>(null);
  const [selectedColorCode, setSelectedColorCode] = useState<string | undefined>();
  const [uploadMode, setUploadMode] = useState<UploadMode>('image');
  const [design, setDesign] = useState<CustomDesign | null>(null);
  
  // 🎮 Canvas state management
  const [canvasState, setCanvasState] = useState<CanvasState>({
    selectedElementIds: [],
    activeTool: 'select',
    isDrawing: false,
    scale: 1,
    panX: 0,
    panY: 0,
    history: [],
    historyIndex: -1
  });

  // 💬 Consultation modal state (for products without price)
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [isSubmittingConsultation, setIsSubmittingConsultation] = useState(false);

  // 🤖 Gemini AI Preview modal state
  const [showGeminiModal, setShowGeminiModal] = useState(false);
  const [canvasDataUrl, setCanvasDataUrl] = useState<string>('');
  const [geminiHealthy, setGeminiHealthy] = useState<boolean>(true);

  // 💾 Enhanced auto-save functionality with better UX
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  // 🎨 UI Animation states
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // 📝 Text editing state - for TextEditPanel
  const [selectedTextElementId, setSelectedTextElementId] = useState<string | null>(null);

  // Debug selectedTextElementId changes
  useEffect(() => {
    console.log('🔄 selectedTextElementId changed to:', selectedTextElementId);
  }, [selectedTextElementId]);

  // 🎯 Enhanced success message system
  const showSuccessToast = useCallback((message: string) => {
    setShowSuccessMessage(message);
    setTimeout(() => setShowSuccessMessage(null), 3000);
  }, []);

  // 🎯 Handle product selection with validation
  const handleProductSelect = useCallback((product: ProductResponseDto) => {
    console.log('🎯 Product selected:', product.name, {
      hasColors: (product.colors?.length || 0) > 0,
      hasStickers: (product.stickers?.length || 0) > 0,
      hasImages: (product.images?.length || 0) > 0,
      price: product.price
    });

    setSelectedProduct(product);
    
    // Reset design when changing product
    const newDesign: CustomDesign = {
      productId: product.id,
      selectedColorCode: product.colors?.[0]?.colorCode,
      elements: [],
      canvasWidth: 800,
      canvasHeight: 600,
      metadata: {
        version: '1.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        totalElements: 0
      }
    };
    
    setDesign(newDesign);
    
    // Set default color if product has colors
    if (product.colors && product.colors.length > 0) {
      setSelectedColorCode(product.colors[0].colorCode);
    } else {
      setSelectedColorCode(undefined);
    }

    // Reset canvas state
    setCanvasState(prev => ({
      ...prev,
      selectedElementIds: [],
      history: [newDesign],
      historyIndex: 0
    }));
  }, []);

  // 🎨 Handle color selection with design update
  const handleColorSelect = useCallback((colorCode: string) => {
    setSelectedColorCode(colorCode);
    
    if (design) {
      const updatedDesign = {
        ...design,
        selectedColorCode: colorCode,
        metadata: {
          version: design.metadata?.version || '1.0',
          createdAt: design.metadata?.createdAt || new Date(),
          updatedAt: new Date(),
          totalElements: design.metadata?.totalElements || design.elements.length
        }
      };
      handleDesignChange(updatedDesign);
    }
  }, [design]);

  // ✏️ Handle design changes with history management
  const handleDesignChange = useCallback((newDesign: CustomDesign) => {
    setDesign(newDesign);
    
    // Update history for undo/redo
    setCanvasState(prev => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(newDesign);
      
      // Limit history to last 20 steps for performance
      const limitedHistory = newHistory.slice(-20);
      
      return {
        ...prev,
        history: limitedHistory,
        historyIndex: limitedHistory.length - 1
      };
    });

    // Auto-save after changes (debounced)
    debouncedAutoSave(newDesign);
  }, []);

  // 🏷️ Handle sticker selection from library
  const handleStickerSelect = useCallback((stickerUrl: string) => {
    if (design) {
      const newElement = createStickerElement(stickerUrl);
      handleDesignChange({
        ...design,
        elements: [...design.elements, newElement]
      });
    }
  }, [design, handleDesignChange]);

  // 📝 Handle text addition
  const handleTextAdd = useCallback((textConfig: any) => {
    if (design) {
      const newElement = createTextElement(textConfig);
      handleDesignChange({
        ...design,
        elements: [...design.elements, newElement]
      });
      console.log('📝 Text element added to canvas:', newElement);
    }
  }, [design, handleDesignChange]);

  // 🧹 Clear design with confirmation
  const handleClearDesign = useCallback(() => {
    if (design && design.elements.length > 0) {
      const confirmed = window.confirm('Are you sure you want to clear all elements?');
      if (!confirmed) return;
    }

    if (selectedProduct) {
      const clearedDesign: CustomDesign = {
        productId: selectedProduct.id,
        selectedColorCode,
        elements: [],
        canvasWidth: design?.canvasWidth || 800,
        canvasHeight: design?.canvasHeight || 600,
        metadata: {
          version: '1.0',
          createdAt: new Date(),
          updatedAt: new Date(),
          totalElements: 0
        }
      };
      
      handleDesignChange(clearedDesign);
    }
  }, [selectedProduct, selectedColorCode, design, handleDesignChange]);

  // 📸 Export design as PNG
  const handleExportPNG = useCallback(() => {
    if (window.customDesigner?.exportImage) {
      window.customDesigner.exportImage();
    } else {
      alert('Export functionality not available');
    }
  }, []);

  // 🤖 Generate Gemini AI Preview
  const handleGenerateGeminiPreview = useCallback(async () => {
    if (!design || design.elements.length === 0) {
      alert('Please add some elements to your design first');
      return;
    }

    try {
      setIsLoading(true);

      // Get canvas as data URL
      const stage = (window as any).Konva?.stages?.[0];
      if (!stage) {
        throw new Error('Canvas not found');
      }

      const dataUrl = stage.toDataURL({ pixelRatio: 2 });
      setCanvasDataUrl(dataUrl);
      
      // Open Gemini modal
      setShowGeminiModal(true);
    } catch (error) {
      console.error('Error preparing Gemini preview:', error);
      alert('Failed to prepare design for AI preview');
    } finally {
      setIsLoading(false);
    }
  }, [design]);

  // Handle Gemini preview selection
  const handleGeminiPreviewSelected = useCallback((selectedPreview: {
    type: 'original' | 'cartoon' | 'cutout';
    url: string;
  }) => {
    console.log('✨ Gemini preview selected:', selectedPreview.type);
    showSuccessToast(`AI Preview Applied: ${selectedPreview.type}`);
    
    // Optionally update design with selected preview URL
    if (design) {
      const updatedDesign: CustomDesign = {
        ...design,
        metadata: {
          version: design.metadata?.version || '1.0',
          createdAt: design.metadata?.createdAt || new Date(),
          updatedAt: new Date(),
          totalElements: design.elements.length,
          geminiPreviewType: selectedPreview.type,
          geminiPreviewUrl: selectedPreview.url
        } as any
      };
      setDesign(updatedDesign);
    }
  }, [design, showSuccessToast]);

  // Check Gemini health on mount
  useEffect(() => {
    const checkHealth = async () => {
      const healthy = await CustomProductService.checkGeminiHealth();
      setGeminiHealthy(healthy);
      if (!healthy) {
        console.warn('⚠️ Gemini Preview Service is not available');
      }
    };
    checkHealth();
  }, []);

  // 💾 Save design as JSON
  const handleSaveJSON = useCallback(() => {
    if (design) {
      const dataStr = JSON.stringify(design, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `custom-design-${selectedProduct?.name || 'product'}-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }, [design, selectedProduct]);

  // 💾 Enhanced save design to backend with better UX
  const handleSaveDesign = useCallback(async () => {
    if (!design) {
      showSuccessToast('⚠️ No design to save');
      return;
    }

    try {
      setSaveStatus('saving');
      setIsAutoSaving(true);
      
      // Generate preview URL (you can implement canvas screenshot here)
      const previewUrl = ''; // TODO: Implement canvas to image conversion
      
      const designId = await CustomProductService.saveCustomDesign(design, previewUrl);
      
      setLastSaved(new Date());
      setSaveStatus('saved');
      showSuccessToast('✅ Design saved successfully!');
      
      console.log('Design saved with ID:', designId);
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus('error');
      showSuccessToast('❌ Failed to save design');
    } finally {
      setIsAutoSaving(false);
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  }, [design, showSuccessToast]);

  // 🛒 Enhanced add to cart with better feedback
  const handleAddToCart = useCallback(() => {
    if (!selectedProduct || !design) {
      showSuccessToast('⚠️ Please select a product and create a design first');
      return;
    }

    if (!design.elements || design.elements.length === 0) {
      showSuccessToast('⚠️ Please add some elements to your design');
      return;
    }

    setIsLoading(true);

    // If product has price, add to cart directly
    if (selectedProduct.price > 0) {
      // TODO: Integrate with your cart system
      console.log('Adding to cart:', {
        productId: selectedProduct.id,
        design: design,
        price: selectedProduct.price
      });
      
      setTimeout(() => {
        setIsLoading(false);
        showSuccessToast('🛒 Added to cart successfully!');
      }, 1000);
    } else {
      // If no price, show consultation modal
      setIsLoading(false);
      setShowConsultationModal(true);
    }
  }, [selectedProduct, design, showSuccessToast]);

  // 📤 Enhanced image upload with progress
  const handleImageUpload = useCallback(async (file: File) => {
    try {
      console.log('📤 Uploading image:', file.name);
      setUploadProgress(0);
      
      const response = await CustomProductService.uploadImage(
        file, 
        uploadMode,
        (progress) => {
          setUploadProgress(progress);
          console.log('Upload progress:', progress + '%');
        }
      );
      
      if (response.success && response.url) {
        // Add uploaded image to canvas
        const newElement = createImageElement(response.url);
        
        if (design) {
          handleDesignChange({
            ...design,
            elements: [...design.elements, newElement]
          });
        }
        
        showSuccessToast('✅ Image uploaded successfully!');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      showSuccessToast('❌ Upload failed: ' + (error as Error).message);
    } finally {
      setUploadProgress(0);
    }
  }, [uploadMode, design, handleDesignChange, showSuccessToast]);

  // 📞 Handle consultation request submission
  const handleConsultationSubmit = useCallback(async (contactInfo: ContactInfo) => {
    if (!selectedProduct || !design) return;

    try {
      setIsSubmittingConsultation(true);
      
      // Save design first to get design ID
      const previewUrl = ''; // TODO: Generate preview
      const designId = await CustomProductService.saveCustomDesign(design, previewUrl);
      
      // Create consultation request
      const request: ConsultationRequest = {
        designId,
        contactInfo,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        designPreview: previewUrl
      };
      
      const requestId = await CustomProductService.createConsultationRequest(request);
      
      console.log('Consultation request created:', requestId);
      setShowConsultationModal(false);
      
      alert('Consultation request submitted successfully! We will contact you soon.');
    } catch (error) {
      console.error('Consultation request failed:', error);
      alert('Failed to submit request: ' + (error as Error).message);
    } finally {
      setIsSubmittingConsultation(false);
    }
  }, [selectedProduct, design]);

  // 🔄 Undo/Redo functionality
  const handleUndo = useCallback(() => {
    setCanvasState(prev => {
      if (prev.historyIndex > 0) {
        const newIndex = prev.historyIndex - 1;
        setDesign(prev.history[newIndex]);
        return { ...prev, historyIndex: newIndex };
      }
      return prev;
    });
  }, []);

  const handleRedo = useCallback(() => {
    setCanvasState(prev => {
      if (prev.historyIndex < prev.history.length - 1) {
        const newIndex = prev.historyIndex + 1;
        setDesign(prev.history[newIndex]);
        return { ...prev, historyIndex: newIndex };
      }
      return prev;
    });
  }, []);

  // 🎨 Helper functions for creating elements
  const createImageElement = (imageUrl: string) => ({
    id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'image' as const,
    x: 100,
    y: 100,
    width: 200,
    height: 200,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    src: imageUrl,
    zIndex: design?.elements.length || 0,
    createdAt: new Date(),
    opacity: 1,
    visible: true
  });

  const createStickerElement = (stickerUrl: string) => ({
    id: `sticker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'sticker' as const,
    x: 150,
    y: 150,
    width: 100,
    height: 100,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    src: stickerUrl,
    zIndex: design?.elements.length || 0,
    createdAt: new Date(),
    opacity: 1,
    visible: true
  });

  const createTextElement = (textConfig: any) => ({
    id: `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'text' as const,
    x: 200,
    y: 200,
    rotation: textConfig.rotation || 0,
    scaleX: 1,
    scaleY: 1,
    text: textConfig.text,
    fontSize: textConfig.fontSize || 32,
    fontFamily: textConfig.fontFamily || 'Arial',
    fill: textConfig.color || '#000000',
    fontWeight: textConfig.fontWeight || 'normal',
    fontStyle: textConfig.fontStyle || 'normal',
    align: textConfig.textAlign || 'left',
    curveAmount: textConfig.curveAmount || 0,
    letterSpacing: textConfig.letterSpacing || 0,
    zIndex: design?.elements.length || 0,
    createdAt: new Date(),
    opacity: 1,
    visible: true
  });

  // ⏰ Debounced auto-save (save after 3 seconds of inactivity)
  const debouncedAutoSave = useCallback(
    debounce(async (designToSave: CustomDesign) => {
      try {
        await CustomProductService.saveCustomDesign(designToSave);
        setLastSaved(new Date());
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 3000),
    []
  );

  // 🔧 Initialize global custom designer methods for external integration
  useEffect(() => {
    window.customDesigner = {
      addImage: (imageUrl: string) => {
        if (design) {
          const newElement = createImageElement(imageUrl);
          handleDesignChange({
            ...design,
            elements: [...design.elements, newElement]
          });
        }
      },
      exportImage: handleExportPNG
    };

    // Cleanup on unmount
    return () => {
      delete (window as any).customDesigner;
    };
  }, [design, handleDesignChange, handleExportPNG]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Fixed Header */}
      <Header />
      
      {/* Enhanced Mobile Navigation Helper */}
      <div className="sm:hidden bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <ViewColumnsIcon className="w-4 h-4" />
            <span>Design Studio</span>
          </div>
          {selectedProduct && (
            <div className="flex items-center space-x-2">
              <EyeIcon className="w-4 h-4" />
              <span className="truncate max-w-[120px]">{selectedProduct.name}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Hero Section - Enhanced Design Studio Header */}
      <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <SparklesIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 flex items-center">
                  <span>Custom Design Studio</span>
                  <CogIcon className="ml-2 w-6 h-6 sm:w-8 sm:h-8" />
                </h1>
                <p className="text-green-100 text-sm sm:text-lg">
                  Tạo thiết kế độc đáo cho sản phẩm của bạn
                </p>
              </div>
            </div>
            
            {/* Enhanced Quick Stats with Icons */}
            {selectedProduct && (
              <div className="flex sm:hidden lg:flex items-center justify-around sm:justify-center sm:space-x-6 lg:space-x-8 text-sm bg-white/10 rounded-xl p-3 sm:bg-transparent sm:p-0">
                <div className="text-center flex items-center space-x-2 lg:block lg:space-x-0">
                  <Squares2X2Icon className="w-5 h-5 lg:hidden" />
                  <div>
                    <div className="text-xl sm:text-2xl font-bold">{design?.elements.length || 0}</div>
                    <div className="text-green-200 text-xs sm:text-sm">Elements</div>
                  </div>
                </div>
                <div className="text-center flex items-center space-x-2 lg:block lg:space-x-0">
                  <CurrencyDollarIcon className="w-5 h-5 lg:hidden" />
                  <div>
                    <div className="text-xl sm:text-2xl font-bold">
                      {selectedProduct.price > 0 ? `$${selectedProduct.price}` : 'TBD'}
                    </div>
                    <div className="text-green-200 text-xs sm:text-sm">Price</div>
                  </div>
                </div>
                <div className="text-center flex items-center space-x-2 lg:block lg:space-x-0">
                  <ChartBarIcon className="w-5 h-5 lg:hidden" />
                  <div>
                    <div className="text-xl sm:text-2xl font-bold">Ready</div>
                    <div className="text-green-200 text-xs sm:text-sm">Status</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Main Design Workspace - Mobile-First */}
      <div className="max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-4 lg:py-8">
        <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr_320px] lg:grid-cols-[280px_1fr_280px] gap-2 sm:gap-4 lg:gap-6 min-h-[calc(100vh-200px)] sm:min-h-[calc(100vh-240px)]">
          
          {/* Left Panel - Enhanced Product Selection */}
          <div className="order-1 xl:order-1 bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200 p-3 sm:p-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                  <CubeIcon className="w-4 h-4 text-white" />
                </div>
                <span className="hidden sm:inline">Chọn sản phẩm</span>
                <span className="sm:hidden">Products</span>
              </h2>
            </div>
            <div className="h-[300px] sm:h-[400px] lg:h-[calc(100vh-320px)] overflow-y-auto">
              <ProductSelector
                selectedProduct={selectedProduct}
                onProductSelect={handleProductSelect}
              />
            </div>
          </div>

          {/* Center - Canvas Workspace */}
          <div className="order-3 xl:order-2 space-y-4">
            {/* Canvas Header with breadcrumb - Mobile Optimized */}
            {selectedProduct && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-xs sm:text-sm">
                        {selectedProduct.name.charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                        {selectedProduct.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {selectedColorCode ? `Color: ${selectedColorCode}` : 'Default color'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Status indicators - Enhanced with saveStatus */}
                  <div className="flex items-center space-x-2 sm:space-x-4">
                    {(isAutoSaving || saveStatus === 'saving') && (
                      <div className="flex items-center space-x-2 text-blue-600">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
                        <span className="text-xs sm:text-sm font-medium">
                          <span className="hidden sm:inline">Auto-saving...</span>
                          <span className="sm:hidden">Saving...</span>
                        </span>
                      </div>
                    )}
                    {saveStatus === 'saved' && (
                      <div className="flex items-center space-x-2 text-green-600">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                        <span className="text-xs sm:text-sm font-medium">
                          <span className="hidden sm:inline">Saved successfully</span>
                          <span className="sm:hidden">Saved</span>
                        </span>
                      </div>
                    )}
                    {saveStatus === 'error' && (
                      <div className="flex items-center space-x-2 text-red-600">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full"></div>
                        <span className="text-xs sm:text-sm font-medium">
                          <span className="hidden sm:inline">Save failed</span>
                          <span className="sm:hidden">Error</span>
                        </span>
                      </div>
                    )}
                    {lastSaved && !isAutoSaving && saveStatus === 'idle' && (
                      <div className="flex items-center space-x-2 text-green-600">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                        <span className="text-xs sm:text-sm font-medium">
                          <span className="hidden sm:inline">Saved {lastSaved.toLocaleTimeString()}</span>
                          <span className="sm:hidden">Saved</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Main Canvas - Responsive Height */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="h-[400px] sm:h-[500px] lg:h-[600px]">
                <CanvasArea
                  selectedProduct={selectedProduct}
                  selectedColorCode={selectedColorCode}
                  design={design}
                  onDesignChange={handleDesignChange}
                  onTextElementSelect={(id) => {
                    console.log('🎨 onTextElementSelect received in CustomProductDesigner:', id);
                    setSelectedTextElementId(id);
                  }}
                />
              </div>
            </div>
            
            {/* Enhanced Canvas Controls with React Icons */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                {/* Left Controls - History & Tools */}
                <div className="flex items-center justify-between sm:justify-start space-x-3">
                  <div className="flex items-center bg-gray-50 rounded-lg p-1">
                    <button
                      onClick={handleUndo}
                      disabled={canvasState.historyIndex <= 0}
                      className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 rounded-md hover:bg-white hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center space-x-1"
                      title="Undo (Ctrl+Z)"
                    >
                      <ArrowUturnLeftIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Undo</span>
                    </button>
                    <button
                      onClick={handleRedo}
                      disabled={canvasState.historyIndex >= canvasState.history.length - 1}
                      className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 rounded-md hover:bg-white hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center space-x-1"
                      title="Redo (Ctrl+Y)"
                    >
                      <span className="hidden sm:inline">Redo</span>
                      <ArrowUturnRightIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                  
                  {/* Element count indicator with icon */}
                  {design && design.elements.length > 0 && (
                    <div className="flex items-center space-x-2 text-gray-500 text-xs sm:text-sm bg-gray-50 px-2 py-1 rounded-lg">
                      <Squares2X2Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">
                        {design.elements.length} element{design.elements.length !== 1 ? 's' : ''}
                      </span>
                      <span className="sm:hidden">{design.elements.length}</span>
                    </div>
                  )}
                </div>
                
                {/* Right Controls - Enhanced Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                  {/* Gemini AI Preview Button */}
                  <button
                    onClick={handleGenerateGeminiPreview}
                    disabled={!design || design.elements.length === 0 || !geminiHealthy}
                    className="px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 shadow-sm hover:shadow-md text-sm sm:text-base"
                    title={geminiHealthy ? 'Generate AI preview with Gemini 2.0' : 'AI service unavailable'}
                  >
                    <SparklesIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">AI Preview</span>
                    <span className="sm:hidden">AI</span>
                  </button>

                  <button
                    onClick={handleSaveDesign}
                    disabled={!design || design.elements.length === 0}
                    className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 shadow-sm hover:shadow-md text-sm sm:text-base"
                  >
                    <ArchiveBoxIcon className="w-4 h-4" />
                    <span>Save Design</span>
                  </button>
                  
                  <button
                    onClick={handleAddToCart}
                    disabled={!selectedProduct || !design || design.elements.length === 0 || isLoading}
                    className="px-4 sm:px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 shadow-sm hover:shadow-md text-sm sm:text-base"
                  >
                    {isLoading ? (
                      <>
                        <BoltIcon className="w-4 h-4 animate-pulse" />
                        <span>Processing...</span>
                      </>
                    ) : (selectedProduct?.price || 0) > 0 ? (
                      <>
                        <ShoppingCartIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Add to Cart</span>
                        <span className="sm:hidden">Add</span>
                      </>
                    ) : (
                      <>
                        <ChatBubbleBottomCenterTextIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Request Consultation</span>
                        <span className="sm:hidden">Consult</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Enhanced Design Tools */}
          <div className="order-2 xl:order-3 bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-3 sm:p-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                  <PaintBrushIcon className="w-4 h-4 text-white" />
                </div>
                <span className="hidden sm:inline">Design Tools</span>
                <span className="sm:hidden">Tools</span>
              </h2>
            </div>
            <div className="h-[300px] sm:h-[400px] lg:h-[calc(100vh-320px)] overflow-y-auto">
              <ToolsPanel
                selectedProduct={selectedProduct}
                selectedColorCode={selectedColorCode}
                onColorSelect={handleColorSelect}
                onImageUpload={handleImageUpload}
                onStickerSelect={handleStickerSelect}
                onTextAdd={handleTextAdd}
                onClearDesign={handleClearDesign}
                onExportPNG={handleExportPNG}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Consultation Modal */}
      {showConsultationModal && (
        <ConsultationModal
          isOpen={showConsultationModal}
          onClose={() => setShowConsultationModal(false)}
          onSubmit={handleConsultationSubmit}
          isSubmitting={isSubmittingConsultation}
          productName={selectedProduct?.name || ''}
        />
      )}

      {/* Gemini AI Preview Modal */}
      {showGeminiModal && (
        <GeminiPreviewModal
          isOpen={showGeminiModal}
          onClose={() => setShowGeminiModal(false)}
          canvasDataUrl={canvasDataUrl}
          onPreviewSelected={handleGeminiPreviewSelected}
        />
      )}

      {/* Text Edit Panel - Floating panel when text element is selected */}
      {(() => {
        console.log('🔍 TextEditPanel render check:', { 
          selectedTextElementId, 
          hasDesign: !!design,
          elementFound: design?.elements.find(el => el.id === selectedTextElementId)
        });
        return selectedTextElementId && design ? (
          <TextEditPanel
            element={design.elements.find(el => el.id === selectedTextElementId)!}
            onUpdate={(updates) => {
              if (design) {
                const updatedElements = design.elements.map(el =>
                  el.id === selectedTextElementId ? { ...el, ...updates } : el
                );
                handleDesignChange({
                  ...design,
                  elements: updatedElements
                });
              }
            }}
            onClose={() => setSelectedTextElementId(null)}
          />
        ) : null;
      })()}

      {/* Enhanced Success Toast with React Icons */}
      {showSuccessMessage && (
        <div className="fixed top-16 sm:top-20 right-4 sm:right-6 z-50 animate-in slide-in-from-right-full duration-300">
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 sm:p-4 max-w-xs sm:max-w-sm mx-4 backdrop-blur-sm bg-white/95">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
              <p className="text-gray-900 font-medium text-sm sm:text-base leading-tight">{showSuccessMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Upload Progress with React Icons */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="fixed bottom-4 left-4 right-4 sm:bottom-6 sm:right-6 sm:left-auto z-50">
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 sm:p-4 min-w-[280px] mx-auto sm:mx-0 max-w-sm backdrop-blur-sm bg-white/95">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <ArrowUpTrayIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 font-medium text-sm sm:text-base">Uploading image...</p>
                <p className="text-xs sm:text-sm text-gray-500">{uploadProgress}% complete</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Floating Action Buttons - Quick Access */}
      <div className="fixed bottom-4 right-4 z-40 sm:hidden">
        <div className="flex flex-col space-y-3">
          {/* Quick Save FAB */}
          {design && design.elements.length > 0 && (
            <button
              onClick={handleSaveDesign}
              className="w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center"
              title="Quick Save"
            >
              <ArchiveBoxIcon className="w-5 h-5" />
            </button>
          )}
          
          {/* Quick Action FAB */}
          {selectedProduct && design && design.elements.length > 0 && (
            <button
              onClick={handleAddToCart}
              disabled={isLoading}
              className="w-14 h-14 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center disabled:opacity-50"
              title={(selectedProduct?.price || 0) > 0 ? 'Add to Cart' : 'Request Consultation'}
            >
              {isLoading ? (
                <BoltIcon className="w-6 h-6 animate-pulse" />
              ) : (selectedProduct?.price || 0) > 0 ? (
                <ShoppingCartIcon className="w-6 h-6" />
              ) : (
                <ChatBubbleBottomCenterTextIcon className="w-6 h-6" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Enhanced Loading Overlay with React Icons */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-xs sm:max-w-sm mx-4 w-full">
            <div className="text-center">
              <div className="relative w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4">
                <BoltIcon className="w-12 h-12 sm:w-16 sm:h-16 text-green-600 animate-pulse" />
                <div className="absolute inset-0 border-4 border-green-600/30 border-t-green-600 rounded-full animate-spin"></div>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2 flex items-center justify-center space-x-2">
                <span>Processing</span>
                <SparklesIcon className="w-5 h-5 text-green-500 animate-bounce" />
              </h3>
              <p className="text-sm sm:text-base text-gray-500">Please wait while we process your request</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 🔧 Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default CustomProductDesigner;
