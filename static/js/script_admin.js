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



// Función para mostrar mensajes modales 
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





function deslizarventana() {
    document.getElementById('ventana').classList.toggle('open');
}

// Función para mostrar/ocultar secciones de contenido
function Enseñarpag(id) {
    const secciones = document.querySelectorAll(".contenido");
    secciones.forEach(s => s.classList.add("oculto"));

    const target = document.getElementById(id);
    if (target) {
        target.classList.remove("oculto");

        if (id === "buscarproducto") {
            cargarProductos();
        }
        if (id === "usuarios") {
            cargarUsuarios();
        }


        if (id === "Recibos") {
            cargarVentas();
        }
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



// 🔁 Cargar todos los productos dinámicamente
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
                    <div class="botoneditaroeliminar">
                        <div class="botonx">
                            <button class="buttonX btn-editar-producto"
                                data-id="${p.id}"
                                data-nombre="${p.nombre}"
                                data-descripcion="${p.descripcion}"
                                data-cantidad="${p.cantidad}"
                                data-precio="${p.precio}">
                                <img class="imgx" src="/static/img/tuerca.png" alt="Editar">
                            </button>
                        </div>
                    </div>
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
                cerrarModal();
                form.reset();
                showMessageModal("✅ Producto actualizado correctamente", "success");
                // Solo recarga productos si estás viendo la sección de productos
                const seccionProductos = document.getElementById("buscarproducto");
                if (seccionProductos && !seccionProductos.classList.contains("oculto")) {
                    cargarProductos();
                }

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
async function cargarUsuarios() {
    try {
        const contenedor = document.getElementById("contenedor-usuarios");
        if (!contenedor) return;

        const res = await fetch("/api/usuarios");
        const usuarios = await res.json();

        contenedor.innerHTML = '';  // Limpia antes de renderizar

        if (usuarios.length === 0) {
            contenedor.innerHTML = '<p>No hay usuarios registrados.</p>';
            return;
        }

        usuarios.forEach(u => {
            const estadoTexto = u.estado ? "Activo" : "Inactivo";
            const claseEstado = u.estado ? "activo" : "inactivo";
            const textoBoton = u.estado ? "Desactivar" : "Activar";

            const usuarioHTML = `
                <div class="divdivuser">
                        <div class="boton1">
                            <button class="buttonEstado" onclick="cambiarEstadoUsuario(${u.id})">
                                ${textoBoton}
                            </button>
                        </div>
                    <div class="divuser">
                        <div class="colum1" style="display: flex; justify-content: center; align-items: center;">
                            <div class="genero">
                                <img style="border: 1px ridge black;" class="Imggener" src="/static/img/mujer.png" alt="Imagen Usuario">
                            </div>
                        </div>
                        <div class="colum2" style="display: flex; justify-content: center; align-items: center;">
                            <div class="divnombreydatos">
                                <div class="nombredato">
                                    <h3>${u.nombre} ${u.apellido}</h3>
                                </div>
                                <div class="divdatos">
                                    <div class="dato1 displaydatos">
                                        <div class="caracter">
                                            <h5>ID:</h5>
                                        </div>
                                        <div class="pedircaracter">${u.codigo_empleado}</div>
                                    </div>
                                    <div class="dato2 displaydatos">
                                        <div class="caracter">
                                            <h5>Correo:</h5>
                                        </div>
                                        <div class="pedircaracter">${u.correo}</div>
                                    </div>
                                    <div class="dato3 displaydatos">
                                        <div class="caracter">
                                            <h5>Cédula:</h5>
                                        </div>
                                        <div class="pedircaracter">${u.cedula}</div>
                                    </div>
                                    <div class="dato4 displaydatos">
                                        <div class="caracter">
                                            <h5>Rol:</h5>
                                        </div>
                                        <div class="pedircaracter">${u.rol}</div>
                                    </div>
                                    <div class="dato5 displaydatos estadoUsuario">
                                        <div class="caracter">
                                            <h5>Estado:</h5>
                                        </div>
                                        <div class="pedircaracter ${claseEstado}">
                                            ${estadoTexto}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            contenedor.innerHTML += usuarioHTML;
        });

    } catch (error) {
        console.error("Error al cargar usuarios:", error);
        showMessageModal("❌ No se pudieron cargar usuarios", "error");
    }
}

function cambiarEstadoUsuario(id) {
    const boton = document.querySelector(`button[onclick="cambiarEstadoUsuario(${id})"]`);
    if (!boton) return;

    boton.disabled = true;           // ⛔ Desactiva el botón
    const textoOriginal = boton.innerText;
    boton.innerText = "Procesando...";

    fetch(`/cambiar_estado_usuario/${id}`, {
        method: "POST"
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showMessageModal(data.mensaje, "success");

                const estadoTexto = document.getElementById(`estado-texto-${id}`);
                if (estadoTexto) {
                    if (data.nuevo_estado) {
                        estadoTexto.textContent = "Activo";
                        estadoTexto.classList.remove("inactivo");
                        estadoTexto.classList.add("activo");
                        boton.innerText = "Desactivar";
                    } else {
                        estadoTexto.textContent = "Inactivo";
                        estadoTexto.classList.remove("activo");
                        estadoTexto.classList.add("inactivo");
                        boton.innerText = "Activar";
                    }
                }
            } else {
                showMessageModal(data.error || "❌ No se pudo cambiar el estado", "error");
                boton.innerText = textoOriginal;
            }
        })
        .catch(err => {
            console.error("Error al cambiar estado:", err);
            showMessageModal("❌ Error del servidor", "error");
            boton.innerText = textoOriginal;
        })
        .finally(() => {
            boton.disabled = false;  // ✅ Reactiva el botón al finalizar
        });
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




// --- Event Listeners (se ejecutan cuando el DOM está completamente cargado) ---

document.addEventListener('DOMContentLoaded', () => {
    Enseñarpag('Recibos');

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
                    cargarUsuarios();


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

                    // 🔄 Recarga todos los productos dinámicamente
                    cargarProductos();

                    // Si deseas seguir usando la tabla, puedes mantener esto o eliminarlo
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

    // Función para filtrar usuarios por cédula 
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
                user.style.display = "grid";
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

            // ✅ NUEVO BLOQUE: refrescar productos si estás viendo la sección de productos
            const seccionProductos = document.getElementById("buscarproducto");
            if (seccionProductos && !seccionProductos.classList.contains("oculto")) {
                await cargarProductos();

                // ✅ Si el buscador tiene texto, aplica el filtro otra vez
                const buscador = document.getElementById("buscador");
                if (buscador && buscador.value.trim() !== "") {
                    filtrarProductos();
                }
            }

            // ✅ NUEVO BLOQUE: refrescar ventas si estás en "Recibos"
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

            cerrarModalActualizarPerfil();
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


// function mostrarSeccion(id_seccion) {
//     document.querySelectorAll('.seccion_ventas').forEach(seccion => {
//         seccion.classList.add('oculto');
//         seccion.classList.remove('visible');
//     });

//     const seccion = document.getElementById(id_seccion);
//     if (seccion) {
//         seccion.classList.remove('oculto');
//         seccion.classList.add('visible');

//         // Cargar datos si está vacío
//         if (!seccion.dataset.cargado) {
//             let tipo = id_seccion.replace('seccion-', '');
//             fetch(`/api/ventas/${tipo}`)
//                 .then(resp => resp.json())
//                 .then(data => {
//                     const contenedorLista = document.getElementById(`listado-${tipo}`);
//                     const canvas = document.getElementById(`grafico-${tipo}`);
//                     let ctx = canvas.getContext('2d');

//                     if (data.length === 0) {
//                         contenedorLista.innerHTML = "<p>Sin ventas registradas.</p>";
//                         return;
//                     }

//                     // Mostrar lista simple
//                     let html = "<ul>";
//                     let etiquetas = [];
//                     let totales = [];

//                     data.forEach(v => {
//                         etiquetas.push(v.fecha);
//                         totales.push(v.total);
//                         html += `<li><strong>${v.fecha}</strong> - ${v.cliente} - $${v.total}</li>`;
//                     });
//                     html += "</ul>";
//                     contenedorLista.innerHTML = html;

//                     // Crear gráfica
//                     new Chart(ctx, {
//                         type: 'bar',
//                         data: {
//                             labels: etiquetas,
//                             datasets: [{
//                                 label: 'Total vendido',
//                                 data: totales,
//                                 backgroundColor: 'rgba(54, 162, 235, 0.6)',
//                                 borderColor: 'rgba(54, 162, 235, 1)',
//                                 borderWidth: 1
//                             }]
//                         },
//                         options: {
//                             responsive: true,
//                             plugins: {
//                                 legend: { position: 'top' },
//                                 title: { display: true, text: `Ventas (${tipo.toUpperCase()})` }
//                             },
//                             scales: {
//                                 y: {
//                                     beginAtZero: true,
//                                     ticks: {
//                                         callback: value => '$' + value.toLocaleString()
//                                     }
//                                 }
//                             }
//                         }
//                     });

//                     seccion.dataset.cargado = "true";
//                 })
//                 .catch(error => {
//                     seccion.innerHTML = "<p>Error al cargar datos.</p>";
//                     console.error(error);
//                 });

//         }
//     }
// }