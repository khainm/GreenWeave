using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    /// <summary>
    /// Health check controller để kiểm tra trạng thái API
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class HealthController : ControllerBase
    {
        /// <summary>
        /// Kiểm tra trạng thái hoạt động của API
        /// </summary>
        /// <returns>Thông tin trạng thái API</returns>
        /// <response code="200">API đang hoạt động bình thường</response>
        [HttpGet]
        [ProducesResponseType(typeof(object), 200)]
        public IActionResult Get()
        {
            return Ok(new
            {
                status = "healthy",
                message = "GreenWeave API đang hoạt động bình thường",
                timestamp = DateTime.UtcNow,
                version = "1.0.0"
            });
        }

        /// <summary>
        /// Endpoint ping đơn giản
        /// </summary>
        /// <returns>Pong response</returns>
        /// <response code="200">Ping thành công</response>
        [HttpGet("ping")]
        [ProducesResponseType(typeof(string), 200)]
        public IActionResult Ping()
        {
            return Ok("pong");
        }
    }
}
