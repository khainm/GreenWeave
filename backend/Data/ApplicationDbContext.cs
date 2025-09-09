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
        public DbSet<Category> Categories { get; set; }
        public DbSet<Cart> Carts { get; set; }
        public DbSet<CartItem> CartItems { get; set; }
        public DbSet<CustomBaseProduct> CustomBaseProducts { get; set; }
        public DbSet<CustomBaseAngle> CustomBaseAngles { get; set; }
        public DbSet<CustomBaseLayer> CustomBaseLayers { get; set; }
        public DbSet<CustomOptionGroup> CustomOptionGroups { get; set; }
        public DbSet<CustomOption> CustomOptions { get; set; }
        public DbSet<CustomDesign> CustomDesigns { get; set; }

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
                entity.Property(c => c.IsVisible).HasDefaultValue(true);
                entity.Property(c => c.IsCustomizable).HasDefaultValue(false);
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
                entity.HasIndex(ci => ci.CartId);
                entity.Property(ci => ci.UnitPrice).HasColumnType("decimal(18,2)");
                entity.Property(ci => ci.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.HasOne(ci => ci.Cart)
                    .WithMany(c => c.Items)
                    .HasForeignKey(ci => ci.CartId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Customizable base product mappings
            modelBuilder.Entity<CustomBaseProduct>(entity =>
            {
                entity.HasKey(p => p.Id);
                entity.Property(p => p.Name).IsRequired().HasMaxLength(200);
                entity.Property(p => p.BasePrice).HasColumnType("decimal(18,2)");
                entity.Property(p => p.Status).HasMaxLength(20).HasDefaultValue("active");
                entity.HasOne(p => p.Category)
                    .WithMany()
                    .HasForeignKey(p => p.CategoryId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<CustomBaseAngle>(entity =>
            {
                entity.HasKey(a => a.Id);
                entity.HasIndex(a => new { a.CustomBaseProductId, a.SortOrder });
                entity.Property(a => a.AngleKey).IsRequired().HasMaxLength(50);
                entity.HasOne(a => a.Product)
                    .WithMany(p => p.Angles)
                    .HasForeignKey(a => a.CustomBaseProductId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<CustomBaseLayer>(entity =>
            {
                entity.HasKey(l => l.Id);
                entity.HasIndex(l => new { l.CustomBaseAngleId, l.ZIndex });
                entity.Property(l => l.LayerType).IsRequired().HasMaxLength(50);
                entity.HasOne(l => l.Angle)
                    .WithMany(a => a.Layers)
                    .HasForeignKey(l => l.CustomBaseAngleId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<CustomOptionGroup>(entity =>
            {
                entity.HasKey(g => g.Id);
                entity.HasIndex(g => g.CustomBaseProductId);
                entity.Property(g => g.Name).IsRequired().HasMaxLength(100);
                entity.HasOne(g => g.Product)
                    .WithMany(p => p.OptionGroups)
                    .HasForeignKey(g => g.CustomBaseProductId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<CustomOption>(entity =>
            {
                entity.HasKey(o => o.Id);
                entity.HasIndex(o => o.CustomOptionGroupId);
                entity.Property(o => o.Code).IsRequired().HasMaxLength(50);
                entity.Property(o => o.DisplayName).IsRequired().HasMaxLength(100);
                entity.Property(o => o.ExtraPrice).HasColumnType("decimal(18,2)");
                entity.HasOne(o => o.Group)
                    .WithMany(g => g.Options)
                    .HasForeignKey(o => o.CustomOptionGroupId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<CustomDesign>(entity =>
            {
                entity.HasKey(d => d.Id);
                entity.Property(d => d.SnapshotPrice).HasColumnType("decimal(18,2)");
                entity.Property(d => d.PayloadJson).IsRequired();
                entity.HasOne(d => d.BaseProduct)
                    .WithMany()
                    .HasForeignKey(d => d.CustomBaseProductId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}
