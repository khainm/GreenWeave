// using backend.Services;
// using backend.Models;
// using Microsoft.Extensions.Logging;
// using Microsoft.AspNetCore.Hosting;
// using DinkToPdf;
// using DinkToPdf.Contracts;

// namespace backend.Tests
// {
//     public class PdfTestRunner
//     {
//         public static async Task<bool> TestPdfGeneration()
//         {
//             try
//             {
//                 // Create mock dependencies
//                 var logger = LoggerFactory.Create(builder => builder.AddConsole())
//                     .CreateLogger<PdfService>();
                
//                 var environment = new MockWebHostEnvironment();
                
//                 // Setup DinkToPdf converter
//                 var context = new backend.CustomAssemblyLoadContext();
//                 context.LoadUnmanagedLibrary(Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/lib", "libwkhtmltox.dylib"));
//                 var converter = new SynchronizedConverter(new PdfTools());

//                 var pdfService = new PdfService(logger, environment, converter);

//                 // Create test order and invoice
//                 var testOrder = CreateTestOrder();
//                 var testInvoice = CreateTestInvoice();

//                 Console.WriteLine("🔧 Testing PDF generation...");

//                 // Generate PDF
//                 var pdfBytes = await pdfService.GenerateInvoicePdfAsync(testOrder, testInvoice);

//                 // Verify PDF was generated
//                 if (pdfBytes == null || pdfBytes.Length == 0)
//                 {
//                     Console.WriteLine("❌ PDF generation failed - empty result");
//                     return false;
//                 }

//                 // Check if it's actually PDF (should start with %PDF)
//                 var pdfHeader = System.Text.Encoding.ASCII.GetString(pdfBytes.Take(4).ToArray());
//                 if (pdfHeader != "%PDF")
//                 {
//                     Console.WriteLine($"❌ Generated file is not a valid PDF. Header: {pdfHeader}");
//                     return false;
//                 }

//                 // Save test file
//                 var testFilePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "test_invoice.pdf");
//                 await File.WriteAllBytesAsync(testFilePath, pdfBytes);

//                 Console.WriteLine($"✅ PDF generated successfully!");
//                 Console.WriteLine($"📄 File size: {pdfBytes.Length:N0} bytes");
//                 Console.WriteLine($"📍 Test file saved: {testFilePath}");
//                 Console.WriteLine($"🔍 PDF header: {pdfHeader}");

//                 return true;
//             }
//             catch (Exception ex)
//             {
//                 Console.WriteLine($"❌ PDF test failed: {ex.Message}");
//                 Console.WriteLine($"Stack trace: {ex.StackTrace}");
//                 return false;
//             }
//         }

//         private static Order CreateTestOrder()
//         {
//             return new Order
//             {
//                 Id = 1,
//                 OrderNumber = "GW-TEST-001",
//                 Customer = new User
//                 {
//                     FullName = "Nguyễn Văn Test",
//                     Email = "test@greenweave.com",
//                     PhoneNumber = "0901234567"
//                 },
//                 ShippingAddress = new UserAddress
//                 {
//                     AddressLine = "123 Test Street",
//                     Ward = "Phường Test",
//                     District = "Quận Test", 
//                     Province = "TP. Test"
//                 },
//                 Items = new List<OrderItem>
//                 {
//                     new OrderItem
//                     {
//                         ProductName = "Áo Polo Eco-Friendly",
//                         ProductSku = "POLO-ECO-001",
//                         Quantity = 2,
//                         UnitPrice = 299000,
//                         TotalPrice = 598000
//                     },
//                     new OrderItem
//                     {
//                         ProductName = "Quần Jean Organic",
//                         ProductSku = "JEAN-ORG-002", 
//                         Quantity = 1,
//                         UnitPrice = 450000,
//                         TotalPrice = 450000
//                     }
//                 },
//                 CreatedAt = DateTime.Now
//             };
//         }

//         private static Invoice CreateTestInvoice()
//         {
//             return new Invoice
//             {
//                 Id = 1,
//                 InvoiceNumber = "INV-TEST-001",
//                 CustomerName = "Nguyễn Văn Test",
//                 CustomerEmail = "test@greenweave.com",
//                 CustomerPhone = "0901234567",
//                 Subtotal = 1048000,
//                 ShippingFee = 30000,
//                 Discount = 0,
//                 Total = 1078000,
//                 CreatedAt = DateTime.Now
//             };
//         }
//     }

//     public class MockWebHostEnvironment : IWebHostEnvironment
//     {
//         public string WebRootPath { get; set; } = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
//         public string ContentRootPath { get; set; } = Directory.GetCurrentDirectory();
//         public string EnvironmentName { get; set; } = "Test";
//         public string ApplicationName { get; set; } = "TestApp";
//         public Microsoft.Extensions.FileProviders.IFileProvider WebRootFileProvider { get; set; } = null!;
//         public Microsoft.Extensions.FileProviders.IFileProvider ContentRootFileProvider { get; set; } = null!;
//     }
// }