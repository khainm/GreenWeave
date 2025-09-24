using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    /// <summary>
    /// Product search and filter request
    /// </summary>
    public class ProductSearchRequest
    {
        /// <summary>
        /// Search term (name, SKU, description)
        /// </summary>
        public string? Search { get; set; }

        /// <summary>
        /// Category filter
        /// </summary>
        public string? Category { get; set; }

        /// <summary>
        /// Status filter (active, inactive)
        /// </summary>
        public string? Status { get; set; }

        /// <summary>
        /// Price range - minimum price
        /// </summary>
        public decimal? MinPrice { get; set; }

        /// <summary>
        /// Price range - maximum price
        /// </summary>
        public decimal? MaxPrice { get; set; }

        /// <summary>
        /// Stock filter - minimum stock
        /// </summary>
        public int? MinStock { get; set; }

        /// <summary>
        /// Sort by field (name, price, createdAt, stock)
        /// </summary>
        public string? SortBy { get; set; } = "name";

        /// <summary>
        /// Sort direction (asc, desc)
        /// </summary>
        public string? SortDirection { get; set; } = "asc";

        /// <summary>
        /// Page number (for pagination)
        /// </summary>
        public int Page { get; set; } = 1;

        /// <summary>
        /// Page size (for pagination)
        /// </summary>
        public int PageSize { get; set; } = 20;
    }

    /// <summary>
    /// Product search response
    /// </summary>
    public class ProductSearchResponse
    {
        public bool IsSuccess { get; set; }
        public string Message { get; set; } = string.Empty;
        public List<ProductResponseDto> Products { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }
}
