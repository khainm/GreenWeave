// 🤖 Gemini AI Preview Modal Component
// Shows 3 AI-generated preview options: Original, Cartoon, Cutout

import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  SparklesIcon, 
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface GeminiPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  canvasDataUrl: string; // Canvas exported as data URL
  onPreviewSelected: (selectedPreview: {
    type: 'original' | 'cartoon' | 'cutout';
    url: string;
  }) => void;
}

interface GeminiPreviews {
  originalUrl: string;
  cartoonUrl: string;
  cutoutUrl: string;
}

const GeminiPreviewModal: React.FC<GeminiPreviewModalProps> = ({
  isOpen,
  onClose,
  canvasDataUrl,
  onPreviewSelected
}) => {
  const [previews, setPreviews] = useState<GeminiPreviews | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'original' | 'cartoon' | 'cutout' | null>(null);

  // Generate previews when modal opens
  useEffect(() => {
    if (isOpen && canvasDataUrl) {
      generatePreviews();
    }
  }, [isOpen, canvasDataUrl]);

  const generatePreviews = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🎨 Starting AI preview generation...');

      // Convert data URL to Blob
      const response = await fetch(canvasDataUrl);
      const blob = await response.blob();
      console.log('📦 Canvas converted to blob:', blob.size, 'bytes');

      // Create FormData
      const formData = new FormData();
      formData.append('image', blob, 'design.png');

      // Call Gemini API with full URL
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7146';
      const apiUrl = `${baseUrl}/api/geminipreview/generate`;
      console.log('🚀 Calling API:', apiUrl);

      const apiResponse = await fetch(apiUrl, {
        method: 'POST',
        body: formData
      });

      console.log('📡 API response status:', apiResponse.status);

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error('❌ API error:', errorText);
        throw new Error(`Server error (${apiResponse.status}): ${errorText}`);
      }

      const result = await apiResponse.json();
      console.log('✅ API result:', result);

      if (result.success && result.data) {
        setPreviews({
          originalUrl: result.data.originalUrl,
          cartoonUrl: result.data.cartoonUrl,
          cutoutUrl: result.data.cutoutUrl
        });
        console.log('🎉 Previews generated successfully!');
      } else {
        throw new Error(result.message || 'Failed to generate previews');
      }
    } catch (err) {
      console.error('💥 Error generating previews:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate AI previews');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreview = (type: 'original' | 'cartoon' | 'cutout') => {
    if (!previews) return;

    const url = type === 'original' 
      ? previews.originalUrl 
      : type === 'cartoon' 
        ? previews.cartoonUrl 
        : previews.cutoutUrl;

    setSelectedType(type);
    onPreviewSelected({ type, url });
    
    // Close modal after selection
    setTimeout(() => {
      onClose();
    }, 500);
  };

  const handleRetry = () => {
    generatePreviews();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <SparklesIcon className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">AI Preview Generator</h2>
                <p className="text-purple-100 text-sm">Powered by Gemini 2.0 Flash</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading && (
            <div className="text-center py-12">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <ArrowPathIcon className="w-20 h-20 text-purple-600 animate-spin" />
                <SparklesIcon className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-pink-500 animate-pulse" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Generating AI Previews...
              </h3>
              <p className="text-gray-500 mb-4">
                This may take 5-8 seconds. Our AI is analyzing your design.
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XMarkIcon className="w-10 h-10 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Failed to Generate Previews
              </h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={handleRetry}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors inline-flex items-center space-x-2"
              >
                <ArrowPathIcon className="w-5 h-5" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {previews && !loading && !error && (
            <div>
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Choose Your Preferred Preview
                </h3>
                <p className="text-gray-600">
                  Select one of the AI-generated previews below
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Original Preview */}
                <PreviewCard
                  title="Original"
                  description="High-quality upload"
                  imageUrl={previews.originalUrl}
                  isSelected={selectedType === 'original'}
                  onSelect={() => handleSelectPreview('original')}
                  badge="1200×1200"
                  badgeColor="bg-blue-500"
                />

                {/* Cartoon Preview */}
                <PreviewCard
                  title="Cartoon Style"
                  description="AI-enhanced with cartoon effect"
                  imageUrl={previews.cartoonUrl}
                  isSelected={selectedType === 'cartoon'}
                  onSelect={() => handleSelectPreview('cartoon')}
                  badge="AI Enhanced"
                  badgeColor="bg-purple-500"
                  recommended
                />

                {/* Cutout Preview */}
                <PreviewCard
                  title="Cutout (No Background)"
                  description="Background removed with AI"
                  imageUrl={previews.cutoutUrl}
                  isSelected={selectedType === 'cutout'}
                  onSelect={() => handleSelectPreview('cutout')}
                  badge="Transparent"
                  badgeColor="bg-pink-500"
                />
              </div>

              {/* Info Section */}
              <div className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <SparklesIcon className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    <p className="font-medium text-purple-900 mb-1">AI Preview Tips:</p>
                    <ul className="space-y-1 text-gray-600">
                      <li>• <strong>Original:</strong> Best for detailed designs with sharp edges</li>
                      <li>• <strong>Cartoon:</strong> Perfect for fun, vibrant product mockups</li>
                      <li>• <strong>Cutout:</strong> Ideal for overlay designs or transparent backgrounds</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Preview Card Component
interface PreviewCardProps {
  title: string;
  description: string;
  imageUrl: string;
  isSelected: boolean;
  onSelect: () => void;
  badge: string;
  badgeColor: string;
  recommended?: boolean;
}

const PreviewCard: React.FC<PreviewCardProps> = ({
  title,
  description,
  imageUrl,
  isSelected,
  onSelect,
  badge,
  badgeColor,
  recommended
}) => {
  return (
    <div
      onClick={onSelect}
      className={`relative bg-white border-2 rounded-xl overflow-hidden cursor-pointer transition-all transform hover:scale-105 hover:shadow-xl ${
        isSelected 
          ? 'border-purple-600 shadow-lg ring-4 ring-purple-200' 
          : 'border-gray-200 hover:border-purple-300'
      }`}
    >
      {/* Recommended Badge */}
      {recommended && (
        <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center space-x-1 shadow-lg">
          <SparklesIcon className="w-3 h-3" />
          <span>RECOMMENDED</span>
        </div>
      )}

      {/* Selected Checkmark */}
      {isSelected && (
        <div className="absolute top-2 right-2 z-10 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
          <CheckCircleIcon className="w-6 h-6 text-white" />
        </div>
      )}

      {/* Image */}
      <div className="aspect-square bg-gray-100 overflow-hidden relative">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover"
        />
        
        {/* Badge */}
        <div className={`absolute bottom-2 left-2 ${badgeColor} text-white text-xs font-medium px-2 py-1 rounded-full`}>
          {badge}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>

      {/* Select Button */}
      <div className="px-4 pb-4">
        <button
          className={`w-full py-2 rounded-lg font-medium transition-colors ${
            isSelected
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-purple-50 hover:text-purple-700'
          }`}
        >
          {isSelected ? 'Selected' : 'Select This Preview'}
        </button>
      </div>
    </div>
  );
};

export default GeminiPreviewModal;
