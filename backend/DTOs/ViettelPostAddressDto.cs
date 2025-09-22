using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    /// <summary>
    /// DTO for Viettel Post Province response
    /// </summary>
    public class ViettelPostProvinceDto
    {
        public int PROVINCE_ID { get; set; }
        public string PROVINCE_NAME { get; set; } = string.Empty;
        public string CODE { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO for Viettel Post District response
    /// </summary>
    public class ViettelPostDistrictDto
    {
        public int DISTRICT_ID { get; set; }
        public string DISTRICT_NAME { get; set; } = string.Empty;
        public int PROVINCE_ID { get; set; }
        public string CODE { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO for Viettel Post Ward response
    /// </summary>
    public class ViettelPostWardDto
    {
        public int WARD_ID { get; set; }
        public string WARD_NAME { get; set; } = string.Empty;
        public int DISTRICT_ID { get; set; }
        public string CODE { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO for Viettel Post API response wrapper
    /// </summary>
    public class ViettelPostApiResponse<T>
    {
        public int Status { get; set; }
        public bool Error { get; set; }
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }
    }

    /// <summary>
    /// DTO for Province list response
    /// </summary>
    public class ProvinceListResponse
    {
        public List<ViettelPostProvinceDto>? ListProvince { get; set; }
    }

    /// <summary>
    /// DTO for District list response
    /// </summary>
    public class DistrictListResponse
    {
        public List<ViettelPostDistrictDto>? ListDistrict { get; set; }
    }

    /// <summary>
    /// DTO for Ward list response
    /// </summary>
    public class WardListResponse
    {
        public List<ViettelPostWardDto>? ListWards { get; set; }
    }

    /// <summary>
    /// DTO for our internal address structure
    /// </summary>
    public class AddressDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO for Province with districts
    /// </summary>
    public class ProvinceWithDistrictsDto : AddressDto
    {
        public List<DistrictWithWardsDto> Districts { get; set; } = new List<DistrictWithWardsDto>();
    }

    /// <summary>
    /// DTO for District with wards
    /// </summary>
    public class DistrictWithWardsDto : AddressDto
    {
        public int ProvinceId { get; set; }
        public List<AddressDto> Wards { get; set; } = new List<AddressDto>();
    }

    /// <summary>
    /// DTO for API response wrapper
    /// </summary>
    public class AddressApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }
        public List<string> Errors { get; set; } = new List<string>();
    }
}
