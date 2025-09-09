using backend.DTOs;
using backend.Interfaces.Repositories;
using backend.Interfaces.Services;
using backend.Models;

namespace backend.Services
{
    public class CustomService : ICustomService
    {
        private readonly ICustomRepository _repo;
        public CustomService(ICustomRepository repo) { _repo = repo; }

        public async Task<IEnumerable<CustomBaseProductDto>> ListBaseProductsAsync(int? categoryId = null)
        {
            var list = await _repo.ListBaseProductsAsync(categoryId);
            return list.Select(ToDto);
        }

        public async Task<CustomBaseProductDto?> GetBaseProductAsync(int id)
        {
            var p = await _repo.GetBaseProductAsync(id);
            return p == null ? null : ToDto(p);
        }

        public async Task<Guid> CreateDesignAsync(CreateCustomDesignRequest request)
        {
            // Basic validation and pricing calculation
            if (string.IsNullOrWhiteSpace(request.PayloadJson))
                throw new ArgumentException("PayloadJson is required");

            var baseProduct = await _repo.GetBaseProductAsync(request.CustomBaseProductId);
            if (baseProduct == null) throw new ArgumentException("Base product not found");

            // TODO: Parse payload and validate shapes within bounding boxes
            // For POC, accept payload and compute price = base + sum(options.extra)
            decimal price = baseProduct.BasePrice;

            try
            {
                var payload = System.Text.Json.JsonDocument.Parse(request.PayloadJson).RootElement;
                if (payload.TryGetProperty("selectedOptions", out var sel))
                {
                    foreach (var opt in sel.EnumerateArray())
                    {
                        if (opt.TryGetProperty("extraPrice", out var ep) && ep.TryGetDecimal(out var v))
                        {
                            price += v;
                        }
                    }
                }
                if (payload.TryGetProperty("surcharges", out var sur))
                {
                    foreach (var s in sur.EnumerateArray())
                    {
                        if (s.TryGetProperty("amount", out var a) && a.TryGetDecimal(out var v)) price += v;
                    }
                }
            }
            catch
            {
                // keep price as base if payload not parseable
            }

            var design = new CustomDesign
            {
                CustomBaseProductId = request.CustomBaseProductId,
                SnapshotPrice = price,
                PreviewImageUrl = request.PreviewImageUrl,
                PayloadJson = request.PayloadJson
            };
            var saved = await _repo.CreateDesignAsync(design);
            return saved.Id;
        }

        public async Task<CreateCustomDesignRequest?> GetDesignRawAsync(Guid id)
        {
            var d = await _repo.GetDesignAsync(id);
            if (d == null) return null;
            return new CreateCustomDesignRequest
            {
                CustomBaseProductId = d.CustomBaseProductId,
                SnapshotPrice = d.SnapshotPrice,
                PreviewImageUrl = d.PreviewImageUrl,
                PayloadJson = d.PayloadJson
            };
        }

        private static CustomBaseProductDto ToDto(CustomBaseProduct p) => new CustomBaseProductDto
        {
            Id = p.Id,
            Name = p.Name,
            Description = p.Description,
            CategoryId = p.CategoryId,
            BasePrice = p.BasePrice,
            Status = p.Status,
            Angles = p.Angles.OrderBy(a => a.SortOrder).Select(a => new CustomBaseAngleDto
            {
                Id = a.Id,
                AngleKey = a.AngleKey,
                SortOrder = a.SortOrder,
                Layers = a.Layers.OrderBy(l => l.ZIndex).Select(l => new CustomBaseLayerDto
                {
                    Id = l.Id,
                    LayerType = l.LayerType,
                    ZIndex = l.ZIndex,
                    X = l.X,
                    Y = l.Y,
                    Width = l.Width,
                    Height = l.Height,
                    ConstraintsJson = l.ConstraintsJson
                }).ToList()
            }).ToList(),
            OptionGroups = p.OptionGroups.Select(g => new CustomOptionGroupDto
            {
                Id = g.Id,
                Name = g.Name,
                Required = g.Required,
                MultiSelect = g.MultiSelect,
                SelectionLimit = g.SelectionLimit,
                Options = g.Options.Select(o => new CustomOptionDto
                {
                    Id = o.Id,
                    Code = o.Code,
                    DisplayName = o.DisplayName,
                    ExtraPrice = o.ExtraPrice,
                    AssetRef = o.AssetRef,
                    MetaJson = o.MetaJson
                }).ToList()
            }).ToList()
        };
    }
}


