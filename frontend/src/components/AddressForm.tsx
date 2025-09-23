import React, { useState, useEffect } from 'react';
import { UserIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline';
import type { UserAddress, CreateUserAddressRequest, UpdateUserAddressRequest } from '../types/userAddress';
import { ADDRESS_TYPES } from '../types/userAddress';
import ViettelPostAddressService, { type AddressDto } from '../services/viettelPostAddressService';

interface AddressFormProps {
  address?: UserAddress;
  onSubmit: (data: CreateUserAddressRequest | UpdateUserAddressRequest) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  errors: string[];
}

const AddressForm: React.FC<AddressFormProps> = ({ 
  address, 
  onSubmit, 
  onCancel, 
  isLoading, 
  errors 
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    addressLine: '',
    ward: '',
    district: '',
    province: '',
    postalCode: '',
    addressType: 'Home',
    isDefault: false
  });

  const [provinces, setProvinces] = useState<AddressDto[]>([]);
  const [districts, setDistricts] = useState<AddressDto[]>([]);
  const [wards, setWards] = useState<AddressDto[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);
  const [selectedWardId, setSelectedWardId] = useState<number | null>(null);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingWards, setIsLoadingWards] = useState(false);

  // Load provinces on component mount
  useEffect(() => {
    loadProvinces();
  }, []);

  // Initialize form data when address changes
  useEffect(() => {
    if (address) {
      setFormData({
        fullName: address.fullName,
        phoneNumber: address.phoneNumber,
        addressLine: address.addressLine,
        ward: address.ward || '',
        district: address.district,
        province: address.province,
        postalCode: address.postalCode || '',
        addressType: address.addressType,
        isDefault: address.isDefault
      });
    }
  }, [address]);

  // Load provinces from Viettel Post API
  const loadProvinces = async () => {
    try {
      setIsLoadingProvinces(true);
      const provincesData = await ViettelPostAddressService.getProvinces();
      setProvinces(provincesData);
    } catch (error) {
      console.error('Error loading provinces:', error);
    } finally {
      setIsLoadingProvinces(false);
    }
  };

  // Load districts when province is selected
  const loadDistricts = async (provinceId: number) => {
    try {
      setIsLoadingDistricts(true);
      const districtsData = await ViettelPostAddressService.getDistricts(provinceId);
      setDistricts(districtsData);
    } catch (error) {
      console.error('Error loading districts:', error);
    } finally {
      setIsLoadingDistricts(false);
    }
  };

  // Load wards when district is selected
  const loadWards = async (districtId: number) => {
    try {
      console.log('🔍 [AddressForm] Loading wards for districtId:', districtId);
      setIsLoadingWards(true);
      const wardsData = await ViettelPostAddressService.getWards(districtId);
      console.log('✅ [AddressForm] Received wards data:', wardsData);
      setWards(wardsData);
    } catch (error) {
      console.error('❌ [AddressForm] Error loading wards:', error);
    } finally {
      setIsLoadingWards(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleProvinceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provinceId = parseInt(e.target.value);
    const province = provinces.find(p => p.id === provinceId);
    
    setSelectedProvinceId(provinceId);
    setDistricts([]);
    setWards([]);
    setSelectedDistrictId(null);
    setSelectedWardId(null);
    
    setFormData(prev => ({
      ...prev,
      province: province?.name || '',
      district: '',
      ward: ''
    }));

    if (provinceId > 0) {
      await loadDistricts(provinceId);
    }
  };

  const handleDistrictChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const districtId = parseInt(e.target.value);
    const district = districts.find(d => d.id === districtId);
    
    setSelectedDistrictId(districtId);
    setSelectedWardId(null);
    setWards([]);
    
    setFormData(prev => ({
      ...prev,
      district: district?.name || '',
      ward: ''
    }));

    if (districtId > 0) {
      await loadWards(districtId);
    }
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const wardId = parseInt(e.target.value);
    const ward = wards.find(w => w.id === wardId);
    
    setSelectedWardId(wardId);
    setFormData(prev => ({
      ...prev,
      ward: ward?.name || ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <div className="bg-white overflow-hidden h-full flex flex-col">
      <div className="bg-gradient-to-r from-green-600 to-green-700 px-4 py-3 flex-shrink-0">
        <h3 className="text-lg font-bold text-white">
          {address ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
        </h3>
        <p className="text-green-100 text-xs mt-1">
          {address ? 'Cập nhật thông tin địa chỉ của bạn' : 'Thêm địa chỉ giao hàng mới'}
        </p>
        <div className="flex items-center justify-center mt-2">
          <div className="flex items-center space-x-1 text-green-200 text-xs">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <span>Có thể cuộn để xem thêm</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[60vh] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 relative">
        {/* Scroll indicator */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-200 to-green-300 opacity-50 pointer-events-none"></div>
        <form id="address-form" onSubmit={handleSubmit} className="p-4 pb-8 space-y-4">
        {/* Error Messages */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Có lỗi xảy ra</h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul className="list-disc list-inside space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="block text-xs font-medium text-gray-700 mb-1">
            Họ và tên người nhận *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <UserIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              value={formData.fullName}
              onChange={handleInputChange}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
              placeholder="Nhập họ và tên người nhận"
            />
          </div>
        </div>

        {/* Phone Number */}
        <div>
          <label htmlFor="phoneNumber" className="block text-xs font-medium text-gray-700 mb-1">
            Số điện thoại *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <PhoneIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              required
              value={formData.phoneNumber}
              onChange={handleInputChange}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
              placeholder="Nhập số điện thoại"
            />
          </div>
        </div>

        {/* Address Type */}
        <div>
          <label htmlFor="addressType" className="block text-xs font-medium text-gray-700 mb-1">
            Loại địa chỉ *
          </label>
          <div className="grid grid-cols-3 gap-3">
            {ADDRESS_TYPES.map((type) => (
              <label
                key={type.value}
                className={`relative flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                  formData.addressType === type.value
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  type="radio"
                  name="addressType"
                  value={type.value}
                  checked={formData.addressType === type.value}
                  onChange={handleInputChange}
                  className="sr-only"
                />
                <div className="text-center">
                  <div className="text-2xl mb-1">{type.icon}</div>
                  <div className="text-sm font-medium">{type.label}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Address Line */}
        <div>
          <label htmlFor="addressLine" className="block text-xs font-medium text-gray-700 mb-1">
            Địa chỉ chi tiết *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPinIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="addressLine"
              name="addressLine"
              type="text"
              required
              value={formData.addressLine}
              onChange={handleInputChange}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
              placeholder="Thôn/Xóm, số nhà, tên đường, tòa nhà..."
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Chỉ cần nhập địa chỉ chi tiết, tỉnh/huyện/xã sẽ được tự động điền từ dropdown bên dưới
          </p>
        </div>

        {/* Province */}
        <div>
          <label htmlFor="province" className="block text-xs font-medium text-gray-700 mb-1">
            Tỉnh/Thành phố *
          </label>
          <select
            id="province"
            name="province"
            required
            value={selectedProvinceId || ''}
            onChange={handleProvinceChange}
            disabled={isLoadingProvinces}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">{isLoadingProvinces ? 'Đang tải...' : 'Chọn tỉnh/thành phố'}</option>
            {provinces.map((province, index) => (
              <option key={province.id || `province-${index}`} value={province.id}>
                {province.name}
              </option>
            ))}
          </select>
        </div>

        {/* District */}
        <div>
          <label htmlFor="district" className="block text-xs font-medium text-gray-700 mb-1">
            Quận/Huyện *
          </label>
          <select
            id="district"
            name="district"
            required
            value={selectedDistrictId || ''}
            onChange={handleDistrictChange}
            disabled={!selectedProvinceId || isLoadingDistricts}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">{isLoadingDistricts ? 'Đang tải...' : 'Chọn quận/huyện'}</option>
            {districts.map((district, index) => (
              <option key={district.id || `district-${index}`} value={district.id}>
                {district.name}
              </option>
            ))}
          </select>
        </div>

        {/* Ward */}
        <div>
          <label htmlFor="ward" className="block text-xs font-medium text-gray-700 mb-1">
            Phường/Xã
          </label>
          <select
            id="ward"
            name="ward"
            value={selectedWardId || ''}
            onChange={handleWardChange}
            disabled={!selectedDistrictId || isLoadingWards}
            title={`selectedDistrictId: ${selectedDistrictId}, isLoadingWards: ${isLoadingWards}, wardsCount: ${wards.length}`}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">{isLoadingWards ? 'Đang tải...' : 'Chọn phường/xã'}</option>
            {(() => {
              console.log('🔍 [AddressForm] Rendering wards:', wards, 'Count:', wards.length);
              return null;
            })()}
            {wards.map((ward, index) => (
              <option key={ward.id || `ward-${index}`} value={ward.id}>
                {ward.name}
              </option>
            ))}
          </select>
        </div>

        {/* Postal Code */}
        <div>
          <label htmlFor="postalCode" className="block text-xs font-medium text-gray-700 mb-1">
            Mã bưu điện
          </label>
          <input
            id="postalCode"
            name="postalCode"
            type="text"
            value={formData.postalCode}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
            placeholder="Nhập mã bưu điện (tùy chọn)"
          />
        </div>

        {/* Set as Default */}
        <div className="flex items-center">
          <input
            id="isDefault"
            name="isDefault"
            type="checkbox"
            checked={formData.isDefault}
            onChange={handleInputChange}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
          <label htmlFor="isDefault" className="ml-2 block text-xs text-gray-700">
            Đặt làm địa chỉ mặc định
          </label>
        </div>

        </form>
        {/* Bottom scroll indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-200 to-green-300 opacity-50 pointer-events-none"></div>
      </div>

      {/* Action Buttons - Fixed at bottom */}
      <div className="flex-shrink-0 p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="address-form"
            disabled={isLoading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium shadow-lg"
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang lưu...
              </div>
            ) : (
              `💾 ${address ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ'}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddressForm;
