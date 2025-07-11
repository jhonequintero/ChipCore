




document.addEventListener("DOMContentLoaded", function () {
    // Inicializa Particles.js
    particlesJS("particles-js", {
        particles: {
            number: { value: 80, density: { enable: true, value_area: 800 } },
            color: { value: "#ffffff" },
            shape: { type: "circle" },
            opacity: { value: 0.5 },
            size: { value: 3, random: true },
            line_linked: {
                enable: true,
                distance: 150,
                color: "#ffffff",
                opacity: 0.4,
                width: 1
            },
            move: { enable: true, speed: 1.5, direction: "none", out_mode: "out" }
        },
        interactivity: {
            detect_on: "canvas",
            events: {
                onhover: { enable: true, mode: "grab" },
                onclick: { enable: false }
            },
            modes: {
                grab: { distance: 180, line_linked: { opacity: 1 } }
            }
        },
        retina_detect: true
    });

    // === Recuperación de contraseña ===
    const modalRecuperar = document.getElementById("modalRecuperar");
    const modalVerificar = document.getElementById("modalVerificarCodigo");
    let correoTemporal = "";

    window.abrirModalRecuperar = () => {
        modalRecuperar.style.display = "flex";
    };

    window.cerrarModalRecuperar = () => {
        modalRecuperar.style.display = "none";
        document.getElementById("correoRecuperar").value = "";
    };

    window.abrirModalVerificarCodigo = (correo) => {
        correoTemporal = correo;
        modalVerificar.style.display = "flex";
    };

    window.cerrarModalVerificarCodigo = () => {
        modalVerificar.style.display = "none";
        document.getElementById("codigoVerificacion").value = "";
        document.getElementById("nuevaContrasena").value = "";
    };

    // === Enviar correo con código ===
    document.getElementById("formRecuperar").addEventListener("submit", async function (e) {
        e.preventDefault();
        const correo = document.getElementById("correoRecuperar").value.trim();

        if (!correo) return showMessageModal("❗ Ingresa tu correo", "warning");

        try {
            const res = await fetch("/enviar_codigo_verificacion", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ correo })
            });

            const data = await res.json();

            if (res.ok) {
                showMessageModal("📧 Código enviado al correo", "success");
                cerrarModalRecuperar();
                abrirModalVerificarCodigo(correo);
            } else {
                showMessageModal("❌ " + (data.mensaje || "Error al enviar código"), "error");
            }
        } catch (error) {
            console.error("Error al enviar código:", error);
            showMessageModal("❌ Error del servidor", "error");
        }
    });

    // === Verificar código y cambiar contraseña ===
    document.getElementById("formVerificarCodigo").addEventListener("submit", async function (e) {
        e.preventDefault();
        const codigo = document.getElementById("codigoVerificacion").value.trim();
        const nueva = document.getElementById("nuevaContrasena").value.trim();

        if (!codigo || !nueva) {
            showMessageModal("❗ Todos los campos son obligatorios", "warning");
            return;
        }

        try {
            const res = await fetch("/verificar_codigo_y_cambiar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    correo: correoTemporal,
                    codigo,
                    nueva_contrasena: nueva
                })
            });

            const data = await res.json();

            if (res.ok) {
                showMessageModal("🔒 Contraseña actualizada", "success");
                cerrarModalVerificarCodigo();
            } else {
                showMessageModal("❌ " + (data.mensaje || "Código incorrecto"), "error");
            }

        } catch (error) {
            console.error("Error al verificar código:", error);
            showMessageModal("❌ Error al conectar", "error");
        }
    });
});

// Función para mostrar mensajes modales 
function showMessageModal(message, type = 'info') {
    const modal = document.getElementById('modalMensajes');
    const modalText = document.getElementById('textoModalMensajes');
    const modalIcon = document.getElementById('iconoModalMensajes');

    if (!modal || !modalText) {
        // Fallback en caso de que el modal HTML no esté cargado
        console.error("Elementos del modal de mensajes no encontrados. Fallback a console.log:", message);
        return;
    }

    modalText.textContent = message;
    // Remueve clases anteriores y añade la nueva para el tipo de mensaje
    modal.classList.remove('success', 'error', 'warning');
    modal.classList.add(type);

    if (modalIcon) {
        modalIcon.classList.remove('fa-check-circle', 'fa-times-circle', 'fa-exclamation-triangle');
        if (type === 'success') {
            modalIcon.classList.add('fa-check-circle');
        } else if (type === 'error') {
            modalIcon.classList.add('fa-times-circle');
        } else if (type === 'warning') {
            modalIcon.classList.add('fa-exclamation-triangle');
        } else {
            modalIcon.classList.add('fa-info-circle');
        }
    }

    modal.style.display = 'flex';

    setTimeout(() => {
        modal.style.display = 'none';
    }, 1500);
}

// Función para mostrar/ocultar indicador de carga en botones
function toggleLoading(buttonId, isLoading, originalText) {
    const button = document.getElementById(buttonId);
    if (!button) return;

    if (isLoading) {
        button.disabled = true;
        button.classList.add('loading-button');
        button.innerHTML = '<span class="spinner"></span> Cargando...'; // Añade spinner y texto
    } else {
        button.disabled = false;
        button.classList.remove('loading-button');
        button.innerHTML = `<span>${originalText}</span><span></span>`; // Restaura el HTML original del botón
    }
}


// Función para abrir una ventana emergente (popup)
function abrirPopup(id) {
    let popup = document.getElementById(id);
    if (popup) {
        popup.style.display = "block";
    }
}

// Función para cerrar una ventana emergente
function cerrarPopup(id) {
    let popup = document.getElementById(id);
    if (popup) {
        popup.style.display = "none";
        // Limpiar campos del formulario de inicio de sesión
        document.getElementById("correo").value = "";
        document.getElementById("contrasena").value = "";

        // Restaurar el tipo del input contraseña y el ícono
        const input = document.getElementById("contrasena");
        const icono = document.getElementById("iconoOjo");
        input.type = "password";
        icono.classList.remove("fa-eye");
        icono.classList.add("fa-eye-slash");

        // Borrar mensaje de error si existe
        const mensajeError = document.getElementById("mensaje-error");
        if (mensajeError) {
            mensajeError.textContent = "";
            mensajeError.classList.remove("visible");
        }

        document.querySelectorAll(".error").forEach(el => el.remove());
    }
}

document.getElementById("formLogin").addEventListener("submit", async function (e) {
    e.preventDefault();

    const correoInput = document.getElementById("correo");
    const contrasenaInput = document.getElementById("contrasena");
    const loginButton = document.getElementById("botonIniciarSesion");

    const correo = correoInput.value.trim();
    const contrasena = contrasenaInput.value.trim();

    if (!correo || !contrasena) {
        showMessageModal("Correo y contraseña son requeridos.", 'warning');
        if (!correo) correoInput.classList.add("input-error");
        if (!contrasena) contrasenaInput.classList.add("input-error");
        return;
    }

    toggleLoading('botonIniciarSesion', true, 'Ingresar'); // Iniciar indicador de carga

    try {
        const respuesta = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ correo, contrasena })
        });

        const data = await respuesta.json();

        // Limpiar estilos de error anteriores antes de mostrar nuevos
        correoInput.classList.remove("input-error");
        contrasenaInput.classList.remove("input-error");
        const existingErrorMessage = document.getElementById("mensaje-error");
        if (existingErrorMessage) {
            existingErrorMessage.textContent = "";
            existingErrorMessage.classList.remove("visible");
        }


        if (data.success) {
            showMessageModal("Inicio de sesión exitoso. Redireccionando...", 'success');
            setTimeout(() => {
                window.location.href = data.redirect;
            }, 1000);
        } else {
            showMessageModal(data.error, 'error');


            if (data.campo === "contrasena") {
                contrasenaInput.value = "";
                contrasenaInput.classList.add("input-error");
            } else if (data.campo === "ambos") {
                correoInput.value = "";
                contrasenaInput.value = "";
                correoInput.classList.add("input-error");
                contrasenaInput.classList.add("input-error");
            }
        }
    } catch (error) {
        console.error("Error en la petición de login:", error);
        showMessageModal("Error al conectar con el servidor. Intenta de nuevo más tarde.", 'error');
    } finally {
        toggleLoading('botonIniciarSesion', false, 'Ingresar'); // Detener indicador de carga
    }
});


document.getElementById("formLoginHeader").addEventListener("submit", async function (e) {
    e.preventDefault();

    const correoInput = document.getElementById("correo");
    const contrasenaInput = document.getElementById("contrasena");
    const loginButton = document.getElementById("botonIniciarSesion");

    const correo = correoInput.value.trim();
    const contrasena = contrasenaInput.value.trim();

    if (!correo || !contrasena) {
        showMessageModal("Correo y contraseña son requeridos.", 'warning');
        if (!correo) correoInput.classList.add("input-error");
        if (!contrasena) contrasenaInput.classList.add("input-error");
        return;
    }

    toggleLoading('botonIniciarSesion', true, 'Ingresar'); // Iniciar indicador de carga

    try {
        const respuesta = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ correo, contrasena })
        });

        const data = await respuesta.json();

        // Limpiar estilos de error anteriores antes de mostrar nuevos
        correoInput.classList.remove("input-error");
        contrasenaInput.classList.remove("input-error");
        const existingErrorMessage = document.getElementById("mensaje-error");
        if (existingErrorMessage) {
            existingErrorMessage.textContent = "";
            existingErrorMessage.classList.remove("visible");
        }


        if (data.success) {
            showMessageModal("Inicio de sesión exitoso. Redireccionando...", 'success');
            setTimeout(() => {
                window.location.href = data.redirect;
            }, 1000);
        } else {
            showMessageModal(data.error, 'error');


            if (data.campo === "contrasena") {
                contrasenaInput.value = "";
                contrasenaInput.classList.add("input-error");
            } else if (data.campo === "ambos") {
                correoInput.value = "";
                contrasenaInput.value = "";
                correoInput.classList.add("input-error");
                contrasenaInput.classList.add("input-error");
            }
        }
    } catch (error) {
        console.error("Error en la petición de login:", error);
        showMessageModal("Error al conectar con el servidor. Intenta de nuevo más tarde.", 'error');
    } finally {
        toggleLoading('botonIniciarSesion', false, 'Ingresar'); // Detener indicador de carga
    }
});

function togglePassword() {
    const input = document.getElementById("contrasena");
    const icono = document.getElementById("iconoOjo");

    if (input.type === "password") {
        input.type = "text"; // Muestra la contraseña
        icono.classList.remove("fa-eye-slash"); // Remueve el ojo tachado
        icono.classList.add("fa-eye"); // Agrega el ojo normal
    } else {
        input.type = "password"; // Oculta la contraseña
        icono.classList.remove("fa-eye"); // Remueve el ojo normal
        icono.classList.add("fa-eye-slash"); // Agrega el ojo tachado
    }
}

// Limpia el mensaje de error al escribir en los inputs
document.getElementById("correo").addEventListener("input", limpiarError);
document.getElementById("contrasena").addEventListener("input", limpiarError);

function limpiarError() {
    const errorMensaje = document.getElementById("mensaje-error");
    if (errorMensaje) {
        errorMensaje.textContent = "";
        errorMensaje.classList.remove("visible");
    }
    document.getElementById("correo").classList.remove("input-error");
    document.getElementById("contrasena").classList.remove("input-error");
}


