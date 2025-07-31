


// --- Window.onload (para cosas que dependen de que todos los recursos, incluyendo imágenes, estén cargados) ---
// ParticlesJS se ejecuta cuando toda la página y sus recursos están cargados.
window.onload = function () {
    particlesJS("particles-js", {
        particles: {
            number: {
                value: 200,
                density: { enable: true, value_area: 800 }
            },
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
            events: { onhover: { enable: true, mode: "grab" }, onclick: { enable: false } },
            modes: { grab: { distance: 180, line_linked: { opacity: 1 } } }
        },
        retina_detect: true
    });
};
// ...código existente...
document.addEventListener("DOMContentLoaded", function () {
    const inputPass = document.getElementById("nuevaContrasena");
    const iconoOjo = document.getElementById("iconEye");
    const toggleBtn = document.getElementById("togglePassword");

    if (toggleBtn && inputPass && iconoOjo) {
        toggleBtn.addEventListener("click", function () {
            if (inputPass.type === "password") {
                inputPass.type = "text";
                iconoOjo.classList.remove("fa-eye-slash");
                iconoOjo.classList.add("fa-eye");
            } else {
                inputPass.type = "password";
                iconoOjo.classList.remove("fa-eye");
                iconoOjo.classList.add("fa-eye-slash");
            }
        });
    }
});

document.addEventListener("DOMContentLoaded", function () {
    let correoTemporal = "";

    function toggleButton(id, estado) {
        const btn = document.getElementById(id);
        if (btn) {
            btn.disabled = !estado;
            if (!estado) {
                btn.classList.add("loading-button");
            } else {
                btn.classList.remove("loading-button");
            }
        }
    }

    function showMessageModal(mensaje, tipo = "success") {
        const modal = document.getElementById("modalMensajes");
        const icono = document.getElementById("iconoModalMensajes");
        const texto = document.getElementById("textoModalMensajes");

        modal.className = `message-modal ${tipo}`;
        icono.className = tipo === "success" ? "fas fa-check-circle"
            : tipo === "error" ? "fas fa-times-circle"
                : "fas fa-exclamation-circle";

        texto.textContent = mensaje;
        modal.style.display = "flex";

        setTimeout(() => {
            modal.style.display = "none";
        }, 2000);
    }

    function mostrarPaso(idPaso) {
        document.querySelectorAll(".paso").forEach(p => p.style.display = "none");
        const paso = document.getElementById(idPaso);
        if (paso) paso.style.display = "block";
    }

    // === Paso 1: Buscar cuenta ===
    async function buscarCuenta() {
        toggleButton("btn-buscar", false);
        const correo = document.getElementById("input_correo_unico").value.trim();
        if (!correo) {
            showMessageModal("❗ Ingresa un correo", "warning");
            toggleButton("btn-buscar", true);
            return;
        }

        try {
            const res = await fetch("/verificar_correo_existente", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ correo })
            });

            const data = await res.json();
            if (res.ok && data.existe) {
                correoTemporal = correo;
                document.getElementById("correoMostrar").textContent = correo;
                document.getElementById("correoMostrar2").textContent = correo;
                mostrarPaso("paso-enviar");
            } else {
                showMessageModal("❌ No existe ninguna cuenta con ese correo", "error");
            }
        } catch (error) {
            console.error(error);
            showMessageModal("❌ Error del servidor", "error");
        }

        toggleButton("btn-buscar", true);
    }

    document.getElementById("btn-buscar").addEventListener("click", buscarCuenta);
    document.getElementById("input_correo_unico").addEventListener("keydown", e => {
        if (e.key === "Enter") buscarCuenta();
    });

    // === Paso 2: Enviar código ===
    async function enviarCodigo() {
        toggleButton("btn-enviar", false);
        try {
            const res = await fetch("/enviar_codigo_verificacion", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ correo: correoTemporal })
            });

            const data = await res.json();

            if (res.ok) {
                showMessageModal("📧 Código enviado al correo", "success");
                mostrarPaso("paso-verificar");
            } else {
                showMessageModal("❌ " + (data.mensaje || "Error al enviar código"), "error");
            }
        } catch (error) {
            console.error(error);
            showMessageModal("❌ Error del servidor", "error");
        }
        toggleButton("btn-enviar", true);
    }

    document.getElementById("btn-enviar").addEventListener("click", enviarCodigo);

    // === Paso 3: Verificar código ===
    async function verificarCodigo() {
        toggleButton("btn-verificar", false);
        const codigo = document.getElementById("codigoVerificacion").value.trim();
        if (!codigo) {
            showMessageModal("❗ Ingresa el código", "warning");
            toggleButton("btn-verificar", true);
            return;
        }

        try {
            const res = await fetch("/verificar_codigo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ correo: correoTemporal, codigo })
            });

            const data = await res.json();

            if (res.ok && data.validado) {
                mostrarPaso("paso-nueva");
            } else {
                showMessageModal("❌ Código incorrecto", "error");
            }
        } catch (err) {
            console.error(err);
            showMessageModal("❌ Error al verificar", "error");
        }
        toggleButton("btn-verificar", true);
    }

    document.getElementById("btn-verificar").addEventListener("click", verificarCodigo);
    document.getElementById("codigoVerificacion").addEventListener("keydown", e => {
        if (e.key === "Enter") verificarCodigo();
    });

    // === Paso 4: Cambiar contraseña ===
    async function actualizarContrasena() {
        toggleButton("btn-guardar", false);
        const nueva = document.getElementById("nuevaContrasena").value.trim();

        if (!nueva || nueva.length < 6) {
            showMessageModal("❗ Ingresa una nueva contraseña válida", "warning");
            toggleButton("btn-guardar", true);
            return;
        }

        try {
            const res = await fetch("/cambiar_contrasena", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ correo: correoTemporal, nueva_contrasena: nueva })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                showMessageModal("🔒 Contraseña actualizada", "success");
                setTimeout(() => {
                    window.location.href = data.redirect;
                }, 1500);
            } else {
                showMessageModal("❌ No se pudo actualizar", "error");
            }
        } catch (err) {
            console.error(err);
            showMessageModal("❌ Error al guardar contraseña", "error");
        }
        toggleButton("btn-guardar", true);
    }

    document.getElementById("btn-guardar").addEventListener("click", actualizarContrasena);
    document.getElementById("nuevaContrasena").addEventListener("keydown", e => {
        if (e.key === "Enter") actualizarContrasena();
    });

    // Botones volver
    document.getElementById("btn-volver-buscar").addEventListener("click", () => {
        mostrarPaso("paso-buscar");
    });
    document.getElementById("btn-volver-correo").addEventListener("click", () => {
        mostrarPaso("paso-enviar");
    });

    document.getElementById("btn-cancelar-buscar").addEventListener("click", () => {
        window.location.href = "/";
    });
});
