document.addEventListener('DOMContentLoaded', () => {
    Enseñarpag('actualizarstock');

    const btnDeslizar = document.querySelector('button'); // <-- botón en minúscula
    if (btnDeslizar) {
        btnDeslizar.addEventListener('click', deslizarventana);
    }

    window.onload = function () {
        particlesJS("particles-js", { // <-- el id correcto
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
    }
});

function deslizarventana() {
    document.getElementById('ventana').classList.toggle('open');
}

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


document.getElementById("form-empleado").addEventListener("submit", function (e) {
    e.preventDefault(); // Evita recargar la página

    const form = e.target;
    const formData = new FormData(form);

    fetch("/registrar_empleado", {
        method: "POST",
        body: formData
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert(data.mensaje);
                form.reset(); // Limpia los campos
            } else {
                alert("Error: " + data.error);
            }
        })
        .catch(error => {
            console.error("Error al enviar:", error);
            alert("Hubo un problema al registrar.");
        });
});

function abrirModal(id, nombre, descripcion, cantidad, precio) {
    document.getElementById("modal_id").value = id;
    document.getElementById("modal_nombre").value = nombre;
    document.getElementById("modal_descripcion").value = descripcion;
    document.getElementById("modal_cantidad").value = cantidad;
    document.getElementById("modal_precio").value = precio;
    document.getElementById("modal-editar").style.display = "flex";
}

function cerrarModal() {
    document.getElementById("modal-editar").style.display = "none";
}


// Función para filtrar los productos por nombre
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

// Evento al hacer clic en la lupa
document.querySelector(".botonbusqueda").addEventListener("click", function (e) {
    e.preventDefault();  // Evita que recargue la página si es un formulario
    filtrarProductos();
});

// Evento al presionar Enter dentro del input
document.getElementById("buscador").addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        e.preventDefault(); // Evita enviar formulario si lo hay
        filtrarProductos();
    }
});



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

// Evento click en el botón de búsqueda por cédula
document.querySelector(".botonbusqueda").addEventListener("click", function (e) {
    e.preventDefault();
    filtrarUsuariosPorCedula();
});


// Evento Enter en el input de búsqueda
document.getElementById("buscadorCedula").addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        e.preventDefault();
        filtrarUsuariosPorCedula();
    }
});

let carrito = [];
async function verificarYAgregar(id, cantidad) {
    try {
        // Verificar si ya existe en carrito
        const existe = carrito.find(p => p.id === id);
        const cantidadActual = existe ? existe.cantidad : 0;
        const cantidadTotal = cantidadActual + cantidad;

        const respuesta = await fetch("/verificar_producto", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, cantidad: cantidadTotal }) // enviar cantidad total
        });

        const data = await respuesta.json();

        if (!data.existe) {
            alert("❌ " + data.mensaje);
            return;
        }

        if (!data.suficiente) {
            alert("⚠️ " + data.mensaje + `. Solo quedan ${data.stock} unidades.`);
            return;
        }

        // Ahora que ya está validado, actualizamos carrito con la cantidad que quieres agregar
        if (existe) {
            existe.cantidad += cantidad; // solo sumamos la cantidad nueva
        } else {
            carrito.push(data.producto);
        }
        renderCarrito();

    } catch (error) {
        console.error("Error:", error);
        alert("❌ Error al conectar con el servidor.");
    }
}

function agregarAlCarrito(producto) {
    const existe = carrito.find(p => p.id === producto.id);
    if (existe) {
        existe.cantidad += producto.cantidad;
    } else {
        carrito.push(producto);
    }
    renderCarrito();
}


document.querySelector(".botonaddid").addEventListener("click", async (e) => {
    e.preventDefault();

    const inputs = document.querySelectorAll(".addid .entradaid");
    const inputID = inputs[0];
    const inputCantidad = inputs[1];

    const id = parseInt(inputID.value);
    const cantidad = parseInt(inputCantidad.value);

    if (!id || !cantidad || cantidad <= 0) {
        alert("❗ Ingresa un ID y cantidad válidos.");
        return;
    }

    await verificarYAgregar(id, cantidad);

    // Vaciar los campos después de agregar
    inputID.value = "";
    inputCantidad.value = "";
});

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

function incrementar(id) {
    const item = carrito.find(p => p.id === id);
    if (!item) return;

    verificarYAgregar(id, 1); // vuelve a verificar stock y agrega solo si se puede
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
                // Si no existe, limpiar campos para que el usuario escriba
                document.getElementById('nombre_completo').value = '';
                document.getElementById('correo').value = '';
            }
        })
        .catch(err => {
            console.error('Error al buscar cliente:', err);
        });
});

document.querySelector(".botonenviarcompra").addEventListener("click", async () => {
    const nombre = document.getElementById("nombre_completo").value;
    const correo = document.getElementById("correo").value;
    const cedula = document.getElementById("cedula").value;

    if (!nombre || !correo || !cedula || carrito.length === 0) {
        alert("❗ Debes llenar los datos del cliente y tener productos en el carrito.");
        return;
    }

    const data = {
        cliente: {
            nombre,
            correo,
            cedula
        },
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
            alert("❌ Error: " + (errorData.mensaje || "Error desconocido"));
            return;
        }

        const result = await res.json();
        alert(result.mensaje);

        // Vaciar carrito
        carrito = [];
        renderCarrito();

        // Vaciar formulario
        document.getElementById("nombre_completo").value = "";
        document.getElementById("correo").value = "";
        document.getElementById("cedula").value = "";

    } catch (err) {
        console.error("Error:", err);
        alert("❌ Hubo un problema al guardar la compra.");
    }
});
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
                'X-Requested-With': 'XMLHttpRequest'  // opcional para diferenciar peticiones ajax
            }
        });

        const data = await response.json();

        if (data.success) {
            // Encuentra el botón y cambia el texto
            const btn = document.querySelector(`button.buttonEstado[onclick="cambiarEstadoUsuario(${id_usuario})"]`);
            if (btn) {
                btn.textContent = data.nuevo_estado ? 'Desactivar' : 'Activar';
            }
            alert(`Usuario ${data.nuevo_estado ? 'activado' : 'desactivado'} correctamente`);
        } else {
            alert('Error: ' + (data.msg || 'No se pudo cambiar el estado'));
        }
    } catch (error) {
        alert('Error en la petición: ' + error.message);
    }
}
