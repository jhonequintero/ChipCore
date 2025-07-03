
// --- Window.onload (para cosas que dependen de que todos los recursos, incluyendo imágenes, estén cargados) ---
// ParticlesJS se ejecuta cuando toda la página y sus recursos están cargados.
window.onload = function () {
    particlesJS("particles-js", {
        particles: {
            number: {
                value: 180,
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





// Función para deslizar una ventana (modal)
function deslizarventana() {
    document.getElementById('ventana').classList.toggle('open');
}

// Función para mostrar/ocultar secciones de contenido
function Enseñarpag(id) {
    document.querySelectorAll('.contenido').forEach(div => {
        div.classList.add('oculto');
    });

    const seccion = document.getElementById(id);
    if (seccion) {
        seccion.classList.remove('oculto');
    } else {
        console.warn(`Enseñarpag: no existe el elemento con id="${id}"`);
    }
}


let carrito = []; // glabal

// Función para renderizar el carrito en la interfaz
function renderCarrito() {
    const container = document.querySelector(".productosenlista");
    container.innerHTML = "";

    carrito.forEach(item => {
        const div = document.createElement("div");
        div.className = "producto";
        const precioTotal = item.precio * item.cantidad;

        div.innerHTML = `
            <div class="celda eliminar">
                <button onclick="eliminar(${item.id})">🗑️</button>
            </div>
            <div class="celda id">${item.id}</div>
            <div class="celda cantidad">
                <button onclick="decrementar(${item.id})">-</button>
                ${item.cantidad}
                <button onclick="incrementar(${item.id})">+</button>
            </div>
            <div class="celda precio">$${item.precio.toFixed(2)}</div>
            
            <div class="celda precio-total">$${precioTotal.toFixed(2)}</div>
            
        `;
        container.appendChild(div);
    });
}
// Función para verificar y agregar productos al carrito (modificado con modal)
async function verificarYAgregar(id, cantidad) {
    try {
        const existe = carrito.find(p => p.id === id);
        const cantidadActual = existe ? existe.cantidad : 0;
        const cantidadTotal = cantidadActual + cantidad;

        const respuesta = await fetch("/verificar_producto", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, cantidad: cantidadTotal })
        });

        const data = await respuesta.json();

        if (!data.existe) {
            showMessageModal("❌ " + data.mensaje, 'error');
            return;
        }

        if (!data.suficiente) {
            showMessageModal(`⚠️ ${data.mensaje}. Solo quedan ${data.stock} unidades.`, 'warning');
            return;
        }

        if (existe) {
            existe.cantidad += cantidad;
        } else {
            carrito.push(data.producto);
        }
        renderCarrito();

    } catch (error) {
        console.error("Error:", error);
        showMessageModal("❌ Error al conectar con el servidor.", 'error');
    }
}

// Funciones para modificar la cantidad de productos en el carrito
function agregarAlCarrito(producto) { // Esta función podría no ser necesaria si solo usas verificarYAgregar
    const existe = carrito.find(p => p.id === producto.id);
    if (existe) {
        existe.cantidad += producto.cantidad;
    } else {
        carrito.push(producto);
    }
    renderCarrito();
}

function incrementar(id) {
    const item = carrito.find(p => p.id === id);
    if (!item) return;

    verificarYAgregar(id, 1);
}

function decrementar(id) {
    const item = carrito.find(p => p.id === id);
    if (!item) return;

    item.cantidad--;
    if (item.cantidad <= 0) {
        carrito = carrito.filter(p => p.id !== id);
    }
    renderCarrito();
}

function eliminar(id) {
    carrito = carrito.filter(p => p.id !== id);
    renderCarrito();
}


// Función para filtrar productos
function filtrarProductos() {
    const inputElement = document.getElementById("buscador");
    const texto = inputElement.value.trim().toLowerCase();
    const productos = document.querySelectorAll(".divdivproducto");
    const mensaje = document.getElementById("mensaje-no-encontrado");

    let encontrados = 0;

    if (texto === "") {
        productos.forEach(producto => {
            producto.style.display = "flex";
        });
        if (mensaje) mensaje.style.display = "none";
        inputElement.focus();
        return;
    }

    productos.forEach(producto => {
        const nombre = producto.querySelector(".colum1 h3").textContent.toLowerCase();
        const id = producto.querySelector(".insertid")?.textContent.toLowerCase() || "";

        if (nombre.includes(texto) || id.includes(texto)) {
            producto.style.display = "flex";
            encontrados++;
        } else {
            producto.style.display = "none";
        }
    });

    if (mensaje) {
        mensaje.style.display = encontrados === 0 ? "block" : "none";
    }
}

// --- Event Listeners (se ejecutan cuando el DOM está completamente cargado) ---

document.addEventListener('DOMContentLoaded', () => {
    Enseñarpag('divperfil');

    // Manejador de evento para el botón de deslizar ventana
    const btnDeslizar = document.querySelector('button');
    if (btnDeslizar) {
        btnDeslizar.addEventListener('click', deslizarventana);
    }







    // Eventos para la búsqueda de productos
    document.querySelector(".botonbusquedaProductos").addEventListener("click", function (e) {
        e.preventDefault();
        filtrarProductos();
    });

    document.getElementById("buscador").addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            filtrarProductos();
        }
    });




    document.querySelector(".botonaddid").addEventListener("click", async (e) => {
        e.preventDefault();

        const boton = e.target;
        boton.disabled = true;
        boton.innerText = "Agregando...";

        const inputs = document.querySelectorAll(".addid .entradaid");
        const inputID = inputs[0];
        const inputCantidad = inputs[1];

        const id = parseInt(inputID.value);
        const cantidad = parseInt(inputCantidad.value);

        if (!id || !cantidad || cantidad <= 0) {
            showMessageModal("❗ Ingresa un ID y cantidad válidos.", "warning");
            boton.disabled = false;
            boton.innerText = "Agregar";
            return;
        }

        await verificarYAgregar(id, cantidad);

        inputID.value = "";
        inputCantidad.value = "";

        boton.disabled = false;
        boton.innerText = "Agregar";
    });





    document.querySelector(".botonenviarcompra").addEventListener("click", async (e) => {
        const boton = e.target;

        if (boton.disabled) return; // evita múltiples envíos

        boton.disabled = true;
        boton.innerText = "Procesando...";

        const nombre = document.getElementById("nombre_completo").value;
        const correo = document.getElementById("correo").value;
        const cedula = document.getElementById("cedula").value;

        if (!nombre || !correo || !cedula || carrito.length === 0) {
            showMessageModal("❗ Debes llenar los datos del cliente y tener productos en el carrito.", "warning");
            boton.disabled = false;
            boton.innerText = "Finalizar compra";
            return;
        }

        const data = {
            cliente: { nombre, correo, cedula },
            carrito
        };

        try {
            const res = await fetch("/finalizar_compra", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            if (!res.ok) {
                const errorData = await res.json();
                showMessageModal("❌ Error: " + (errorData.mensaje || "Error desconocido"), "error");
                return;
            }

            const result = await res.json();
            showMessageModal(result.mensaje, "success");

            carrito = [];
            renderCarrito();

            document.getElementById("nombre_completo").value = "";
            document.getElementById("correo").value = "";
            document.getElementById("cedula").value = "";

        } catch (err) {
            console.error("Error:", err);
            showMessageModal("❌ Hubo un problema al guardar la compra.", "error");
        } finally {
            boton.disabled = false;
            boton.innerText = "Finalizar compra";
        }
    });

});

// Autocompletar datos del cliente al salir del campo de cédula
document.getElementById('cedula').addEventListener('blur', function () {
    const cedula = this.value.trim();
    if (cedula === '') return;

    fetch('/buscar_cliente', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cedula })
    })
        .then(res => res.json())
        .then(data => {
            if (data.existe) {
                document.getElementById('nombre_completo').value = data.nombre;
                document.getElementById('correo').value = data.correo;
            } else {
                document.getElementById('nombre_completo').value = '';
                document.getElementById('correo').value = '';
            }
        })
        .catch(err => {
            console.error('Error al buscar cliente:', err);
        });
});





// Mostrar y cerrar el modal
function abrirModalActualizarPerfil() {
    document.getElementById("modalActualizarPerfil").style.display = "flex";
}

function cerrarModalActualizarPerfil() {
    document.getElementById("modalActualizarPerfil").style.display = "none";
    document.getElementById("formActualizarPerfil").reset(); // Limpia el formulario
}

// Envío del formulario con AJAX sin recargar la página
document.getElementById("formActualizarPerfil").addEventListener("submit", async function (e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const boton = form.querySelector("button[type='submit']");

    boton.disabled = true;
    boton.innerText = "Actualizando...";

    try {
        const res = await fetch("/actualizar_perfil", {
            method: "POST",
            body: formData
        });

        const data = await res.json();

        if (data.success) {
            showMessageModal("✅ Perfil actualizado correctamente", "success");

            // Actualizar en tiempo real los datos visibles del perfil
            document.querySelector(".valor.nombre").textContent = formData.get("nombre");
            document.querySelector(".valor.apellido").textContent = formData.get("apellido");
            document.querySelector(".valor.correo").textContent = formData.get("correo");

            cerrarModalActualizarPerfil(); // Cierra y limpia el modal

        } else {
            showMessageModal("❌ " + (data.mensaje || "Error al actualizar perfil"), "error");
        }

    } catch (error) {
        console.error("Error al actualizar perfil:", error);
        showMessageModal("❌ Error al conectar con el servidor", "error");
    } finally {
        boton.disabled = false;
        boton.innerText = "Guardar cambios";
    }
});


