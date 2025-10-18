// using Microsoft.AspNetCore.Mvc;
// using backend.Tests;

// namespace backend.Controllers
// {
//     [ApiController]
//     [Route("api/test")]
//     public class TestController : ControllerBase
//     {
//         [HttpGet("pdf")]
//         public async Task<IActionResult> TestPdf()
//         {
//             try
//             {
//                 var success = await PdfTestRunner.TestPdfGeneration();
                
//                 if (success)
//                 {
//                     return Ok(new { 
//                         message = "✅ PDF Test PASSED! File được tạo đúng format và có thể mở được.",
//                         success = true 
//                     });
//                 }
//                 else
//                 {
//                     return BadRequest(new { 
//                         message = "❌ PDF Test FAILED! Có lỗi trong quá trình tạo PDF.",
//                         success = false 
//                     });
//                 }
//             }
//             catch (Exception ex)
//             {
//                 return StatusCode(500, new { 
//                     message = $"❌ Test Error: {ex.Message}",
//                     success = false 
//                 });
//             }
//         }
//     }
// }