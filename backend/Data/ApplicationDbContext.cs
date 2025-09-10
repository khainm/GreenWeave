using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Data
{
    public class ApplicationDbContext : DbContext
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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
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
                entity.Property(c => c.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(c => c.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
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
        }
    }
}
