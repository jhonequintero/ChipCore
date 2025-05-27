document.addEventListener('DOMContentLoaded', () => {
    Enseñarpag('buscarproducto');

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
