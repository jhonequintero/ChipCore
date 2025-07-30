
// =====================================================================================
// SECCIÓN 1: INICIALIZACIÓN Y FUNCIONES GLOBALES ESENCIALES

// --- 1.1. Window.onload: Carga de Partículas JS (particles-js) ---
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

// --- 1.2. Función: para mostrar mensajes en el modal ---
function showMessageModal(message, type = 'info') {
    const modal = document.getElementById('modalMensajes');
    const modalText = document.getElementById('textoModalMensajes');
    const modalIcon = document.getElementById('iconoModalMensajes');

    if (!modal || !modalText) {
        console.error("Elementos del modal de mensajes no encontrados. Fallback a console.log:", message);
        return;
    }

    modalText.textContent = message;
    modal.classList.remove('success', 'error', 'warning');
    modal.classList.add(type);

    if (modalIcon) {
        modalIcon.classList.remove('fa-check-circle', 'fa-times-circle', 'fa-exclamation-triangle', 'fa-info-circle');
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


// =====================================================================================
// SECCIÓN 2: FUNCIONES DE INTERFAZ DE USUARIO Y NAVEGACIÓN

// --- 2.1. Función: deslizarventana ---
function deslizarventana() {
    document.getElementById('ventana').classList.toggle('open');
}

// --- 2.2. Función: Enseñarpag ---
// Controla la visibilidad de las diferentes secciones de contenido en el panel.
function Enseñarpag(id) {
    const secciones = document.querySelectorAll(".contenido");
    secciones.forEach(s => s.classList.add("oculto"));

    const target = document.getElementById(id);
    if (target) {
        target.classList.remove("oculto");

        if (id === "buscarproducto") {
            cargarProductos();
        }


        if (id === "Recibos") {
            cargarVentas();
        }
    }
}



// --- 3.2. Función: cargarProductos ---
//  Obtiene y renderiza la lista de productos desde la API (`/api/productos`).
async function cargarProductos() {
    try {
        const contenedor = document.querySelector(".mostrarproductos");
        if (!contenedor) return;

        const res = await fetch("/api/productos");
        const productos = await res.json();

        contenedor.innerHTML = '';
        if (productos.length === 0) {
            contenedor.innerHTML += '<p>No hay productos registrados.</p>';
            return;
        }

        productos.forEach(p => {
            const agotado = p.cantidad > 0
                ? p.cantidad
                : `<span style="display:inline-block; height:89%; width:7vh; text-align: center; color: red; font-weight: bold;">None</span>`;
            const productoHTML = `
                <div class="divdivproducto">
                       
                    <div class="divproducto">
                        <div class="colum1">
                            <h3>${p.nombre}</h3>
                            <div class="divdescripcion">
                                <h4>Descripción</h4>
                                <div class="letradescripcion">${p.descripcion}</div>
                            </div>
                        </div>
                        <div class="colum2">
                            <div class="divid">
                                <div class="id">
                                    <h3>ID:</h3>
                                    <div class="insertid">${p.id}</div>
                                </div>
                                <div class="cantidad">
                                    <h3 style="">Cantidad:</h3>
                                    <div style="margin-top: 1vh;" class="insertcantidad">${agotado}</div>
                                </div>
                            </div>
                            <div class="divprice">
                                <div class="precio">
                                    <h4>Precio:</h4>
                                    <div class="insertprecio">$${p.precio.toFixed(2)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            contenedor.innerHTML += productoHTML;
        });

    } catch (error) {
        console.error("Error al cargar productos:", error);
        showMessageModal("❌ No se pudieron cargar productos", "error");
    }
}



// =====================================================================================
// SECCIÓN 4: GESTIÓN DEL CARRITO DE COMPRAS

let carrito = []; // Variable global para almacenar los productos en el carrito.

// --- 4.1. Función: renderCarrito ---
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

// --- 4.2. Función: verificarYAgregar ---
//  Verifica stock y existencia del producto antes de agregarlo al carrito.
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

// --- 4.3. Funciones de Modificación del Carrito ---
//  Permiten agregar, incrementar, decrementar y eliminar productos del carrito.
function agregarAlCarrito(producto) {
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


// =====================================================================================
// SECCIÓN 5: FUNCIONES DE BÚSQUEDA Y FILTRADO

// --- 5.1. Función: filtrarProductos ---
function filtrarProductos() {
    const inputElement = document.getElementById("buscador");
    const texto = inputElement.value.trim().toLowerCase();  // Convierte el texto a minúsculas para búsqueda insensible a mayúsculas
    const productos = document.querySelectorAll(".divdivproducto");  // Todos los productos
    const mensaje = document.getElementById("mensaje-no-encontrado");  // Mensaje cuando no se encuentra ningún producto

    let encontrados = 0;  // Contador de productos encontrados

    if (texto === "") {  // Si el campo de búsqueda está vacío
        productos.forEach(producto => {
            producto.style.display = "flex";  // Mostrar todos los productos
        });
        if (mensaje) mensaje.style.display = "none";  // Ocultar mensaje de "no encontrado"
        inputElement.focus();
        return;
    }

    productos.forEach(producto => {
        const nombre = producto.querySelector(".colum1 h3")?.textContent.toLowerCase() || "";  // Obtener el nombre del producto
        const id = producto.querySelector(".insertid")?.textContent.toLowerCase() || "";  // Obtener el ID del producto

        // Verificar si el nombre o el ID contienen el texto de búsqueda
        if (nombre.includes(texto) || id.includes(texto)) {
            producto.style.display = "flex";  // Mostrar el producto
            encontrados++;
        } else {
            producto.style.display = "none";  // Ocultar el producto
        }
    });

    // Mostrar el mensaje de "no encontrado" si no se encuentran productos
    if (mensaje) {
        mensaje.style.display = encontrados === 0 ? "block" : "none";
    }
}



// =====================================================================================
// SECCIÓN 7: GESTIÓN DE VENTAS Y CLIENTES

// --- 7.1. Función: cargarVentas ---
// Guía: Obtiene y renderiza el historial de ventas desde la API (`/api/ventas`).
// async function cargarVentas() {
//     const contenedor = document.querySelector('.divmostrarfacturas');
//     if (!contenedor) return;

//     contenedor.innerHTML = 'Cargando registros de ventas...';

//     try {
//         const res = await fetch('/api/ventas');
//         if (!res.ok) throw new Error('Error al obtener ventas');

//         const ventas = await res.json();

//         if (ventas.length === 0) {
//             contenedor.innerHTML = '<p>No hay registros de ventas.</p>';
//             return;
//         }

//         let html = `
//             <h2>Registro de Ventas</h2>
//             <table border="1" cellspacing="0" cellpadding="4">
//                 <thead>
//                     <tr>
//                         <th>Fecha</th>
//                         <th>Hora</th>
//                         <th>Folio</th>
//                         <th>Nombre Cliente</th>
//                         <th>Cédula Cliente</th>
//                         <th>Código Producto</th>
//                         <th>Nombre Producto</th>
//                         <th>Cantidad</th>
//                         <th>Total Item</th>
//                         <th>Total Venta</th>
//                         <th>Vendedor</th>
//                     </tr>
//                 </thead>
//                 <tbody>
//         `;

//         ventas.forEach(v => {
//             html += `
//                 <tr>
//                     <td>${v.fecha}</td>
//                     <td>${v.hora}</td>
//                     <td>${v.folio}</td>
//                     <td>${v.nombre_cliente}</td>
//                     <td>${v.cedula_cliente}</td>
//                     <td>${v.codigo_producto}</td>
//                     <td>${v.nombre_producto}</td>
//                     <td>${v.cantidad}</td>
//                     <td>$${v.total_detalle_producto.toFixed(2)}</td>
//                     <td>$${v.total_venta_completa.toFixed(2)}</td>
//                     <td>${v.vendedor}</td>
//                 </tr>
//             `;
//         });

//         html += '</tbody></table>';
//         contenedor.innerHTML = html;

//     } catch (error) {
//         contenedor.innerHTML = `<p>Error al cargar ventas: ${error.message}</p>`;
//         console.error("Error al cargar ventas:", error);
//     }
// }

// --- 7.2. Event Listener: Buscar Cliente por Cédula ---
//Autocompleta datos del cliente si la cédula ya existe en la DB.
document.addEventListener('DOMContentLoaded', () => {
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
});

// --- 7.3. Event Listener: Agregar Producto a Carrito (por ID) ---
// Añade productos al carrito desde los campos de ID y cantidad.
document.addEventListener('DOMContentLoaded', () => {
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
});

// --- 7.4. Event Listener: Finalizar Compra ---
//  Procesa la venta, envía datos al servidor y gestiona la respuesta (factura, etc.).
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector(".botonenviarcompra").addEventListener("click", async (e) => {
        const boton = e.target;

        if (boton.disabled) return;

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

            // Limpia el carrito y los campos del cliente
            carrito = [];
            renderCarrito();
            document.getElementById("nombre_completo").value = "";
            document.getElementById("correo").value = "";
            document.getElementById("cedula").value = "";

            // Refresca la vista de productos si está visible
            const seccionProductos = document.getElementById("buscarproducto");
            if (seccionProductos && !seccionProductos.classList.contains("oculto")) {
                await cargarProductos();
                const buscador = document.getElementById("buscador");
                if (buscador && buscador.value.trim() !== "") {
                    filtrarProductos();
                }
            }

            // Refresca la vista de recibos/ventas si está visible
            const seccionRecibos = document.getElementById("Recibos");
            if (seccionRecibos && !seccionRecibos.classList.contains("oculto")) {
                await cargarVentas();
            }

        } catch (err) {
            console.error("Error:", err);
            showMessageModal("❌ Hubo un problema al guardar la compra.", "error");
        }
        finally {
            boton.disabled = false;
            boton.innerText = "Finalizar compra";
        }
    });
});


// =====================================================================================
// SECCIÓN 8: GESTIÓN DE PERFIL DE USUARIO

// --- 8.1. Funciones de Modal de Actualización de Perfil ---
// function abrirModalActualizarPerfil() {
//     document.getElementById("modalActualizarPerfil").style.display = "flex";
// }

// function cerrarModalActualizarPerfil() {
//     document.getElementById("modalActualizarPerfil").style.display = "none";
//     document.getElementById("formActualizarPerfil").reset();
// }

// --- 8.2. Event Listener: Formulario de Actualización de Perfil ---
//  Maneja el envío del formulario para actualizar el perfil del usuario logueado.
// document.addEventListener('DOMContentLoaded', () => {
//     document.getElementById("formActualizarPerfil").addEventListener("submit", async function (e) {
//         e.preventDefault();

//         const form = e.target;
//         const formData = new FormData(form);
//         const boton = form.querySelector("button[type='submit']");

//         boton.disabled = true;
//         boton.innerText = "Actualizando...";

//         try {
//             const res = await fetch("/actualizar_perfil", {
//                 method: "POST",
//                 body: formData
//             });

//             const data = await res.json();

//             if (data.success) {
//                 showMessageModal("✅ Perfil actualizado correctamente", "success");

//                 // Actualizar elementos de la interfaz si es necesario (ej: nombre en el header)
//                 // document.querySelector(".valor.nombre").textContent = formData.get("nombre");
//                 // document.querySelector(".valor.apellido").textContent = formData.get("apellido");
//                 // document.querySelector(".valor.correo").textContent = formData.get("correo");

//                 cerrarModalActualizarPerfil();
//             } else {
//                 showMessageModal("❌ " + (data.mensaje || "Error al actualizar perfil"), "error");
//             }

//         } catch (error) {
//             console.error("Error al actualizar perfil:", error);
//             showMessageModal("❌ Error al conectar con el servidor", "error");
//         } finally {
//             boton.disabled = false;
//             boton.innerText = "Guardar cambios";
//         }
//     });
// });


// =====================================================================================
// SECCIÓN 9: EVENT LISTENERS PRINCIPALES (DOMContentLoaded)

//  Contiene los manejadores de eventos que se activan cuando el DOM está listo.
document.addEventListener('DOMContentLoaded', () => {
    Enseñarpag('divperfil'); // Muestra la sección de  por defecto

    const btnDeslizar = document.querySelector('button');
    if (btnDeslizar) {
        btnDeslizar.addEventListener('click', deslizarventana);
    }


    // --- 9.2. Formulario de Agregación de Producto ---
    //  Maneja el envío del formulario para agregar nuevos productos.
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
                    cargarProductos();
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

    // --- 9.3. Eventos de Búsqueda de Productos ---
    // : Activan la función de filtrado de productos al hacer clic o presionar Enter.
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


});