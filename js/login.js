const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyLDzIgbgG_4st1XAqQfAVxoOqxhZPeU5MEl_tjSxr4c2YJh0mXNk2l9kC05ea2TBkNSQ/exec";

const usuarioInput = document.getElementById("usuario");
const passwordInput = document.getElementById("password");

const vistaUsuario = document.getElementById("vistaUsuario");
const fotoUsuario = document.getElementById("fotoUsuario");
const nombreUsuario = document.getElementById("nombreUsuario");
const rolUsuario = document.getElementById("rolUsuario");

const loginForm = document.getElementById("loginForm");

const loadingOverlay = document.getElementById("loadingOverlay");
const loadingText = document.getElementById("loadingText");
const alertOverlay = document.getElementById("alertOverlay");
const alertMessage = document.getElementById("alertMessage");
const btnAlertAceptar = document.getElementById("btnAlertAceptar");
let usuarioValidado = "";
let buscandoUsuario = false;
let ultimoUsuarioNoExiste = "";
usuarioInput.addEventListener("input", function () {

    usuarioValidado = "";
    ultimoUsuarioNoExiste = "";

    ocultarVista();

});

function showLoading(texto = "Cargando usuario...") {

    loadingText.textContent = texto;

    loadingOverlay.classList.remove("hidden");

}

function hideLoading() {
    loadingOverlay.classList.add("hidden");
}
function mostrarAlerta(mensaje) {

    alertMessage.innerHTML = mensaje.replace(/\n/g, "<br>");

    alertOverlay.classList.remove("hidden");

}

function cerrarAlerta() {

    alertOverlay.classList.add("hidden");

    usuarioInput.focus();

    usuarioInput.select();

}
function cargarFotoUsuario(user) {
    const fotoWeb = (user && user.fotoWeb) || "";
    const fotoApp = (user && user.foto) || "";

    fotoUsuario.dataset.fallback = fotoApp;
    fotoUsuario.dataset.fallbackTried = "0";
    fotoUsuario.style.display = "block";

    fotoUsuario.onerror = function () {
        const fallback = this.dataset.fallback || "";
        const fallbackTried = this.dataset.fallbackTried === "1";

        if (!fallbackTried && fallback) {
            this.dataset.fallbackTried = "1";
            this.src = fallback;
            return;
        }

        this.style.display = "none";
    };

    if (fotoWeb || fotoApp) {
        fotoUsuario.src = fotoWeb || fotoApp;
    } else {
        fotoUsuario.src = "";
        fotoUsuario.style.display = "none";
    }
}

btnAlertAceptar.addEventListener("click", cerrarAlerta);
usuarioInput.addEventListener("blur", async function () {
    await verificarUsuario();
});

passwordInput.addEventListener("focus", async function () {

    const usuario = usuarioInput.value.trim();

    if (usuario === "")
        return;

    if (usuario === usuarioValidado)
        return;

    if (usuario === ultimoUsuarioNoExiste)
        return;

    await verificarUsuario();

});

async function verificarUsuario() {

    if (buscandoUsuario)
        return;

    const usuario = usuarioInput.value.trim();

    if (usuario.length < 3) {
        ocultarVista();
        return;
    }

    buscandoUsuario = true;

showLoading("Cargando usuario...");

    try {

        const url = `${APP_SCRIPT_URL}?action=previewUser&usuario=${encodeURIComponent(usuario)}`;

        const response = await fetch(url);

const data = await response.json();

if (data.ok && data.found) {

    hideLoading();

    usuarioValidado = usuario;
    ultimoUsuarioNoExiste = "";

    nombreUsuario.textContent = data.user.nombre || "Usuario detectado";
    rolUsuario.textContent = data.user.rol || "";

cargarFotoUsuario(data.user);

    vistaUsuario.classList.remove("oculto");

} else {

    hideLoading();

usuarioValidado = "";
ultimoUsuarioNoExiste = usuario;

ocultarVista();

mostrarAlerta(
"USUARIO NO EXISTE.\n\nSOLICITAR AL EQUIPO BPE LA CREACION."
);

}

    } catch (error) {

        console.error(error);

        hideLoading();

        usuarioValidado = "";

        ocultarVista();

        mostrarAlerta("Error consultando el usuario.");

    }

    buscandoUsuario = false;

}

function ocultarVista() {

    vistaUsuario.classList.add("oculto");

    fotoUsuario.src = "";
    fotoUsuario.style.display = "block";
    fotoUsuario.dataset.fallback = "";
    fotoUsuario.dataset.fallbackTried = "0";

    nombreUsuario.textContent = "Usuario detectado";
    rolUsuario.textContent = "";

}

fotoUsuario.onerror = function () {
    this.style.display = "none";
};

loginForm.addEventListener("submit", async function (e) {

    e.preventDefault();

    const usuario = usuarioInput.value.trim();
    const password = passwordInput.value.trim();

    if (!usuario || !password) {
        alert("Ingrese usuario y contraseña.");
        return;
    }

    try {
        showLoading("Iniciando sesión...");
        const response = await fetch(APP_SCRIPT_URL, {

            method: "POST",

            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },

            body: JSON.stringify({

                action: "login",

                usuario: usuario,

                password: password

            })

        });

        const data = await response.json();

        if (data.ok && data.authenticated) {

            localStorage.setItem("authUser", JSON.stringify(data.user));
            sessionStorage.setItem("authUser", JSON.stringify(data.user));

            window.location.href = "menu.html";

}else{

    hideLoading();

    alert(data.message || "Credenciales incorrectas");

}

    } catch(error){

    hideLoading();

    console.error(error);

    alert("Error al iniciar sesión");

}

});
