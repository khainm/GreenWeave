namespace backend.Models
{
    public static class UserRoles
    {
        public const string Admin = "Admin";
        public const string Staff = "Staff";
        public const string Customer = "Customer";
        
        public static readonly string[] AllRoles = { Admin, Staff, Customer };
    }
    
    public enum UserRoleEnum
    {
        Customer = 1,
        Staff = 2,
        Admin = 3
    }
}
