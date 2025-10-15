// Address validation utilities
export interface AddressValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface Address {
  fullName?: string;
  phoneNumber?: string;
  addressLine?: string;
  ward?: string;
  district?: string;
  province?: string;
}

/**
 * Comprehensive address validation for Vietnamese addresses
 */
export class AddressValidator {
  
  // Vietnamese phone number patterns
  private static readonly PHONE_PATTERNS = [
    /^(0[3|5|7|8|9])[0-9]{8}$/, // Mobile: 03x, 05x, 07x, 08x, 09x + 8 digits
    /^(84[3|5|7|8|9])[0-9]{8}$/, // With country code
    /^(\+84[3|5|7|8|9])[0-9]{8}$/, // With +84
  ];

  // Vietnamese name patterns (allow Vietnamese characters)
  private static readonly NAME_PATTERN = /^[a-zA-ZàáãạảăắằẳẵặâấầẩẫậèéẹẻẽêềếểễệđìíĩỉịòóõọỏôốồổỗộơớờởỡợùúũụủưứừửữựỳỵỷỹýÀÁÃẠẢĂẮẰẲẴẶÂẤẦẨẪẬÈÉẸẺẼÊỀẾỂỄỆĐÌÍĨỈỊÒÓÕỌỎÔỐỒỔỖỘƠỚỜỞỠỢÙÚŨỤỦƯỨỪỬỮỰỲỴỶỸÝ\s]+$/;

  // Common street patterns in Vietnam
  private static readonly STREET_KEYWORDS = [
    'đường', 'phố', 'ngõ', 'hẻm', 'số', 'khu', 'lô', 'tòa', 'chung cư', 'khu đô thị',
    'khu vực', 'tổ', 'thôn', 'ấp', 'khóm', 'quận', 'huyện', 'xã', 'phường', 'thị trấn'
  ];

  // Administrative divisions validation
  private static readonly PROVINCE_KEYWORDS = [
    'hà nội', 'hồ chí minh', 'đà nẵng', 'hải phòng', 'cần thơ', 'tỉnh', 'thành phố'
  ];

  /**
   * Validate full address object
   */
  static validateAddress(address: Address): AddressValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    if (!address.fullName?.trim()) {
      errors.push('Họ và tên là bắt buộc');
    } else {
      const nameValidation = this.validateName(address.fullName);
      if (!nameValidation.isValid) {
        errors.push(...nameValidation.errors);
      }
      warnings.push(...nameValidation.warnings);
    }

    if (!address.phoneNumber?.trim()) {
      errors.push('Số điện thoại là bắt buộc');
    } else {
      const phoneValidation = this.validatePhoneNumber(address.phoneNumber);
      if (!phoneValidation.isValid) {
        errors.push(...phoneValidation.errors);
      }
      warnings.push(...phoneValidation.warnings);
    }

    if (!address.addressLine?.trim()) {
      errors.push('Địa chỉ chi tiết là bắt buộc');
    } else {
      const addressValidation = this.validateAddressLine(address.addressLine);
      if (!addressValidation.isValid) {
        errors.push(...addressValidation.errors);
      }
      warnings.push(...addressValidation.warnings);
    }

    if (!address.province?.trim()) {
      errors.push('Tỉnh/Thành phố là bắt buộc');
    } else {
      const provinceValidation = this.validateProvince(address.province);
      warnings.push(...provinceValidation.warnings);
    }

    if (!address.district?.trim()) {
      errors.push('Quận/Huyện là bắt buộc');
    }

    if (!address.ward?.trim()) {
      warnings.push('Xã/Phường không được cung cấp - có thể ảnh hưởng đến việc giao hàng');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate Vietnamese name
   */
  static validateName(name: string): AddressValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!name || name.trim().length === 0) {
      errors.push('Họ và tên không được để trống');
      return { isValid: false, errors, warnings };
    }

    const trimmedName = name.trim();

    // Length validation
    if (trimmedName.length < 2) {
      errors.push('Họ và tên phải có ít nhất 2 ký tự');
    }

    if (trimmedName.length > 100) {
      errors.push('Họ và tên không được vượt quá 100 ký tự');
    }

    // Pattern validation for Vietnamese names
    if (!this.NAME_PATTERN.test(trimmedName)) {
      errors.push('Họ và tên chỉ được chứa chữ cái và khoảng trắng');
    }

    // Check for reasonable name structure
    const nameParts = trimmedName.split(/\s+/);
    if (nameParts.length < 2) {
      warnings.push('Nên cung cấp đầy đủ họ và tên để tránh nhầm lẫn khi giao hàng');
    }

    // Check for suspicious patterns
    if (/^\d+/.test(trimmedName) || /\d{3,}/.test(trimmedName)) {
      errors.push('Họ và tên không được chứa nhiều số');
    }

    if (/[!@#$%^&*()_+=\[\]{};':"\\|,.<>\/?]/.test(trimmedName)) {
      errors.push('Họ và tên không được chứa ký tự đặc biệt');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate Vietnamese phone number
   */
  static validatePhoneNumber(phone: string): AddressValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!phone || phone.trim().length === 0) {
      errors.push('Số điện thoại không được để trống');
      return { isValid: false, errors, warnings };
    }

    // Clean phone number (remove spaces, dashes, parentheses)
    const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');

    // Check if it matches any valid Vietnamese phone pattern
    const isValid = this.PHONE_PATTERNS.some(pattern => pattern.test(cleanPhone));

    if (!isValid) {
      errors.push('Số điện thoại không đúng định dạng Việt Nam (VD: 0901234567)');
    }

    // Check for common mistakes
    if (cleanPhone.startsWith('84') && !cleanPhone.startsWith('843') && !cleanPhone.startsWith('845') && 
        !cleanPhone.startsWith('847') && !cleanPhone.startsWith('848') && !cleanPhone.startsWith('849')) {
      warnings.push('Đảm bảo mã vùng đúng định dạng với mã quốc gia 84');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate address line (detailed address)
   */
  static validateAddressLine(addressLine: string): AddressValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!addressLine || addressLine.trim().length === 0) {
      errors.push('Địa chỉ chi tiết không được để trống');
      return { isValid: false, errors, warnings };
    }

    const trimmedAddress = addressLine.trim();

    // Length validation
    if (trimmedAddress.length < 5) {
      errors.push('Địa chỉ chi tiết quá ngắn (ít nhất 5 ký tự)');
    }

    if (trimmedAddress.length > 255) {
      errors.push('Địa chỉ chi tiết quá dài (tối đa 255 ký tự)');
    }

    // Check for house number
    if (!/^\d+/.test(trimmedAddress) && !/số\s*\d+/i.test(trimmedAddress)) {
      warnings.push('Nên bắt đầu bằng số nhà để shipper dễ tìm');
    }

    // Check for common street indicators
    const lowerAddress = trimmedAddress.toLowerCase();
    const hasStreetKeyword = this.STREET_KEYWORDS.some(keyword => 
      lowerAddress.includes(keyword.toLowerCase())
    );

    if (!hasStreetKeyword) {
      warnings.push('Nên bao gồm loại đường (đường, phố, ngõ, hẻm...) để rõ ràng hơn');
    }

    // Check for special characters that might cause issues
    if (/[<>\"'&]/.test(trimmedAddress)) {
      errors.push('Địa chỉ không được chứa ký tự đặc biệt: < > " \' &');
    }

    // Check if it looks like admin division (too generic)
    if (/^(xã|phường|quận|huyện|tỉnh|thành phố)\s/i.test(trimmedAddress)) {
      errors.push('Địa chỉ chi tiết không được bắt đầu bằng đơn vị hành chính');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate province name
   */
  static validateProvince(province: string): AddressValidationResult {
    const warnings: string[] = [];

    if (!province || province.trim().length === 0) {
      return { isValid: false, errors: ['Tỉnh/Thành phố là bắt buộc'], warnings };
    }

    const lowerProvince = province.toLowerCase();
    
    // Check if it contains proper Vietnamese province keywords
    const hasProvinceKeyword = this.PROVINCE_KEYWORDS.some(keyword => 
      lowerProvince.includes(keyword)
    );

    if (!hasProvinceKeyword && lowerProvince.length > 3) {
      warnings.push('Tên tỉnh/thành phố có vẻ không chuẩn - kiểm tra lại để đảm bảo giao hàng chính xác');
    }

    return { isValid: true, errors: [], warnings };
  }

  /**
   * Quick validation for checkout process
   */
  static validateForCheckout(address: Address): AddressValidationResult {
    const result = this.validateAddress(address);
    
    // Additional checkout-specific validations
    if (result.isValid) {
      // Check for complete address requirement
      if (!address.ward?.trim()) {
        result.errors.push('Xã/Phường là bắt buộc để tính phí vận chuyển chính xác');
        result.isValid = false;
      }

      // Warn about potential delivery issues
      if (result.warnings.length > 0) {
        result.warnings.push('Địa chỉ có thể không tối ưu cho việc giao hàng - vui lòng kiểm tra lại');
      }
    }

    return result;
  }

  /**
   * Format address for display
   */
  static formatAddress(address: Address): string {
    const parts: string[] = [];
    
    if (address.addressLine) parts.push(address.addressLine);
    if (address.ward) parts.push(address.ward);
    if (address.district) parts.push(address.district);
    if (address.province) parts.push(address.province);
    
    return parts.join(', ');
  }

  /**
   * Get address completeness score (0-100)
   */
  static getCompletenessScore(address: Address): number {
    let score = 0;
    
    if (address.fullName?.trim()) score += 20;
    if (address.phoneNumber?.trim()) score += 20;
    if (address.addressLine?.trim()) score += 25;
    if (address.ward?.trim()) score += 15;
    if (address.district?.trim()) score += 15;
    if (address.province?.trim()) score += 5;
    
    return Math.min(100, score);
  }
}