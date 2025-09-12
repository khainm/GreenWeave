import React from 'react';
import { MapPinIcon, PhoneIcon, PencilIcon, TrashIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import type { UserAddress } from '../types/userAddress';
import { userAddressService } from '../services/userAddressService';

interface AddressCardProps {
  address: UserAddress;
  onEdit: (address: UserAddress) => void;
  onDelete: (addressId: string) => void;
  onSetDefault: (addressId: string) => void;
  isLoading?: boolean;
}

const AddressCard: React.FC<AddressCardProps> = ({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  isLoading = false
}) => {
  const addressTypeIcon = userAddressService.getAddressTypeIcon(address.addressType);
  const addressTypeLabel = userAddressService.getAddressTypeLabel(address.addressType);
  const formattedAddress = userAddressService.formatAddress(address);

  return (
    <div className={`bg-white rounded-2xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
      address.isDefault 
        ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 shadow-lg' 
        : 'border-gray-200 hover:border-green-300 shadow-md'
    } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Header */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-3xl transform hover:scale-110 transition-transform duration-200">
              {addressTypeIcon}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{address.fullName}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                  {addressTypeLabel}
                </span>
              </div>
            </div>
          </div>
          
          {address.isDefault && (
            <div className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-2 rounded-full shadow-md">
              <StarIconSolid className="h-4 w-4" />
              <span className="text-sm font-semibold">Mặc định</span>
            </div>
          )}
        </div>
      </div>

      {/* Address Details */}
      <div className="p-5 space-y-4">
        {/* Address */}
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-1">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <MapPinIcon className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900 mb-1">Địa chỉ:</p>
            <p className="text-sm text-gray-700 leading-relaxed">{formattedAddress}</p>
          </div>
        </div>

        {/* Phone */}
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-1">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <PhoneIcon className="h-4 w-4 text-green-600" />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900 mb-1">Số điện thoại:</p>
            <p className="text-sm text-gray-700">{address.phoneNumber}</p>
          </div>
        </div>

        {/* Postal Code */}
        {address.postalCode && (
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-sm text-purple-600">📮</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 mb-1">Mã bưu điện:</p>
              <p className="text-sm text-gray-700">{address.postalCode}</p>
            </div>
          </div>
        )}

        {/* Created Date */}
        <div className="pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 flex items-center space-x-2">
            <span>🕒</span>
            <span>Thêm vào: {new Date(address.createdAt).toLocaleDateString('vi-VN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</span>
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="p-5 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100 rounded-b-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {!address.isDefault && (
              <button
                onClick={() => onSetDefault(address.id)}
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-green-600 transition-all duration-200 bg-white hover:bg-green-50 px-3 py-2 rounded-lg border border-gray-200 hover:border-green-300 shadow-sm hover:shadow-md"
              >
                <StarIcon className="h-4 w-4" />
                <span className="font-medium">Đặt mặc định</span>
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onEdit(address)}
              className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 transition-all duration-200 bg-white hover:bg-blue-50 px-4 py-2 rounded-lg border border-blue-200 hover:border-blue-300 shadow-sm hover:shadow-md transform hover:scale-105"
            >
              <PencilIcon className="h-4 w-4" />
              <span className="font-medium">Chỉnh sửa</span>
            </button>
            
            <button
              onClick={() => onDelete(address.id)}
              className="flex items-center space-x-2 text-sm text-red-600 hover:text-red-700 transition-all duration-200 bg-white hover:bg-red-50 px-4 py-2 rounded-lg border border-red-200 hover:border-red-300 shadow-sm hover:shadow-md transform hover:scale-105"
            >
              <TrashIcon className="h-4 w-4" />
              <span className="font-medium">Xóa</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressCard;
