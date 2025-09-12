namespace backend.Interfaces.Services
{
    public interface ICustomerCodeService
    {
        Task<string> GenerateCustomerCodeAsync();
        bool IsValidCustomerCode(string customerCode);
    }
}
