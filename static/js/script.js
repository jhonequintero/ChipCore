// abrir ventana
function abrirPopup(id) {
    let popup = document.getElementById(id);
    if (popup) {
        popup.style.display = "block";


    }
}

// cerrar ventana
function cerrarPopup(id) {
    let popup = document.getElementById(id);
    if (popup) {
        popup.style.display = "none";
        // Limpiar campos
        document.getElementById("correo").value = "";
        document.getElementById("contrasena").value = "";

        // Restaurar el tipo del input contraseña y el ícono
        const input = document.getElementById("contrasena");
        const icono = document.getElementById("iconoOjo");
        input.type = "password";
        icono.classList.remove("fa-eye");
        icono.classList.add("fa-eye-slash");

        // Borrar mensaje de error
        const mensajeError = document.querySelector("#mensaje-error");
        if (mensajeError) {
            mensajeError.textContent = "";
        }

        // Si hay algún <p class="error"> añadido dinámicamente, también se borra
        document.querySelectorAll(".error").forEach(el => el.remove());
    }
}



document.getElementById("formLogin").addEventListener("submit", async function (e) {
    e.preventDefault(); // Evita recarga

    const correo = document.getElementById("correo").value;
    const contrasena = document.getElementById("contrasena").value;

    const respuesta = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, contrasena })  // sin tilde aquí
    });

    const data = await respuesta.json();

    if (data.success) {
        window.location.href = data.redirect;
    } else {
        // Elimina errores y bordes anteriores
        document.querySelector(".error")?.remove();
        document.getElementById("correo").classList.remove("input-error");
        document.getElementById("contrasena").classList.remove("input-error");

        const mensaje = document.createElement("p");
        mensaje.classList.add("error");
        mensaje.id = "mensaje-error"; // 👈 para eliminar después
        mensaje.textContent = data.error;
        document.querySelector("#formLogin").appendChild(mensaje);

        if (data.campo === "contrasena") {
            document.getElementById("contrasena").value = "";
            document.getElementById("contrasena").classList.add("input-error");
        } else if (data.campo === "ambos") {
            document.getElementById("correo").value = "";
            document.getElementById("contrasena").value = "";
            document.getElementById("correo").classList.add("input-error");
            document.getElementById("contrasena").classList.add("input-error");
        }
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
        errorMensaje.remove(); // Esto elimina por completo el mensaje
    }
}




// style particulas 
particlesJS("particles-js", {
    particles: {
        number: {
            // value: 700,
            value: 80,
            density: {
                enable: true,
                value_area: 800
            }
        },
        color: {
            value: "#ffffff"
        },
        shape: {
            type: "circle"
        },
        opacity: {
            value: 0.5,
            random: false
        },
        size: {
            value: 3,
            random: true
        },
        line_linked: {
            enable: true,         // Las partículas se conectan entre sí
            distance: 150,
            color: "#ffffff",
            opacity: 0.4,
            width: 1
        },
        move: {
            enable: true,
            speed: 1.5,
            direction: "none",
            out_mode: "out"
        }
    },
    interactivity: {
        detect_on: "canvas",
        events: {
            onhover: {
                enable: true,
                mode: "grab" // Este modo hace que el cursor conecte partículas como si las tocara
            },
            onclick: {
                enable: false
            }
        },
        modes: {
            grab: {
                distance: 180, // Distancia a la que el cursor "agarra" partículas
                line_linked: {
                    opacity: 1 // Qué tan fuerte se ve la línea del cursor a la partícula
                }
            }
        }
    },
    retina_detect: true
});



