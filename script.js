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