const admin = require('firebase-admin');

// Inicializar Firebase
admin.initializeApp({
    credential: admin.credential.cert('./serviceAccount.json')
});
const db = admin.firestore();

// Función para crear colecciones (añadiendo un documento inicial)
async function createCollections() {
    try {
        // Colección: students
        await db.collection('students').doc('00000000').set({
            dni: '00000000',
            codigo: '0000000000000',
            nombre: 'Placeholder',
            apellidos: 'Student',
            sexo: 'N/A',
            fechaNacimiento: '01/01/2000',
            edad: '0',
            grado: 'N/A',
            seccion: 'N/A',
            estado: 'Placeholder'
        });
        console.log('Colección students creada');

        // Colección: teachers
        await db.collection('teachers').doc('00000000').set({
            dni: '00000000',
            nombre: 'Placeholder',
            apellidos: 'Teacher',
            especialidad: 'N/A',
            fechaNacimiento: '01/01/1980',
            celular: '000000000',
            correo: 'placeholder@example.com',
            seccionAsignada: 'N/A',
            esEducacionFisica: false
        });
        console.log('Colección teachers creada');

        // Colección: courses (con subcolección grades)
        await db.collection('courses').doc('placeholder_course').set({
            id: 'placeholder_course',
            nombre: 'Placeholder',
            grado: 'N/A',
            seccion: 'N/A',
            bimestre: 'N/A',
            ano: 2025,
            idProfesor: '00000000',
            estudiantes: []
        });
        // Subcolección: grades
        await db.collection('courses').doc('placeholder_course')
            .collection('grades').doc('00000000').set({
                idEstudiante: '00000000',
                nota: 0,
                bimestre: 'N/A',
                idProfesor: '00000000',
                fecha: admin.firestore.FieldValue.serverTimestamp()
            });
        console.log('Colección courses y subcolección grades creadas');

        // Colección: deadlines
        await db.collection('deadlines').doc('placeholder_deadline').set({
            id: 'placeholder_deadline',
            bimestre: 'N/A',
            ano: 2025,
            fechaInicio: admin.firestore.Timestamp.fromDate(new Date('2025-01-01T00:00:00')),
            fechaCierre: admin.firestore.Timestamp.fromDate(new Date('2025-12-31T23:59:59'))
        });
        console.log('Colección deadlines creada');
    } catch (error) {
        console.error('Error al crear colecciones:', error);
    }
}

// Ejecutar
createCollections().then(() => {
    console.log('Proceso completado');
    process.exit(0);
}).catch((error) => {
    console.error(error);
    process.exit(1);
});