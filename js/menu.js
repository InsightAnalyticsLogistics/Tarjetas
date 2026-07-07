const topUserName = document.getElementById("topUserName");
const topUserRole = document.getElementById("topUserRole");
const topUserPhoto = document.getElementById("topUserPhoto");
const logoutBtn = document.getElementById("logoutBtn");

const cardAnomalias = document.getElementById("cardAnomalias");
const cardSugerencias = document.getElementById("cardSugerencias");

document.addEventListener("DOMContentLoaded", initMenu);

function initMenu() {
  const authRaw = localStorage.getItem("authUser") || sessionStorage.getItem("authUser");

  if (!authRaw) {
    window.location.href = "index.html";
    return;
  }

  const authUser = JSON.parse(authRaw);

  topUserName.textContent = authUser.nombre || "Usuario";
  topUserRole.textContent = authUser.rol || "";
  topUserPhoto.src = authUser.foto || makeInitialsAvatar(authUser.nombre || "Usuario");
  topUserPhoto.onerror = function () {
    this.src = makeInitialsAvatar(authUser.nombre || "Usuario");
  };

  logoutBtn.addEventListener("click", logout);

  cardAnomalias.addEventListener("click", function () {
    window.location.href = "trackinganomalias.html";
  });

  cardSugerencias.addEventListener("click", function () {
    window.location.href = "trackingSugerencias.html";
  });
}

function logout() {
  localStorage.removeItem("authUser");
  sessionStorage.removeItem("authUser");
  window.location.href = "index.html";
}

function makeInitialsAvatar(name) {
  const words = String(name || "U").trim().split(" ").filter(Boolean);
  const initials = words.length >= 2
    ? (words[0][0] + words[1][0]).toUpperCase()
    : String(words[0] || "U").substring(0, 2).toUpperCase();

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">
      <rect width="100%" height="100%" fill="#0f4c81"/>
      <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
        font-size="40" font-family="Arial" font-weight="700" fill="#ffffff">${initials}</text>
    </svg>
  `;

  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}
