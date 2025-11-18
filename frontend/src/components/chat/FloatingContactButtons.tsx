import React, { useEffect, useState } from "react";
import { MessageCircle, Phone, X } from "lucide-react";

const FloatingContactButtons: React.FC = () => {
  const [open, setOpen] = useState(false);
  const pageId = "521194264420185";
  const phoneNumber = "0359994361";

  // Khởi tạo Facebook SDK
  useEffect(() => {
    if (document.getElementById("facebook-jssdk")) return;

    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.src = "https://connect.facebook.net/vi_VN/sdk/xfbml.customerchat.js";
    document.body.appendChild(script);

    (window as any).fbAsyncInit = function () {
      (window as any).FB.init({
        xfbml: true,
        version: "v19.0",
      });
    };

    if (!document.getElementById("fb-customer-chat")) {
      const chatDiv = document.createElement("div");
      chatDiv.id = "fb-customer-chat";
      chatDiv.className = "fb-customerchat";
      chatDiv.setAttribute("page_id", pageId);
      chatDiv.setAttribute("attribution", "biz_inbox");
      document.body.appendChild(chatDiv);
    }
  }, [pageId]);

  const buttonBaseStyle: React.CSSProperties = {
    border: "none",
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    fontSize: "20px",
    fontWeight: "600",
  };

  return (
    <>
      <div id="fb-root"></div>

      {/* Container chính */}
      <div
        style={{
          position: "fixed",
          bottom: "28px",
          right: "28px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          zIndex: 9999,
          gap: "12px",
        }}
      >
        {/* Các nút con với label */}
        {open && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: "14px",
              animation: "slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {/* Nút Messenger */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                animation: "fadeIn 0.4s ease-out 0.1s both",
              }}
            >
              <span
                style={{
                  backgroundColor: "white",
                  color: "#333",
                  padding: "8px 16px",
                  borderRadius: "20px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  fontSize: "14px",
                  fontWeight: "500",
                  whiteSpace: "nowrap",
                }}
              >
                Chat với chúng tôi
              </span>
              <button
                onClick={() =>
                  window.open(`https://m.me/${pageId}`, "_blank", "noopener")
                }
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.1)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(0, 132, 255, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
                }}
                style={{
                  ...buttonBaseStyle,
                  backgroundColor: "#0084FF",
                  color: "white",
                  width: "56px",
                  height: "56px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                }}
                title="Chat qua Messenger"
              >
                <MessageCircle size={24} />
              </button>
            </div>

            {/* Nút gọi điện */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                animation: "fadeIn 0.4s ease-out 0.2s both",
              }}
            >
              <span
                style={{
                  backgroundColor: "white",
                  color: "#333",
                  padding: "8px 16px",
                  borderRadius: "20px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  fontSize: "14px",
                  fontWeight: "500",
                  whiteSpace: "nowrap",
                }}
              >
                Gọi ngay: {phoneNumber}
              </span>
              <button
                onClick={() => (window.location.href = `tel:${phoneNumber}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.1)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(76, 175, 80, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
                }}
                style={{
                  ...buttonBaseStyle,
                  backgroundColor: "#4CAF50",
                  color: "white",
                  width: "56px",
                  height: "56px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                }}
                title="Gọi ngay"
              >
                <Phone size={24} />
              </button>
            </div>
          </div>
        )}

        {/* Nút chính */}
        <button
          onClick={() => setOpen(!open)}
          onMouseEnter={(e) => {
            if (!open) {
              e.currentTarget.style.transform = "scale(1.08)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(34, 139, 34, 0.4)";
            }
          }}
          onMouseLeave={(e) => {
            if (!open) {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.3)";
            }
          }}
          style={{
            ...buttonBaseStyle,
            background: open 
              ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              : "linear-gradient(135deg, #228B22 0%, #32CD32 100%)",
            color: "white",
            width: "64px",
            height: "64px",
            boxShadow: "0 6px 16px rgba(0,0,0,0.3)",
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
          }}
          title={open ? "Đóng" : "Liên hệ với chúng tôi"}
          aria-label={open ? "Đóng menu liên hệ" : "Mở menu liên hệ"}
        >
          {open ? <X size={28} /> : <MessageCircle size={28} />}
        </button>
      </div>

      {/* CSS Animations */}
      <style>
        {`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateX(10px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          /* Responsive */
          @media (max-width: 768px) {
            [style*="bottom: 28px"] {
              bottom: 20px !important;
              right: 20px !important;
            }
          }
        `}
      </style>
    </>
  );
};

export default FloatingContactButtons;
