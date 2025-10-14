import React, { useState, useEffect } from 'react';
import { ShippingService } from '../../services/shippingService';
import type { 
  ShippingOption
} from '../../types';

interface ShippingProviderSelectorProps {
  request: any; // E-commerce shipping request
  selectedOption: ShippingOption | null;
  onOptionSelect: (option: ShippingOption) => void;
  className?: string;
}

const ShippingProviderSelector: React.FC<ShippingProviderSelectorProps> = ({
  request,
  selectedOption,
  onOptionSelect,
  className = ''
}) => {
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (request.toAddress.district && request.toAddress.province) {
      calculateShippingFees();
    }
  }, [request.toAddress.district, request.toAddress.province]);

  const calculateShippingFees = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const requestId = Math.random().toString(36).substr(2, 9);
      console.log(`🚀 [ShippingProviderSelector] [${requestId}] Calculating e-commerce fees with request:`, request);
      const response = await ShippingService.calculateEcommerceShippingFees(request);
      console.log(`📦 [ShippingProviderSelector] [${requestId}] Received e-commerce response:`, response);
      
      const availableOptions = response.options.filter(option => option.isAvailable);
      console.log(`✅ [ShippingProviderSelector] [${requestId}] Available e-commerce options:`, availableOptions);
      setShippingOptions(availableOptions);
      
      // Auto-select cheapest option if none selected, or auto-select if only one option
      if (!selectedOption && availableOptions.length > 0) {
        const optionToSelect = availableOptions.length === 1 
          ? availableOptions[0] // Auto-select if only one option
          : availableOptions.sort((a, b) => a.fee - b.fee)[0]; // Select cheapest if multiple options
        
        console.log(`💰 [ShippingProviderSelector] [${requestId}] Auto-selecting option:`, optionToSelect);
        if (optionToSelect) {
          onOptionSelect(optionToSelect);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi tính phí vận chuyển');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (option: ShippingOption) => {
    onOptionSelect(option);
  };

  if (loading) {
    return (
      <div className={`shipping-provider-selector ${className}`}>
        <h3 className="text-lg font-semibold mb-4">Phương thức vận chuyển</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`shipping-provider-selector ${className}`}>
        <h3 className="text-lg font-semibold mb-4">Phương thức vận chuyển</h3>
        <div className="text-red-600 bg-red-50 p-3 rounded-lg">
          {error}
          <button 
            onClick={calculateShippingFees}
            className="ml-2 text-red-800 underline hover:no-underline"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`shipping-provider-selector ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Phương thức vận chuyển</h3>
      
      {/* Show helpful message if only one option */}
      {shippingOptions.length === 1 && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-blue-500">ℹ️</span>
            <span className="text-sm text-blue-700 font-medium">
              Phương thức vận chuyển khả dụng
            </span>
          </div>
        </div>
      )}
      
      {shippingOptions.length === 0 ? (
        <div className="text-gray-500 bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-orange-500">⚠️</span>
            <span className="font-medium">Không thể tính phí vận chuyển</span>
          </div>
          <p className="text-sm mb-3">
            Hệ thống đang gặp sự cố khi kết nối với dịch vụ vận chuyển. 
            Vui lòng thử lại sau hoặc liên hệ hỗ trợ.
          </p>
          <button 
            onClick={calculateShippingFees}
            className="text-blue-600 hover:text-blue-800 underline text-sm"
          >
            Thử lại
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {shippingOptions.map((option) => (
            <label 
              key={`${option.provider}-${option.serviceId}`}
              className={`
                shipping-option relative flex items-center p-4 border rounded-lg cursor-pointer transition-all
                ${selectedOption?.serviceId === option.serviceId 
                  ? 'border-green-500 bg-green-50 ring-2 ring-green-200' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <input
                type="radio"
                name="shipping-option"
                value={`${option.provider}-${option.serviceId}`}
                checked={selectedOption?.serviceId === option.serviceId}
                onChange={() => handleOptionSelect(option)}
                className="sr-only"
              />
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {option.providerName || option.provider}
                    </h4>
                    {option.serviceName && (
                      <p className="text-sm text-gray-600">{option.serviceName}</p>
                    )}
                    {option.estimatedDeliveryDays !== undefined && option.estimatedDeliveryDays !== null && (
                      <p className="text-sm text-blue-600">
                        Dự kiến: {option.estimatedDeliveryDays} ngày
                      </p>
                    )}
                    {option.errorMessage && (
                      <p className="text-sm text-orange-600 font-medium">
                        ⚠️ {option.errorMessage}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      {option.fee.toLocaleString('vi-VN')}đ
                    </p>
                    {option.fee === 0 && (
                      <p className="text-sm text-green-600">Miễn phí</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Custom radio indicator */}
              <div className={`
                absolute top-4 right-4 w-4 h-4 rounded-full border-2 transition-all
                ${selectedOption?.serviceId === option.serviceId
                  ? 'border-green-500 bg-green-500'
                  : 'border-gray-300'
                }
              `}>
                {selectedOption?.serviceId === option.serviceId && (
                  <div className="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                )}
              </div>
            </label>
          ))}
        </div>
      )}
      
      {shippingOptions.length > 0 && (
        <button
          onClick={calculateShippingFees}
          className="mt-3 text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Tính lại phí vận chuyển
        </button>
      )}
    </div>
  );
};

export default ShippingProviderSelector;
