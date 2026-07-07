const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyLDzIgbgG_4st1XAqQfAVxoOqxhZPeU5MEl_tjSxr4c2YJh0mXNk2l9kC05ea2TBkNSQ/exec";
const MENU_PAGE = "./menu.html";
const TRACKING_PAGE = "./trackingSugerencias.html";


const state = {
  auth: null,
  user: null,
  defaults: null,
  options: null,
  selectedTeam: []
};

const loadingOverlay = document.getElementById("loadingOverlay");
const loadingText = document.getElementById("loadingText");

const topUserPhoto = document.getElementById("topUserPhoto");
const topUserName = document.getElementById("topUserName");
const topUserRole = document.getElementById("topUserRole");
const logoutBtn = document.getElementById("logoutBtn");

const reporterPhoto = document.getElementById("reporterPhoto");
const reporterName = document.getElementById("reporterName");
const reporterArea = document.getElementById("reporterArea");

const sugerenciaForm = document.getElementById("sugerenciaForm");
const formMessage = document.getElementById("formMessage");
const submitBtn = document.getElementById("submitBtn");

const fechaReporte = document.getElementById("fechaReporte");
const semana = document.getElementById("semana");
const detectadoPor = document.getElementById("detectadoPor");
const rol = document.getElementById("rol");
const area = document.getElementById("area");
const jefeDirecto = document.getElementById("jefeDirecto");

const proceso = document.getElementById("proceso");
const fuente = document.getElementById("fuente");

const colaboradorSelect = document.getElementById("colaboradorSelect");
const addColaboradorBtn = document.getElementById("addColaboradorBtn");
const selectedTeam = document.getElementById("selectedTeam");

const descripcionSugerencia = document.getElementById("descripcionSugerencia");
const descripcionCount = document.getElementById("descripcionCount");

const beneficios = document.getElementById("beneficios");
const beneficiosCount = document.getElementById("beneficiosCount");

document.addEventListener("DOMContentLoaded", initPage);

async function initPage() {
  showLoading("Cargando Sugerencia...");
  await waitForPaint_();

  try {
    const authRaw = localStorage.getItem("authUser") || sessionStorage.getItem("authUser");

    if (!authRaw) {
      window.location.href = "index.html";
      return;
    }

    state.auth = JSON.parse(authRaw);

    bindEvents();

    const url = APP_SCRIPT_URL + "?action=sugerenciaInit&usuario=" + encodeURIComponent(state.auth.usuario || "");
    const data = await fetchJson(url);

    if (!data.ok) {
      hideLoading();
      setMessage(data.message || "No se pudo cargar la interfaz.", "error");
      return;
    }

    state.user = data.user || {};
    state.defaults = data.defaults || {};
    state.options = data.options || {};

    renderTopUser();
    renderReporterCard();
    renderDefaults();
    renderFuentes();
    renderColaboradores();
    updateCounters();
    renderSelectedTeam();

    hideLoading();
  } catch (error) {
    console.error("initPage error:", error);
    hideLoading();
    setMessage("Error al cargar la interfaz de sugerencias.", "error");
  }
}

function bindEvents() {
  if (logoutBtn) logoutBtn.addEventListener("click", logout);
  if (descripcionSugerencia) descripcionSugerencia.addEventListener("input", updateCounters);
  if (beneficios) beneficios.addEventListener("input", updateCounters);
  if (addColaboradorBtn) addColaboradorBtn.addEventListener("click", handleAddColaborador);
  if (selectedTeam) selectedTeam.addEventListener("click", handleRemoveColaborador);
  if (sugerenciaForm) sugerenciaForm.addEventListener("submit", handleSubmit);
}

function showLoading(text) {
  if (!loadingOverlay) return;
  if (loadingText) loadingText.textContent = text || "Cargando Sugerencia...";
  loadingOverlay.classList.remove("hidden");
}

function hideLoading() {
  if (!loadingOverlay) return;
  loadingOverlay.classList.add("hidden");
}

function waitForPaint_() {
  return new Promise(function (resolve) {
    requestAnimationFrame(function () {
      requestAnimationFrame(resolve);
    });
  });
}

async function fetchJson(url) {
  const response = await fetch(url);
  const text = await response.text();
  return JSON.parse(text);
}

function renderTopUser() {
  const userName = state.user.nombre || state.defaults.detectadoPor || state.auth.nombre || "Usuario";
  const userRole = state.defaults.rol || state.auth.rol || "";
  const userPhoto = state.user.foto || state.auth.foto || makeInitialsAvatar(userName);

  topUserName.textContent = userName;
  topUserRole.textContent = userRole;
  topUserPhoto.src = userPhoto;
  topUserPhoto.onerror = function () {
    topUserPhoto.src = makeInitialsAvatar(userName);
  };
}

function renderReporterCard() {
  const userName = state.user.nombre || state.defaults.detectadoPor || state.auth.nombre || "Usuario";
  const userArea = state.defaults.area || "";
  const userPhoto = state.user.foto || state.auth.foto || makeInitialsAvatar(userName);

  reporterName.textContent = userName;
  reporterArea.textContent = userArea;
  reporterPhoto.src = userPhoto;
  reporterPhoto.onerror = function () {
    reporterPhoto.src = makeInitialsAvatar(userName);
  };
}

function renderDefaults() {
  fechaReporte.value = state.defaults.fechaReporte || "";
  semana.value = state.defaults.semana || "";
  detectadoPor.value = state.defaults.detectadoPor || "";
  rol.value = state.defaults.rol || "";
  area.value = state.defaults.area || "";
  jefeDirecto.value = state.defaults.jefeDirecto || "";
}

function renderFuentes() {
  fuente.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Seleccione una opción";
  fuente.appendChild(placeholder);

  const items = (state.options && state.options.fuentes) ? state.options.fuentes : [];
  for (let i = 0; i < items.length; i++) {
    const option = document.createElement("option");
    option.value = items[i];
    option.textContent = items[i];
    fuente.appendChild(option);
  }
}

function renderColaboradores() {
  colaboradorSelect.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Seleccione un personal";
  colaboradorSelect.appendChild(placeholder);

  const items = (state.options && state.options.colaboradores) ? state.options.colaboradores : [];
  for (let i = 0; i < items.length; i++) {
    const option = document.createElement("option");
    option.value = items[i];
    option.textContent = items[i];
    colaboradorSelect.appendChild(option);
  }
}

function updateCounters() {
  descripcionCount.textContent = descripcionSugerencia.value.length;
  beneficiosCount.textContent = beneficios.value.length;
}

function handleAddColaborador() {
  const value = String(colaboradorSelect.value || "").trim();
  setMessage("", "");

  if (!value) {
    setMessage("Seleccione un personal para agregar al equipo.", "error");
    return;
  }
  if (state.selectedTeam.indexOf(value) !== -1) {
    setMessage("Ese colaborador ya fue agregado.", "error");
    return;
  }
  if (state.selectedTeam.length >= 6) {
    setMessage("Solo puede agregar hasta 6 colaboradores.", "error");
    return;
  }

  state.selectedTeam.push(value);
  renderSelectedTeam();
  colaboradorSelect.value = "";
}

function handleRemoveColaborador(e) {
  const btn = e.target.closest(".remove-team-btn");
  if (!btn) return;

  const name = String(btn.getAttribute("data-name") || "").trim();
  if (!name) return;

  state.selectedTeam = state.selectedTeam.filter(function (item) {
    return item !== name;
  });
  renderSelectedTeam();
}

function renderSelectedTeam() {
  if (!selectedTeam) return;
  selectedTeam.innerHTML = "";

  if (!state.selectedTeam.length) return;

  for (let i = 0; i < state.selectedTeam.length; i++) {
    const name = state.selectedTeam[i];

    const chip = document.createElement("div");
    chip.className = "team-chip";

    const span = document.createElement("span");
    span.textContent = name;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "remove-team-btn";
    btn.setAttribute("data-name", name);
    btn.textContent = "-";

    chip.appendChild(span);
    chip.appendChild(btn);
    selectedTeam.appendChild(chip);
  }
}

function getSelectedCategorias() {
  const checked = document.querySelectorAll(".categoria-checkbox:checked");
  const values = [];
  checked.forEach(function (item) {
    values.push(String(item.value || "").trim());
  });
  return values;
}
async function handleSubmit(e) {
  e.preventDefault();
  setMessage("", "");

  const procesoValue = String(proceso.value || "").trim();
  const fuenteValue = String(fuente.value || "").trim();
  const descripcionValue = String(descripcionSugerencia.value || "").trim();
  const beneficiosValue = String(beneficios.value || "").trim();
  const categorias = getSelectedCategorias();

  if (!procesoValue) {
    setMessage("Ingrese el Proceso.", "error");
    return;
  }
  if (!fuenteValue) {
    setMessage("Seleccione una Fuente.", "error");
    return;
  }
  if (state.selectedTeam.length < 1) {
    setMessage("Debe agregar al menos 1 colaborador al equipo.", "error");
    return;
  }
  if (state.selectedTeam.length > 6) {
    setMessage("Solo puede agregar hasta 6 colaboradores.", "error");
    return;
  }
  if (descripcionValue.length < 10 || descripcionValue.length > 100) {
    setMessage("La Descripción de Sugerencia debe tener entre 10 y 100 caracteres.", "error");
    return;
  }
  if (beneficiosValue.length < 10 || beneficiosValue.length > 100) {
    setMessage("El campo Beneficios debe tener entre 10 y 100 caracteres.", "error");
    return;
  }
  if (categorias.length < 1) {
    setMessage("Seleccione al menos una categoría.", "error");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Registrando...";
  showLoading("Registrando Sugerencia...");
  await waitForPaint_();

  try {
    const payload = {
      action: "registrarSugerencia",
      usuarioLogin: state.auth.usuario,
      proceso: procesoValue,
      fuente: fuenteValue,
      equipo: state.selectedTeam,
      descripcionSugerencia: descripcionValue,
      beneficios: beneficiosValue,
      categorias: categorias
    };

    const response = await fetch(APP_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!data.ok) {
      const errorText = data.detail
        ? (data.message + ": " + data.detail)
        : (data.message || "No se pudo registrar la sugerencia.");

      hideLoading();
      setMessage(errorText, "error");
      submitBtn.disabled = false;
      submitBtn.textContent = "Registrar";
      return;
    }

    fechaReporte.value = data.fechaReporte || fechaReporte.value;
    clearEditableFields_();

    setMessage("Sugerencia registrada correctamente.", "success");
    showLoading("Registro exitoso");

    setTimeout(function () {
      window.location.replace(TRACKING_PAGE);
    }, 1200);

  } catch (error) {
    console.error("handleSubmit error:", error);
    hideLoading();
    setMessage("Error al registrar la sugerencia.", "error");
    submitBtn.disabled = false;
    submitBtn.textContent = "Registrar";
  }
}

function clearEditableFields_() {
  proceso.value = "";
  fuente.value = "";
  descripcionSugerencia.value = "";
  beneficios.value = "";
  colaboradorSelect.value = "";
  state.selectedTeam = [];
  renderSelectedTeam();

  const checks = document.querySelectorAll(".categoria-checkbox");
  checks.forEach(function (item) {
    item.checked = false;
  });

  updateCounters();
}

function setMessage(message, type) {
  formMessage.textContent = message || "";
  formMessage.className = "form-message";
  if (type) formMessage.classList.add(type);
}

function logout() {
  localStorage.removeItem("authUser");
  sessionStorage.removeItem("authUser");
  window.location.href = "index.html";
}

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function makeInitialsAvatar(name) {
  const words = String(name || "U").trim().split(" ").filter(Boolean);
  let initials = "U";
  if (words.length >= 2) {
    initials = (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1) {
    initials = words[0].substring(0, 2).toUpperCase();
  }

  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">' +
    '<rect width="100%" height="100%" fill="#0f4c81"/>' +
    '<text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-size="40" font-family="Arial" font-weight="700" fill="#ffffff">' +
    initials +
    '</text></svg>';

  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}
