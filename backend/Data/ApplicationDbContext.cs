using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using backend.Models;
using GreenWeave.Models;

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
        public DbSet<Warehouse> Warehouses { get; set; }
        public DbSet<ProductWarehouseStock> ProductWarehouseStocks { get; set; }
        public DbSet<WebhookLog> WebhookLogs { get; set; }
        public DbSet<EmailVerificationToken> EmailVerificationTokens { get; set; }
        public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }
        public DbSet<Blog> Blogs { get; set; }
        public DbSet<BlogLike> BlogLikes { get; set; }
        public DbSet<BlogView> BlogViews { get; set; }
        public DbSet<CustomDesign> CustomDesigns { get; set; }
        public DbSet<ConsultationRequest> ConsultationRequests { get; set; }

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
            
            // Removed: ProductSticker configuration - use Sticker Library instead
            // ProductStickers are now managed separately, not attached to products
            // modelBuilder.Entity<ProductSticker>(entity => { ... });
            
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

            // Warehouse configuration
            modelBuilder.Entity<Warehouse>(entity =>
            {
                entity.HasKey(w => w.Id);
                entity.Property(w => w.Name).IsRequired().HasMaxLength(100);
                entity.Property(w => w.Phone).IsRequired().HasMaxLength(15);
                entity.Property(w => w.AddressDetail).IsRequired().HasMaxLength(200);
                entity.Property(w => w.ProvinceName).HasMaxLength(100);
                entity.Property(w => w.DistrictName).HasMaxLength(100);
                entity.Property(w => w.WardName).HasMaxLength(100);
                entity.Property(w => w.Notes).HasMaxLength(500);
                
                entity.HasIndex(w => w.IsDefault).HasFilter("IsDefault = 1 AND IsActive = 1");
                entity.HasIndex(w => w.IsActive);
            });

            // ProductWarehouseStock configuration
            modelBuilder.Entity<ProductWarehouseStock>(entity =>
            {
                entity.HasKey(pws => pws.Id);
                
                // Composite unique index để tránh duplicate Product-Warehouse
                entity.HasIndex(pws => new { pws.ProductId, pws.WarehouseId }).IsUnique();
                
                // Foreign key relationships
                entity.HasOne(pws => pws.Product)
                    .WithMany(p => p.WarehouseStocks)
                    .HasForeignKey(pws => pws.ProductId)
                    .OnDelete(DeleteBehavior.Cascade);
                    
                entity.HasOne(pws => pws.Warehouse)
                    .WithMany()
                    .HasForeignKey(pws => pws.WarehouseId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Blog configuration
            modelBuilder.Entity<Blog>(entity =>
            {
                entity.HasKey(b => b.Id);
                entity.HasIndex(b => b.Slug).IsUnique();
                entity.HasIndex(b => b.Status);
                entity.HasIndex(b => b.Category);
                entity.HasIndex(b => b.AuthorId);
                
                entity.Property(b => b.Title).IsRequired().HasMaxLength(200);
                entity.Property(b => b.Slug).IsRequired().HasMaxLength(500);
                entity.Property(b => b.Excerpt).HasMaxLength(1000);
                entity.Property(b => b.Content).IsRequired();
                entity.Property(b => b.FeaturedImageUrl).HasMaxLength(500);
                entity.Property(b => b.FeaturedImageAlt).HasMaxLength(100);
                entity.Property(b => b.Status).IsRequired().HasMaxLength(50).HasDefaultValue("draft");
                entity.Property(b => b.AuthorId).IsRequired();
                entity.Property(b => b.AuthorName).HasMaxLength(100);
                entity.Property(b => b.Tags).HasMaxLength(500);
                entity.Property(b => b.Category).HasMaxLength(100);
                entity.Property(b => b.MetaTitle).HasMaxLength(200);
                entity.Property(b => b.MetaDescription).HasMaxLength(500);
                entity.Property(b => b.MetaKeywords).HasMaxLength(200);
                entity.Property(b => b.ViewCount).HasDefaultValue(0);
                entity.Property(b => b.LikeCount).HasDefaultValue(0);
                entity.Property(b => b.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(b => b.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
                
                // Relationship with User (Author)
                entity.HasOne(b => b.Author)
                    .WithMany()
                    .HasForeignKey(b => b.AuthorId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // BlogLike configuration
            modelBuilder.Entity<BlogLike>(entity =>
            {
                entity.HasKey(bl => bl.Id);
                
                // Composite unique index để tránh duplicate like
                entity.HasIndex(bl => new { bl.BlogId, bl.UserId }).IsUnique();
                
                entity.Property(bl => bl.LikedAt).HasDefaultValueSql("GETUTCDATE()");
                
                // Foreign key relationships
                entity.HasOne(bl => bl.Blog)
                    .WithMany()
                    .HasForeignKey(bl => bl.BlogId)
                    .OnDelete(DeleteBehavior.Cascade);
                    
                entity.HasOne(bl => bl.User)
                    .WithMany()
                    .HasForeignKey(bl => bl.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // BlogView configuration
            modelBuilder.Entity<BlogView>(entity =>
            {
                entity.HasKey(bv => bv.Id);
                
                entity.Property(bv => bv.IpAddress).IsRequired().HasMaxLength(45);
                entity.Property(bv => bv.UserAgent).HasMaxLength(500);
                entity.Property(bv => bv.ViewedAt).HasDefaultValueSql("GETUTCDATE()");
                
                // Foreign key relationship
                entity.HasOne(bv => bv.Blog)
                    .WithMany()
                    .HasForeignKey(bv => bv.BlogId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure CustomDesign
            modelBuilder.Entity<CustomDesign>(entity =>
            {
                entity.HasKey(cd => cd.Id);
                
                entity.Property(cd => cd.ProductId).IsRequired();
                entity.Property(cd => cd.UserId).IsRequired().HasMaxLength(450);
                entity.Property(cd => cd.DesignJson).IsRequired().HasColumnType("NVARCHAR(MAX)");
                entity.Property(cd => cd.PreviewUrl).HasMaxLength(500);
                entity.Property(cd => cd.ThumbnailUrl).HasMaxLength(500);
                entity.Property(cd => cd.Status).IsRequired().HasMaxLength(20);
                entity.Property(cd => cd.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(cd => cd.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
                
                // Index for performance
                entity.HasIndex(cd => cd.ProductId);
                entity.HasIndex(cd => cd.UserId);
                entity.HasIndex(cd => cd.Status);
                entity.HasIndex(cd => cd.CreatedAt);
                
                // Foreign key relationship
                entity.HasOne<Product>()
                    .WithMany()
                    .HasForeignKey(cd => cd.ProductId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure ConsultationRequest
            modelBuilder.Entity<ConsultationRequest>(entity =>
            {
                entity.HasKey(cr => cr.Id);
                
                entity.Property(cr => cr.ProductId).IsRequired();
                entity.Property(cr => cr.CustomerName).IsRequired().HasMaxLength(100);
                entity.Property(cr => cr.PreferredContact).IsRequired().HasMaxLength(20);
                entity.Property(cr => cr.Phone).HasMaxLength(20);
                entity.Property(cr => cr.Zalo).HasMaxLength(100);
                entity.Property(cr => cr.Facebook).HasMaxLength(200);
                entity.Property(cr => cr.Email).HasMaxLength(100);
                entity.Property(cr => cr.Notes).HasMaxLength(1000);
                entity.Property(cr => cr.ProductName).HasMaxLength(200);
                entity.Property(cr => cr.DesignPreview).HasMaxLength(500);
                entity.Property(cr => cr.EstimatedPrice).HasPrecision(18, 2);
                entity.Property(cr => cr.Status).IsRequired().HasMaxLength(50);
                entity.Property(cr => cr.AssignedTo).HasMaxLength(100);
                entity.Property(cr => cr.RequestedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(cr => cr.ContactedAt);
                entity.Property(cr => cr.CompletedAt);
                
                // Index for performance
                entity.HasIndex(cr => cr.DesignId);
                entity.HasIndex(cr => cr.ProductId);
                entity.HasIndex(cr => cr.Status);
                entity.HasIndex(cr => cr.Email);
                entity.HasIndex(cr => cr.RequestedAt);
                
                // Foreign key relationships
                entity.HasOne(cr => cr.Design)
                    .WithMany()
                    .HasForeignKey(cr => cr.DesignId)
                    .OnDelete(DeleteBehavior.SetNull);
                    
                entity.HasOne<Product>()
                    .WithMany()
                    .HasForeignKey(cr => cr.ProductId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }
    }
}
