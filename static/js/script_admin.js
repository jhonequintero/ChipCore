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
    const mensaje = document.getElementById("mensaje-no-encontrado"); // Mensaje de no encontrado

    let encontrados = 0;

    if (texto === "") {
        productos.forEach(producto => {
            producto.style.display = "flex";
        });
        if (mensaje) mensaje.style.display = "none"; // Ocultar mensaje
        inputElement.focus();
        return;
    }

    productos.forEach(producto => {
        const nombre = producto.querySelector(".colum1 h3").textContent.toLowerCase();
        if (nombre.includes(texto)) {
            producto.style.display = "flex";
            encontrados++;
        } else {
            producto.style.display = "none";
        }
    });

    // Mostrar mensaje si no se encontró ninguno
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


function agregarAlCarrito() {
    const id = document.getElementById("inputId").value;
    const cantidad = parseInt(document.getElementById("inputCantidad").value);
    const mensaje = document.getElementById("mensajeError");
    const tabla = document.getElementById("tablaCarrito");

    mensaje.innerText = ""; // Limpiar mensajes

    if (!id || !cantidad || cantidad <= 0) {
        mensaje.innerText = "Por favor ingrese un ID y cantidad válida.";
        return;
    }

    const producto = document.querySelector(`.producto[data-id="${id}"]`);
    if (!producto) {
        mensaje.innerText = "Producto no encontrado.";
        return;
    }

    const precio = parseFloat(producto.getAttribute("data-precio"));
    let stock = parseInt(producto.getAttribute("data-stock"));

    if (cantidad > stock) {
        mensaje.innerText = "Cantidad no disponible.";
        return;
    }

    // Actualizar stock visualmente
    stock -= cantidad;
    producto.setAttribute("data-stock", stock);
    producto.children[2].innerText = stock;

    // Calcular precio total
    const precioTotal = precio * cantidad;

    // Agregar a la tabla del carrito
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${id}</td>
      <td>${cantidad}</td>
      <td>$${precioTotal.toLocaleString()}</td>
    `;
    tabla.appendChild(fila);
}