const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyLDzIgbgG_4st1XAqQfAVxoOqxhZPeU5MEl_tjSxr4c2YJh0mXNk2l9kC05ea2TBkNSQ/exec";

const FUENTES = [
  "SEE&ACT",
  "EHS OPP",
  "FIP&FOC",
  "AUDITORIAS",
  "SIMULACRO",
  "ACTAS DE REUNION",
  "COTIDIANO",
  "MIÉRCOLES DE 5S",
  "AUDITORIA 5S",
  "CHECKLIST",
  "EQUIPO PIV",
  "GEMBA",
  "WECARE",
  "5s Lean OFFICE"
];

const state = {
  auth: null,
  profile: null,
  locations: [],
  reasonCodes: [],
  selectedLocation: null,
  photoDataUrl: "",
  clockTimer: null
};

const topUserName = document.getElementById("topUserName");
const topUserRole = document.getElementById("topUserRole");
const topUserPhoto = document.getElementById("topUserPhoto");
const logoutBtn = document.getElementById("logoutBtn");

const fechaRegistro = document.getElementById("fechaRegistro");
const registradoPor = document.getElementById("registradoPor");
const rol = document.getElementById("rol");
const area = document.getElementById("area");
const jefeDirecto = document.getElementById("jefeDirecto");

const ubicacion = document.getElementById("ubicacion");
const ubicacionSuggestions = document.getElementById("ubicacionSuggestions");
const zona = document.getElementById("zona");
const areaZona = document.getElementById("areaZona");

const reasonCode = document.getElementById("reasonCode");
const descripcionReason = document.getElementById("descripcionReason");
const tipoReason = document.getElementById("tipoReason");
const fuente = document.getElementById("fuente");

const descripcionAnomalia = document.getElementById("descripcionAnomalia");
const descripcionCount = document.getElementById("descripcionCount");

const cameraBtn = document.getElementById("cameraBtn");
const galleryBtn = document.getElementById("galleryBtn");
const cameraInput = document.getElementById("cameraInput");
const galleryInput = document.getElementById("galleryInput");
const photoPreviewBox = document.getElementById("photoPreviewBox");
const photoPreview = document.getElementById("photoPreview");
const removePhotoBtn = document.getElementById("removePhotoBtn");

const responsableZona = document.getElementById("responsableZona");
const areaResponsable = document.getElementById("areaResponsable");

const registroForm = document.getElementById("registroForm");
const formMessage = document.getElementById("formMessage");
const submitBtn = document.getElementById("submitBtn");
const loadingOverlay = document.getElementById("loadingOverlay");
const loadingText = document.getElementById("loadingText");

document.addEventListener("DOMContentLoaded", initPage);

function showLoading(message) {
  if (loadingText) {
    loadingText.textContent = message || "Cargando datos...";
  }
  if (loadingOverlay) {
    loadingOverlay.classList.remove("hidden");
  }
}

function hideLoading() {
  if (loadingOverlay) {
    loadingOverlay.classList.add("hidden");
  }
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


async function initPage() {
  try {
    showLoading("Cargando datos...");

    const authRaw = sessionStorage.getItem("authUser");

    if (!authRaw) {
      window.location.href = "index.html";
      return;
    }

    state.auth = JSON.parse(authRaw);

    bindEvents();
    loadFuentes();
    updateClock();

    if (state.clockTimer) {
      clearInterval(state.clockTimer);
    }
    state.clockTimer = setInterval(updateClock, 1000);

    descripcionCount.textContent = "0";

    await loadInitialData();
  } catch (error) {
    console.error("initPage error:", error);
    setMessage("Error al cargar datos iniciales.", "error");
  } finally {
    hideLoading();
  }
}


function bindEvents() {
  logoutBtn.addEventListener("click", logout);

  ubicacion.addEventListener("input", handleUbicacionInput);
  document.addEventListener("click", handleOutsideClick);

  reasonCode.addEventListener("change", handleReasonChange);

  descripcionAnomalia.addEventListener("input", () => {
    descripcionCount.textContent = descripcionAnomalia.value.length;
  });

  cameraBtn.addEventListener("click", () => cameraInput.click());
  galleryBtn.addEventListener("click", () => galleryInput.click());

  cameraInput.addEventListener("change", handleFileSelected);
  galleryInput.addEventListener("change", handleFileSelected);

  removePhotoBtn.addEventListener("click", clearPhoto);

  registroForm.addEventListener("submit", handleSubmit);
}

function updateClock() {
  fechaRegistro.value = formatDateTime(new Date());
}

function formatDateTime(date) {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}:${ss}`;
}

function loadFuentes() {
  fuente.innerHTML = `<option value="">Seleccione una opción</option>`;

  FUENTES.forEach(item => {
    const option = document.createElement("option");
    option.value = item;
    option.textContent = item;
    fuente.appendChild(option);
  });
}

async function loadInitialData() {
  try {
    const usuario = state.auth.usuario || "";
    const url = `${APP_SCRIPT_URL}?action=registroInit&usuario=${encodeURIComponent(usuario)}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.ok) {
      setMessage(data.message || "No se pudo cargar la interfaz.", "error");
      return;
    }

    state.profile = data.user || {};
    state.locations = data.locations || [];
    state.reasonCodes = data.reasonCodes || [];

    renderUserProfile();
    renderReasonCodes();
  } catch (error) {
    setMessage("Error al cargar datos iniciales.", "error");
  }
}

function renderUserProfile() {
  const profile = state.profile || {};
  const userName = profile.nombre || state.auth.nombre || "Usuario";
  const userRole = profile.rol || state.auth.rol || "";
  const userPhoto = profile.foto || state.auth.foto || makeInitialsAvatar(userName);

  topUserName.textContent = userName;
  topUserRole.textContent = userRole;
  topUserPhoto.src = userPhoto;
  topUserPhoto.onerror = () => {
    topUserPhoto.src = makeInitialsAvatar(userName);
  };

  registradoPor.value = userName;
  rol.value = userRole;
  area.value = profile.area || "";
  jefeDirecto.value = profile.jefeDirecto || "";
}

function renderReasonCodes() {
  reasonCode.innerHTML = `<option value="">Seleccione una opción</option>`;

  state.reasonCodes.forEach(item => {
    const option = document.createElement("option");
    option.value = item.codigo;
    option.textContent = item.codigo;
    reasonCode.appendChild(option);
  });
}
function autoResizeTextarea(element) {
  if (!element) return;
  element.style.height = "44px";
  element.style.height = element.scrollHeight + "px";
}

function handleReasonChange() {
  const code = reasonCode.value;
  const found = state.reasonCodes.find(item => item.codigo === code);

  descripcionReason.value = found ? found.descripcion : "";
  tipoReason.value = found ? found.tipo : "";

  autoResizeTextarea(descripcionReason);
}


function handleUbicacionInput() {
  const term = ubicacion.value.trim();

  if (!term) {
    hideSuggestions();
    clearLocationData();
    return;
  }

  const norm = normalize(term);
  const results = state.locations
    .filter(item => normalize(item.ubicacion).includes(norm))
    .slice(0, 8);

  renderSuggestions(results);

  const exact = state.locations.find(item => normalize(item.ubicacion) === norm);

  if (exact) {
    selectLocation(exact);
  } else {
    clearLocationData(false);
  }
}

function renderSuggestions(items) {
  if (!items.length) {
    hideSuggestions();
    return;
  }

  ubicacionSuggestions.innerHTML = "";

  items.forEach(item => {
    const row = document.createElement("div");
    row.className = "suggestion-item";
    row.textContent = item.ubicacion;
    row.addEventListener("mousedown", function (e) {
      e.preventDefault();
      selectLocation(item);
      hideSuggestions();
    });
    ubicacionSuggestions.appendChild(row);
  });

  ubicacionSuggestions.classList.remove("hidden");
}

function selectLocation(item) {
  state.selectedLocation = item;
  ubicacion.value = item.ubicacion || "";
  zona.value = item.zona || "";
  areaZona.value = item.areaZona || "";
  responsableZona.value = item.responsable || "";
  areaResponsable.value = item.responsableArea || "";
}

function clearLocationData(clearInput = true) {
  state.selectedLocation = null;

  if (clearInput) {
    ubicacion.value = "";
  }

  zona.value = "";
  areaZona.value = "";
  responsableZona.value = "";
  areaResponsable.value = "";
}

function hideSuggestions() {
  ubicacionSuggestions.classList.add("hidden");
}

function handleOutsideClick(e) {
  if (!e.target.closest(".autocomplete-wrap")) {
    hideSuggestions();
  }
}

async function handleFileSelected(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const dataUrl = await compressImage(file, 800, 0.65);
    state.photoDataUrl = dataUrl;
    photoPreview.src = dataUrl;
    photoPreviewBox.classList.remove("hidden");
  } catch (error) {
    setMessage("No se pudo procesar la imagen.", "error");
  }

  cameraInput.value = "";
  galleryInput.value = "";
}

function clearPhoto() {
  state.photoDataUrl = "";
  photoPreview.src = "";
  photoPreviewBox.classList.add("hidden");
  cameraInput.value = "";
  galleryInput.value = "";
}

function compressImage(file, maxWidth, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };

      img.onerror = reject;
      img.src = reader.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function handleSubmit(e) {
  e.preventDefault();
  setMessage("", "");

  const exactLocation = state.locations.find(
    item => normalize(item.ubicacion) === normalize(ubicacion.value.trim())
  );

  const detalle = descripcionAnomalia.value.trim();

  if (!exactLocation) {
    setMessage("Seleccione una ubicación válida de la lista.", "error");
    return;
  }

  if (!reasonCode.value) {
    setMessage("Seleccione un Reason Code.", "error");
    return;
  }

  if (!fuente.value) {
    setMessage("Seleccione una fuente.", "error");
    return;
  }

  if (detalle.length < 10 || detalle.length > 50) {
    setMessage("La descripción debe tener entre 10 y 50 caracteres.", "error");
    return;
  }

  if (!state.photoDataUrl) {
    setMessage("Debe adjuntar una foto inicial.", "error");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Registrando...";
  showLoading("Registrando anomalía...");

  try {
    const payload = {
      action: "registrarAnomalia",
      registradoPor: registradoPor.value.trim(),
      usuarioLogin: state.auth.usuario || "",
      rol: rol.value.trim(),
      area: area.value.trim(),
      jefeDirecto: jefeDirecto.value.trim(),
      ubicacion: exactLocation.ubicacion,
      zona: exactLocation.zona,
      areaZona: exactLocation.areaZona,
      reasonCode: reasonCode.value,
      descripcionReason: descripcionReason.value.trim(),
      tipoReason: tipoReason.value.trim(),
      fuente: fuente.value,
      descripcionAnomalia: detalle,
      responsableZona: exactLocation.responsable || "",
      areaResponsable: exactLocation.responsableArea || "",
      estado: "ANOMALIA",
      colorEstado: "MOSTAZA",
      photoDataUrl: state.photoDataUrl
    };

    const response = await fetch(APP_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!data.ok) {
      hideLoading();
      const detalleError = data.detail ? ` (${data.detail})` : "";
      setMessage((data.message || "No se pudo registrar la anomalía.") + detalleError, "error");
      submitBtn.disabled = false;
      submitBtn.textContent = "Registrar anomalía";
      return;
    }

    showLoading("Registro con éxito");
    await wait(1200);
    window.location.href = "trackinganomalias.html";
  } catch (error) {
    hideLoading();
    setMessage("Error al registrar la anomalía.", "error");
    submitBtn.disabled = false;
    submitBtn.textContent = "Registrar anomalía";
  }
}

function resetFormAfterSave() {
  clearLocationData();
  reasonCode.value = "";
  descripcionReason.value = "";
  autoResizeTextarea(descripcionReason);
  tipoReason.value = "";
  fuente.value = "";
  descripcionAnomalia.value = "";
  descripcionCount.textContent = "0";
  clearPhoto();
  updateClock();
  hideSuggestions();
}

function setMessage(message, type) {
  formMessage.textContent = message || "";
  formMessage.className = "form-message";
  if (type) {
    formMessage.classList.add(type);
  }
}

function logout() {
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
