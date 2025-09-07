using backend.Models;
using backend.Data;
using System.Collections.Generic;

namespace backend.Services
{
    public class ExampleService : IExampleService
    {
        private readonly IExampleRepository _repository;
        public ExampleService(IExampleRepository repository)
        {
            _repository = repository;
        }
        public IEnumerable<ExampleEntity> GetAll() => _repository.GetAll();
        public ExampleEntity GetById(int id) => _repository.GetById(id);
        public void Add(ExampleEntity entity) => _repository.Add(entity);
        public void Update(ExampleEntity entity) => _repository.Update(entity);
        public void Delete(int id) => _repository.Delete(id);
    }
}
