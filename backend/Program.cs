using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.DataProtection;
using System.Text;
using backend.Data;
using backend.Models;
using backend.Services;
using backend.Interfaces.Services;
using backend.Interfaces.Repositories;
using backend.Repositories;
using backend.Swagger;
using backend.Extensions;
using backend.DTOs;
using Net.payOS;
using DinkToPdf;
using DinkToPdf.Contracts;
using backend.Controllers;



var builder = WebApplication.CreateBuilder(args);

// Load .env file early so Environment.GetEnvironmentVariable can pick up values during startup
builder.Configuration.AddDotEnvFile(".env");

// Override PayOS settings from environment variables (or .env)

var payosClientId = Environment.GetEnvironmentVariable("PAYOS_CLIENT_ID");
var payosApiKey = Environment.GetEnvironmentVariable("PAYOS_API_KEY");
var payosChecksumKey = Environment.GetEnvironmentVariable("PAYOS_CHECKSUM_KEY");



if (!string.IsNullOrEmpty(payosClientId))
{
    builder.Configuration["PayOS:ClientId"] = payosClientId;
}
if (!string.IsNullOrEmpty(payosApiKey))
{
    builder.Configuration["PayOS:ApiKey"] = payosApiKey;
}
if (!string.IsNullOrEmpty(payosChecksumKey))
{
    builder.Configuration["PayOS:ChecksumKey"] = payosChecksumKey;
}


// Configure URLs for production (bind to all interfaces)
if (!builder.Environment.IsDevelopment())
{
    builder.WebHost.UseUrls("http://0.0.0.0:5000");
}



// Đăng ký PayOS SDK chính thức
builder.Services.AddSingleton(sp => new PayOS(
    builder.Configuration["PayOS:ClientId"]!,
    builder.Configuration["PayOS:ApiKey"]!,
    builder.Configuration["PayOS:ChecksumKey"]!
));
// Đăng ký PayOSService sử dụng SDK chính thức
builder.Services.AddScoped<PayOSService>();

var dbConnectionString = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING");
if (!string.IsNullOrEmpty(dbConnectionString))
{
    builder.Configuration["ConnectionStrings:DefaultConnection"] = dbConnectionString;
}

// Override other sensitive settings from environment variables
var jwtSecretKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY");
var jwtSecretKeyDev = Environment.GetEnvironmentVariable("JWT_SECRET_KEY_DEV");
var isDevelopment = builder.Environment.IsDevelopment();

if (isDevelopment && !string.IsNullOrEmpty(jwtSecretKeyDev))
{
    builder.Configuration["JwtSettings:SecretKey"] = jwtSecretKeyDev;
}
else if (!string.IsNullOrEmpty(jwtSecretKey))
{
    builder.Configuration["JwtSettings:SecretKey"] = jwtSecretKey;
}

var cloudinaryCloudName = Environment.GetEnvironmentVariable("CLOUDINARY_CLOUD_NAME");
var cloudinaryApiKey = Environment.GetEnvironmentVariable("CLOUDINARY_API_KEY");
var cloudinaryApiSecret = Environment.GetEnvironmentVariable("CLOUDINARY_API_SECRET");
if (!string.IsNullOrEmpty(cloudinaryCloudName))
{
    builder.Configuration["Cloudinary:CloudName"] = cloudinaryCloudName;
    builder.Configuration["Cloudinary:ApiKey"] = cloudinaryApiKey;
    builder.Configuration["Cloudinary:ApiSecret"] = cloudinaryApiSecret;
}

var sendGridApiKey = Environment.GetEnvironmentVariable("SENDGRID_API_KEY");
if (!string.IsNullOrEmpty(sendGridApiKey))
{
    builder.Configuration["SendGrid:ApiKey"] = sendGridApiKey;
}

var viettelPostToken = Environment.GetEnvironmentVariable("VIETTELPOST_TOKEN");
var viettelPostPrintToken = Environment.GetEnvironmentVariable("VIETTELPOST_PRINT_TOKEN");
var viettelPostWebhookSecret = Environment.GetEnvironmentVariable("VIETTELPOST_WEBHOOK_SECRET");
if (!string.IsNullOrEmpty(viettelPostToken))
{
    builder.Configuration["Shipping:ViettelPost:Token"] = viettelPostToken;
    builder.Configuration["Shipping:ViettelPost:PrintToken"] = viettelPostPrintToken;
}
// ✅ FIX: Always set WebhookSecret if available (independent of Token)
if (!string.IsNullOrEmpty(viettelPostWebhookSecret))
{
    builder.Configuration["Shipping:ViettelPost:WebhookSecret"] = viettelPostWebhookSecret;
}

// Debug: Check connection string
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
Console.WriteLine($"🔗 Connection String: {(string.IsNullOrEmpty(connectionString) ? "NULL/EMPTY" : "[LOADED]")}");
if (!string.IsNullOrEmpty(connectionString))
{
    Console.WriteLine($"📏 Length: {connectionString.Length} characters");
    Console.WriteLine($"🔍 Contains 'Server=': {connectionString.Contains("Server=")}");
    Console.WriteLine($"🔍 Contains 'Database=': {connectionString.Contains("Database=")}");
    // Show first 50 characters to debug without exposing password
    Console.WriteLine($"🔍 Preview: {connectionString.Substring(0, Math.Min(50, connectionString.Length))}...");
}
Console.WriteLine($"📧 SendGrid API Key: {(string.IsNullOrEmpty(builder.Configuration["SendGrid:ApiKey"]) ? "NULL/EMPTY" : "[LOADED]")}");
Console.WriteLine($"🔐 ViettelPost WebhookSecret: {(string.IsNullOrEmpty(builder.Configuration["Shipping:ViettelPost:WebhookSecret"]) ? "NULL/EMPTY" : "[LOADED]")}");


// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Configure enum serialization to use string values
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
        // Configure property naming policy to match frontend (camelCase)
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// Add Swagger/OpenAPI services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "GreenWeave API",
        Version = "v1",
        Description = "API để quản lý sản phẩm GreenWeave - Hệ thống túi thân thiện môi trường",
        Contact = new Microsoft.OpenApi.Models.OpenApiContact
        {
            Name = "GreenWeave Team",
            Email = "support@greenweave.com"
        }
    });

    // Add servers for different environments
    c.AddServer(new Microsoft.OpenApi.Models.OpenApiServer
    {
        Url = "https://api.greenweave.vn",
        Description = "Production API Server (AWS Elastic Beanstalk HTTPS)"
    });
    c.AddServer(new Microsoft.OpenApi.Models.OpenApiServer
    {
        Url = "http://api.greenweave.vn",
        Description = "AWS Elastic Beanstalk HTTP Server"
    });
    c.AddServer(new Microsoft.OpenApi.Models.OpenApiServer
    {
        Url = "https://localhost:5001",
        Description = "Local Development HTTPS"
    });
    c.AddServer(new Microsoft.OpenApi.Models.OpenApiServer
    {
        Url = "http://localhost:5000",
        Description = "Local Development HTTP"
    });

    // Add JWT Bearer Authentication to Swagger
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token in the text input below.\nExample: 'Bearer 12345abcdef'",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
    
    // Enable XML comments for better Swagger documentation
    // Temporarily disabled to debug Swagger 500 error
    // var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    // var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    // if (File.Exists(xmlPath))
    // {
    //     c.IncludeXmlComments(xmlPath);
    // }
    
    // Configure file upload support
    c.MapType<IFormFile>(() => new Microsoft.OpenApi.Models.OpenApiSchema
    {
        Type = "string",
        Format = "binary"
    });
    
    // Handle form data and file uploads
    c.OperationFilter<FileUploadOperationFilter>();
});

// Add Entity Framework
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Bind Order settings
builder.Services.Configure<OrderSettings>(builder.Configuration.GetSection("Order"));

// Add Identity
builder.Services.AddIdentity<User, IdentityRole>(options =>
{
    // Password settings
    options.Password.RequiredLength = 6;
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = false;
    options.Password.RequireNonAlphanumeric = false;
    
    // Lockout settings
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;
    
    // User settings
    options.User.AllowedUserNameCharacters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._@+";
    options.User.RequireUniqueEmail = true;
    
    // Sign in settings
    options.SignIn.RequireConfirmedEmail = true;
    options.SignIn.RequireConfirmedPhoneNumber = false;
    
    // Token settings - tăng thời gian sống của tokens
    options.Tokens.EmailConfirmationTokenProvider = TokenOptions.DefaultEmailProvider;
    options.Tokens.PasswordResetTokenProvider = TokenOptions.DefaultEmailProvider;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// Configure Data Protection for consistent token generation
builder.Services.AddDataProtection()
    .SetApplicationName("GreenWeave");

// Configure token lifespan for email confirmation and password reset
builder.Services.Configure<DataProtectionTokenProviderOptions>(options =>
{
    // Tăng thời gian sống của tokens lên 24 giờ
    options.TokenLifespan = TimeSpan.FromHours(24);
});

// Add JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] ?? throw new ArgumentNullException("JwtSettings:SecretKey");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ClockSkew = TimeSpan.Zero
    };
});

// Add Product services
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<ICustomProductRepository, CustomProductRepository>();
builder.Services.AddScoped<ICustomProductService, CustomProductService>();
builder.Services.AddScoped<ICloudinaryService, CloudinaryService>();
//builder.Services.AddScoped<IGeminiPreviewService, GeminiPreviewService>();
//builder.Services.AddHttpClient<GeminiPreviewService>(); // For HTTP calls to Gemini API
builder.Services.AddHttpClient<AiEditController>();





builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<ICartRepository, CartRepository>();
builder.Services.AddScoped<ICartService, CartService>();

// Add Custom Design services
builder.Services.AddScoped<ICustomDesignService, CustomDesignService>();
builder.Services.AddScoped<IConsultationRequestService, ConsultationRequestService>();

// Add Authentication services
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<ICustomerCodeService, CustomerCodeService>();
builder.Services.AddScoped<IAuthService, AuthService>();

// Add Current User service
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

// Add UserAddress services
builder.Services.AddScoped<IUserAddressRepository, UserAddressRepository>();
builder.Services.AddScoped<IUserAddressService, UserAddressService>();

// Add Order services
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<IOrderService, OrderService>();

// Add Invoice services
builder.Services.AddScoped<IInvoiceRepository, InvoiceRepository>();
builder.Services.AddScoped<IInvoiceService, InvoiceService>();
builder.Services.AddScoped<IPdfService, PdfService>();

// Add DinkToPdf
var context = new backend.CustomAssemblyLoadContext();
context.LoadUnmanagedLibrary(Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/lib", "libwkhtmltox.dylib"));
builder.Services.AddSingleton(typeof(IConverter), new SynchronizedConverter(new PdfTools()));
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IViettelPostPrintService, ViettelPostPrintService>();
builder.Services.AddScoped<IViettelPostAuthService, ViettelPostAuthService>();

// Add ViettelPost background token refresh service
builder.Services.AddHostedService<ViettelPostTokenRefreshService>();

// Add Shipping configuration
builder.Services.Configure<ShippingConfiguration>(
    builder.Configuration.GetSection(ShippingConfiguration.SectionName));

// Add HttpClient for shipping providers
builder.Services.AddHttpClient<ViettelPostShippingProvider>();
builder.Services.AddHttpClient<ViettelPostAddressService>();

// Add Shipping repositories
builder.Services.AddScoped<IShippingRequestRepository, ShippingRequestRepository>();
builder.Services.AddScoped<IShippingTransactionRepository, ShippingTransactionRepository>();

// Add Shipping providers
builder.Services.AddScoped<ViettelPostShippingProvider>();
builder.Services.AddScoped<IShippingProvider>(sp => sp.GetRequiredService<ViettelPostShippingProvider>());

// Add Viettel Post Address service
builder.Services.AddScoped<IViettelPostAddressService, ViettelPostAddressService>();
// Future providers can be added here:
// builder.Services.AddScoped<IShippingProvider, GHNShippingProvider>();
// builder.Services.AddScoped<IShippingProvider, GHTKShippingProvider>();

// Register collection of shipping providers for ShippingService
builder.Services.AddScoped<IEnumerable<IShippingProvider>>(serviceProvider =>
{
    return new List<IShippingProvider>
    {
        serviceProvider.GetRequiredService<ViettelPostShippingProvider>()
        // Add more providers here when implemented
    };
});

// Add Shipping service
builder.Services.AddScoped<IShippingService, ShippingService>();

// Add WebhookLog services
builder.Services.AddScoped<IWebhookLogRepository, WebhookLogRepository>();
builder.Services.AddScoped<IWebhookLogService, WebhookLogService>();

// Add Email Verification services
builder.Services.AddScoped<IEmailVerificationService, EmailVerificationService>();
builder.Services.AddScoped<IPasswordResetService, PasswordResetService>();

// Add Warehouse services
builder.Services.AddScoped<IWarehouseRepository, WarehouseRepository>();
builder.Services.AddScoped<IProductWarehouseStockRepository, ProductWarehouseStockRepository>();
builder.Services.AddScoped<IWarehouseService, WarehouseService>();
    builder.Services.AddScoped<IWarehouseSelectionService, WarehouseSelectionService>();
    // builder.Services.AddScoped<IWarehouseSelectionService, WarehouseSelectionService>(); // Đã loại bỏ service cũ

// Add Blog services
builder.Services.AddScoped<IBlogRepository, BlogRepository>();
builder.Services.AddScoped<IBlogService, BlogService>();

// Add Dashboard services
builder.Services.AddScoped<IDashboardService, DashboardService>();

// Add CORS for React frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigins",
        policyBuilder =>
        {
            if (builder.Environment.IsDevelopment())
            {
                // Development: Allow localhost origins
                policyBuilder.WithOrigins(
                    "http://localhost:5173",  // Vite dev server
                    "http://localhost:3000",  // Alternative React port
                    "https://localhost:5173",
                     "https://localhost:5174",// HTTPS variant
                    "https://localhost:3000"  // HTTPS variant
                )
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
            }
            else
            {
                // Production: Only allow production domain
                policyBuilder.WithOrigins(
                    "https://greenweave.vn",
                    "https://www.greenweave.vn",
                    "http://greenweave.vn",
                    "http://www.greenweave.vn"
                )
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
            }
        });
});

// Add logging
builder.Services.AddLogging();
// Register SignalR
builder.Services.AddSignalR();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    // Enable Swagger in development environment
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "GreenWeave API v1");
        c.RoutePrefix = string.Empty; // Swagger UI at root path (/)
        c.DocExpansion(Swashbuckle.AspNetCore.SwaggerUI.DocExpansion.List);
        c.EnableDeepLinking();
        c.DisplayOperationId();
        c.EnableFilter();
        c.ShowCommonExtensions();
    });
}
else
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

// Force HTTPS redirection in production
// Disabled for Elastic Beanstalk as load balancer handles HTTPS
// if (!app.Environment.IsDevelopment())
// {
//     app.UseHttpsRedirection();
// }

// Configure forwarded headers for load balancer
app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedFor | 
                      Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedProto
});

app.UseRouting();

// Apply CORS after routing and before auth per ASP.NET Core guidance
app.UseCors("AllowSpecificOrigins");

// Add Authentication & Authorization middleware
app.UseAuthentication();
app.UseAuthorization();

// Add custom JWT middleware
app.UseMiddleware<backend.Middleware.JwtTokenValidationMiddleware>();
app.UseMiddleware<backend.Middleware.JwtAuthenticationMiddleware>();

// Add health check endpoint for load balancer
app.MapGet("/health", () => Results.Ok(new { 
    status = "healthy", 
    timestamp = DateTime.UtcNow 
}));

// Add simple root endpoint for production
app.MapGet("/", () => Results.Ok(new { 
    message = "GreenWeave API is running", 
    version = "1.0.0",
    endpoints = new[] { "/health", "/api", "/swagger" },
    timestamp = DateTime.UtcNow 
}));

// Only map API controllers, remove Razor Pages
app.MapControllers();

// Seed data
await DataSeeder.SeedDataAsync(app.Services);

// Map SignalR hubs
app.MapHub<backend.Hubs.StockHub>("/hubs/stock");


// Ensure all required PayOS configurations are present
var missingConfigurations = new List<string>();
if (string.IsNullOrEmpty(payosClientId)) missingConfigurations.Add("PAYOS_CLIENT_ID");
if (string.IsNullOrEmpty(payosApiKey)) missingConfigurations.Add("PAYOS_API_KEY");
if (string.IsNullOrEmpty(payosChecksumKey)) missingConfigurations.Add("PAYOS_CHECKSUM_KEY");


if (missingConfigurations.Any())
{
    throw new InvalidOperationException($"Missing required PayOS configurations: {string.Join(", ", missingConfigurations)}");
}

app.Run();


