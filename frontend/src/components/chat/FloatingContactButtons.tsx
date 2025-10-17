import React, { useEffect, useState } from "react";

const FloatingContactButtons: React.FC = () => {
  const [open, setOpen] = useState(false);
  const pageId = "521194264420185"; // 👈 thay bằng Page ID của bạn
  const phoneNumber = "0359994361"; // 👈 thay bằng số điện thoại thật

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

  return (
    <>
      <div id="fb-root"></div>

      {/* Nút chính + dropdown */}
      <div
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          zIndex: 9999,
        }}
      >
        {/* Các nút con */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "10px",
            marginBottom: open ? "10px" : "0",
            opacity: open ? 1 : 0,
            transform: open ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.3s ease",
            pointerEvents: open ? "auto" : "none",
          }}
        >
          {/* Nút chat Messenger */}
          <button
            onClick={() =>
              window.open(`https://m.me/${pageId}`, "_blank", "noopener")
            }
            style={{
              backgroundColor: "#0084FF",
              color: "white",
              border: "none",
              borderRadius: "50%",
              padding: "14px",
              width: "52px",
              height: "52px",
              cursor: "pointer",
              boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
              transition: "transform 0.2s",
            }}
            title="Chat qua Messenger"
          >
            💬
          </button>

          {/* Nút gọi điện */}
          <button
            onClick={() => (window.location.href = `tel:${phoneNumber}`)}
            style={{
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "50%",
              padding: "14px",
              width: "52px",
              height: "52px",
              cursor: "pointer",
              boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
              transition: "transform 0.2s",
            }}
            title="Gọi ngay"
          >
            📞
          </button>
        </div>

        {/* Nút chính */}
        <button
          onClick={() => setOpen(!open)}
          style={{
            backgroundColor: "#0084FF",
            color: "white",
            border: "none",
            borderRadius: "50%",
            padding: "16px",
            width: "58px",
            height: "58px",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            transition: "transform 0.3s ease, background-color 0.2s ease",
            transform: open ? "rotate(45deg)" : "rotate(0deg)",
          }}
          title="Liên hệ"
        >
          💬
        </button>
      </div>
    </>
  );
};

export default FloatingContactButtons;
