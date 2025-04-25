document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM cargado, inicializando eventos...');

    // Navegación principal
    const navLinks = document.querySelectorAll('nav a, .dropdown-btn');
    if (navLinks.length > 0) {
        navLinks.forEach(link => {
            link.addEventListener('click', function () {
                const sectionId = this.getAttribute('data-section');
                const sections = document.querySelectorAll('.section');
                sections.forEach(section => section.classList.remove('active'));
                const targetSection = document.getElementById(sectionId);
                if (targetSection) {
                    targetSection.classList.add('active');
                    targetSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    } else {
        console.error('No se encontraron enlaces de navegación');
    }

    // Mostrar portales
    const accesoEstudiantil = document.getElementById('acceso-estudiantil');
    if (accesoEstudiantil) {
        accesoEstudiantil.addEventListener('click', function () {
            document.querySelectorAll('.access-content').forEach(content => content.style.display = 'none');
            document.getElementById('acceso-estudiantil-content').style.display = 'block';
        });
    } else {
        console.error('No se encontró el botón de acceso estudiantil');
    }

    const accesoProfesores = document.getElementById('acceso-profesores');
    if (accesoProfesores) {
        accesoProfesores.addEventListener('click', function () {
            window.location.href = 'login_teacher.html';
        });
    } else {
        console.error('No se encontró el botón de acceso profesores');
    }
});