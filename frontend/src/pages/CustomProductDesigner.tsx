// 🎨 Custom Product Designer - Main Component (Final)
// Production-ready: AI Try-On (person + product), Cartoon Preview, history, save, UX.

import React, { useState, useEffect, useCallback } from "react";
import Header from "../components/layout/Header";
import ProductSelector from "../components/designer/ProductSelector";
import CanvasArea from "../components/designer/CanvasArea";
import ToolsPanel from "../components/designer/ToolsPanel";
import ConsultationModal from "../components/designer/ConsultationModal";
import AiTryOnModal from "../components/designer/AiTryOnModal";
import AiCartoonModal from "../components/designer/AiCartoonModal";
import GiphyStickerPicker from "../components/designer/GiphyStickerPicker";
import type { GiphySticker } from "../services/giphyService";
import TextEditPanel from "../components/designer/TextEditPanel";
import { CustomProductService } from "../services/customProductService";
import AiGeneratedGallery from "../components/designer/AiGeneratedGallery";


import {
  CubeIcon, ArchiveBoxIcon, ChatBubbleBottomCenterTextIcon,
  ArrowUturnLeftIcon, ArrowUturnRightIcon, TrashIcon, ArrowUpTrayIcon, Squares2X2Icon,
  BoltIcon, CheckCircleIcon, ChartBarIcon, CogIcon, EyeIcon,
  ViewColumnsIcon, SparklesIcon, PaintBrushIcon, ChevronDownIcon, ChevronUpIcon
} from "@heroicons/react/24/outline";

import type {
  ProductResponseDto, CustomDesign, CanvasState,
  ContactInfo, ConsultationRequest
} from "../components/designer/types";

const CustomProductDesigner: React.FC = () => {
  // Core state
  const [selectedProduct, setSelectedProduct] = useState<ProductResponseDto | null>(null);
  const [selectedColorCode, setSelectedColorCode] = useState<string | undefined>();
  const [design, setDesign] = useState<CustomDesign | null>(null);

  // Canvas / history
  const [canvasState, setCanvasState] = useState<CanvasState>({
    selectedElementIds: [], activeTool: "select", isDrawing: false,
    scale: 1, panX: 0, panY: 0, history: [], historyIndex: -1
  });

  // AI modals / states
  const [showTryOnModal, setShowTryOnModal] = useState(false);
  const [showCartoonModal, setShowCartoonModal] = useState(false);
  const [showGeminiModal, setShowGeminiModal] = useState(false);
  const [canvasDataUrl, setCanvasDataUrl] = useState<string>(""); // result image
  const [geminiHealthy, setGeminiHealthy] = useState<boolean>(true);
  const [aiImageType, setAiImageType] = useState<"cartoon" | "tryon" | null>(null); // 🎨 Phân biệt loại ảnh AI
  const [aiGeneratedImages, setAiGeneratedImages] = useState<any[]>([]); // 🎨 Danh sách ảnh AI đã tạo

  // UX
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(true); // ✨ State for collapsible product selector
  const [showStickerPicker, setShowStickerPicker] = useState(false); // ✨ State for sticker picker modal
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Text selection
  const [selectedTextElementId, setSelectedTextElementId] = useState<string | null>(null);

  const showSuccessToast = useCallback((message: string) => {
    setShowSuccessMessage(message);
    setTimeout(() => setShowSuccessMessage(null), 3000);
  }, []);

  // Product select
  const handleProductSelect = useCallback((product: ProductResponseDto) => {
    setSelectedProduct(product);

    const newDesign: CustomDesign = {
      productId: product.id,
      selectedColorCode: product.colors?.[0]?.colorCode,
      elements: [],
      canvasWidth: 800,
      canvasHeight: 600,
      metadata: {
        version: "1.0",
        createdAt: new Date(),
        updatedAt: new Date(),
        totalElements: 0
      }
    };

    setDesign(newDesign);
    setSelectedColorCode(product.colors?.[0]?.colorCode);

    setCanvasState(prev => ({
      ...prev,
      selectedElementIds: [],
      history: [newDesign],
      historyIndex: 0
    }));
  }, []);

  // Color select
  const handleColorSelect = useCallback((colorCode: string) => {
    setSelectedColorCode(colorCode);
    if (design) {
      const updated = {
        ...design,
        selectedColorCode: colorCode,
        metadata: {
          version: design.metadata?.version || "1.0",
          createdAt: design.metadata?.createdAt || new Date(),
          updatedAt: new Date(),
          totalElements: design.elements.length
        }
      };
      handleDesignChange(updated);
    }
  }, [design]);

  // Design change + history + autosave
  const handleDesignChange = useCallback((newDesign: CustomDesign) => {
    setDesign(newDesign);
    setCanvasState(prev => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(newDesign);
      const limited = newHistory.slice(-20);
      return { ...prev, history: limited, historyIndex: limited.length - 1 };
    });
    debouncedAutoSave(newDesign);
  }, []);

  // Stickers / Text add
  const handleStickerSelect = useCallback((url: string) => {
    if (!design) return;
    const el = createStickerElement(url);
    handleDesignChange({ ...design, elements: [...design.elements, el] });
  }, [design, handleDesignChange]);

  const handleTextAdd = useCallback((cfg: any) => {
    if (!design) return;
    const el = createTextElement(cfg);
    handleDesignChange({ ...design, elements: [...design.elements, el] });
  }, [design, handleDesignChange]);

  // Clear
  const handleClearDesign = useCallback(() => {
    if (!selectedProduct) return;
    const cleared: CustomDesign = {
      productId: selectedProduct.id,
      selectedColorCode,
      elements: [],
      canvasWidth: design?.canvasWidth || 800,
      canvasHeight: design?.canvasHeight || 600,
      metadata: { version: "1.0", createdAt: new Date(), updatedAt: new Date(), totalElements: 0 }
    };
    handleDesignChange(cleared);
  }, [selectedProduct, selectedColorCode, design, handleDesignChange]);

  // Export PNG
  const handleExportPNG = useCallback(() => {
    try {
      const stage = (window as any).Konva?.stages?.[0];
      if (!stage) throw new Error("Canvas not found");
      const dataUrl = stage.toDataURL({ pixelRatio: 2 });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "design.png";
      link.click();
    } catch (e) {
      alert("Failed to export PNG");
    }
  }, []);

  // Cartoon preview (optional)
  const handleCartoonSubmit = async () => {
    try {
      setIsLoading(true);
      setShowCartoonModal(false);
      const stage = (window as any).Konva?.stages?.[0];
      if (!stage) throw new Error("Canvas not found");
      const dataUrl = stage.toDataURL({ pixelRatio: 2 });
      const productBlob = await (await fetch(dataUrl)).blob();

      const formData = new FormData();
      formData.append("image", productBlob, "design.png");
      formData.append("prompt",
        "Make this product into a cute anime-style cartoon. Soft pastel colors, clean lines, and a cute background."
      );

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const res = await fetch(`${API_BASE_URL}/api/aicartoon/cartoon-preview`, { method: "POST", body: formData });
      if (!res.ok) throw new Error("AI Cartoon generation failed");
      const data = await res.json();
      setCanvasDataUrl(`data:image/png;base64,${data.imageBase64}`);
      setAiImageType("cartoon"); // 🎨 Đánh dấu đây là ảnh cartoon
      setShowGeminiModal(true);
    } catch (err) {
      alert("AI Cartoon Preview failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ AI Try-On (accept file from modal)
  const handleAiTryOn = async (userImage: File, productPreviewUrl?: string) => {
    try {
      setIsLoading(true);
      setUploadProgress(0);


      let productBlob: Blob;
      if (productPreviewUrl && productPreviewUrl.startsWith("data:image")) {
        productBlob = await (await fetch(productPreviewUrl)).blob();
        console.log("🧠 Using AI-generated product image for try-on");
      } else if (canvasDataUrl && canvasDataUrl.startsWith("data:image")) {
        productBlob = await (await fetch(canvasDataUrl)).blob();
        console.log("🧠 Using last AI canvas image for try-on");
      } else {
        const stage = (window as any).Konva?.stages?.[0];
        if (!stage) throw new Error("Canvas not found.");
        const dataUrl = stage.toDataURL({ pixelRatio: 2 });
        productBlob = await (await fetch(dataUrl)).blob();
        console.log("🧠 Fallback to current canvas snapshot for try-on");
      }


      // 2) gửi 2 ảnh + prompt lên backend
      const formData = new FormData();
      formData.append("image1", userImage, "person.png");   // người
      formData.append("image2", productBlob, "product.png"); // sản phẩm
      formData.append("prompt",
        "Combine the person and the tote bag into a realistic full-body photo where the person naturally wears the tote bag on their shoulder. " +
        "If the uploaded person image only shows the upper body, realistically extend the missing parts (legs, feet, posture) to complete the body. " +
        "Keep natural proportions, consistent clothing style, realistic lighting, and remove the background. " +
        "The final image should look like a real fashion photo taken in studio lighting."
      );

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const resp = await fetch(`${API_BASE_URL}/api/aiedit/multi-image-edit`, { method: "POST", body: formData });
      const json = await resp.json();
      if (!resp.ok) {
        console.error("Backend error:", json);
        alert(json.error || "An unexpected error occurred. Please try again.");
        return;
      }

      if (!json.imageBase64) {
        console.error("No image returned from backend:", json);
        alert("The AI service did not return an image. Please try again later.");
        return;
      }

      // 3) hiển thị kết quả
      setCanvasDataUrl("data:image/png;base64," + json.imageBase64);
      setAiImageType("tryon"); // 🧥 Đánh dấu đây là ảnh try-on
      setShowGeminiModal(true);
    } catch (e) {
      console.error(e);
      alert("AI Try-On thất bại. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  // Health check
  useEffect(() => {
    (async () => {
      const healthy = await CustomProductService.checkGeminiHealth();
      setGeminiHealthy(healthy);
    })();
  }, []);

  // 🎨 Load AI generated images from localStorage on mount
  useEffect(() => {
    const loadAiImages = () => {
      try {
        const stored = localStorage.getItem("aiGeneratedItems");
        if (stored) {
          const parsed = JSON.parse(stored);
          setAiGeneratedImages(Array.isArray(parsed) ? parsed : []);
        }
      } catch (error) {
        console.error("❌ Failed to load AI images from localStorage:", error);
        setAiGeneratedImages([]);
      }
    };
    loadAiImages();
  }, []);


  useEffect(() => {
    if (canvasDataUrl && canvasDataUrl.startsWith("data:image") && aiImageType) {
      try {
        const img = new Image();
        img.src = canvasDataUrl;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const scale = 800 / img.width;
          canvas.width = 800;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.8);

          const existing = JSON.parse(localStorage.getItem("aiGeneratedItems") || "[]");
          const newItem = {
            id: Date.now().toString(),
            url: compressedBase64,
            createdAt: new Date().toISOString(),
            type: aiImageType, // 🎨 Lưu loại ảnh (cartoon hoặc tryon)
          };
          const updated = [newItem, ...existing].slice(0, 15);
          localStorage.setItem("aiGeneratedItems", JSON.stringify(updated));
          console.log(`💾 Saved AI ${aiImageType} to localStorage:`, newItem);
          setAiGeneratedImages(updated); // ✅ Cập nhật state ngay lập tức
          setAiImageType(null); // Reset để tránh lưu lại nhiều lần
        };
      } catch (error) {
        console.error("❌ Error saving AI image:", error);
      }
    }
  }, [canvasDataUrl, aiImageType]);

  // Upload image to canvas
  const handleImageUpload = useCallback(async (file: File) => {
    try {
      setUploadProgress(0);
      const response = await CustomProductService.uploadImage(file, p => setUploadProgress(p));
      if (response.success && response.url && design) {
        const el = createImageElement(response.url);
        handleDesignChange({ ...design, elements: [...design.elements, el] });
        showSuccessToast("✅ Image uploaded!");
      }
    } catch {
      // ignore
    } finally {
      setUploadProgress(0);
    }
  }, [design, handleDesignChange, showSuccessToast]);

  // Consultation (demo)
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [isSubmittingConsultation, setIsSubmittingConsultation] = useState(false);
  const handleConsultationSubmit = useCallback(async (contactInfo: ContactInfo, selectedImageUrl?: string) => {
    if (!selectedProduct || !design) return;
    try {
      setIsSubmittingConsultation(true);

      // 📸 Capture canvas image for preview
      let previewUrl = "";
      try {
        console.log('🖼️ [Consultation] Processing image for preview...');
        console.log('🖼️ [Consultation] selectedImageUrl:', selectedImageUrl?.substring(0, 100));

        // ✨ Upload base64 to Cloudinary
        if (selectedImageUrl && selectedImageUrl.startsWith('data:image')) {
          console.log('📤 [Consultation] Uploading base64 to Cloudinary...');

          try {
            const uploadResponse = await CustomProductService.uploadBase64Image(
              selectedImageUrl,
              `consultation-${Date.now()}.png`,
              'custom-design'
            );

            if (uploadResponse?.url) {
              previewUrl = uploadResponse.url;
              console.log('✅ [Consultation] Image uploaded to Cloudinary:', previewUrl);
            } else {
              console.warn('⚠️ [Consultation] Upload response missing URL, using base64 fallback');
              previewUrl = selectedImageUrl; // Fallback to base64
            }
          } catch (uploadError) {
            console.error('❌ [Consultation] Cloudinary upload failed, using base64 fallback:', uploadError);
            previewUrl = selectedImageUrl; // Fallback to base64
          }
        } else if (selectedImageUrl && selectedImageUrl.startsWith('http')) {
          // Nếu là URL đã upload rồi, dùng luôn
          previewUrl = selectedImageUrl;
          console.log('✅ [Consultation] Using existing uploaded image URL:', previewUrl);
        } else {
          console.log('🖼️ [Consultation] Falling back to canvas capture...');
          // Fallback: Capture từ canvas
          const stage = (window as any).Konva?.stages?.[0];
          if (stage) {
            console.log('📸 [Consultation] Capturing canvas...');
            const dataUrl = stage.toDataURL({ pixelRatio: 2 });

            try {
              const uploadResponse = await CustomProductService.uploadBase64Image(
                dataUrl,
                `consultation-canvas-${Date.now()}.png`,
                'custom-design'
              );

              if (uploadResponse?.url) {
                previewUrl = uploadResponse.url;
                console.log('✅ [Consultation] Canvas uploaded to Cloudinary:', previewUrl);
              } else {
                previewUrl = dataUrl; // Fallback
              }
            } catch (uploadError) {
              console.error('❌ [Consultation] Canvas upload failed:', uploadError);
              previewUrl = dataUrl; // Fallback
            }
          } else if (canvasDataUrl) {
            previewUrl = canvasDataUrl;
            console.log('✅ [Consultation] Using AI-generated canvas image as preview');
          } else {
            console.warn('⚠️ [Consultation] No image source available!');
          }
        }

        console.log('🎯 [Consultation] Final previewUrl:', previewUrl?.substring(0, 100));
      } catch (error) {
        console.error('❌ [Consultation] Failed to process image:', error);
        // Continue without preview image
      }

      // Save design first to get designId
      let savedDesignId: string | undefined;
      try {
        console.log('💾 [Consultation] Saving design first...');
        savedDesignId = await CustomProductService.saveCustomDesign(design, previewUrl);
        console.log('✅ [Consultation] Design saved with ID:', savedDesignId);
      } catch (designError) {
        console.error('⚠️ [Consultation] Failed to save design:', designError);
        // Continue without design ID
      }

      // Create consultation request (designId is optional)
      console.log('📞 [Consultation] Creating consultation request with data:', {
        designId: savedDesignId,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        designPreview: previewUrl || 'EMPTY!',
        customerName: contactInfo.customerName
      });

      await CustomProductService.createConsultationRequest({
        designId: savedDesignId, // Will be undefined if save failed
        contactInfo,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        designPreview: previewUrl
      });

      console.log('✅ [Consultation] Consultation request sent successfully!');
      setShowConsultationModal(false);
      alert("✅ Yêu cầu tư vấn đã được gửi! Chúng tôi sẽ liên hệ với bạn sớm nhất.");
    } catch (error) {
      console.error('❌ Consultation submission failed:', error);
      alert("❌ Có lỗi xảy ra. Vui lòng thử lại!");
    } finally {
      setIsSubmittingConsultation(false);
    }
  }, [selectedProduct, design, canvasDataUrl]);
  // Delete selected element
  const handleDeleteElement = useCallback(() => {
    if (!design || !canvasState.selectedElementIds.length) return;
    const remaining = design.elements.filter(
      el => !canvasState.selectedElementIds.includes(el.id)
    );
    handleDesignChange({
      ...design,
      elements: remaining,
      metadata: {
        version: design.metadata?.version || '1.0',
        createdAt: design.metadata?.createdAt || new Date(),
        updatedAt: new Date(),
        totalElements: remaining.length,
      },
    });
    setCanvasState(prev => ({ ...prev, selectedElementIds: [] }));
    showSuccessToast("🗑️ Deleted selected element");
  }, [design, canvasState.selectedElementIds, handleDesignChange, showSuccessToast]);

  // Undo/redo
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

  // Helpers to create elements
  const createImageElement = (url: string) => ({
    id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    type: "image" as const, x: 100, y: 100, width: 200, height: 200,
    rotation: 0, scaleX: 1, scaleY: 1, src: url, zIndex: design?.elements.length || 0,
    createdAt: new Date(), opacity: 1, visible: true
  });
  const createStickerElement = (url: string) => ({
    id: `sticker_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    type: "sticker" as const, x: 150, y: 150, width: 100, height: 100,
    rotation: 0, scaleX: 1, scaleY: 1, src: url, zIndex: design?.elements.length || 0,
    createdAt: new Date(), opacity: 1, visible: true
  });
  const createTextElement = (cfg: any) => ({
    id: `text_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    type: "text" as const, x: 200, y: 200, rotation: cfg.rotation || 0,
    scaleX: 1, scaleY: 1, text: cfg.text, fontSize: cfg.fontSize || 32,
    fontFamily: cfg.fontFamily || "Arial", fill: cfg.color || "#000000",
    fontWeight: cfg.fontWeight || "normal", fontStyle: cfg.fontStyle || "normal",
    align: cfg.textAlign || "left", curveAmount: cfg.curveAmount || 0,
    letterSpacing: cfg.letterSpacing || 0, zIndex: design?.elements.length || 0,
    createdAt: new Date(), opacity: 1, visible: true
  });

  // Debounced autosave
  const debouncedAutoSave = useCallback(
    debounce(async (d: CustomDesign) => {
      try {
        setSaveStatus("saving");
        await CustomProductService.saveCustomDesign(d);
        setLastSaved(new Date());
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 1000);
      } catch {
        setSaveStatus("error");
      }
    }, 1200),
    []
  );

  // expose to window (optional)
  useEffect(() => {
    (window as any).customDesigner = {
      addImage: (url: string) => design && handleDesignChange({ ...design, elements: [...design.elements, createImageElement(url)] }),
      exportImage: handleExportPNG
    };
    return () => { delete (window as any).customDesigner; };
  }, [design, handleDesignChange, handleExportPNG]);

  const handleSaveDesign = useCallback(async () => {
    try {
      setIsLoading(true);
      if (design) await CustomProductService.saveCustomDesign(design);
      showSuccessToast("💾 Saved!");
    } finally {
      setIsLoading(false);
    }
  }, [design, showSuccessToast]);

  return (
    <div className="min-h-screen gradient-mesh animate-fade-in">
      <Header />

      {/* top bar mobile - Enhanced with animations */}
      <div className="sm:hidden bg-white/90 backdrop-blur-lg border-b border-emerald-200 px-4 py-3 sticky top-0 z-30 shadow-lg animate-slide-up">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md hover-scale">
              <ViewColumnsIcon className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-800">Design Studio</span>
          </div>
          {selectedProduct && (
            <div className="flex items-center space-x-2 bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-1.5 rounded-lg shadow-sm border border-emerald-200 animate-bounce-in">
              <EyeIcon className="w-4 h-4 text-emerald-600" />
              <span className="truncate max-w-[120px] text-gray-700 font-semibold">{selectedProduct.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* hero - Premium animated design */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 text-white animate-gradient">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
            <div className="flex items-start space-x-3 sm:space-x-4 animate-slide-in-left">
              <div className="w-12 h-12 sm:w-20 sm:h-20 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-lg border border-white/30 shadow-xl hover-lift animate-float">
                <SparklesIcon className="w-6 h-6 sm:w-10 sm:h-10 text-white animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl sm:text-4xl font-bold mb-1 sm:mb-2 flex flex-wrap items-center gap-2">
                  <span className="bg-gradient-to-r from-white via-emerald-100 to-white bg-clip-text text-transparent">
                    Custom Design Studio
                  </span>
                  <CogIcon className="w-5 h-5 sm:w-8 sm:h-8 text-white/80 animate-spin-slow" />
                </h1>
                <p className="text-emerald-50 text-xs sm:text-lg font-medium flex items-center gap-2">
                  <PaintBrushIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Tạo thiết kế độc đáo, thể hiện phong cách riêng của bạn</span>
                  <span className="sm:hidden">Thiết kế độc đáo của bạn</span>
                </p>
              </div>
            </div>

            {/* Stats badges - Enhanced with animations */}
            <div className="flex gap-2 sm:gap-4 animate-slide-in-right">
              <div className="glass-card-strong rounded-xl px-3 py-2 sm:px-4 sm:py-3 border border-white/30 hover-lift hover-glow transition-all">
                <div className="text-xl sm:text-2xl font-bold">AI</div>
                <div className="text-xs text-emerald-100">Powered</div>
              </div>
              <div className="glass-card-strong rounded-xl px-3 py-2 sm:px-4 sm:py-3 border border-white/30 hover-lift hover-glow transition-all">
                <div className="text-xl sm:text-2xl font-bold">∞</div>
                <div className="text-xs text-emerald-100">Unlimited</div>
              </div>
              <div className="glass-card-strong rounded-xl px-3 py-2 sm:px-4 sm:py-3 border border-white/30 hover-lift hover-glow transition-all hidden sm:block">
                <div className="text-xl sm:text-2xl font-bold">🎨</div>
                <div className="text-xs text-emerald-100">Creative</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* workspace */}
      <div className="max-w-[1900px] mx-auto px-3 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr_340px] lg:grid-cols-[300px_1fr_300px] gap-4 lg:gap-6 min-h-[calc(100vh-200px)]">
          {/* left - Product selector with premium styling */}
          <div className="order-3 xl:order-1 bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border-2 border-emerald-100 overflow-hidden hover-lift animate-scale-up transition-all duration-300">
            <div
              className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-4 sm:p-5 relative overflow-hidden cursor-pointer xl:cursor-default"
              onClick={() => window.innerWidth < 1280 && setIsProductSelectorOpen(!isProductSelectorOpen)}
            >
              <div className="absolute inset-0 bg-white/10 animate-shimmer"></div>
              <div className="flex items-center justify-between relative z-10">
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30 shadow-lg hover-scale mobile-touch-target">
                    <CubeIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="hidden sm:inline">Chọn sản phẩm</div>
                    <div className="sm:hidden">Products</div>
                    <div className="text-xs text-emerald-50 font-normal mt-0.5">Bắt đầu thiết kế của bạn</div>
                  </div>
                </h2>
                <div className="xl:hidden text-white/80">
                  {isProductSelectorOpen ? <ChevronDownIcon className="w-6 h-6" /> : <ChevronUpIcon className="w-6 h-6" />}
                </div>
              </div>
            </div>
            <div className={`overflow-y-auto custom-scrollbar transition-all duration-300 ${isProductSelectorOpen ? 'h-[280px] sm:h-[400px] p-2' : 'h-0 xl:h-[calc(100vh-340px)] xl:p-2'}`}>
              <ProductSelector selectedProduct={selectedProduct} onProductSelect={handleProductSelect} />
            </div>
          </div>

          {/* center - Canvas area with modern design */}
          <div className="order-1 xl:order-2 space-y-5">
            {selectedProduct && (
              <div className="glass-emerald rounded-2xl shadow-xl border-2 border-emerald-200 p-3 sm:p-5 hover-lift animate-bounce-in">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                    <div className="w-11 h-11 sm:w-14 sm:h-14 bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg hover-scale animate-float mobile-touch-target flex-shrink-0">
                      <span className="text-white font-bold text-base sm:text-xl">{selectedProduct.name.charAt(0)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-gray-900 text-sm sm:text-lg truncate flex items-center gap-2">
                        <span className="truncate">{selectedProduct.name}</span>
                        <span className="inline-flex items-center px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 animate-pulse flex-shrink-0">
                          Active
                        </span>
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1.5 mt-0.5">
                        <div className="w-3 h-3 rounded-full border-2 border-gray-300 shadow-sm flex-shrink-0" style={{ backgroundColor: selectedColorCode }}></div>
                        <span className="truncate">{selectedColorCode ? "Màu sắc" : "Màu mặc định"}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    {(isAutoSaving || saveStatus === "saving") && (
                      <div className="flex items-center gap-2 bg-blue-50 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-blue-200 shadow-sm animate-pulse">
                        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
                        <span className="text-xs sm:text-sm font-semibold text-blue-700 hidden sm:inline">Saving...</span>
                      </div>
                    )}
                    {saveStatus === "saved" && (
                      <div className="flex items-center gap-2 bg-emerald-50 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-emerald-200 shadow-sm animate-bounce-in">
                        <CheckCircleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                        <span className="text-xs sm:text-sm font-semibold text-emerald-700">Saved</span>
                      </div>
                    )}
                    {saveStatus === "error" && (
                      <div className="flex items-center gap-2 bg-red-50 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-red-200 shadow-sm">
                        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-xs sm:text-sm font-semibold text-red-700 hidden sm:inline">Failed</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-3xl shadow-2xl border-2 border-emerald-100 overflow-hidden hover-lift transition-all duration-300 animate-scale-up">
              <div className="h-[45vh] min-h-[350px] sm:h-[580px] lg:h-[600px] relative">
                {!selectedProduct && (
                  <div className="absolute inset-0 flex items-center justify-center gradient-mesh z-10">
                    <div className="text-center p-6 sm:p-8 animate-bounce-in">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-2xl animate-float">
                        <CubeIcon className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 text-gradient">Bắt đầu thiết kế</h3>
                      <p className="text-gray-600 text-sm sm:text-base max-w-xs mx-auto">Chọn một sản phẩm từ danh sách bên trái để bắt đầu sáng tạo</p>
                      <div className="mt-4 flex items-center justify-center gap-2 text-emerald-600 text-sm font-medium">
                        <SparklesIcon className="w-5 h-5 animate-pulse" />
                        <span>Thiết kế độc đáo chỉ với vài cú nhấp chuột</span>
                      </div>
                    </div>
                  </div>
                )}
                <CanvasArea
                  selectedProduct={selectedProduct}
                  selectedColorCode={selectedColorCode}
                  design={design}
                  onDesignChange={handleDesignChange}
                  onTextElementSelect={(id) => setSelectedTextElementId(id)}
                  onElementSelect={(id) => {
                    // ✨ Đồng bộ selectedElementIds với canvas selection
                    setCanvasState(prev => ({
                      ...prev,
                      selectedElementIds: id ? [id] : []
                    }));
                  }}
                />
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-emerald-100 p-3 sm:p-5 hover-lift animate-scale-up">
              <div className="flex flex-col xl:flex-row items-center justify-between gap-4">
                {/* Left: Canvas Controls */}
                <div className="flex items-center gap-2 bg-gray-50/80 p-1.5 rounded-xl border border-gray-200 shadow-inner w-full xl:w-auto justify-center xl:justify-start">
                  <button onClick={handleUndo} disabled={canvasState.historyIndex <= 0}
                    className="p-2.5 text-gray-700 rounded-lg hover:bg-white hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 button-press"
                    title="Hoàn tác (Undo)">
                    <ArrowUturnLeftIcon className="w-5 h-5" />
                  </button>
                  <div className="w-px h-6 bg-gray-300 mx-1"></div>
                  <button onClick={handleRedo} disabled={canvasState.historyIndex >= canvasState.history.length - 1}
                    className="p-2.5 text-gray-700 rounded-lg hover:bg-white hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 button-press"
                    title="Làm lại (Redo)">
                    <ArrowUturnRightIcon className="w-5 h-5" />
                  </button>
                  <div className="w-px h-6 bg-gray-300 mx-1"></div>
                  <button
                    onClick={handleDeleteElement}
                    disabled={!canvasState.selectedElementIds.length}
                    className="flex items-center gap-2 px-3 py-2 text-red-600 rounded-lg hover:bg-white hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 button-press font-medium"
                    title="Xóa phần tử đã chọn">
                    <TrashIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">Xóa</span>
                  </button>

                  {design?.elements.length ? (
                    <>
                      <div className="w-px h-6 bg-gray-300 mx-1 hidden sm:block"></div>
                      <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-500 bg-white rounded-lg border border-gray-100 shadow-sm">
                        <Squares2X2Icon className="w-4 h-4" />
                        <span>{design.elements.length} layers</span>
                      </div>
                    </>
                  ) : null}
                </div>

                {/* Right: AI & Actions */}
                {/* Right: AI & Actions */}
                <div className="grid grid-cols-3 gap-2 w-full xl:w-auto xl:flex xl:items-center xl:gap-3 xl:justify-end">
                  <button
                    onClick={() => setShowTryOnModal(true)}
                    className="group px-2 py-2.5 sm:px-4 sm:py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all hover:-translate-y-0.5 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 min-w-0"
                    title={geminiHealthy ? "Thử đồ với AI" : "Dịch vụ AI đang bảo trì"}>
                    <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5 group-hover:animate-spin-slow" />
                    <span className="text-[10px] sm:text-base whitespace-nowrap">AI Try-On</span>
                  </button>

                  <button
                    onClick={() => setShowCartoonModal(true)}
                    className="group px-2 py-2.5 sm:px-4 sm:py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-pink-500/30 transition-all hover:-translate-y-0.5 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 min-w-0">
                    <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5 group-hover:animate-pulse" />
                    <span className="text-[10px] sm:text-base whitespace-nowrap">AI Cartoon</span>
                  </button>

                  <button
                    onClick={() => setShowConsultationModal(true)}
                    disabled={!selectedProduct || !design || isSubmittingConsultation}
                    className="group px-2 py-2.5 sm:px-4 sm:py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-emerald-500/30 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 min-w-0">
                    {isSubmittingConsultation ? (
                      <BoltIcon className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    ) : (
                      <ChatBubbleBottomCenterTextIcon className="w-4 h-4 sm:w-5 sm:h-5 group-hover:animate-bounce" />
                    )}
                    <span className="text-[10px] sm:text-base whitespace-nowrap">Tư vấn</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* right - Tools panel with premium styling */}
          <div className="order-2 xl:order-3 bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border-2 border-blue-100 flex flex-col h-full overflow-hidden hover-lift animate-scale-up">
            <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 p-4 sm:p-5 relative overflow-hidden">
              <div className="absolute inset-0 bg-white/10 animate-shimmer"></div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30 shadow-lg hover-scale mobile-touch-target">
                  <PaintBrushIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="hidden sm:inline">Design Tools</div>
                  <div className="sm:hidden">Tools</div>
                  <div className="text-xs text-blue-50 font-normal mt-0.5">Tùy chỉnh thiết kế</div>
                </div>
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
              <ToolsPanel
                selectedProduct={selectedProduct}
                selectedColorCode={selectedColorCode}
                onColorSelect={handleColorSelect}
                onImageUpload={handleImageUpload}
                onStickerSelect={handleStickerSelect}
                onTextAdd={handleTextAdd}
                onClearDesign={handleClearDesign}
                onExportPNG={handleExportPNG}
                onOpenStickerPicker={() => setShowStickerPicker(true)} // ✨ Pass callback to open sticker picker
              />
            </div>
          </div>
        </div>
      </div>

      {/* consultation */}
      {showConsultationModal && (
        <ConsultationModal
          isOpen={showConsultationModal}
          onClose={() => setShowConsultationModal(false)}
          onSubmit={handleConsultationSubmit}
          isSubmitting={isSubmittingConsultation}
          productName={selectedProduct?.name || ""}
          productPreviewUrl={
            (window as any).Konva?.stages?.[0]?.toDataURL?.({ pixelRatio: 1 }) ||
            canvasDataUrl ||
            undefined
          }
          aiGeneratedImages={aiGeneratedImages}
        />
      )}


      {/* AI result modal - Enhanced design */}
      {showGeminiModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white to-emerald-50 p-6 sm:p-8 rounded-3xl shadow-2xl text-center max-w-3xl mx-auto border-2 border-emerald-200 transform transition-all">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                <SparklesIcon className="w-6 h-6 text-white animate-pulse" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Kết quả AI Try-On
              </h2>
            </div>

            <div className="relative group mb-6">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition"></div>
              <img
                src={canvasDataUrl}
                alt="AI result"
                className="relative rounded-2xl shadow-xl mx-auto max-h-[60vh] object-contain border-4 border-white"
              />
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => {
                  setShowGeminiModal(false);
                  setShowConsultationModal(true);
                }}
                className="group px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold hover:from-emerald-700 hover:to-teal-700 transition-all transform hover:scale-105 shadow-lg flex items-center gap-2">
                <ChatBubbleBottomCenterTextIcon className="w-5 h-5 group-hover:animate-bounce" />
                Tư vấn đặt hàng
              </button>

              <button
                onClick={() => {
                  setShowGeminiModal(false);
                  const aiGeneratedImage = canvasDataUrl;
                  setCanvasDataUrl(aiGeneratedImage);
                  setShowTryOnModal(true);
                }}
                className="group px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 group-hover:animate-spin" />
                Phòng thay đồ
              </button>

              <button
                onClick={() => setShowGeminiModal(false)}
                className="px-6 py-3 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 rounded-xl font-bold hover:from-gray-300 hover:to-gray-400 transition-all transform hover:scale-105 shadow-lg">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}







      {showTryOnModal && (
        <AiTryOnModal
          isOpen={showTryOnModal}
          onClose={() => setShowTryOnModal(false)}
          onSubmit={handleAiTryOn}
          // ✅ Ảnh preview gốc từ canvas (sản phẩm AI design)
          // productPreviewUrl={(window as any).Konva?.stages?.[0]?.toDataURL?.({ pixelRatio: 1 })}
          productPreviewUrl={canvasDataUrl} // ✅ ảnh AI generate
          aiGeneratedImages={aiGeneratedImages} // ✅ Truyền danh sách ảnh AI
          onImagesChange={setAiGeneratedImages} // ✅ Callback khi xóa ảnh
        />
      )}


      {/* AI Cartoon modal */}
      {showCartoonModal && (
        <AiCartoonModal
          isOpen={showCartoonModal}
          onClose={() => setShowCartoonModal(false)}
          onSubmit={handleCartoonSubmit}
          previewImageUrl={(window as any).Konva?.stages?.[0]?.toDataURL?.({ pixelRatio: 1 })}
          onConsult={() => {
            setShowCartoonModal(false);
            setShowConsultationModal(true); // mở modal tư vấn
          }}
          // onTryOn={() => {
          //   setShowCartoonModal(false);
          //   setShowTryOnModal(true); // mở modal phòng thay đồ
          // }}
          onTryOn={() => {
            // ✅ Reset ảnh AI generation để người dùng thử đồ với người mẫu khác
            setCanvasDataUrl("");
            setShowCartoonModal(false);
            setShowTryOnModal(true);
          }}

        />
      )}


      {/* Text edit panel */}
      {selectedTextElementId && design ? (
        <TextEditPanel
          element={design.elements.find(el => el.id === selectedTextElementId)!}
          onUpdate={(updates) => {
            if (!design) return;
            const updated = design.elements.map(el => el.id === selectedTextElementId ? { ...el, ...updates } : el);
            handleDesignChange({ ...design, elements: updated });
          }}
          onClose={() => setSelectedTextElementId(null)}
        />
      ) : null}

      {/* toast - Enhanced notification */}
      {showSuccessMessage && (
        <div className="fixed top-20 sm:top-24 right-4 sm:right-6 z-50 animate-slide-in-right">
          <div className="bg-gradient-to-br from-white to-emerald-50 border-2 border-emerald-200 rounded-2xl shadow-2xl p-4 sm:p-5 max-w-sm backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                <CheckCircleIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-gray-900 font-bold text-sm sm:text-base">{showSuccessMessage}</p>
                <p className="text-xs text-gray-600">Success</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* upload progress - Enhanced */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="fixed bottom-4 left-4 right-4 sm:bottom-6 sm:right-6 sm:left-auto z-50">
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 rounded-2xl shadow-2xl p-4 sm:p-5 min-w-[280px] mx-auto sm:mx-0 max-w-sm backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                <ArrowUpTrayIcon className="w-5 h-5 text-white animate-bounce" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 font-bold text-sm sm:text-base">Uploading image...</p>
                <p className="text-xs sm:text-sm text-gray-600 font-semibold">{uploadProgress}% complete</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
              <div
                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-3 rounded-full transition-all duration-300 shadow-lg"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* floating FABs - Enhanced */}
      <div className="fixed bottom-6 right-6 z-40 sm:hidden">
        <div className="flex flex-col space-y-3">
          {design?.elements.length ? (
            <button
              onClick={handleSaveDesign}
              className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl shadow-2xl hover:shadow-blue-500/50 flex items-center justify-center transform hover:scale-110 transition-all duration-200 border-2 border-white"
              title="Quick Save">
              <ArchiveBoxIcon className="w-6 h-6" />
            </button>
          ) : null}
          {selectedProduct && design ? (
            <button
              onClick={() => setShowConsultationModal(true)}
              disabled={isSubmittingConsultation}
              className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-2xl shadow-2xl hover:shadow-emerald-500/50 flex items-center justify-center disabled:opacity-50 transform hover:scale-110 transition-all duration-200 border-2 border-white"
              title="Tư vấn đặt hàng">
              {isSubmittingConsultation ?
                <BoltIcon className="w-7 h-7 animate-spin" /> :
                <ChatBubbleBottomCenterTextIcon className="w-7 h-7" />
              }
            </button>
          ) : null}
        </div>
      </div>

      {/* loading overlay - Enhanced */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-40 p-4">
          <div className="bg-gradient-to-br from-white to-emerald-50 rounded-3xl shadow-2xl p-8 sm:p-10 max-w-xs sm:max-w-sm mx-4 w-full border-2 border-emerald-200">
            <div className="text-center">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-5">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl animate-pulse"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <BoltIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white animate-bounce" />
                </div>
                <div className="absolute inset-0 border-4 border-emerald-600/30 border-t-emerald-600 rounded-2xl animate-spin"></div>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                <span>Processing</span>
                <SparklesIcon className="w-6 h-6 text-emerald-500 animate-pulse" />
              </h3>
              <p className="text-sm sm:text-base text-gray-600 font-medium">Please wait while we process your request</p>
            </div>
          </div>
        </div>
      )}

      {/* Giphy Picker Modal - Rendered at root to avoid stacking context issues */}
      {showStickerPicker && (
        <GiphyStickerPicker
          onStickerSelect={(sticker) => {
            handleStickerSelect(sticker.url);
            setShowStickerPicker(false);
          }}
          onClose={() => setShowStickerPicker(false)}
        />
      )}
    </div>
  );
};

// debounce helper
function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
  let timeout: any;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default CustomProductDesigner;
