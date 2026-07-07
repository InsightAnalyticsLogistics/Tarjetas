const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyLDzIgbgG_4st1XAqQfAVxoOqxhZPeU5MEl_tjSxr4c2YJh0mXNk2l9kC05ea2TBkNSQ/exec";

var state = {
  auth: null,
  user: null,
  isAdmin: false,
  page: 1,
  pageSize: 30,
  total: 0,
  totalPages: 1
};

var topUserName = document.getElementById("topUserName");
var topUserRole = document.getElementById("topUserRole");
var topUserPhoto = document.getElementById("topUserPhoto");
var logoutBtn = document.getElementById("logoutBtn");

var filterEstado = document.getElementById("filterEstado");
var filterZona = document.getElementById("filterZona");
var filterAsignado = document.getElementById("filterAsignado");
var filterSearch = document.getElementById("filterSearch");
var btnBuscar = document.getElementById("btnBuscar");
var btnLimpiar = document.getElementById("btnLimpiar");
var btnNuevaAnomalia = document.getElementById("btnNuevaAnomalia");

var trackingSummary = document.getElementById("trackingSummary");
var btnExportExcel = document.getElementById("btnExportExcel");
var trackingBody = document.getElementById("trackingBody");
var btnPrev = document.getElementById("btnPrev");
var btnNext = document.getElementById("btnNext");
var pageInfo = document.getElementById("pageInfo");
var loadingOverlay = document.getElementById("loadingOverlay");

document.addEventListener("DOMContentLoaded", initTracking);

async function initTracking() {
  try {
    var raw = localStorage.getItem("authUser") || sessionStorage.getItem("authUser");

    if (!raw) {
      window.location.href = "index.html";
      return;
    }

    state.auth = JSON.parse(raw);

    bindEvents();
    showLoading();

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

function bindEvents() {
 
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }

  if (btnNuevaAnomalia) {
    btnNuevaAnomalia.addEventListener("click", function () {
      window.location.href = "registro.html";
    });
  }
  if (btnExportExcel) {
  btnExportExcel.addEventListener("click", function () {
    runWithLoading(function () {
      return downloadAnomaliasExcel();
    });
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
      filterZona.value = "";
      filterAsignado.value = "";
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
}

async function runWithLoading(fn) {
  try {
    showLoading();
    await fn();
  } catch (error) {
    console.error("runWithLoading error:", error);
    trackingSummary.textContent = "Error al cargar registros.";
    trackingBody.innerHTML = '<tr><td colspan="8">' + escapeHtml(error.message || "Error inesperado") + '</td></tr>';
  } finally {
    hideLoading();
  }
}

async function loadTrackingInit() {
  var url = APP_SCRIPT_URL + "?action=trackingAnomaliasInit&usuario=" + encodeURIComponent(state.auth.usuario || "");
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

  fillSelect(filterEstado, (data.filters && data.filters.estados) ? data.filters.estados : [], "Todos");
  fillSelect(filterZona, (data.filters && data.filters.zonas) ? data.filters.zonas : [], "Todas");
  fillSelect(filterAsignado, (data.filters && data.filters.asignados) ? data.filters.asignados : [], "Todos");
}

function fillSelect(select, items, firstLabel) {
  if (!select) return;

  select.innerHTML = '<option value="">' + firstLabel + '</option>';

  for (var i = 0; i < items.length; i++) {
    var option = document.createElement("option");
    option.value = items[i];
    option.textContent = items[i];
    select.appendChild(option);
  }
}

async function loadTrackingList(page) {
  trackingSummary.textContent = "Cargando registros...";
  trackingBody.innerHTML = '<tr><td colspan="8">Cargando...</td></tr>';

  var params = new URLSearchParams({
    action: "trackingAnomaliasList",
    page: String(page),
    pageSize: String(state.pageSize),
    estado: filterEstado.value,
    zona: filterZona.value,
    asignado: filterAsignado.value,
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

async function fetchJson(url) {
  var response = await fetch(url);
  var text = await response.text();
  return JSON.parse(text);
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

    if (canOpenCierre(item)) {
      html += '<tr class="fila-cierre" data-row="' + item.rowNumber + '">';
    } else {
      html += '<tr>';
    }

    html += '<td><span class="status-pill ' + getStatusClass(item.estado) + '">' + escapeHtml(item.estado || "") + '</span></td>';
    html += '<td>' + escapeHtml(item.fechaRegistro || "") + '</td>';
    html += '<td>' + escapeHtml(item.usuarioRegistro || "") + '</td>';
    html += '<td>' + escapeHtml(item.zona || "") + '</td>';
    html += '<td>' + escapeHtml(item.ubicacion || "") + '</td>';
    html += '<td>' + escapeHtml(item.usuarioAsignado || "") + '</td>';
    html += '<td>' + escapeHtml(item.fechaPlanificada || "") + '</td>';
    html += '<td class="col-actions">';

    if (state.isAdmin) {
      html += '<button type="button" class="edit-btn" data-row="' + item.rowNumber + '" title="Editar">&#9998;</button>';
    }

    html += '</td>';
    html += '</tr>';
  }

  trackingBody.innerHTML = html;

  var filas = trackingBody.querySelectorAll(".fila-cierre");

  for (var j = 0; j < filas.length; j++) {
    filas[j].style.cursor = "pointer";
    filas[j].title = "Abrir cierre de anomalía";

    filas[j].addEventListener("click", function (e) {
      if (e.target.closest(".edit-btn")) return;
      var row = this.dataset.row;
      window.location.href = "cierreanomalia.html?row=" + encodeURIComponent(row);
    });
  }

  var editBtns = trackingBody.querySelectorAll(".edit-btn");

  for (var k = 0; k < editBtns.length; k++) {
    editBtns[k].addEventListener("click", function (e) {
      e.stopPropagation();
      var row = this.getAttribute("data-row");
      window.location.href = "analisisAnomalia.html?row=" + encodeURIComponent(row);
    });
  }
}

function canOpenCierre(item) {
  if (!state.auth) {
    return false;
  }

  var estado = normalize(item.estado);

  if (estado !== "en proceso" && estado !== "atrasado") {
    return false;
  }

  var asignado = normalize(item.usuarioAsignado);
  var usuarioLogin = normalize(state.auth.usuario);
  var usuarioNombre = normalize(state.auth.nombre);

  return asignado === usuarioLogin || asignado === usuarioNombre;
}

function renderPagination() {
  pageInfo.textContent = "Página " + state.page + " de " + state.totalPages;
  btnPrev.disabled = state.page <= 1;
  btnNext.disabled = state.page >= state.totalPages;
}

function getStatusClass(status) {
  var s = normalize(status);

  if (s === "anomalia") return "status-anomalia";
  if (s === "concluido" || s === "cerrado") return "status-concluido";
  if (s === "en proceso") return "status-en-proceso";
  if (s === "cancelado") return "status-cancelado";
  if (s === "a futuro" || s === "futuro") return "status-a-futuro";
  if (s === "atrasado") return "status-atrasado";

  return "status-default";
}

function showLoading() {
  if (loadingOverlay) {
    loadingOverlay.classList.remove("hidden");
  }
}

function hideLoading() {
  if (loadingOverlay) {
    loadingOverlay.classList.add("hidden");
  }
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

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function makeInitialsAvatar(name) {
  var words = String(name || "U").trim().split(" ").filter(Boolean);
  var initials = "U";

  if (words.length >= 2) {
    initials = (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1) {
    initials = words[0].substring(0, 2).toUpperCase();
  }

  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">'
    + '<rect width="100%" height="100%" fill="#0f4c81"/>'
    + '<text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-size="40" font-family="Arial" font-weight="700" fill="#ffffff">'
    + initials
    + '</text></svg>';

  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}
async function downloadAnomaliasExcel() {
  if (!state.isAdmin) {
    return;
  }

  var params = new URLSearchParams({
    action: "exportAnomaliasData",
    usuario: state.auth.usuario || ""
  });

  var data = await fetchJson(APP_SCRIPT_URL + "?" + params.toString());

  if (!data.ok) {
    throw new Error(data.message || "No se pudo exportar anomalías.");
  }

  downloadCsvFile(data.rows || [], data.fileName || "REGISTRO_ANOMALIAS.csv");
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
