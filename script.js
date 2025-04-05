// Navegación principal
document.querySelectorAll('nav a, .dropdown-btn').forEach(link => {
    link.addEventListener('click', function() {
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

// Mostrar portales
document.getElementById('acceso-estudiantil').addEventListener('click', function() {
    document.querySelectorAll('.access-content').forEach(content => {
        content.style.display = 'none';
    });
    document.getElementById('acceso-estudiantil-content').style.display = 'block';
});

document.getElementById('acceso-profesores').addEventListener('click', function() {
    document.querySelectorAll('.access-content').forEach(content => {
        content.style.display = 'none';
    });
    document.getElementById('acceso-profesores-content').style.display = 'block';
});

// Firebase Authentication
const auth = firebase.auth();

// Mostrar formulario de registro
document.getElementById('show-register-btn').addEventListener('click', function() {
    document.getElementById('profesor-login').style.display = 'none';
    document.getElementById('profesor-register').style.display = 'block';
});

// Volver al inicio de sesión
document.getElementById('back-to-login-btn').addEventListener('click', function() {
    document.getElementById('profesor-register').style.display = 'none';
    document.getElementById('profesor-login').style.display = 'block';
});

// Registrar nuevo profesor
document.getElementById('profesor-register-btn').addEventListener('click', function() {
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const email = `${username}@juliobenavides.edu`;
    auth.createUserWithEmailAndPassword(email, password)
        .then(() => {
            alert('Profesor registrado con éxito. Ahora puedes iniciar sesión.');
            document.getElementById('profesor-register').style.display = 'none';
            document.getElementById('profesor-login').style.display = 'block';
            document.getElementById('register-username').value = '';
            document.getElementById('register-password').value = '';
        })
        .catch(error => alert('Error al registrar: ' + error.message));
});

// Inicio de sesión del profesor
document.getElementById('profesor-login-btn').addEventListener('click', function() {
    const username = document.getElementById('profesor-username').value;
    const password = document.getElementById('profesor-password').value;
    const email = `${username}@juliobenavides.edu`;
    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            window.location.href = 'grades.html'; // Redirige a grades.html
        })
        .catch(error => alert('Error al iniciar sesión: ' + error.message));
});