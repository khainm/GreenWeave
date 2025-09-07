using backend.Models;
using System.Collections.Generic;

namespace backend.Data
{
    public interface IExampleRepository
    {
        IEnumerable<ExampleEntity> GetAll();
    ExampleEntity? GetById(int id);
        void Add(ExampleEntity entity);
        void Update(ExampleEntity entity);
        void Delete(int id);
    }
}
