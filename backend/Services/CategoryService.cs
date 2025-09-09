using backend.DTOs;
using backend.Interfaces.Repositories;
using backend.Interfaces.Services;
using backend.Models;

namespace backend.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly ICategoryRepository _repo;
        public CategoryService(ICategoryRepository repo)
        {
            _repo = repo;
        }

        public async Task<IEnumerable<CategoryDto>> GetAllAsync()
        {
            var items = await _repo.GetAllAsync();
            var results = new List<CategoryDto>();
            foreach (var c in items)
            {
                var dto = ToDto(c);
                dto.ProductCount = await _repo.CountProductsAsync(c.Id);
                results.Add(dto);
            }
            return results;
        }

        public async Task<CategoryDto?> GetByIdAsync(int id)
        {
            var c = await _repo.GetByIdAsync(id);
            return c == null ? null : ToDto(c);
        }

        public async Task<CategoryDto> CreateAsync(CreateCategoryDto dto)
        {
            if (await _repo.CodeExistsAsync(dto.Code))
            {
                throw new InvalidOperationException("Mã danh mục đã tồn tại");
            }
            var entity = new Category
            {
                Name = dto.Name,
                Code = dto.Code,
                Description = dto.Description,
                Status = dto.Status,
                SortOrder = dto.SortOrder,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            var saved = await _repo.AddAsync(entity);
            return ToDto(saved);
        }

        public async Task<CategoryDto> UpdateAsync(int id, CreateCategoryDto dto)
        {
            var existing = await _repo.GetByIdAsync(id) ?? throw new InvalidOperationException("Không tìm thấy danh mục");
            if (await _repo.CodeExistsAsync(dto.Code, id))
            {
                throw new InvalidOperationException("Mã danh mục đã tồn tại");
            }
            existing.Name = dto.Name;
            existing.Code = dto.Code;
            existing.Description = dto.Description;
            existing.Status = dto.Status;
            existing.SortOrder = dto.SortOrder;
            existing.UpdatedAt = DateTime.UtcNow;
            var saved = await _repo.UpdateAsync(existing);
            return ToDto(saved);
        }

        public Task<bool> DeleteAsync(int id) => _repo.DeleteAsync(id);

        private static CategoryDto ToDto(Category c) => new CategoryDto
        {
            Id = c.Id,
            Name = c.Name,
            Code = c.Code,
            Description = c.Description,
            Status = c.Status,
            SortOrder = c.SortOrder,
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt
        };
    }
}


