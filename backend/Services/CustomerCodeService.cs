using backend.Interfaces.Services;
using backend.Interfaces.Repositories;
using backend.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class CustomerCodeService : ICustomerCodeService
    {
        private readonly IUserRepository _userRepository;
        private const string PREFIX = "GW";
        private const int CODE_LENGTH = 8; // Includes prefix

        public CustomerCodeService(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public async Task<string> GenerateCustomerCodeAsync()
        {
            string customerCode;
            bool isUnique;

            do
            {
                // Generate 6-digit random number
                var random = new Random();
                var number = random.Next(100000, 999999);
                customerCode = $"{PREFIX}{number}";

                // Check if this code already exists
                isUnique = !await _userRepository.CustomerCodeExistsAsync(customerCode);
            }
            while (!isUnique);

            return customerCode;
        }

        public bool IsValidCustomerCode(string customerCode)
        {
            if (string.IsNullOrWhiteSpace(customerCode))
                return false;

            if (customerCode.Length != CODE_LENGTH)
                return false;

            if (!customerCode.StartsWith(PREFIX))
                return false;

            // Check if the remaining part is numeric
            var numberPart = customerCode.Substring(PREFIX.Length);
            return int.TryParse(numberPart, out _);
        }
    }
}
