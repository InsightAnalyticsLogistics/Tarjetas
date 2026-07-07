const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyLDzIgbgG_4st1XAqQfAVxoOqxhZPeU5MEl_tjSxr4c2YJh0mXNk2l9kC05ea2TBkNSQ/exec";
const SUGERENCIA_PAGE = "./sugerencias.html";

var state = {
  auth: null,
  user: null,
  isAdmin: false,
  page: 1,
  pageSize: 30,
  total: 0,
  totalPages: 1
};

var loadingOverlay = document.getElementById("loadingOverlay");
var loadingText = document.getElementById("loadingText");
var topUserName = document.getElementById("topUserName");
var topUserRole = document.getElementById("topUserRole");
var topUserPhoto = document.getElementById("topUserPhoto");
var logoutBtn = document.getElementById("logoutBtn");
var filterEstado = document.getElementById("filterEstado");
var filterArea = document.getElementById("filterArea");
var filterFuente = document.getElementById("filterFuente");
var filterResponsable = document.getElementById("filterResponsable");
var filterSearch = document.getElementById("filterSearch");
var btnNuevaSugerencia = document.getElementById("btnNuevaSugerencia");
var btnBuscar = document.getElementById("btnBuscar");
var btnLimpiar = document.getElementById("btnLimpiar");
var trackingSummary = document.getElementById("trackingSummary");
var btnExportExcel = document.getElementById("btnExportExcel");
var trackingBody = document.getElementById("trackingBody");
var btnPrev = document.getElementById("btnPrev");
var btnNext = document.getElementById("btnNext");
var pageInfo = document.getElementById("pageInfo");

function showLoading(text) {
  if (!loadingOverlay) return;
  if (loadingText) loadingText.textContent = text || "Cargando Registros...";
  loadingOverlay.classList.remove("hidden");
}

function hideLoading() {
  if (!loadingOverlay) return;
  loadingOverlay.classList.add("hidden");
}

function logout() {
  localStorage.removeItem("authUser");
  sessionStorage.removeItem("authUser");
  window.location.href = "index.html";
}

function normalize(text) {
  return String(text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function escapeHtml(text) {
  var s = String(text || "");

  s = s.replace(/&/g, "&amp;");
  s = s.replace(/</g, "&lt;");
  s = s.replace(/>/g, "&gt;");
  s = s.replace(/"/g, "&quot;");
  s = s.replace(/'/g, "&#039;");

  return s;
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

function getStatusClass(status) {
  var s = normalize(status);
  if (s === "por validar") return "status-por-validar";
  if (s === "concluido") return "status-concluido";
  if (s === "futuro") return "status-futuro";
  if (s === "priorizado") return "status-priorizado";
  if (s === "atrasado") return "status-atrasado";
  if (s === "cancelado") return "status-cancelado";
  return "status-default";
}

async function fetchJson(url) {
  var response = await fetch(url);
  var text = await response.text();
  return JSON.parse(text);
}
function renderPagination() {
  pageInfo.textContent = "Página " + state.page + " de " + state.totalPages;
  btnPrev.disabled = state.page <= 1;
  btnNext.disabled = state.page >= state.totalPages;
}

function renderTable(items) {
  if (!items.length) {
    trackingSummary.textContent = "No se encontraron registros.";
    trackingBody.innerHTML = '<tr><td colspan="8">Sin resultados</td></tr>';
    return;
  }

  trackingSummary.textContent = "Mostrando " + items.length + " registros de " + state.total;

  var html = "";

  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var estadoText = item.estado || "";
    var estadoClass = getStatusClass(estadoText);

    html += '<tr>';
    html += '<td><span class="status-pill ' + estadoClass + '">' + escapeHtml(estadoText) + '</span></td>';
    html += '<td>' + escapeHtml(item.fechaRegistro || "") + '</td>';
    html += '<td>' + escapeHtml(item.proceso || "") + '</td>';
    html += '<td>' + escapeHtml(item.area || "") + '</td>';
    html += '<td>' + escapeHtml(item.responsable || "") + '</td>';
    html += '<td>' + escapeHtml(item.categorias || "") + '</td>';
    html += '<td>' + escapeHtml(item.fuente || "") + '</td>';
    html += '<td class="col-actions">';

    if (state.isAdmin) {
      html += '<button type="button" class="edit-btn" data-row="' + item.rowNumber + '" title="Editar">&#9998;</button>';
    }

    html += '</td>';
    html += '</tr>';
  }

  trackingBody.innerHTML = html;
}

async function loadTrackingInit() {
  var url = APP_SCRIPT_URL + "?action=trackingSugerenciasInit&usuario=" + encodeURIComponent(state.auth.usuario || "");
  var data = await fetchJson(url);

  if (!data.ok) {
    throw new Error(data.message || "No se pudo cargar la interfaz.");
  }

  state.user = data.user || {};
  state.isAdmin = !!data.isAdmin;

if (btnExportExcel) {
  btnExportExcel.classList.toggle("hidden", !state.isAdmin);
}

  topUserName.textContent = state.user.nombre || state.auth.nombre || "Usuario";
  topUserRole.textContent = state.user.rol || state.auth.rol || "";
  topUserPhoto.src = state.user.foto || state.auth.foto || makeInitialsAvatar(topUserName.textContent);
  topUserPhoto.onerror = function () {
    topUserPhoto.src = makeInitialsAvatar(topUserName.textContent);
  };

  var estados = (data.filters && data.filters.estados) ? data.filters.estados : [];
  var areas = (data.filters && data.filters.areas) ? data.filters.areas : [];
  var fuentes = (data.filters && data.filters.fuentes) ? data.filters.fuentes : [];
  var responsables = (data.filters && data.filters.responsables) ? data.filters.responsables : [];

  fillSelect(filterEstado, estados, "Todos");
  fillSelect(filterArea, areas, "Todas");
  fillSelect(filterFuente, fuentes, "Todas");
  fillSelect(filterResponsable, responsables, "Todos");
}

async function loadTrackingList(page) {
  trackingSummary.textContent = "Cargando registros...";
  trackingBody.innerHTML = '<tr><td colspan="8">Cargando...</td></tr>';

  var params = new URLSearchParams({
    action: "trackingSugerenciasList",
    page: String(page),
    pageSize: String(state.pageSize),
    estado: filterEstado.value,
    area: filterArea.value,
    fuente: filterFuente.value,
    responsable: filterResponsable.value,
    search: filterSearch.value.trim()
  });

  var data = await fetchJson(APP_SCRIPT_URL + "?" + params.toString());

  if (!data.ok) {
    throw new Error(data.message || "No se pudo cargar la tabla.");
  }

  state.page = data.page || 1;
  state.total = data.total || 0;
  state.totalPages = data.totalPages || 1;

  renderTable(data.items || []);
  renderPagination();
}

async function runWithLoading(fn) {
  try {
    showLoading("Cargando Registros...");
    await fn();
  } catch (error) {
    console.error("runWithLoading error:", error);
    trackingSummary.textContent = "Error al cargar registros.";
    trackingBody.innerHTML = '<tr><td colspan="8">' + escapeHtml(error.message || "Error inesperado") + '</td></tr>';
  } finally {
    hideLoading();
  }
}

function bindEvents() {
if (btnExportExcel) {
  btnExportExcel.addEventListener("click", function () {
    runWithLoading(function () {
      return downloadSugerenciasExcel();
    });
  });
}

  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }

  if (btnNuevaSugerencia) {
    btnNuevaSugerencia.addEventListener("click", function () {
      window.location.href = SUGERENCIA_PAGE;
    });
  }

  if (btnBuscar) {
    btnBuscar.addEventListener("click", function () {
      runWithLoading(function () {
        return loadTrackingList(1);
      });
    });
  }

  if (btnLimpiar) {
    btnLimpiar.addEventListener("click", function () {
      filterEstado.value = "";
      filterArea.value = "";
      filterFuente.value = "";
      filterResponsable.value = "";
      filterSearch.value = "";
      runWithLoading(function () {
        return loadTrackingList(1);
      });
    });
  }

  if (filterSearch) {
    filterSearch.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        runWithLoading(function () {
          return loadTrackingList(1);
        });
      }
    });
  }

  if (btnPrev) {
    btnPrev.addEventListener("click", function () {
      if (state.page > 1) {
        runWithLoading(function () {
          return loadTrackingList(state.page - 1);
        });
      }
    });
  }

  if (btnNext) {
    btnNext.addEventListener("click", function () {
      if (state.page < state.totalPages) {
        runWithLoading(function () {
          return loadTrackingList(state.page + 1);
        });
      }
    });
  }

  if (trackingBody) {
    trackingBody.addEventListener("click", function (e) {
      var btn = e.target.closest(".edit-btn");
      if (!btn) return;
      var row = btn.getAttribute("data-row");
      window.location.href = "analisisSugerencia.html?row=" + encodeURIComponent(row);
    });
  }

}

async function initTracking() {
  showLoading("Cargando Registros...");

  try {
    var raw = localStorage.getItem("authUser") || sessionStorage.getItem("authUser");

    if (!raw) {
      window.location.href = "index.html";
      return;
    }

    state.auth = JSON.parse(raw);

    bindEvents();

    await loadTrackingInit();
    await loadTrackingList(1);
  } catch (error) {
    console.error("initTracking error:", error);
    trackingSummary.textContent = "Error al cargar la interfaz.";
    trackingBody.innerHTML = '<tr><td colspan="8">' + escapeHtml(error.message || "Error inesperado") + '</td></tr>';
  } finally {
    hideLoading();
  }
}

document.addEventListener("DOMContentLoaded", initTracking);
async function downloadSugerenciasExcel() {
  if (!state.isAdmin) {
    return;
  }

  var params = new URLSearchParams({
    action: "exportSugerenciasData",
    usuario: state.auth.usuario || ""
  });

  var data = await fetchJson(APP_SCRIPT_URL + "?" + params.toString());

  if (!data.ok) {
    throw new Error(data.message || "No se pudo exportar sugerencias.");
  }

  downloadCsvFile(data.rows || [], data.fileName || "REGISTRO_SUGERENCIAS.csv");
}

function downloadCsvFile(rows, fileName) {
  var csv = "\uFEFF" + rows.map(function (row) {
    return row.map(function (cell) {
      return '"' + String(cell || "").replace(/"/g, '""') + '"';
    }).join(";");
  }).join("\r\n");

  var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");

  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
