const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyLDzIgbgG_4st1XAqQfAVxoOqxhZPeU5MEl_tjSxr4c2YJh0mXNk2l9kC05ea2TBkNSQ/exec";
const TRACKING_PAGE = "./trackingSugerencias.html";

var state = {
  auth: null,
  rowNumber: 0,
  registro: null,
  options: null
};

var loadingOverlay = document.getElementById("loadingOverlay");
var loadingText = document.getElementById("loadingText");

var topUserName = document.getElementById("topUserName");
var topUserRole = document.getElementById("topUserRole");
var topUserPhoto = document.getElementById("topUserPhoto");
var logoutBtn = document.getElementById("logoutBtn");
var backBtn = document.getElementById("backBtn");

var estadoActual = document.getElementById("estadoActual");
var fechaRegistro = document.getElementById("fechaRegistro");
var detectadoPor = document.getElementById("detectadoPor");
var rolDetectado = document.getElementById("rolDetectado");
var areaDetectado = document.getElementById("areaDetectado");
var jefeDetectado = document.getElementById("jefeDetectado");
var proceso = document.getElementById("proceso");
var fuente = document.getElementById("fuente");
var equipo = document.getElementById("equipo");
var categorias = document.getElementById("categorias");
var descripcion = document.getElementById("descripcion");
var beneficios = document.getElementById("beneficios");

var areaResponsable = document.getElementById("areaResponsable");
var nombreResponsable = document.getElementById("nombreResponsable");
var responsableApoyo = document.getElementById("responsableApoyo");
var fechaPlan = document.getElementById("fechaPlan");
var fechaCierreInput = document.getElementById("fechaCierreInput");
var comentarioAdicional = document.getElementById("comentarioAdicional");
var comentarioAdicionalCount = document.getElementById("comentarioAdicionalCount");
var fechaCancelacion = document.getElementById("fechaCancelacion");
var comentarioCancelacion = document.getElementById("comentarioCancelacion");
var comentarioCancelacionCount = document.getElementById("comentarioCancelacionCount");
var reconocido = document.getElementById("reconocido");
var impacto = document.getElementById("impacto");
var planAccion = document.getElementById("planAccion");

var analisisForm = document.getElementById("analisisForm");
var formMessage = document.getElementById("formMessage");
var submitBtn = document.getElementById("submitBtn");

function showLoading(text) {
  if (!loadingOverlay) return;
  if (loadingText) loadingText.textContent = text || "Cargando Detalle...";
  loadingOverlay.classList.remove("hidden");
}

function hideLoading() {
  if (!loadingOverlay) return;
  loadingOverlay.classList.add("hidden");
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
  return String(text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function makeInitialsAvatar(name) {
  var words = String(name || "U").trim().split(" ").filter(Boolean);
  var initials = "U";
  if (words.length >= 2) {
    initials = (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1) {
    initials = words[0].substring(0, 2).toUpperCase();
  }
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="100%" height="100%" fill="#0f4c81"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-size="40" font-family="Arial" font-weight="700" fill="#ffffff">' + initials + '</text></svg>';
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

async function fetchJson(url) {
  var response = await fetch(url);
  var text = await response.text();
  return JSON.parse(text);
}

function fillSelect(select, items, firstLabel) {
  if (!select) return;
  select.innerHTML = "";
  var first = document.createElement("option");
  first.value = "";
  first.textContent = firstLabel;
  select.appendChild(first);
  for (var i = 0; i < items.length; i++) {
    var option = document.createElement("option");
    option.value = items[i];
    option.textContent = items[i];
    select.appendChild(option);
  }
}

function toInputDate_(text) {
  var t = String(text || "").trim();
  if (!t) return "";
  var m = t.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return m[3] + "-" + m[2] + "-" + m[1];
  var m2 = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m2) return m2[0];
  return "";
}

function toSheetDate_(text) {
  var t = String(text || "").trim();
  if (!t) return "";
  var m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return m[3] + "/" + m[2] + "/" + m[1];
  return t;
}
function renderRegistro(reg) {
  estadoActual.value = reg.estado || "";
  fechaRegistro.value = reg.fechaRegistro || "";
  detectadoPor.value = reg.detectadoPor || "";
  rolDetectado.value = reg.rolDetectado || "";
  areaDetectado.value = reg.areaDetectado || "";
  jefeDetectado.value = reg.jefeDetectado || "";
  proceso.value = reg.proceso || "";
  fuente.value = reg.fuente || "";
  equipo.value = reg.equipo || "";
  categorias.value = reg.categorias || "";
  descripcion.value = reg.descripcion || "";
  beneficios.value = reg.beneficios || "";

  if (reg.areaResponsable) areaResponsable.value = reg.areaResponsable;
  if (reg.nombreResponsable) nombreResponsable.value = reg.nombreResponsable;
  if (reg.reconocido) reconocido.value = reg.reconocido;
  if (reg.impacto) impacto.value = reg.impacto;
  if (reg.planAccion) planAccion.value = reg.planAccion;
  if (reg.comentarioAdicional) {
    comentarioAdicional.value = reg.comentarioAdicional;
    comentarioAdicionalCount.textContent = comentarioAdicional.value.length;
  }
  if (reg.comentarioCancelacion) {
    comentarioCancelacion.value = reg.comentarioCancelacion;
    comentarioCancelacionCount.textContent = comentarioCancelacion.value.length;
  }
  if (reg.fechaPlan) fechaPlan.value = toInputDate_(reg.fechaPlan);
  if (reg.fechaCierre) fechaCierreInput.value = toInputDate_(reg.fechaCierre);
  if (reg.fechaCancelacion) fechaCancelacion.value = toInputDate_(reg.fechaCancelacion);
}

function renderTopUser(user) {
  var name = user.nombre || state.auth.nombre || "Usuario";
  var role = user.rol || state.auth.rol || "";
  var photo = user.foto || state.auth.foto || makeInitialsAvatar(name);
  topUserName.textContent = name;
  topUserRole.textContent = role;
  topUserPhoto.src = photo;
  topUserPhoto.onerror = function () {
    topUserPhoto.src = makeInitialsAvatar(name);
  };
}

function bindEvents() {
  if (logoutBtn) logoutBtn.addEventListener("click", logout);
  if (backBtn) backBtn.addEventListener("click", function () {
    window.location.href = TRACKING_PAGE;
  });

  if (comentarioAdicional) {
    comentarioAdicional.addEventListener("input", function () {
      comentarioAdicionalCount.textContent = comentarioAdicional.value.length;
    });
  }

  if (comentarioCancelacion) {
    comentarioCancelacion.addEventListener("input", function () {
      comentarioCancelacionCount.textContent = comentarioCancelacion.value.length;
    });
  }

  if (analisisForm) {
    analisisForm.addEventListener("submit", handleSubmit);
  }
}

async function initPage() {
  showLoading("Cargando Detalle...");

  try {
    var raw = localStorage.getItem("authUser") || sessionStorage.getItem("authUser");
    if (!raw) {
      window.location.href = "index.html";
      return;
    }
    state.auth = JSON.parse(raw);
    state.rowNumber = Number(new URLSearchParams(window.location.search).get("row") || 0);

    if (!state.rowNumber) {
      hideLoading();
      setMessage("No se recibió el registro seleccionado.", "error");
      return;
    }

    bindEvents();

    var url = APP_SCRIPT_URL + "?action=analisisSugerenciaInit&usuario=" + encodeURIComponent(state.auth.usuario) + "&row=" + state.rowNumber;
    var data = await fetchJson(url);

    if (!data.ok) {
      hideLoading();
      setMessage(data.message || "No se pudo cargar el detalle.", "error");
      return;
    }

    state.registro = data.registro || {};
    state.options = data.options || {};

    renderTopUser(data.user || {});

    fillSelect(areaResponsable, state.options.areasResponsables || [], "Seleccione un área");
    fillSelect(nombreResponsable, state.options.nombresPersonal || [], "Seleccione un responsable");
    fillSelect(responsableApoyo, state.options.nombresPersonal || [], "Seleccione (opcional)");
    fillSelect(reconocido, state.options.reconocidos || [], "Seleccione");
    fillSelect(impacto, state.options.impactos || [], "Seleccione");

    renderRegistro(state.registro);

    hideLoading();
  } catch (error) {
    console.error("initPage error:", error);
    hideLoading();
    setMessage("Error al cargar el detalle.", "error");
  }
}

async function handleSubmit(e) {
  e.preventDefault();
  setMessage("", "");

  var comAdic = comentarioAdicional.value.trim();
  var comCanc = comentarioCancelacion.value.trim();

  if (comAdic && (comAdic.length < 5 || comAdic.length > 50)) {
    setMessage("El comentario adicional debe tener entre 5 y 50 caracteres.", "error");
    return;
  }

  if (comCanc && (comCanc.length < 5 || comCanc.length > 50)) {
    setMessage("El comentario de cancelación debe tener entre 5 y 50 caracteres.", "error");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Actualizando...";
  showLoading("Actualizando...");

  try {
    var payload = {
      action: "actualizarAnalisisSugerencia",
      rowNumber: state.rowNumber,
      usuarioLogin: state.auth.usuario,
      areaResponsable: areaResponsable.value,
      nombreResponsable: nombreResponsable.value,
      fechaPlan: toSheetDate_(fechaPlan.value),
      fechaCierre: toSheetDate_(fechaCierreInput.value),
      comentarioAdicional: comAdic,
      fechaCancelacion: toSheetDate_(fechaCancelacion.value),
      comentarioCancelacion: comCanc,
      reconocido: reconocido.value,
      impacto: impacto.value,
      planAccion: planAccion.value.trim()
    };

    var response = await fetch(APP_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    var data = await response.json();

    if (!data.ok) {
      var errorText = data.detail ? (data.message + ": " + data.detail) : (data.message || "No se pudo actualizar.");
      hideLoading();
      setMessage(errorText, "error");
      submitBtn.disabled = false;
      submitBtn.textContent = "Actualizar";
      return;
    }

    setMessage("Actualización exitosa.", "success");
    showLoading("Actualización exitosa");

    setTimeout(function () {
      window.location.replace(TRACKING_PAGE);
    }, 1200);
  } catch (error) {
    console.error("handleSubmit error:", error);
    hideLoading();
    setMessage("Error al actualizar.", "error");
    submitBtn.disabled = false;
    submitBtn.textContent = "Actualizar";
  }
}

document.addEventListener("DOMContentLoaded", initPage);
