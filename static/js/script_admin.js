
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

// Mostrar modal al hacer clic en cualquier botón de editar producto
document.addEventListener("click", function (e) {
    const btn = e.target.closest(".btn-editar-producto");
    if (!btn) return;

    document.getElementById("modal_id").value = btn.dataset.id;
    document.getElementById("modal_nombre").value = btn.dataset.nombre;
    document.getElementById("modal_descripcion").value = btn.dataset.descripcion;
    document.getElementById("modal_cantidad").value = btn.dataset.cantidad;
    document.getElementById("modal_precio").value = btn.dataset.precio;

    document.getElementById("modal-editar").style.display = "flex";
});

function cerrarModal() {
    document.getElementById("modal-editar").style.display = "none";
}
document.getElementById("form-editar-producto").addEventListener("submit", function (e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const boton = form.querySelector("button[type='submit']");

    if (boton) {
        boton.disabled = true;
        boton.innerText = "Guardando...";
    }

    fetch("/actualizar_producto", {
        method: "POST",
        body: formData
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                cerrarModal(); // Cierra el modal
                form.reset(); // Limpia el formulario
                showMessageModal("✅ Producto actualizado correctamente", "success");
            } else {
                showMessageModal(data.error || "❌ No se pudo actualizar", "error");
            }
        })
        .catch(err => {
            console.error("Error al actualizar producto:", err);
            showMessageModal("❌ Error del servidor", "error");
        })
        .finally(() => {
            if (boton) {
                boton.disabled = false;
                boton.innerText = "Guardar cambios";
            }
        });
});

// --- Lógica del Carrito de Compras ---

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

// --- Funciones de Búsqueda y Filtrado ---

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

// Función para filtrar usuarios por cédula
function filtrarUsuariosPorCedula() {
    const input = document.getElementById("buscadorCedula");
    const texto = input.value.trim().toLowerCase();
    const usuarios = document.querySelectorAll(".divdivuser");
    const mensaje = document.getElementById("mensaje-no-usuario");

    let encontrados = 0;

    if (texto === "") {
        usuarios.forEach(user => user.style.display = "flex");
        if (mensaje) mensaje.style.display = "none";
        input.focus();
        return;
    }

    usuarios.forEach(user => {
        const cedula = user.querySelector(".dato3 .pedircaracter").textContent.trim().toLowerCase();
        if (cedula.includes(texto)) {
            user.style.display = "flex";
            encontrados++;
        } else {
            user.style.display = "none";
        }
    });

    if (mensaje) {
        mensaje.style.display = encontrados === 0 ? "block" : "none";
    }
}

// --- Funciones relacionadas con ventas y usuarios ---

// Función para cargar registros de ventas
async function cargarVentas() {
    const contenedor = document.querySelector('.divmostrarfacturas');
    contenedor.innerHTML = 'Cargando registros de ventas...';

    try {
        const res = await fetch('/api/ventas');
        if (!res.ok) throw new Error('Error al obtener ventas');

        const ventas = await res.json();

        if (ventas.length === 0) {
            contenedor.innerHTML = '<p>No hay registros de ventas.</p>';
            return;
        }

        let html = `
            <h2>Registro de Ventas</h2>
            <table border="1" cellspacing="0" cellpadding="4">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Hora</th>
                        <th>Folio</th>
                        <th>Nombre Cliente</th>
                        <th>Cédula Cliente</th>
                        <th>Código Producto</th>
                        <th>Nombre Producto</th>
                        <th>Cantidad</th>
                        <th>Total</th>
                        <th>Vendedor</th>
                    </tr>
                </thead>
                <tbody>
        `;

        ventas.forEach(v => {
            html += `
                <tr>
                    <td>${v.fecha}</td>
                    <td>${v.hora}</td>
                    <td>${v.folio}</td>
                    <td>${v.nombre_cliente}</td>
                    <td>${v.cedula_cliente}</td>
                    <td>${v.codigo_producto}</td>
                    <td>${v.nombre_producto}</td>
                    <td>${v.cantidad}</td>
                    <td>$${v.total.toFixed(2)}</td>
                    <td>${v.vendedor}</td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        contenedor.innerHTML = html;

    } catch (error) {
        contenedor.innerHTML = `<p>Error al cargar ventas: ${error.message}</p>`;
    }
}

async function cambiarEstadoUsuario(id_usuario) {
    try {
        const response = await fetch(`/usuario/${id_usuario}/cambiar_estado`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        const data = await response.json();

        if (data.success) {
            const btn = document.querySelector(`button.buttonEstado[onclick="cambiarEstadoUsuario(${id_usuario})"]`);
            if (btn) {
                btn.textContent = data.nuevo_estado ? 'Desactivar' : 'Activar';
            }

            // Actualizar texto visual del estado
            const contenedorEstado = document.querySelector(`#estado-${id_usuario} .pedircaracter`);
            if (contenedorEstado) {
                contenedorEstado.textContent = data.nuevo_estado ? 'Activo' : 'Inactivo';
            }

            // Mostrar modal con mensaje
            showMessageModal(`✅ Usuario ${data.nuevo_estado ? 'activado' : 'desactivado'} correctamente.`, 'success');

        } else {
            showMessageModal('Error: ' + (data.msg || 'No se pudo cambiar el estado'), 'error');
        }
    } catch (error) {
        showMessageModal('❌ Error en la petición: ' + error.message, 'error');
    }
}


// --- Event Listeners (se ejecutan cuando el DOM está completamente cargado) ---

document.addEventListener('DOMContentLoaded', () => {
    // Inicialización de la página al cargar el DOM
    Enseñarpag('divperfil');

    // Manejador de evento para el botón de deslizar ventana
    const btnDeslizar = document.querySelector('button');
    if (btnDeslizar) {
        btnDeslizar.addEventListener('click', deslizarventana);
    }

    // Manejador de evento para el formulario de registro de empleado
    document.getElementById("form-empleado").addEventListener("submit", function (e) {
        e.preventDefault();

        const form = e.target;
        const formData = new FormData(form);
        const boton = form.querySelector("button[type='submit']");

        // Desactiva el botón mientras se envía
        if (boton) boton.disabled = true;

        fetch("/registrar_empleado", {
            method: "POST",
            body: formData
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    showMessageModal(data.mensaje, 'success');
                    form.reset();

                    // OPCIONAL: Agrega el nuevo empleado a una tabla si existe
                    const tabla = document.getElementById("tabla-empleados");
                    if (tabla && data.empleado) {
                        const fila = document.createElement("tr");
                        fila.innerHTML = `
                        <td>${data.empleado.nombre}</td>
                        <td>${data.empleado.apellido}</td>
                        <td>${data.empleado.correo}</td>
                        <td>${data.empleado.codigo_empleado}</td>
                    `;
                        tabla.appendChild(fila);
                    }

                } else {
                    showMessageModal(data.error, 'error');
                }
            })
            .catch(error => {
                console.error("Error al registrar empleado:", error);
                showMessageModal("❌ Hubo un problema al registrar.", 'error');
            })
            .finally(() => {
                // Reactiva el botón pase lo que pase
                if (boton) boton.disabled = false;
            });
    });

    document.getElementById("form-producto").addEventListener("submit", function (e) {
        e.preventDefault();

        const form = e.target;
        const formData = new FormData(form);
        const boton = form.querySelector("button[type='submit']");

        if (boton) {
            boton.disabled = true;
            boton.innerText = "Registrando...";
        }

        fetch("/agregar_producto", {
            method: "POST",
            body: formData
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    showMessageModal(data.mensaje, 'success');
                    form.reset();

                    const tabla = document.getElementById("tabla-productos");
                    if (tabla && data.producto) {
                        const fila = document.createElement("tr");
                        fila.innerHTML = `
                        <td>${data.producto.nombre}</td>
                        <td>$${data.producto.precio}</td>
                        <td>${data.producto.cantidad}</td>
                        <td>${data.producto.descripcion}</td>
                    `;
                        tabla.appendChild(fila);
                    }

                } else {
                    showMessageModal(data.error, 'error');
                }
            })
            .catch(error => {
                console.error("Error al registrar producto:", error);
                showMessageModal("❌ Error del servidor", 'error');
            })
            .finally(() => {
                if (boton) {
                    boton.disabled = false;
                    boton.innerText = "Registrar producto";
                }
            });
    });




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


    // Evento para buscar usuarios por cédula con botón
    document.querySelector(".botonbusquedausuarios").addEventListener("click", function (e) {
        e.preventDefault();
        filtrarUsuariosPorCedula();
    });

    // Evento para buscar usuarios por cédula con Enter
    document.getElementById("buscadorCedula").addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            filtrarUsuariosPorCedula();
        }
    });

    // Función para filtrar usuarios por cédula sin dañar el diseño
    function filtrarUsuariosPorCedula() {
        const input = document.getElementById("buscadorCedula");
        const texto = input.value.trim().toLowerCase();
        const usuarios = document.querySelectorAll(".divdivuser");
        const mensaje = document.getElementById("mensaje-no-usuario");

        let encontrados = 0;

        usuarios.forEach(user => {
            const cedulaElemento = user.querySelector(".dato3 .pedircaracter");
            const cedula = cedulaElemento?.textContent.trim().toLowerCase() || "";

            if (cedula.includes(texto) || texto === "") {
                user.style.display = "grid"; // mantener el layout
                encontrados++;
            } else {
                user.style.display = "none";
            }
        });

        if (mensaje) {
            mensaje.style.display = encontrados === 0 ? "block" : "none";
        }
    }
    // Evento para buscar cliente al salir del campo de cédula
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