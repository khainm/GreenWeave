using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using System.Globalization;
using System.Text;

namespace backend.Data
{
    // Helper classes for order data parsing
    public class OrderDataGroup
    {
        public string OrderNumber { get; set; } = string.Empty;
        public DateTime OrderDate { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string Address { get; set; } = string.Empty;
        public string PaymentMethod { get; set; } = string.Empty;
        public string OrderStatus { get; set; } = string.Empty;
        public string PaymentStatus { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public decimal ShippingFee { get; set; } = 0;
        public string? Notes { get; set; }
        public List<OrderItemData> Items { get; set; } = new List<OrderItemData>();
    }

    public class OrderItemData
    {
        public string ProductName { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }

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

            // Seed Order Data from Real Business Data
            await SeedOrderDataAsync(context, userManager);

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

            // Remove test customers - will use real customers from order data instead
        }

        private static async Task SeedOrderDataAsync(ApplicationDbContext context, UserManager<User> userManager)
        {
            // Check if orders already exist
            if (await context.Orders.AnyAsync())
            {
                return; // Orders already seeded
            }

            // Create sample products first (if not exist)
            await SeedSampleProductsAsync(context);

            // Real order data from business Excel
            var orderData = GetRealOrderData();

            foreach (var orderGroup in orderData)
            {
                try
                {
                    // Create customer if not exists
                    var customer = await CreateOrGetCustomerAsync(userManager, orderGroup.CustomerName, orderGroup.PhoneNumber);
                    
                    // Create shipping address if not exists
                    var shippingAddress = await CreateOrGetShippingAddressAsync(context, customer.Id, orderGroup);

                    // Create order
                    var order = new Order
                    {
                        OrderNumber = orderGroup.OrderNumber,
                        CustomerId = customer.Id,
                        ShippingAddressId = shippingAddress.Id,
                        Subtotal = orderGroup.Items.Sum(i => i.UnitPrice * i.Quantity),
                        ShippingFee = orderGroup.ShippingFee,
                        Total = orderGroup.TotalAmount,
                        Status = ParseOrderStatus(orderGroup.OrderStatus),
                        PaymentStatus = ParsePaymentStatus(orderGroup.PaymentStatus),
                        PaymentMethod = ParsePaymentMethod(orderGroup.PaymentMethod),
                        Notes = orderGroup.Notes,
                        CreatedAt = orderGroup.OrderDate,
                        UpdatedAt = orderGroup.OrderDate,
                        DeliveredAt = orderGroup.OrderStatus == "Đã Giao" ? orderGroup.OrderDate.AddDays(3) : null,
                        PaidAt = orderGroup.PaymentStatus == "Thanh toán 100%" ? orderGroup.OrderDate.AddHours(1) : null
                    };

                    context.Orders.Add(order);
                    await context.SaveChangesAsync(); // Save to get Order ID

                    // Create order items
                    foreach (var itemData in orderGroup.Items)
                    {
                        var product = await GetOrCreateProductAsync(context, itemData.ProductName, itemData.Color, itemData.UnitPrice);
                        
                        var orderItem = new OrderItem
                        {
                            OrderId = order.Id,
                            ProductId = product.Id,
                            ProductName = product.Name,
                            ProductSku = product.Sku,
                            ProductImage = product.Images.FirstOrDefault()?.ImageUrl,
                            Quantity = itemData.Quantity,
                            UnitPrice = itemData.UnitPrice,
                            TotalPrice = itemData.UnitPrice * itemData.Quantity,
                            CustomizationData = !string.IsNullOrEmpty(itemData.Color) ? 
                                $"{{\"color\":\"{itemData.Color}\"}}" : null
                        };

                        context.OrderItems.Add(orderItem);
                    }

                    await context.SaveChangesAsync();
                }
                catch (Exception ex)
                {
                    // Log error and continue with next order
                    Console.WriteLine($"Error seeding order {orderGroup.OrderNumber}: {ex.Message}");
                }
            }
        }

        private static async Task SeedSampleProductsAsync(ApplicationDbContext context)
        {
            if (await context.Products.AnyAsync())
            {
                return; // Products already exist
            }

            var sampleProducts = new[]
            {
                new Product { Name = "Túi Tote Cơ Bản", Sku = "TOTE-001", Category = "Túi Tote", Price = 159000, Stock = 100, Weight = 200 },
                new Product { Name = "Túi Tote Premium", Sku = "TOTE-002", Category = "Túi Tote", Price = 299000, Stock = 50, Weight = 250 },
                new Product { Name = "Túi Tote Deluxe", Sku = "TOTE-003", Category = "Túi Tote", Price = 479000, Stock = 30, Weight = 300 },
                new Product { Name = "Túi Tote Đặc Biệt", Sku = "TOTE-004", Category = "Túi Tote", Price = 259000, Stock = 40, Weight = 220 },
                new Product { Name = "Túi Tote Cá Nhân Hóa", Sku = "TOTE-005", Category = "Túi Tote", Price = 200000, Stock = 60, Weight = 180 }
            };

            context.Products.AddRange(sampleProducts);
            await context.SaveChangesAsync();
        }

        private static string GenerateRealisticEmail(string fullName)
        {
            // Remove diacritics and convert to lower case
            var normalizedName = RemoveDiacritics(fullName.ToLower());
            
            // Split name into parts
            var nameParts = normalizedName.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            
            var emailDomains = new[] { "@gmail.com", "@yahoo.com", "@hotmail.com", "@outlook.com" };
            var random = new Random();
            
            if (nameParts.Length >= 2)
            {
                // Get first name and last name
                var firstName = nameParts[^1]; // Last part (given name)
                var lastName = nameParts[0];   // First part (family name)
                
                var emailPatterns = new[]
                {
                    $"{firstName}{lastName}",
                    $"{firstName}.{lastName}",
                    $"{firstName}_{lastName}",
                    $"{firstName}{lastName}{random.Next(10, 99)}",
                    $"{firstName}{random.Next(1990, 2005)}",
                    $"{lastName}{firstName}",
                    $"{firstName}{lastName[0]}",
                };
                
                var pattern = emailPatterns[random.Next(emailPatterns.Length)];
                var domain = emailDomains[0]; // Always use @gmail.com as requested
                
                return pattern + domain;
            }
            else
            {
                // Single name fallback
                var name = nameParts[0];
                return $"{name}{random.Next(100, 999)}@gmail.com";
            }
        }

        private static string RemoveDiacritics(string text)
        {
            var normalizedString = text.Normalize(NormalizationForm.FormD);
            var stringBuilder = new StringBuilder();

            foreach (var c in normalizedString)
            {
                var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(c);
                if (unicodeCategory != UnicodeCategory.NonSpacingMark)
                {
                    stringBuilder.Append(c);
                }
            }

            return stringBuilder.ToString().Normalize(NormalizationForm.FormC);
        }

        private static async Task<User> CreateOrGetCustomerAsync(UserManager<User> userManager, string fullName, string? phoneNumber)
        {
            // Try to find existing user by phone or name
            var existingUser = await userManager.Users
                .FirstOrDefaultAsync(u => u.PhoneNumber == phoneNumber || u.FullName == fullName);

            if (existingUser != null)
            {
                return existingUser;
            }

            // Generate realistic email from customer name
            var email = GenerateRealisticEmail(fullName);
            
            // Ensure email is unique
            var existingUserByEmail = await userManager.FindByEmailAsync(email);
            if (existingUserByEmail != null)
            {
                // Add a suffix to make it unique
                var emailParts = email.Split('@');
                email = $"{emailParts[0]}_{DateTime.Now.Ticks}@{emailParts[1]}";
            }

            // Create new customer
            var customer = new User
            {
                UserName = email,
                Email = email,
                EmailConfirmed = false,
                CustomerCode = $"GW{DateTime.Now:yyMMdd}{new Random().Next(1000, 9999)}",
                FullName = fullName,
                PhoneNumber = phoneNumber ?? "N/A",
                PhoneNumberConfirmed = !string.IsNullOrEmpty(phoneNumber),
                Address = "Địa chỉ từ đơn hàng",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var result = await userManager.CreateAsync(customer, "Customer@123");
            if (!result.Succeeded)
            {
                throw new InvalidOperationException($"Failed to create user: {string.Join(", ", result.Errors.Select(e => e.Description))}");
            }
            
            // Add role
            await userManager.AddToRoleAsync(customer, "Customer");
            
            // Reload customer to ensure it has valid ID from database
            var createdCustomer = await userManager.FindByEmailAsync(email);
            if (createdCustomer == null || string.IsNullOrEmpty(createdCustomer.Id))
            {
                throw new InvalidOperationException($"Failed to retrieve created customer ID for {email}");
            }

            return createdCustomer;
        }

        private static async Task<UserAddress> CreateOrGetShippingAddressAsync(ApplicationDbContext context, string userId, OrderDataGroup orderGroup)
        {
            // Check if address already exists for this user  
            var addressParts = orderGroup.Address.Split(',');
            var firstAddressPart = addressParts.Length > 0 ? addressParts[0] : orderGroup.Address;
            
            var existingAddress = await context.UserAddresses
                .FirstOrDefaultAsync(a => a.UserId == userId && a.AddressLine.Contains(firstAddressPart));

            if (existingAddress != null)
            {
                return existingAddress;
            }

            // Parse address components
            var addressLine = addressParts.Length > 0 ? addressParts[0].Trim() : orderGroup.Address;
            var district = addressParts.Length > 1 ? addressParts[1].Trim() : "";
            var province = addressParts.Length > 2 ? addressParts[2].Trim() : "";

            var userAddress = new UserAddress
            {
                UserId = userId,
                FullName = orderGroup.CustomerName,
                PhoneNumber = orderGroup.PhoneNumber ?? "N/A",
                AddressLine = addressLine,
                District = district,
                Province = province,
                AddressType = "Home",
                IsDefault = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            context.UserAddresses.Add(userAddress);
            await context.SaveChangesAsync();
            return userAddress;
        }

        private static async Task<Product> GetOrCreateProductAsync(ApplicationDbContext context, string productName, string color, decimal price)
        {
            // Find existing product by price range to match the Excel data
            var product = await context.Products
                .FirstOrDefaultAsync(p => Math.Abs(p.Price - price) < 10);

            if (product == null)
            {
                // Create new product based on price and name pattern
                string category = "Túi Tote";
                string sku = $"TOTE-{price:F0}";
                
                product = new Product
                {
                    Name = DetermineProductName(price),
                    Sku = sku,
                    Category = category,
                    Price = price,
                    Stock = 100,
                    Weight = 200,
                    Status = "active",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                context.Products.Add(product);
                await context.SaveChangesAsync();
            }

            return product;
        }

        private static string DetermineProductName(decimal price)
        {
            return price switch
            {
                >= 400 => "Túi Tote Deluxe",
                >= 250 => "Túi Tote Premium", 
                >= 200 => "Túi Tote Cá Nhân Hóa",
                >= 150 => "Túi Tote Cơ Bản",
                _ => "Túi Tote Giá Rẻ"
            };
        }

        private static OrderStatus ParseOrderStatus(string status)
        {
            return status?.ToLower() switch
            {
                "đã giao" => OrderStatus.Delivered,
                "pre-order" => OrderStatus.Pending,
                "đang giao" => OrderStatus.Shipping,
                "đã xác nhận" => OrderStatus.Confirmed,
                _ => OrderStatus.Delivered // Default for most orders in data
            };
        }

        private static PaymentStatus ParsePaymentStatus(string status)
        {
            return status?.ToLower() switch
            {
                "thanh toán 100%" => PaymentStatus.Paid,
                "chưa thanh toán" => PaymentStatus.Pending,
                _ => PaymentStatus.Paid // Default for most orders
            };
        }

        private static PaymentMethod ParsePaymentMethod(string method)
        {
            return method?.ToLower() switch
            {
                "chuyển khoản" => PaymentMethod.BankTransfer,
                "tiền mặt" => PaymentMethod.CashOnDelivery,
                _ => PaymentMethod.BankTransfer // Default
            };
        }

        private static List<OrderDataGroup> GetRealOrderData()
        {
            return OrderData.GetAllOrders();
        }

        private static string RemoveVietnameseAccents(string text)
        {
            if (string.IsNullOrEmpty(text))
                return text;

            // Vietnamese accent mapping
            var accentMap = new Dictionary<char, char>
            {
                {'á', 'a'}, {'à', 'a'}, {'ả', 'a'}, {'ã', 'a'}, {'ạ', 'a'},
                {'ă', 'a'}, {'ắ', 'a'}, {'ằ', 'a'}, {'ẳ', 'a'}, {'ẵ', 'a'}, {'ặ', 'a'},
                {'â', 'a'}, {'ấ', 'a'}, {'ầ', 'a'}, {'ẩ', 'a'}, {'ẫ', 'a'}, {'ậ', 'a'},
                {'é', 'e'}, {'è', 'e'}, {'ẻ', 'e'}, {'ẽ', 'e'}, {'ẹ', 'e'},
                {'ê', 'e'}, {'ế', 'e'}, {'ề', 'e'}, {'ể', 'e'}, {'ễ', 'e'}, {'ệ', 'e'},
                {'í', 'i'}, {'ì', 'i'}, {'ỉ', 'i'}, {'ĩ', 'i'}, {'ị', 'i'},
                {'ó', 'o'}, {'ò', 'o'}, {'ỏ', 'o'}, {'õ', 'o'}, {'ọ', 'o'},
                {'ô', 'o'}, {'ố', 'o'}, {'ồ', 'o'}, {'ổ', 'o'}, {'ỗ', 'o'}, {'ộ', 'o'},
                {'ơ', 'o'}, {'ớ', 'o'}, {'ờ', 'o'}, {'ở', 'o'}, {'ỡ', 'o'}, {'ợ', 'o'},
                {'ú', 'u'}, {'ù', 'u'}, {'ủ', 'u'}, {'ũ', 'u'}, {'ụ', 'u'},
                {'ư', 'u'}, {'ứ', 'u'}, {'ừ', 'u'}, {'ử', 'u'}, {'ữ', 'u'}, {'ự', 'u'},
                {'ý', 'y'}, {'ỳ', 'y'}, {'ỷ', 'y'}, {'ỹ', 'y'}, {'ỵ', 'y'},
                {'đ', 'd'},
                // Uppercase
                {'Á', 'A'}, {'À', 'A'}, {'Ả', 'A'}, {'Ã', 'A'}, {'Ạ', 'A'},
                {'Ă', 'A'}, {'Ắ', 'A'}, {'Ằ', 'A'}, {'Ẳ', 'A'}, {'Ẵ', 'A'}, {'Ặ', 'A'},
                {'Â', 'A'}, {'Ấ', 'A'}, {'Ầ', 'A'}, {'Ẩ', 'A'}, {'Ẫ', 'A'}, {'Ậ', 'A'},
                {'É', 'E'}, {'È', 'E'}, {'Ẻ', 'E'}, {'Ẽ', 'E'}, {'Ẹ', 'E'},
                {'Ê', 'E'}, {'Ế', 'E'}, {'Ề', 'E'}, {'Ể', 'E'}, {'Ễ', 'E'}, {'Ệ', 'E'},
                {'Í', 'I'}, {'Ì', 'I'}, {'Ỉ', 'I'}, {'Ĩ', 'I'}, {'Ị', 'I'},
                {'Ó', 'O'}, {'Ò', 'O'}, {'Ỏ', 'O'}, {'Õ', 'O'}, {'Ọ', 'O'},
                {'Ô', 'O'}, {'Ố', 'O'}, {'Ồ', 'O'}, {'Ổ', 'O'}, {'Ỗ', 'O'}, {'Ộ', 'O'},
                {'Ơ', 'O'}, {'Ớ', 'O'}, {'Ờ', 'O'}, {'Ở', 'O'}, {'Ỡ', 'O'}, {'Ợ', 'O'},
                {'Ú', 'U'}, {'Ù', 'U'}, {'Ủ', 'U'}, {'Ũ', 'U'}, {'Ụ', 'U'},
                {'Ư', 'U'}, {'Ứ', 'U'}, {'Ừ', 'U'}, {'Ử', 'U'}, {'Ữ', 'U'}, {'Ự', 'U'},
                {'Ý', 'Y'}, {'Ỳ', 'Y'}, {'Ỷ', 'Y'}, {'Ỹ', 'Y'}, {'Ỵ', 'Y'},
                {'Đ', 'D'}
            };

            var result = new System.Text.StringBuilder();
            foreach (char c in text)
            {
                if (accentMap.TryGetValue(c, out char replacement))
                {
                    result.Append(replacement);
                }
                else if (char.IsLetter(c) || char.IsDigit(c) || c == ' ')
                {
                    result.Append(c);
                }
            }

            return result.ToString();
        }

    }
}
