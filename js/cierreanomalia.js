const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyLDzIgbgG_4st1XAqQfAVxoOqxhZPeU5MEl_tjSxr4c2YJh0mXNk2l9kC05ea2TBkNSQ/exec";
const TRACKING_PAGE = "./trackinganomalias.html";

const state = {
  auth: null,
  rowNumber: 0,
  canEdit: false,
  locations: [],
  reasonCodes: [],
  selectedLocation: null,
  photoDataUrl: ""
};

const topUserName = document.getElementById("topUserName");
const topUserRole = document.getElementById("topUserRole");
const topUserPhoto = document.getElementById("topUserPhoto");
const logoutBtn = document.getElementById("logoutBtn");
const backBtn = document.getElementById("backBtn");

const loadingOverlay = document.getElementById("loadingOverlay");
const loadingText = document.getElementById("loadingText");
const modeInfo = document.getElementById("modeInfo");

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

const fotoInicialBox = document.getElementById("fotoInicialBox");
const fotoInicialPreview = document.getElementById("fotoInicialPreview");

const cameraBtn = document.getElementById("cameraBtn");
const galleryBtn = document.getElementById("galleryBtn");
const cameraInput = document.getElementById("cameraInput");
const galleryInput = document.getElementById("galleryInput");
const photoPreviewBox = document.getElementById("photoPreviewBox");
const photoPreview = document.getElementById("photoPreview");
const removePhotoBtn = document.getElementById("removePhotoBtn");

const responsableZona = document.getElementById("responsableZona");
const areaResponsable = document.getElementById("areaResponsable");
const estado = document.getElementById("estado");
const fechaPlanificada = document.getElementById("fechaPlanificada");

const cierreForm = document.getElementById("cierreForm");
const formMessage = document.getElementById("formMessage");
const submitBtn = document.getElementById("submitBtn");

document.addEventListener("DOMContentLoaded", initPage);

async function initPage() {
  showLoading("Cargando Detalle...");
  await waitForPaint_();

  try {
    const authRaw = localStorage.getItem("authUser") || sessionStorage.getItem("authUser");

    if (!authRaw) {
      window.location.href = "index.html";
      return;
    }

    state.auth = JSON.parse(authRaw);
    state.rowNumber = Number(new URLSearchParams(window.location.search).get("row") || 0);

    if (!state.rowNumber) {
      hideLoading();
      setMessage("No se recibió el registro seleccionado.", "error");
      return;
    }

    bindEvents();

    const url = `${APP_SCRIPT_URL}?action=cierreAnomaliaInit&usuario=${encodeURIComponent(state.auth.usuario)}&row=${state.rowNumber}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.ok) {
      hideLoading();
      setMessage(data.message || "No se pudo cargar el detalle.", "error");
      return;
    }

    state.canEdit = !!data.canEdit;
    state.locations = data.locations || [];
    state.reasonCodes = data.reasonCodes || [];

    renderTopUser(data.user || {});
    renderReasonCodes();
    renderRegistro(data.registro || {});
    applyMode();

    hideLoading();
  } catch (error) {
    console.error("initPage error:", error);
    hideLoading();
    setMessage("Error al cargar el detalle.", "error");
  }
}

function bindEvents() {
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }

  if (backBtn) {
    backBtn.addEventListener("click", () => window.location.href = TRACKING_PAGE);
  }

  if (ubicacion) {
    ubicacion.addEventListener("input", handleUbicacionInput);
  }

  document.addEventListener("click", handleOutsideClick);

  if (reasonCode) {
    reasonCode.addEventListener("change", handleReasonChange);
  }

  if (descripcionAnomalia) {
    descripcionAnomalia.addEventListener("input", () => {
      descripcionCount.textContent = descripcionAnomalia.value.length;
    });
  }

  if (cameraBtn) {
    cameraBtn.addEventListener("click", () => cameraInput.click());
  }

  if (galleryBtn) {
    galleryBtn.addEventListener("click", () => galleryInput.click());
  }

  if (cameraInput) {
    cameraInput.addEventListener("change", handleFileSelected);
  }

  if (galleryInput) {
    galleryInput.addEventListener("change", handleFileSelected);
  }

  if (removePhotoBtn) {
    removePhotoBtn.addEventListener("click", clearPhoto);
  }

  if (cierreForm) {
    cierreForm.addEventListener("submit", handleSubmit);
  }
}

function showLoading(text) {
  if (!loadingOverlay) return;

  if (loadingText) {
    loadingText.textContent = text || "Cargando Detalle...";
  }

  loadingOverlay.classList.remove("hidden");
}

function hideLoading() {
  if (!loadingOverlay) return;
  loadingOverlay.classList.add("hidden");
}

function waitForPaint_() {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });
}

function renderTopUser(user) {
  const userName = user.nombre || state.auth.nombre || "Usuario";
  const userRole = user.rol || state.auth.rol || "";
  const userPhoto = user.foto || state.auth.foto || makeInitialsAvatar(userName);

  topUserName.textContent = userName;
  topUserRole.textContent = userRole;
  topUserPhoto.src = userPhoto;
  topUserPhoto.onerror = () => {
    topUserPhoto.src = makeInitialsAvatar(userName);
  };
}

function renderReasonCodes() {
  reasonCode.innerHTML = '<option value="">Seleccione una opción</option>';

  state.reasonCodes.forEach(item => {
    const option = document.createElement("option");
    option.value = item.codigo;
    option.textContent = item.codigo;
    reasonCode.appendChild(option);
  });
}

function renderRegistro(reg) {
  fechaRegistro.value = reg.fechaRegistro || "";
  registradoPor.value = reg.registradoPor || "";
  rol.value = reg.rol || "";
  area.value = reg.area || "";
  jefeDirecto.value = reg.jefeDirecto || "";

  ubicacion.value = reg.ubicacion || "";
  zona.value = reg.zona || "";
  areaZona.value = reg.areaZona || "";

  reasonCode.value = reg.reasonCode || "";
  descripcionReason.value = reg.descripcionReason || "";
  tipoReason.value = reg.tipoReason || "";
  fuente.value = reg.fuente || "";

  descripcionAnomalia.value = reg.descripcionAnomalia || "";
  descripcionCount.textContent = descripcionAnomalia.value.length;

  responsableZona.value = reg.responsableZona || "";
  areaResponsable.value = reg.areaResponsable || "";
  estado.value = reg.estado || "";
  fechaPlanificada.value = reg.fechaPlanificada || "";

  if (reg.fotoInicial) {
    fotoInicialPreview.src = reg.fotoInicial;
    fotoInicialBox.classList.remove("hidden");
  }

  const exactLocation = state.locations.find(item => normalize(item.ubicacion) === normalize(reg.ubicacion || ""));
  if (exactLocation) {
    state.selectedLocation = exactLocation;
  }

  autoResizeTextarea(descripcionReason);
}

function applyMode() {
  if (state.canEdit) {
    modeInfo.textContent = "Modo ADMIN: puede editar Ubicación, Reason Code y Descripción antes de cerrar.";
    ubicacion.readOnly = false;
    reasonCode.disabled = false;
    descripcionAnomalia.readOnly = false;
  } else {
    modeInfo.textContent = "Modo USUARIO: solo lectura. Solo debe adjuntar la foto de cierre.";
    ubicacion.readOnly = true;
    reasonCode.disabled = true;
    descripcionAnomalia.readOnly = true;
  }
}

function handleReasonChange() {
  const code = reasonCode.value;
  const found = state.reasonCodes.find(item => item.codigo === code);
  descripcionReason.value = found ? found.descripcion : "";
  tipoReason.value = found ? found.tipo : "";
  autoResizeTextarea(descripcionReason);
}

function handleUbicacionInput() {
  if (!state.canEdit) return;

  const term = ubicacion.value.trim();
  if (!term) {
    hideSuggestions();
    clearLocationData(false);
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

function clearLocationData(clearInput = false) {
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
    const dataUrl = await compressImage(file, 800, 0.7);
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

        resolve(canvas.toDataURL("image/jpeg", quality));
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

  if (!state.photoDataUrl) {
    setMessage("Debe adjuntar la foto de cierre.", "error");
    return;
  }

  if (state.canEdit) {
    const exactLocation = state.locations.find(
      item => normalize(item.ubicacion) === normalize(ubicacion.value.trim())
    );

    if (!exactLocation) {
      setMessage("Seleccione una ubicación válida de la lista.", "error");
      return;
    }

    if (!reasonCode.value) {
      setMessage("Seleccione un Reason Code.", "error");
      return;
    }

    const detalle = descripcionAnomalia.value.trim();
    if (detalle.length < 10 || detalle.length > 50) {
      setMessage("La descripción debe tener entre 10 y 50 caracteres.", "error");
      return;
    }
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Cerrando...";
  showLoading("Cargando Cierre...");
  await waitForPaint_();

  try {
    const payload = {
      action: "cerrarAnomalia",
      rowNumber: state.rowNumber,
      usuarioLogin: state.auth.usuario,
      photoDataUrl: state.photoDataUrl,
      ubicacion: ubicacion.value.trim(),
      reasonCode: reasonCode.value,
      descripcionAnomalia: descripcionAnomalia.value.trim()
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
        : (data.message || "No se pudo cerrar la anomalía.");

      hideLoading();
      setMessage(errorText, "error");
      submitBtn.disabled = false;
      submitBtn.textContent = "Cerrar anomalía";
      return;
    }

    setMessage("Anomalía cerrada correctamente.", "success");
    showLoading("Cierre exitoso");

    setTimeout(() => {
      window.location.replace(TRACKING_PAGE);
    }, 1200);
  } catch (error) {
    console.error("handleSubmit error:", error);
    hideLoading();
    setMessage("Error al cerrar la anomalía.", "error");
    submitBtn.disabled = false;
    submitBtn.textContent = "Cerrar anomalía";
  }
}

function autoResizeTextarea(element) {
  if (!element) return;
  element.style.height = "44px";
  element.style.height = element.scrollHeight + "px";
}

function setMessage(message, type) {
  formMessage.textContent = message || "";
  formMessage.className = "form-message";

  if (type) {
    formMessage.classList.add(type);
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
