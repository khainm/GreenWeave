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
import TextEditPanel from "../components/designer/TextEditPanel";
import { CustomProductService } from "../services/customProductService";
import AiGeneratedGallery from "../components/designer/AiGeneratedGallery";


import {
  CubeIcon, ArchiveBoxIcon, ShoppingCartIcon, ChatBubbleBottomCenterTextIcon,
  ArrowUturnLeftIcon, ArrowUturnRightIcon, ArrowUpTrayIcon, Squares2X2Icon,
  BoltIcon, CheckCircleIcon, ChartBarIcon, CogIcon, EyeIcon,
  ViewColumnsIcon, SparklesIcon, PaintBrushIcon
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

  // UX
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
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

      const res = await fetch("https://api.greenweave.vn/api/aicartoon/cartoon-preview", { method: "POST", body: formData });
      if (!res.ok) throw new Error("AI Cartoon generation failed");
      const data = await res.json();
      setCanvasDataUrl(`data:image/png;base64,${data.imageBase64}`);
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

      // 1) lấy ảnh sản phẩm từ Konva
      // const stage = (window as any).Konva?.stages?.[0];
      // if (!stage) throw new Error("Canvas not found.");
      // const dataUrl = stage.toDataURL({ pixelRatio: 2 });
      // const productBlob = await (await fetch(dataUrl)).blob();
      // 1) Ưu tiên ảnh AI generation (nếu có), fallback về ảnh canvas
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

      const resp = await fetch("https://api.greenweave.vn/api/aiedit/multi-image-edit", { method: "POST", body: formData });
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

  // Lưu ảnh AI-generated vào localStorage để dùng lại
// useEffect(() => {
//   if (canvasDataUrl && canvasDataUrl.startsWith("data:image")) {
//     try {
//       const existing = JSON.parse(localStorage.getItem("aiGeneratedItems") || "[]");
//       const newItem = {
//         id: Date.now().toString(),
//         url: canvasDataUrl, // Store only the URL, avoid large base64 strings
//         createdAt: new Date().toISOString(),
//       };
//       const updated = [newItem, ...existing].slice(0, 20); // Limit to 20 items
//       localStorage.setItem("aiGeneratedItems", JSON.stringify(updated));
//     } catch (error) {
//       if (error instanceof DOMException && error.name === "QuotaExceededError") {
//         console.error("LocalStorage quota exceeded. Consider clearing some items.");
//       } else {
//         console.error("An error occurred while saving to localStorage:", error);
//       }
//     }
//   }
// }, [canvasDataUrl]);
useEffect(() => {
  if (canvasDataUrl && canvasDataUrl.startsWith("data:image")) {
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
        };
        const updated = [newItem, ...existing].slice(0, 15);
        localStorage.setItem("aiGeneratedItems", JSON.stringify(updated));
        console.log("💾 Saved AI item to localStorage:", newItem);
      };
    } catch (error) {
      console.error("❌ Error saving AI image:", error);
    }
  }
}, [canvasDataUrl]);


  // Add to cart demo
  const handleAddToCart = useCallback(() => {
    if (!selectedProduct || !design) return showSuccessToast("⚠️ Select product & make a design first");
    if (!design.elements?.length) return showSuccessToast("⚠️ Add some elements to your design");
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      showSuccessToast("🛒 Added to cart successfully!");
    }, 900);
  }, [selectedProduct, design, showSuccessToast]);

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
  const handleConsultationSubmit = useCallback(async (contactInfo: ContactInfo) => {
    if (!selectedProduct || !design) return;
    try {
      setIsSubmittingConsultation(true);
      const previewUrl = "";
      await CustomProductService.saveCustomDesign(design, previewUrl);
      await CustomProductService.createConsultationRequest({
        designId: "demo", contactInfo, productId: selectedProduct.id,
        productName: selectedProduct.name, designPreview: previewUrl
      });
      setShowConsultationModal(false);
      alert("We will contact you soon.");
    } finally {
      setIsSubmittingConsultation(false);
    }
  }, [selectedProduct, design]);
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
      ...design.metadata,
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Header />

      {/* top bar mobile */}
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

      {/* hero */}
      <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <SparklesIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 flex items-center">
                  <span>Custom Design Studio</span>
                  <CogIcon className="ml-2 w-6 h-6 sm:w-8 sm:h-8" />
                </h1>
                <p className="text-green-100 text-sm sm:text-lg">Tạo thiết kế độc đáo cho sản phẩm của bạn</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* workspace */}
      <div className="max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 py-0">
        <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr_320px] lg:grid-cols-[280px_1fr_280px] gap-0 sm:gap-2 lg:gap-3 min-h-[calc(100vh-160px)]">
          {/* left */}
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
              <ProductSelector selectedProduct={selectedProduct} onProductSelect={handleProductSelect} />
            </div>
          </div>

          {/* center */}
          <div className="order-3 xl:order-2 space-y-4">
            {selectedProduct && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-xs sm:text-sm">{selectedProduct.name.charAt(0)}</span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{selectedProduct.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-500">{selectedColorCode ? `Color: ${selectedColorCode}` : "Default color"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {(isAutoSaving || saveStatus === "saving") && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <div className="w-3 h-3 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
                        <span className="text-xs sm:text-sm font-medium">Saving...</span>
                      </div>
                    )}
                    {saveStatus === "saved" && (
                      <div className="flex items-center gap-2 text-green-600">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-xs sm:text-sm font-medium">Saved</span>
                      </div>
                    )}
                    {saveStatus === "error" && (
                      <div className="flex items-center gap-2 text-red-600">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-xs sm:text-sm font-medium">Save failed</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="h-[400px] sm:h-[500px] lg:h-[600px]">
                <CanvasArea
                  selectedProduct={selectedProduct}
                  selectedColorCode={selectedColorCode}
                  design={design}
                  onDesignChange={handleDesignChange}
                  onTextElementSelect={(id) => setSelectedTextElementId(id)}
                />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-gray-50 rounded-lg p-1">
                    <button onClick={handleUndo} disabled={canvasState.historyIndex <= 0}
                      className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 rounded-md hover:bg-white hover:shadow-sm disabled:opacity-40">
                      <ArrowUturnLeftIcon className="w-4 h-4" /> <span className="hidden sm:inline">Undo</span>
                    </button>
                    <button onClick={handleRedo} disabled={canvasState.historyIndex >= canvasState.history.length - 1}
                      className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 rounded-md hover:bg-white hover:shadow-sm disabled:opacity-40">
                      <span className="hidden sm:inline">Redo</span> <ArrowUturnRightIcon className="w-4 h-4" />
                    </button>
                    <button
  onClick={handleDeleteElement}
  disabled={!canvasState.selectedElementIds.length}
  className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-red-600 rounded-md hover:bg-red-50 hover:shadow-sm disabled:opacity-40 flex items-center gap-1"
>
  🗑️ <span className="hidden sm:inline">Delete</span>
</button>

                  </div>
                  {design?.elements.length ? (
                    <div className="flex items-center space-x-2 text-gray-500 text-xs sm:text-sm bg-gray-50 px-2 py-1 rounded-lg">
                      <Squares2X2Icon className="w-4 h-4" />
                      <span>{design.elements.length} elements</span>
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  <button
                    onClick={() => setShowTryOnModal(true)}
                    className="px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 flex items-center justify-center gap-2"
                    title={geminiHealthy ? "Generate AI preview" : "AI service unavailable"}
                  >
                    <SparklesIcon className="w-4 h-4" />
                    <span>Phòng thay đồ AI</span>
                  </button>

                  <button
                    onClick={() => setShowCartoonModal(true)}
                    className="px-3 sm:px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-lg font-medium hover:from-pink-600 hover:to-rose-700 flex items-center justify-center gap-2"
                  >
                    <SparklesIcon className="w-4 h-4" />
                    <span>AI Cartoon Preview</span>
                  </button>

                  <button
                    onClick={handleAddToCart}
                    disabled={!selectedProduct || !design || !design.elements.length || isLoading}
                    className="px-4 sm:px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                  >
                    {isLoading ? (
                      <>
                        <BoltIcon className="w-4 h-4 animate-pulse" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCartIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Tư vấn đặt hàng </span>
                        <span className="sm:hidden">Tư vấn đặt hàng</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* right */}
          <div className="order-2 xl:order-3 bg-white border-l border-gray-200 flex flex-col h-full">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-3 sm:p-3">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                  <PaintBrushIcon className="w-4 h-4 text-white" />
                </div>
                <span className="hidden sm:inline">Design Tools</span>
                <span className="sm:hidden">Tools</span>
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto">
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

      {/* consultation */}
     {showConsultationModal && (
  <ConsultationModal
    isOpen={showConsultationModal}
    onClose={() => setShowConsultationModal(false)}
    onSubmit={handleConsultationSubmit}
    isSubmitting={isSubmittingConsultation}
    productName={selectedProduct?.name || ""}
    productPreviewUrl={canvasDataUrl} // ✅ ảnh AI generate
  />
)}


      {/* AI result modal */}
      {showGeminiModal && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-2xl shadow-lg text-center max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Kết quả AI Try-On</h2>

      <img
        src={canvasDataUrl}
        alt="AI result"
        className="rounded-xl shadow-md mx-auto max-h-[70vh] object-contain mb-6"
      />

      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={() => {
            setShowGeminiModal(false);
            setShowConsultationModal(true); // mở modal tư vấn
          }}
          className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
        >
          🛍️ Tư vấn đặt hàng
        </button>

        
        <button
  onClick={() => {
    // ✅ Đóng modal kết quả
    setShowGeminiModal(false);

    // ✅ Truyền ảnh AI generation (ảnh cartoon / multi-edit)
    const aiGeneratedImage = canvasDataUrl;
    setCanvasDataUrl(aiGeneratedImage);

    // ✅ Mở modal phòng thay đồ
    setShowTryOnModal(true);
  }}
  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
>
  🧥 Phòng thay đồ
</button>


        <button
          onClick={() => setShowGeminiModal(false)}
          className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
        >
          Đóng
        </button>
      </div>
    </div>
  </div>
)}





      {/* AI Try-On modal */}
      {/* {showTryOnModal && (
        <AiTryOnModal
          isOpen={showTryOnModal}
          onClose={() => setShowTryOnModal(false)}
          onSubmit={handleAiTryOn}
          previewImageUrl={(window as any).Konva?.stages?.[0]?.toDataURL?.({ pixelRatio: 1 })}
          productPreviewUrl={canvasDataUrl} // ✅ ảnh AI generate
        />
      )} */}

      {showTryOnModal && (
  <AiTryOnModal
    isOpen={showTryOnModal}
    onClose={() => setShowTryOnModal(false)}
    onSubmit={handleAiTryOn}
    // ✅ Ảnh preview gốc từ canvas (sản phẩm AI design)
   // productPreviewUrl={(window as any).Konva?.stages?.[0]?.toDataURL?.({ pixelRatio: 1 })}
    productPreviewUrl={canvasDataUrl} // ✅ ảnh AI generate
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

      {/* toast */}
      {showSuccessMessage && (
        <div className="fixed top-16 sm:top-20 right-4 sm:right-6 z-50">
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 sm:p-4 max-w-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircleIcon className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-gray-900 font-medium text-sm sm:text-base">{showSuccessMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* upload progress */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="fixed bottom-4 left-4 right-4 sm:bottom-6 sm:right-6 sm:left-auto z-50">
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 sm:p-4 min-w-[280px] mx-auto sm:mx-0 max-w-sm">
            <div className="flex items-center gap-2 sm:gap-3 mb-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <ArrowUpTrayIcon className="w-4 h-4 text-blue-600 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 font-medium text-sm sm:text-base">Uploading image...</p>
                <p className="text-xs sm:text-sm text-gray-500">{uploadProgress}% complete</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* floating FABs */}
      <div className="fixed bottom-4 right-4 z-40 sm:hidden">
        <div className="flex flex-col space-y-3">
          {design?.elements.length ? (
            <button onClick={handleSaveDesign} className="w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center" title="Quick Save">
              <ArchiveBoxIcon className="w-5 h-5" />
            </button>
          ) : null}
          {selectedProduct && design?.elements.length ? (
            <button onClick={handleAddToCart} disabled={isLoading}
              className="w-14 h-14 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full shadow-lg hover:from-green-700 hover:to-emerald-700 flex items-center justify-center disabled:opacity-50"
              title="Tư Vấn đặt hàng">
              {isLoading ? <BoltIcon className="w-6 h-6 animate-pulse" /> : <ShoppingCartIcon className="w-6 h-6" />}
            </button>
          ) : null}
        </div>
      </div>

      {/* loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-xs sm:max-w-sm mx-4 w-full">
            <div className="text-center">
              <div className="relative w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4">
                <BoltIcon className="w-12 h-12 sm:w-16 sm:h-16 text-green-600 animate-pulse" />
                <div className="absolute inset-0 border-4 border-green-600/30 border-t-green-600 rounded-full animate-spin"></div>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2 flex items-center justify-center gap-2">
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

// debounce helper
function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
  let timeout: any;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default CustomProductDesigner;
