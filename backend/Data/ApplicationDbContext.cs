using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using backend.Models;

namespace backend.Data
{
    public class ApplicationDbContext : IdentityDbContext<User>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<Product> Products { get; set; }
        public DbSet<ProductImage> ProductImages { get; set; }
        public DbSet<ProductColor> ProductColors { get; set; }
        public DbSet<ProductSticker> ProductStickers { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Cart> Carts { get; set; }
        public DbSet<CartItem> CartItems { get; set; }
        public DbSet<UserAddress> UserAddresses { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<ShippingRequest> ShippingRequests { get; set; }
        public DbSet<ShippingTransaction> ShippingTransactions { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // Configure User (extends IdentityUser)
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(u => u.CustomerCode).IsUnique();
                entity.Property(u => u.CustomerCode).IsRequired().HasMaxLength(20);
                entity.Property(u => u.FullName).IsRequired().HasMaxLength(100);
                entity.Property(u => u.Address).HasMaxLength(500);
                entity.Property(u => u.Avatar).HasMaxLength(255);
                entity.Property(u => u.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(u => u.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(u => u.IsActive).HasDefaultValue(true);
            });

            // Configure UserAddress
            modelBuilder.Entity<UserAddress>(entity =>
            {
                entity.HasKey(ua => ua.Id);
                entity.Property(ua => ua.UserId).IsRequired();
                entity.Property(ua => ua.FullName).IsRequired().HasMaxLength(100);
                entity.Property(ua => ua.PhoneNumber).IsRequired().HasMaxLength(15);
                entity.Property(ua => ua.AddressLine).IsRequired().HasMaxLength(200);
                entity.Property(ua => ua.Ward).HasMaxLength(100);
                entity.Property(ua => ua.District).IsRequired().HasMaxLength(100);
                entity.Property(ua => ua.Province).IsRequired().HasMaxLength(100);
                entity.Property(ua => ua.PostalCode).HasMaxLength(10);
                entity.Property(ua => ua.AddressType).IsRequired().HasMaxLength(20).HasDefaultValue("Home");
                entity.Property(ua => ua.IsDefault).HasDefaultValue(false);
                entity.Property(ua => ua.IsActive).HasDefaultValue(true);
                entity.Property(ua => ua.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(ua => ua.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
                
                // Relationship with User
                entity.HasOne(ua => ua.User)
                    .WithMany(u => u.Addresses)
                    .HasForeignKey(ua => ua.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
            
            // Configure Category
            modelBuilder.Entity<Category>(entity =>
            {
                entity.HasKey(c => c.Id);
                entity.HasIndex(c => c.Code).IsUnique();
                entity.Property(c => c.Name).IsRequired().HasMaxLength(100);
                entity.Property(c => c.Code).IsRequired().HasMaxLength(20);
                entity.Property(c => c.Description).HasMaxLength(500);
                entity.Property(c => c.Status).IsRequired().HasMaxLength(20).HasDefaultValue("active");
                entity.Property(c => c.SortOrder).HasDefaultValue(0);
                entity.Property(c => c.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(c => c.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
            });

            // Configure Product
            modelBuilder.Entity<Product>(entity =>
            {
                entity.HasKey(p => p.Id);
                entity.HasIndex(p => p.Sku).IsUnique();
                
                entity.Property(p => p.Name)
                    .IsRequired()
                    .HasMaxLength(200);
                    
                entity.Property(p => p.Sku)
                    .IsRequired()
                    .HasMaxLength(50);
                    
                entity.Property(p => p.Category)
                    .IsRequired()
                    .HasMaxLength(100);
                    
                entity.Property(p => p.Description)
                    .HasMaxLength(1000);
                    
                entity.Property(p => p.Price)
                    .HasColumnType("decimal(18,2)");
                    
                entity.Property(p => p.OriginalPrice)
                    .HasColumnType("decimal(18,2)");
                    
                entity.Property(p => p.Weight)
                    .HasColumnType("decimal(10,3)");
                    
                entity.Property(p => p.Status)
                    .IsRequired()
                    .HasMaxLength(20)
                    .HasDefaultValue("active");
                    
                entity.Property(p => p.CreatedAt)
                    .HasDefaultValueSql("GETUTCDATE()");
                    
                entity.Property(p => p.UpdatedAt)
                    .HasDefaultValueSql("GETUTCDATE()");

                // Optional FK to Category for integrity while keeping legacy string Category
                entity.HasOne(p => p.CategoryRef)
                    .WithMany()
                    .HasForeignKey(p => p.CategoryId)
                    .OnDelete(DeleteBehavior.SetNull);
            });
            
            // Configure ProductImage
            modelBuilder.Entity<ProductImage>(entity =>
            {
                entity.HasKey(pi => pi.Id);
                
                entity.Property(pi => pi.ImageUrl)
                    .IsRequired()
                    .HasMaxLength(500);
                    
                entity.Property(pi => pi.CloudinaryPublicId)
                    .HasMaxLength(200);
                    
                entity.Property(pi => pi.CreatedAt)
                    .HasDefaultValueSql("GETUTCDATE()");
                
                entity.HasOne(pi => pi.Product)
                    .WithMany(p => p.Images)
                    .HasForeignKey(pi => pi.ProductId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
            
            // Configure ProductSticker
            modelBuilder.Entity<ProductSticker>(entity =>
            {
                entity.HasKey(ps => ps.Id);
                entity.Property(ps => ps.ImageUrl).IsRequired().HasMaxLength(500);
                entity.Property(ps => ps.CloudinaryPublicId).HasMaxLength(200);
                entity.Property(ps => ps.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.HasOne(ps => ps.Product)
                    .WithMany(p => p.Stickers)
                    .HasForeignKey(ps => ps.ProductId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
            
            // Configure ProductColor
            modelBuilder.Entity<ProductColor>(entity =>
            {
                entity.HasKey(pc => pc.Id);
                
                entity.Property(pc => pc.ColorCode)
                    .IsRequired()
                    .HasMaxLength(7);
                    
                entity.Property(pc => pc.ColorName)
                    .HasMaxLength(50);
                
                entity.HasOne(pc => pc.Product)
                    .WithMany(p => p.Colors)
                    .HasForeignKey(pc => pc.ProductId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure Cart
            modelBuilder.Entity<Cart>(entity =>
            {
                entity.HasKey(c => c.Id);
                entity.Property(c => c.UserId).IsRequired(false); // Allow null for anonymous carts
                entity.Property(c => c.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(c => c.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
                
                // Relationship with User
                entity.HasOne(c => c.User)
                    .WithMany(u => u.Carts)
                    .HasForeignKey(c => c.UserId)
                    .OnDelete(DeleteBehavior.SetNull); // Set to null instead of cascading delete
            });

            // Configure CartItem
            modelBuilder.Entity<CartItem>(entity =>
            {
                entity.HasKey(ci => ci.Id);
                entity.Property(ci => ci.UnitPrice).HasColumnType("decimal(18,2)");
                entity.Property(ci => ci.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.HasOne(ci => ci.Cart)
                    .WithMany(c => c.Items)
                    .HasForeignKey(ci => ci.CartId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure Order
            modelBuilder.Entity<Order>(entity =>
            {
                entity.HasKey(o => o.Id);
                entity.Property(o => o.OrderNumber).IsRequired().HasMaxLength(20);
                entity.HasIndex(o => o.OrderNumber).IsUnique();
                entity.Property(o => o.CustomerId).IsRequired();
                entity.Property(o => o.Subtotal).HasColumnType("decimal(18,2)");
                entity.Property(o => o.ShippingFee).HasColumnType("decimal(18,2)").HasDefaultValue(0);
                entity.Property(o => o.Discount).HasColumnType("decimal(18,2)").HasDefaultValue(0);
                entity.Property(o => o.Total).HasColumnType("decimal(18,2)");
                entity.Property(o => o.Notes).HasMaxLength(500);
                entity.Property(o => o.CancelReason).HasMaxLength(500);
                entity.Property(o => o.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(o => o.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
                
                // Convert enum to string
                entity.Property(o => o.Status)
                    .HasConversion<string>()
                    .HasMaxLength(20);
                
                // Relationship with User (Customer)
                entity.HasOne(o => o.Customer)
                    .WithMany(u => u.Orders)
                    .HasForeignKey(o => o.CustomerId)
                    .OnDelete(DeleteBehavior.Restrict);
                    
                // Relationship with UserAddress (ShippingAddress)
                entity.HasOne(o => o.ShippingAddress)
                    .WithMany()
                    .HasForeignKey(o => o.ShippingAddressId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure OrderItem
            modelBuilder.Entity<OrderItem>(entity =>
            {
                entity.HasKey(oi => oi.Id);
                entity.Property(oi => oi.ProductName).IsRequired().HasMaxLength(200);
                entity.Property(oi => oi.ProductSku).IsRequired().HasMaxLength(50);
                entity.Property(oi => oi.UnitPrice).HasColumnType("decimal(18,2)");
                entity.Property(oi => oi.TotalPrice).HasColumnType("decimal(18,2)");
                entity.Property(oi => oi.ProductImage).HasMaxLength(500);
                entity.Property(oi => oi.CustomizationData).HasMaxLength(2000);
                
                // Relationship with Order
                entity.HasOne(oi => oi.Order)
                    .WithMany(o => o.Items)
                    .HasForeignKey(oi => oi.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);
                    
                // Relationship with Product
                entity.HasOne(oi => oi.Product)
                    .WithMany()
                    .HasForeignKey(oi => oi.ProductId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure UserAddress - Updated, removed duplicate
            modelBuilder.Entity<UserAddress>(entity =>
            {
                entity.HasKey(ua => ua.Id);
                entity.Property(ua => ua.UserId).IsRequired();
                entity.Property(ua => ua.FullName).IsRequired().HasMaxLength(100);
                entity.Property(ua => ua.PhoneNumber).IsRequired().HasMaxLength(15);
                entity.Property(ua => ua.AddressLine).IsRequired().HasMaxLength(200);
                entity.Property(ua => ua.Ward).HasMaxLength(100);
                entity.Property(ua => ua.District).IsRequired().HasMaxLength(100);
                entity.Property(ua => ua.Province).IsRequired().HasMaxLength(100);
                entity.Property(ua => ua.PostalCode).HasMaxLength(10);
                entity.Property(ua => ua.AddressType).IsRequired().HasMaxLength(20).HasDefaultValue("Home");
                entity.Property(ua => ua.IsDefault).HasDefaultValue(false);
                entity.Property(ua => ua.IsActive).HasDefaultValue(true);
                entity.Property(ua => ua.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(ua => ua.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
                
                // Relationship with User
                entity.HasOne(ua => ua.User)
                    .WithMany(u => u.Addresses)
                    .HasForeignKey(ua => ua.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure Invoice
            modelBuilder.Entity<Invoice>(entity =>
            {
                entity.HasKey(i => i.Id);
                entity.Property(i => i.InvoiceNumber).IsRequired().HasMaxLength(20);
                entity.HasIndex(i => i.InvoiceNumber).IsUnique();
                entity.Property(i => i.CustomerEmail).IsRequired().HasMaxLength(255);
                entity.Property(i => i.CustomerName).IsRequired().HasMaxLength(100);
                entity.Property(i => i.CustomerPhone).HasMaxLength(15);
                entity.Property(i => i.Subtotal).HasColumnType("decimal(18,2)");
                entity.Property(i => i.ShippingFee).HasColumnType("decimal(18,2)").HasDefaultValue(0);
                entity.Property(i => i.Discount).HasColumnType("decimal(18,2)").HasDefaultValue(0);
                entity.Property(i => i.Total).HasColumnType("decimal(18,2)");
                entity.Property(i => i.FilePath).HasMaxLength(500);
                entity.Property(i => i.FileName).HasMaxLength(100);
                entity.Property(i => i.ErrorMessage).HasMaxLength(500);
                entity.Property(i => i.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(i => i.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
                
                // Convert enum to string
                entity.Property(i => i.Status)
                    .HasConversion<string>()
                    .HasMaxLength(20);
                
                // Relationship with Order
                entity.HasOne(i => i.Order)
                    .WithOne()
                    .HasForeignKey<Invoice>(i => i.OrderId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }
    }
}
