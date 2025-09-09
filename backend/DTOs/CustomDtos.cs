namespace backend.DTOs
{
    public class CustomBaseProductDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int CategoryId { get; set; }
        public decimal BasePrice { get; set; }
        public string Status { get; set; } = "active";
        public List<CustomBaseAngleDto> Angles { get; set; } = new();
        public List<CustomOptionGroupDto> OptionGroups { get; set; } = new();
    }

    public class CustomBaseAngleDto
    {
        public int Id { get; set; }
        public string AngleKey { get; set; } = string.Empty;
        public int SortOrder { get; set; }
        public List<CustomBaseLayerDto> Layers { get; set; } = new();
    }

    public class CustomBaseLayerDto
    {
        public int Id { get; set; }
        public string LayerType { get; set; } = string.Empty;
        public int ZIndex { get; set; }
        public int X { get; set; }
        public int Y { get; set; }
        public int Width { get; set; }
        public int Height { get; set; }
        public string? ConstraintsJson { get; set; }
    }

    public class CustomOptionGroupDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public bool Required { get; set; }
        public bool MultiSelect { get; set; }
        public int? SelectionLimit { get; set; }
        public List<CustomOptionDto> Options { get; set; } = new();
    }

    public class CustomOptionDto
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public decimal ExtraPrice { get; set; }
        public string? AssetRef { get; set; }
        public string? MetaJson { get; set; }
    }

    public class CreateCustomDesignRequest
    {
        public int CustomBaseProductId { get; set; }
        public decimal SnapshotPrice { get; set; }
        public string? PreviewImageUrl { get; set; }
        public string PayloadJson { get; set; } = string.Empty;
    }
}


