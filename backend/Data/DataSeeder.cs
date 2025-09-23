using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Data
{
    public static class DataSeeder
    {
        public static async Task SeedDataAsync(IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
            var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

            // Ensure database is created
            await context.Database.EnsureCreatedAsync();

            // Seed Roles
            await SeedRolesAsync(roleManager);

            // Seed Users
            await SeedUsersAsync(userManager);

        }

        private static async Task SeedRolesAsync(RoleManager<IdentityRole> roleManager)
        {
            string[] roles = { "Admin", "User", "Customer" };

            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    await roleManager.CreateAsync(new IdentityRole(role));
                }
            }
        }

        private static async Task SeedUsersAsync(UserManager<User> userManager)
        {
            // Admin User
            var adminUser = await userManager.FindByEmailAsync("admin@greenweave.com");
            if (adminUser == null)
            {
                adminUser = new User
                {
                    UserName = "admin@greenweave.com",
                    Email = "admin@greenweave.com",
                    EmailConfirmed = true,
                    CustomerCode = "ADMIN001",
                    FullName = "Quản trị viên hệ thống",
                    PhoneNumber = "0123456789",
                    PhoneNumberConfirmed = true,
                    Address = "123 Đường ABC, Quận 1, TP.HCM",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                var result = await userManager.CreateAsync(adminUser, "Admin@123");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(adminUser, "Admin");
                }
            }

            // Test Customer Users
            var customers = new[]
            {
                new
                {
                    Email = "customer1@greenweave.com",
                    CustomerCode = "CUST001",
                    FullName = "Nguyễn Văn An",
                    PhoneNumber = "0987654321",
                    Address = "456 Đường XYZ, Quận 2, TP.HCM",
                    Password = "Customer@123"
                },
                new
                {
                    Email = "customer2@greenweave.com",
                    CustomerCode = "CUST002",
                    FullName = "Trần Thị Bình",
                    PhoneNumber = "0912345678",
                    Address = "789 Đường DEF, Quận 3, TP.HCM",
                    Password = "Customer@123"
                },
                new
                {
                    Email = "customer3@greenweave.com",
                    CustomerCode = "CUST003",
                    FullName = "Lê Văn Cường",
                    PhoneNumber = "0923456789",
                    Address = "321 Đường GHI, Quận 4, TP.HCM",
                    Password = "Customer@123"
                },
                new
                {
                    Email = "customer4@greenweave.com",
                    CustomerCode = "CUST004",
                    FullName = "Phạm Thị Dung",
                    PhoneNumber = "0934567890",
                    Address = "654 Đường JKL, Quận 5, TP.HCM",
                    Password = "Customer@123"
                },
                new
                {
                    Email = "customer5@greenweave.com",
                    CustomerCode = "CUST005",
                    FullName = "Hoàng Văn Em",
                    PhoneNumber = "0945678901",
                    Address = "987 Đường MNO, Quận 6, TP.HCM",
                    Password = "Customer@123"
                }
            };

            foreach (var customer in customers)
            {
                var user = await userManager.FindByEmailAsync(customer.Email);
                if (user == null)
                {
                    user = new User
                    {
                        UserName = customer.Email,
                        Email = customer.Email,
                        EmailConfirmed = true,
                        CustomerCode = customer.CustomerCode,
                        FullName = customer.FullName,
                        PhoneNumber = customer.PhoneNumber,
                        PhoneNumberConfirmed = true,
                        Address = customer.Address,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    var result = await userManager.CreateAsync(user, customer.Password);
                    if (result.Succeeded)
                    {
                        await userManager.AddToRoleAsync(user, "Customer");
                    }
                }
            }
        }


    }
}
