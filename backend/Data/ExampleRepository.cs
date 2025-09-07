using backend.Models;
using System.Collections.Generic;
using System.Linq;

namespace backend.Data
{
    public class ExampleRepository : IExampleRepository
    {
        private readonly List<ExampleEntity> _entities = new();

        public IEnumerable<ExampleEntity> GetAll() => _entities;
    public ExampleEntity? GetById(int id) => _entities.FirstOrDefault(e => e.Id == id);
        public void Add(ExampleEntity entity) => _entities.Add(entity);
        public void Update(ExampleEntity entity)
        {
            var existing = GetById(entity.Id);
            if (existing != null)
            {
                existing.Name = entity.Name;
            }
        }
        public void Delete(int id)
        {
            var entity = GetById(id);
            if (entity != null)
                _entities.Remove(entity);
        }
    }
}
