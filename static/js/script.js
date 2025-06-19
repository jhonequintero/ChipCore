// Función para mostrar mensajes modales (NO usar alert)
function showMessageModal(message, type = 'info') {
    const modal = document.getElementById('modalMensajes'); // ID del modal en HTML
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
    modal.classList.add(type); // Clase para estilos (success, error, warning)

    if (modalIcon) {
        modalIcon.classList.remove('fa-check-circle', 'fa-times-circle', 'fa-exclamation-triangle');
        if (type === 'success') {
            modalIcon.classList.add('fa-check-circle');
        } else if (type === 'error') {
            modalIcon.classList.add('fa-times-circle');
        } else if (type === 'warning') {
            modalIcon.classList.add('fa-exclamation-triangle');
        } else {
            modalIcon.classList.add('fa-info-circle'); // Default icon
        }
    }

    modal.style.display = 'flex'; // Muestra el modal

    // Ocultar automáticamente después de 3 segundos
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

// Función para cerrar una ventana emergente (popup)
function cerrarPopup(id) {
    let popup = document.getElementById(id);
    if (popup) {
        popup.style.display = "none";
        // Limpiar campos del formulario de inicio de sesión
        document.getElementById("correo").value = ""; // Usando ID original 'correo'
        document.getElementById("contrasena").value = ""; // Usando ID original 'contrasena'

        // Restaurar el tipo del input contraseña y el ícono
        const input = document.getElementById("contrasena"); // Usando ID original 'contrasena'
        const icono = document.getElementById("iconoOjo");
        input.type = "password";
        icono.classList.remove("fa-eye");
        icono.classList.add("fa-eye-slash");

        // Borrar mensaje de error si existe
        const mensajeError = document.getElementById("mensaje-error"); // Usando ID original 'mensaje-error'
        if (mensajeError) {
            mensajeError.textContent = "";
            mensajeError.classList.remove("visible"); // Oculta visualmente el mensaje de error
        }

        // Si hay algún <p class="error"> añadido dinámicamente, también se borra
        document.querySelectorAll(".error").forEach(el => el.remove());
    }
}

document.getElementById("formLogin").addEventListener("submit", async function (e) {
    e.preventDefault(); // Evita la recarga de la página

    const correoInput = document.getElementById("correo"); // Usando ID original 'correo'
    const contrasenaInput = document.getElementById("contrasena"); // Usando ID original 'contrasena'
    const loginButton = document.getElementById("botonIniciarSesion"); // Asegúrate de que tu botón tenga este ID en el HTML

    const correo = correoInput.value.trim();
    const contrasena = contrasenaInput.value.trim();

    // Validación básica en el cliente
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
            }, 1000); // Dar un segundo para que el mensaje se vea antes de redireccionar
        } else {
            showMessageModal(data.error, 'error'); // Usar el modal para mostrar el error

            // También puedes seguir mostrando el error debajo del formulario si lo prefieres,
            // pero el modal ya cumple esta función. Lo dejo comentado si el modal es suficiente:
            // const mensaje = document.getElementById("mensaje-error") || document.createElement("p");
            // if (!mensaje.id) {
            //     mensaje.id = "mensaje-error";
            //     document.querySelector("#formLogin").appendChild(mensaje);
            // }
            // mensaje.classList.add("error", "visible"); // Añade clase 'visible' para mostrarlo
            // mensaje.textContent = data.error;

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
    const input = document.getElementById("contrasena"); // Usando ID original 'contrasena'
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
document.getElementById("correo").addEventListener("input", limpiarError); // Usando ID original 'correo'
document.getElementById("contrasena").addEventListener("input", limpiarError); // Usando ID original 'contrasena'

function limpiarError() {
    const errorMensaje = document.getElementById("mensaje-error"); // Usando ID original 'mensaje-error'
    if (errorMensaje) {
        errorMensaje.textContent = "";
        errorMensaje.classList.remove("visible"); // Oculta visualmente el mensaje
    }
    document.getElementById("correo").classList.remove("input-error"); // Usando ID original 'correo'
    document.getElementById("contrasena").classList.remove("input-error"); // Usando ID original 'contrasena'
}

// Inicialización de Particles.js
// Se recomienda inicializar Particles.js solo una vez y cuando el DOM esté completamente cargado.
window.onload = function () {
    particlesJS("particles-js", {
        particles: {
            number: {
                value: 80, // Valor de partículas
                density: { enable: true, value_area: 800 }
            },
            color: { value: "#ffffff" },
            shape: { type: "circle" },
            opacity: { value: 0.5, random: false },
            size: { value: 3, random: true },
            line_linked: { enable: true, distance: 150, color: "#ffffff", opacity: 0.4, width: 1 },
            move: { enable: true, speed: 1.5, direction: "none", out_mode: "out" }
        },
        interactivity: {
            detect_on: "canvas",
            events: { onhover: { enable: true, mode: "grab" }, onclick: { enable: false } },
            modes: { grab: { distance: 180, line_linked: { opacity: 1 } } }
        },
        retina_detect: true
    });
};
