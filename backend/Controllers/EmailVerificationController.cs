using backend.DTOs;
using backend.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EmailVerificationController : ControllerBase
    {
        private readonly IEmailVerificationService _emailVerificationService;
        private readonly ILogger<EmailVerificationController> _logger;

        public EmailVerificationController(
            IEmailVerificationService emailVerificationService,
            ILogger<EmailVerificationController> logger)
        {
            _emailVerificationService = emailVerificationService;
            _logger = logger;
        }

        /// <summary>
        /// Gửi email xác thực
        /// </summary>
        [HttpPost("send-verification")]
        public async Task<ActionResult<EmailVerificationResponse>> SendVerificationEmail([FromBody] SendVerificationEmailDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new EmailVerificationResponse
                {
                    Success = false,
                    Message = "Dữ liệu không hợp lệ",
                    Errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage)).ToList()
                });
            }

            var result = await _emailVerificationService.SendVerificationEmailAsync(dto.Email);
            
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Xác thực email
        /// </summary>
        [HttpPost("verify")]
        public async Task<ActionResult<EmailVerificationResponse>> VerifyEmail([FromBody] VerifyEmailDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new EmailVerificationResponse
                {
                    Success = false,
                    Message = "Dữ liệu không hợp lệ",
                    Errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage)).ToList()
                });
            }

            var result = await _emailVerificationService.VerifyEmailAsync(dto.Token, dto.UserId);
            
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Gửi lại email xác thực
        /// </summary>
        [HttpPost("resend-verification")]
        public async Task<ActionResult<EmailVerificationResponse>> ResendVerificationEmail([FromBody] ResendVerificationEmailDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new EmailVerificationResponse
                {
                    Success = false,
                    Message = "Dữ liệu không hợp lệ",
                    Errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage)).ToList()
                });
            }

            var result = await _emailVerificationService.ResendVerificationEmailAsync(dto.Email);
            
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Kiểm tra token có hợp lệ không
        /// </summary>
        [HttpGet("check-token")]
        public async Task<ActionResult<bool>> CheckToken([FromQuery] string token, [FromQuery] string userId)
        {
            if (string.IsNullOrEmpty(token) || string.IsNullOrEmpty(userId))
            {
                return BadRequest(false);
            }

            var isValid = await _emailVerificationService.IsTokenValidAsync(token, userId);
            return Ok(isValid);
        }
    }
}
