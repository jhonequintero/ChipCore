// --- Window.onload (para cosas que dependen de que todos los recursos, incluyendo imágenes, estén cargados) ---
// ParticlesJS se ejecuta cuando toda la página y sus recursos están cargados.
window.onload = function () {
    const particlesDiv = document.getElementById("particles-js");
    if (particlesDiv && particlesDiv.offsetHeight > 0) {
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
            // tu configuración aquí...
        });
    }
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
                                    <div class="insertprecio">${p.precio.toLocaleString("es-CO", { style: "currency", currency: "COP" })}</div>

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

// Función debounce para evitar que se ejecute en cada letra
function debounce(func, delay = 300) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
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
            const textoBoton = u.estado ? "Off" : "On";

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
                        boton.innerText = "off";
                    } else {
                        estadoTexto.textContent = "Inactivo";
                        estadoTexto.classList.remove("activo");
                        estadoTexto.classList.add("inactivo");
                        boton.innerText = "on";
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




// --- Event Listeners (se ejecutan cuando el DOM está completamente cargado) ---

document.addEventListener('DOMContentLoaded', () => {
    Enseñarpag('divperfil');

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

    // ✅ Buscar en tiempo real mientras escribe, pero con debounce
    const inputBuscador = document.getElementById("buscador");
    if (inputBuscador) {
        inputBuscador.addEventListener("input", filtrarProductos);
    }


    // ✅ También permite buscar con Enter como estaba antes
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

                // 🟢 ACTUALIZAR LA GRÁFICA CON EL AÑO ACTUAL
                const anioActual = new Date().getFullYear();
                cargarGraficaVentas(anioActual);

                // 🟢 ACTUALIZAR SELECTOR DE AÑOS (opcional pero recomendado)
                fetch('/api/anios-disponibles')
                    .then(res => res.json())
                    .then(anios => {
                        const selector = document.getElementById('selector-anio');
                        selector.innerHTML = ''; // limpiar
                        anios.sort().forEach(anio => {
                            const opt = document.createElement("option");
                            opt.value = anio;
                            opt.textContent = anio;
                            selector.appendChild(opt);
                        });

                        selector.value = anioActual;
                    });
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

/*--------------------desplegables facturas --------------------*/
const meses = document.querySelectorAll('.mes');
meses.forEach(mes => {
    mes.addEventListener('click', () => {
        meses.forEach(m => {
            if (m !== mes) m.classList.remove('abierto');
        });
        mes.classList.toggle('abierto');
    });
});
const facturas = document.querySelectorAll('.factura');
facturas.forEach(factura => {
    factura.addEventListener('click', () => {
        factura.classList.toggle('abierto');
    });
});


document.addEventListener("DOMContentLoaded", function () {
    const contenedorFacturas = document.querySelector(".divfacturas");
    const selector = document.getElementById("selector-anio");  // 👈 correcto
    const añoActual = new Date().getFullYear();

    // Crear y cargar selector de año (solo si está vacío)
    if (selector.options.length === 0) {
        for (let i = añoActual; i >= añoActual - 5; i--) {
            const option = document.createElement("option");
            option.value = i;
            option.textContent = i;
            selector.appendChild(option);
        }
    }
    selector.value = añoActual;

    function cargarFacturasPorAño(anio) {
        fetch(`/api/facturas-por-anio/${anio}`)
            .then(r => r.json())
            .then(data => {
                contenedorFacturas.querySelectorAll(".mes, .contenido-mes").forEach(el => el.remove());

                const nombresMeses = [
                    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
                ];

                for (let i = 1; i <= 12; i++) {
                    const nombreMes = nombresMeses[i - 1];
                    const divMes = document.createElement("div");
                    divMes.classList.add("mes");
                    divMes.style.height = "30px";
                    divMes.style.background = "#ccc";
                    divMes.style.margin = "10px";
                    divMes.textContent = nombreMes;

                    const contenedorMes = document.createElement("div");
                    contenedorMes.classList.add("contenido-mes");

                    const facturas = data[i];

                    if (!facturas || facturas.length === 0) {
                        const mensaje = document.createElement("div");
                        mensaje.textContent = "No hay ventas registradas";
                        mensaje.classList.add("factura");
                        contenedorMes.appendChild(mensaje);
                    } else {
                        facturas.forEach(factura => {
                            const divFactura = document.createElement("div");
                            divFactura.classList.add("factura");
                            divFactura.textContent = `Factura #${factura.folio} - Cliente: ${factura.cliente} - $${factura.total.toLocaleString()}`;

                            const contenedorDetalle = document.createElement("div");
                            contenedorDetalle.classList.add("contenido-factura");

                            const recibo = document.createElement("div");
                            recibo.classList.add("recibo");

                            const tabla = document.createElement("table");
                            tabla.innerHTML = `
                                <thead>
                                    <tr>
                                        <th>Folio</th><th>Fecha</th><th>Hora</th>
                                        <th>Producto</th><th>Cantidad</th>
                                        <th>Precio Unitario</th><th>Total</th><th>Vendedor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${factura.detalles.map(prod => `
                                        <tr>
                                            <td>${factura.folio}</td>
                                            <td>${factura.fecha}</td>
                                            <td>${factura.hora}</td>
                                            <td>${prod.producto}</td>
                                            <td>${prod.cantidad}</td>
                                            <td>$${prod.precio_unitario.toLocaleString()}</td>
                                            <td>$${prod.total.toLocaleString()}</td>
                                            <td>${factura.vendedor}</td>
                                        </tr>`).join("")}
                                </tbody>
                            `;
                            recibo.appendChild(tabla);
                            contenedorDetalle.appendChild(recibo);
                            contenedorMes.appendChild(divFactura);
                            contenedorMes.appendChild(contenedorDetalle);

                            divFactura.addEventListener("click", () => {
                                document.querySelectorAll(".factura").forEach(f => f.classList.remove("abierto"));
                                document.querySelectorAll(".contenido-factura").forEach(cf => cf.classList.remove("abierto"));
                                divFactura.classList.add("abierto");
                                contenedorDetalle.classList.add("abierto");
                            });
                        });
                    }

                    contenedorFacturas.appendChild(divMes);
                    contenedorFacturas.appendChild(contenedorMes);

                    divMes.addEventListener("click", () => {
                        document.querySelectorAll(".mes").forEach(m => {
                            if (m !== divMes) m.classList.remove("abierto");
                        });
                        divMes.classList.toggle("abierto");
                    });
                }
            });
    }

    selector.addEventListener("change", () => {
        const anio = selector.value;
        cargarFacturasPorAño(anio);
        cargarDatosYActualizarGrafica(anio);
    });

    cargarFacturasPorAño(añoActual);
    cargarDatosYActualizarGrafica(añoActual);
});

let grafica;
let modoLinea = false;

// Función para obtener años disponibles desde el backend
async function cargarAnios() {
    console.log("🔍 Ejecutando cargarAnios()");
    const res = await fetch('/api/anios-disponibles');
    let anios = await res.json();

    anios = [...new Set(anios)]; // elimina duplicados
    anios.sort();

    const selector = document.getElementById("selector-anio");
    selector.innerHTML = '';

    anios.forEach(anio => {
        const opt = document.createElement("option");
        opt.value = anio;
        opt.textContent = anio;
        selector.appendChild(opt);
    });

    const anioActual = new Date().getFullYear();
    selector.value = anioActual;

    cargarDatosYActualizarGrafica(anioActual);
}

async function cargarDatosYActualizarGrafica(anio) {
    const res = await fetch(`/api/ventas-anuales/${anio}`);
    const data = await res.json();

    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    // 🔍 Aseguramos que los datos lleguen bien en formato {mes: N, total: X}
    const valores = Array(12).fill(0);
    data.forEach(dato => {
        const index = dato.mes - 1;
        if (index >= 0 && index < 12) {
            valores[index] = dato.total;
        }
    });

    if (grafica) grafica.destroy();

    const ctx = document.getElementById("grafica-ventas-anuales").getContext("2d");
    const tipoGrafica = modoLinea ? 'line' : 'bar';

    grafica = new Chart(ctx, {
        type: tipoGrafica,
        data: {
            labels: meses,
            datasets: [{
                label: 'Ventas anuales',
                data: valores,
                backgroundColor: modoLinea ? 'rgba(74, 144, 226, 0.3)' : '#4a90e2',
                borderColor: '#4a90e2',
                borderWidth: 2,
                pointBackgroundColor: '#4a90e2',
                fill: modoLinea,
                tension: 0.3,
                borderRadius: modoLinea ? 0 : 5,
                pointRadius: modoLinea ? 5 : 0,
                barPercentage: 0.6,
                categoryPercentage: 0.7
            }]
        },
        options: {
            responsive: true,
            animation: {
                duration: 800,
                easing: 'easeInOutQuart'
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: valor => `$${valor.toLocaleString()}`
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: context => `$${context.raw.toLocaleString()}`
                    }
                },
                legend: {
                    onClick: function () {
                        modoLinea = !modoLinea;
                        cargarDatosYActualizarGrafica(anio); // recargar con el nuevo tipo
                    }
                }
            }
        }
    });
}



document.getElementById("selector-anio").addEventListener("change", function () {
    const año = this.value;
    cargarFacturasPorAño(año);              // ✅ actualiza las facturas
    cargarDatosYActualizarGrafica(año);     // ✅ actualiza la gráfica
});



// Cargar todo al iniciar
cargarAnios();