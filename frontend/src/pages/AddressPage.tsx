import React, { useState, useEffect } from 'react';
import { PlusIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { userAddressService } from '../services/userAddressService';
import type { UserAddress, CreateUserAddressRequest, UpdateUserAddressRequest } from '../types/userAddress';
import AddressCard from '../components/AddressCard';
import AddressForm from '../components/AddressForm';

const AddressPage: React.FC = () => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');

  // Load addresses on component mount
  useEffect(() => {
    console.log('🚀 [AddressPage] Component mounted, loading addresses...');
    console.log('👤 [AddressPage] Current user:', user);
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    console.log('🏠 [AddressPage] Starting to load addresses...');
    setIsLoading(true);
    try {
      console.log('🏠 [AddressPage] Calling userAddressService.getAddresses()');
      const response = await userAddressService.getAddresses();
      console.log('🏠 [AddressPage] GetAddresses response:', response);
      
      if (response.success && response.addresses) {
        console.log('🏠 [AddressPage] Successfully loaded addresses:', response.addresses);
        setAddresses(response.addresses);
      } else {
        console.error('🏠 [AddressPage] Failed to load addresses:', response);
        setErrors(response.errors || [response.message]);
      }
    } catch (error) {
      console.error('🏠 [AddressPage] Error loading addresses:', error);
      setErrors(['Có lỗi xảy ra khi tải danh sách địa chỉ']);
    } finally {
      setIsLoading(false);
      console.log('🏠 [AddressPage] Finished loading addresses');
    }
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setIsFormOpen(true);
    setErrors([]);
    setSuccessMessage('');
  };

  const handleEditAddress = (address: UserAddress) => {
    setEditingAddress(address);
    setIsFormOpen(true);
    setErrors([]);
    setSuccessMessage('');
  };

  const handleDeleteAddress = async (addressId: string) => {
    console.log('🗑️ [AddressPage] Attempting to delete address:', addressId);
    if (!window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) {
      console.log('🗑️ [AddressPage] Delete cancelled by user');
      return;
    }

    try {
      console.log('🗑️ [AddressPage] Calling deleteAddress service');
      const response = await userAddressService.deleteAddress(addressId);
      console.log('🗑️ [AddressPage] Delete response:', response);
      if (response.success) {
        console.log('🗑️ [AddressPage] Delete successful, reloading addresses');
        setSuccessMessage('Xóa địa chỉ thành công!');
        await loadAddresses();
      } else {
        console.error('🗑️ [AddressPage] Delete failed:', response);
        setErrors(response.errors || [response.message]);
      }
    } catch (error) {
      console.error('🗑️ [AddressPage] Delete error:', error);
      setErrors(['Có lỗi xảy ra khi xóa địa chỉ']);
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    console.log('⭐ [AddressPage] Setting default address:', addressId);
    try {
      const response = await userAddressService.setDefaultAddress(addressId);
      console.log('⭐ [AddressPage] Set default response:', response);
      if (response.success) {
        console.log('⭐ [AddressPage] Set default successful');
        setSuccessMessage('Đặt địa chỉ mặc định thành công!');
        await loadAddresses();
      } else {
        console.error('⭐ [AddressPage] Set default failed:', response);
        setErrors(response.errors || [response.message]);
      }
    } catch (error) {
      console.error('⭐ [AddressPage] Set default error:', error);
      setErrors(['Có lỗi xảy ra khi đặt địa chỉ mặc định']);
    }
  };

  const handleSubmitForm = async (formData: CreateUserAddressRequest | UpdateUserAddressRequest) => {
    console.log('📝 [AddressPage] Submitting form with data:', formData);
    console.log('📝 [AddressPage] Editing address:', editingAddress);
    setIsSubmitting(true);
    setErrors([]);
    setSuccessMessage('');

    try {
      let response;
      if (editingAddress) {
        console.log('📝 [AddressPage] Updating existing address:', editingAddress.id);
        response = await userAddressService.updateAddress(editingAddress.id, formData as UpdateUserAddressRequest);
      } else {
        console.log('📝 [AddressPage] Creating new address');
        response = await userAddressService.createAddress(formData as CreateUserAddressRequest);
      }

      console.log('📝 [AddressPage] Submit response:', response);
      if (response.success) {
        console.log('📝 [AddressPage] Submit successful');
        setSuccessMessage(editingAddress ? 'Cập nhật địa chỉ thành công!' : 'Thêm địa chỉ thành công!');
        setIsFormOpen(false);
        setEditingAddress(null);
        await loadAddresses();
      } else {
        console.error('📝 [AddressPage] Submit failed:', response);
        setErrors(response.errors || [response.message]);
      }
    } catch (error) {
      console.error('📝 [AddressPage] Submit error:', error);
      setErrors(['Có lỗi xảy ra khi lưu địa chỉ']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditingAddress(null);
    setErrors([]);
    setSuccessMessage('');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-green-600 to-green-700 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <MapPinIcon className="h-10 w-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-md">
                <span className="text-xs">📍</span>
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Địa chỉ giao hàng
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Quản lý các địa chỉ giao hàng của bạn một cách dễ dàng và thuận tiện
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Messages */}
        {errors.length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
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

        {/* Action Buttons */}
        <div className="mb-8 flex space-x-4">
          <button
            onClick={handleAddAddress}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Thêm địa chỉ mới</span>
          </button>
          
          <button
            onClick={loadAddresses}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Tải lại</span>
          </button>
        </div>

        {/* Address Form Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen p-4">
              {/* Backdrop */}
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm" onClick={handleCancelForm}></div>

              {/* Modal */}
              <div className="relative bg-white rounded-2xl shadow-xl transform transition-all w-full max-w-2xl max-h-[85vh] overflow-hidden">
                <AddressForm
                  address={editingAddress || undefined}
                  onSubmit={handleSubmitForm}
                  onCancel={handleCancelForm}
                  isLoading={isSubmitting}
                  errors={errors}
                />
              </div>
            </div>
          </div>
        )}

        {/* Addresses List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mx-auto"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <MapPinIcon className="h-6 w-6 text-green-600 animate-pulse" />
                </div>
              </div>
              <p className="mt-4 text-gray-600 font-medium">Đang tải danh sách địa chỉ...</p>
            </div>
          </div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-16">
            <div className="relative mb-6">
              <div className="w-32 h-32 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <MapPinIcon className="h-16 w-16 text-green-600" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-xl">🏠</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Chưa có địa chỉ nào</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Thêm địa chỉ giao hàng để việc mua sắm trở nên thuận tiện và nhanh chóng hơn
            </p>
            <button
              onClick={handleAddAddress}
              className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <PlusIcon className="h-6 w-6" />
              <span>Thêm địa chỉ đầu tiên</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {addresses.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                onEdit={handleEditAddress}
                onDelete={handleDeleteAddress}
                onSetDefault={handleSetDefaultAddress}
              />
            ))}
          </div>
        )}

        {/* Info Section */}
        {addresses.length > 0 && (
          <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-lg">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-blue-900 mb-3">Thông tin về địa chỉ</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Địa chỉ mặc định sẽ được sử dụng cho đơn hàng</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Bạn có thể thêm nhiều địa chỉ giao hàng</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Chỉnh sửa thông tin địa chỉ bất kỳ lúc nào</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Xóa những địa chỉ không còn sử dụng</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressPage;
