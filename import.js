const admin = require('firebase-admin');
const fs = require('fs');
const csv = require('csv-parse');

// Inicializar Firebase
admin.initializeApp({
    credential: admin.credential.cert('./serviceAccount.json')
});
const db = admin.firestore();

// Función para parsear CSV con delimitador configurable
function parseCSV(filePath, delimiter) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv.parse({ 
                columns: true, 
                skip_empty_lines: true, 
                trim: true, 
                delimiter: delimiter
            }))
            .on('data', (data) => {
                const cleanedData = {};
                for (let key in data) {
                    const cleanedKey = key.trim();
                    cleanedData[cleanedKey] = data[key];
                }
                results.push(cleanedData);
            })
            .on('end', () => {
                console.log(`Archivo ${filePath} parseado. Total de filas: ${results.length}`);
                resolve(results);
            })
            .on('error', (err) => {
                console.error(`Error al parsear ${filePath}:`, err);
                reject(err);
            });
    });
}

// Convertir grado a formato estándar
function formatGrado(grado) {
    const gradoMap = {
        'PRIMERO': '1ro Primaria',
        'SEGUNDO': '2do Primaria',
        'TERCERO': '3ro Primaria',
        'CUARTO': '4to Primaria',
        'QUINTO': '5to Primaria',
        'SEXTO': '6to Primaria',
        '1°': '1ro Primaria',
        '2°': '2do Primaria',
        '3°': '3ro Primaria',
        '4°': '4to Primaria',
        '5°': '5to Primaria',
        '6°': '6to Primaria'
    };
    return gradoMap[grado.toUpperCase()] || grado;
}

// Lista de cursos
const cursosGenerales = ['Matemáticas', 'Comunicación', 'Personal Social', 'Ciencia y Ambiente', 'Arte', 'Educación Religiosa', 'Tutoría'];
const cursoEducacionFisica = 'Educación Física';

// Lista de secciones por grado
const seccionesPorGrado = {
    '1ro Primaria': ['A', 'B', 'C', 'D'],
    '2do Primaria': ['A', 'B', 'C', 'D'],
    '3ro Primaria': ['A', 'B', 'C', 'D', 'E'],
    '4to Primaria': ['A', 'B', 'C', 'D', 'E'],
    '5to Primaria': ['A', 'B', 'C', 'D'],
    '6to Primaria': ['A', 'B', 'C', 'D']
};

// Distribución de profesores de Educación Física
const asignacionEducacionFisica = {
    '41312550': [ // Eli Sadi MONTESINOS SERRANO
        '1ro Primaria A', '1ro Primaria B', '1ro Primaria C', '1ro Primaria D',
        '2do Primaria A', '2do Primaria B', '2do Primaria C', '2do Primaria D',
        '3ro Primaria A'
    ],
    '22508783': [ // Nilton Johnny RAMIREZ IGARZA
        '3ro Primaria B', '3ro Primaria C', '3ro Primaria D', '3ro Primaria E',
        '4to Primaria A', '4to Primaria B', '4to Primaria C', '4to Primaria D', '4to Primaria E'
    ],
    '04078727': [ // Efrain Grover ROBLES VALLE
        '5to Primaria A', '5to Primaria B', '5to Primaria C', '5to Primaria D',
        '6to Primaria A', '6to Primaria B', '6to Primaria C', '6to Primaria D'
    ]
};

// Función para pausar (usada para evitar sobrecarga en Firestore)
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Importar alumnos (delimitador: ;)
async function importarAlumnos() {
    try {
        const alumnos = await parseCSV('alumnos.csv', ';');
        console.log('Primer alumno parseado:', alumnos[0]);
        let alumnosImportados = 0;
        const dniList = new Set(); // Para detectar duplicados
        let batch = db.batch();
        let operationsInBatch = 0;

        for (const alumno of alumnos) {
            const dni = alumno['DNI']?.trim();
            if (!dni) {
                console.log(`Advertencia: DNI vacío para alumno ${alumno['Nombre']} ${alumno['Apellidos']}`);
                continue;
            }
            if (dniList.has(dni)) {
                console.log(`Advertencia: DNI duplicado encontrado para alumno: ${dni} (${alumno['Nombre']} ${alumno['Apellidos']})`);
            } else {
                dniList.add(dni);
            }
            const grado = formatGrado(alumno['Grado']);
            const seccion = (alumno['Sección'] || '').toUpperCase();
            console.log(`Importando alumno DNI ${dni}: grado=${grado}, seccion=${seccion}`);

            const docRef = db.collection('students').doc(dni);
            batch.set(docRef, {
                dni: dni,
                codigo: alumno['Código'] || '',
                nombre: alumno['Nombre'] || '',
                apellidos: alumno['Apellidos'] || '',
                sexo: alumno['Sexo'] || '',
                fechaNacimiento: alumno['Fecha de Nacimiento'] || '',
                edad: alumno['Edad'] || '',
                grado: grado,
                seccion: seccion,
                estado: alumno['Estado'] || ''
            });
            operationsInBatch++;
            alumnosImportados++;

            // Si el batch alcanza 100 operaciones, lo ejecutamos
            if (operationsInBatch >= 100) {
                try {
                    await batch.commit();
                    console.log(`Batch de ${operationsInBatch} alumnos ejecutado.`);
                    batch = db.batch();
                    operationsInBatch = 0;
                    await delay(1000); // Pausa de 1 segundo para evitar sobrecarga
                } catch (error) {
                    console.error(`Error al ejecutar batch de alumnos:`, error);
                }
            }
        }

        // Ejecutar el último batch si tiene operaciones pendientes
        if (operationsInBatch > 0) {
            try {
                await batch.commit();
                console.log(`Último batch de ${operationsInBatch} alumnos ejecutado.`);
            } catch (error) {
                console.error(`Error al ejecutar último batch de alumnos:`, error);
            }
        }

        console.log('Alumnos importados:', alumnosImportados);
        console.log('Lista de DNIs de alumnos importados:', Array.from(dniList));
    } catch (error) {
        console.error('Error en importarAlumnos:', error);
    }
}

// Importar docentes (delimitador: ,)
async function importarDocentes() {
    const docentes = await parseCSV('docentes.csv', ',');
    let docentesImportados = 0;
    const dniList = new Set(); // Para detectar duplicados
    let batch = db.batch();
    let operationsInBatch = 0;

    if (docentes.length > 0) {
        console.log('Primer docente parseado:', docentes[0]);
        console.log('Claves disponibles:', Object.keys(docentes[0]));
    } else {
        console.log('No se encontraron docentes en el archivo.');
    }

    for (const docente of docentes) {
        const dni = docente['DNI']?.trim();
        if (!dni) {
            console.log(`Advertencia: DNI vacío para docente ${docente['Nombre']} ${docente['Apellidos']}`);
            continue;
        }
        console.log(`Importando docente DNI ${dni}: ${docente['Nombre']} ${docente['Apellidos']}`);
        if (dniList.has(dni)) {
            console.log(`Advertencia: DNI duplicado encontrado: ${dni}`);
        } else {
            dniList.add(dni);
        }
        const esEducacionFisicaRaw = (docente['Es Educación Física'] || '').trim().toLowerCase();
        const esEducacionFisica = esEducacionFisicaRaw === 'true';

        const docRef = db.collection('teachers').doc(dni);
        batch.set(docRef, {
            dni: dni,
            nombre: docente['Nombre'],
            apellidos: docente['Apellidos'],
            especialidad: docente['Especialidad'],
            fechaNacimiento: docente['Fecha de Nacimiento'],
            celular: docente['Celular'],
            correo: docente['Correo'],
            seccionAsignada: docente['Grado'] === 'N/A' ? 'N/A' : `${formatGrado(docente['Grado'])} ${docente['Sección']}`,
            esEducacionFisica: esEducacionFisica
        });
        operationsInBatch++;
        docentesImportados++;

        // Si el batch alcanza 100 operaciones, lo ejecutamos
        if (operationsInBatch >= 100) {
            try {
                await batch.commit();
                console.log(`Batch de ${operationsInBatch} docentes ejecutado.`);
                batch = db.batch();
                operationsInBatch = 0;
                await delay(1000); // Pausa de 1 segundo para evitar sobrecarga
            } catch (error) {
                console.error(`Error al ejecutar batch de docentes:`, error);
            }
        }
    }

    // Ejecutar el último batch si tiene operaciones pendientes
    if (operationsInBatch > 0) {
        try {
            await batch.commit();
            console.log(`Último batch de ${operationsInBatch} docentes ejecutado.`);
        } catch (error) {
            console.error(`Error al ejecutar último batch de docentes:`, error);
        }
    }

    console.log('Docentes importados:', docentesImportados);
    console.log('Lista de DNIs importados:', Array.from(dniList));
    return docentes;
}

// Crear cursos para todas las secciones usando WriteBatch
async function crearCursos(docentes) {
    const bimestres = ['Bimestre 1', 'Bimestre 2', 'Bimestre 3', 'Bimestre 4'];
    let totalCursos = 0;
    let batch = db.batch();
    let operationsInBatch = 0;

    if (docentes.length === 0) {
        console.log('No se crearon cursos porque no se importaron docentes.');
        return;
    }

    for (const grado of Object.keys(seccionesPorGrado)) {
        const secciones = seccionesPorGrado[grado];
        for (const seccion of secciones) {
            const seccionAsignada = `${grado} ${seccion}`;

            // Obtener estudiantes de la sección
            const estudiantesSnapshot = await db.collection('students')
                .where('grado', '==', grado)
                .where('seccion', '==', seccion)
                .get();
            const estudiantes = estudiantesSnapshot.docs.map(doc => doc.id);
            console.log(`Estudiantes en ${seccionAsignada}:`, estudiantes.length);

            // Buscar profesor general asignado a esta sección
            const profesoresGenerales = docentes.filter(docente => {
                const esEducacionFisica = (docente['Es Educación Física'] || '').trim().toLowerCase() === 'true';
                const seccionDocente = `${formatGrado(docente['Grado'])} ${docente['Sección']}`;
                return !esEducacionFisica && seccionDocente === seccionAsignada;
            });
            const profesorGeneral = profesoresGenerales[0];
            const idProfesorGeneral = profesorGeneral ? profesorGeneral['DNI'] : '00000000';
            console.log(`Profesor general para ${seccionAsignada}: ${idProfesorGeneral}`);

            // Crear cursos generales
            for (const curso of cursosGenerales) {
                for (const bimestre of bimestres) {
                    const cursoId = `${curso}_${seccionAsignada.replace(' ', '_')}_${bimestre.replace(' ', '_')}_2025`;
                    const docRef = db.collection('courses').doc(cursoId);
                    batch.set(docRef, {
                        id: cursoId,
                        nombre: curso,
                        grado: grado,
                        seccion: seccion,
                        bimestre: bimestre,
                        ano: 2025,
                        idProfesor: idProfesorGeneral,
                        estudiantes: estudiantes
                    });
                    operationsInBatch++;
                    totalCursos++;

                    // Si el batch alcanza 500 operaciones, lo ejecutamos
                    if (operationsInBatch >= 500) {
                        await batch.commit();
                        console.log(`Batch de ${operationsInBatch} cursos ejecutado.`);
                        batch = db.batch();
                        operationsInBatch = 0;
                        await delay(1000); // Pausa de 1 segundo para evitar sobrecarga
                    }
                }
            }

            // Asignar profesor de Educación Física
            let idProfesorEducacionFisica = '00000000';
            for (const [dniProfesor, seccionesAsignadas] of Object.entries(asignacionEducacionFisica)) {
                if (seccionesAsignadas.includes(seccionAsignada)) {
                    idProfesorEducacionFisica = dniProfesor;
                    break;
                }
            }
            console.log(`Profesor de Educación Física para ${seccionAsignada}: ${idProfesorEducacionFisica}`);

            // Crear curso de Educación Física
            for (const bimestre of bimestres) {
                const cursoId = `${cursoEducacionFisica}_${seccionAsignada.replace(' ', '_')}_${bimestre.replace(' ', '_')}_2025`;
                const docRef = db.collection('courses').doc(cursoId);
                batch.set(docRef, {
                    id: cursoId,
                    nombre: cursoEducacionFisica,
                    grado: grado,
                    seccion: seccion,
                    bimestre: bimestre,
                    ano: 2025,
                    idProfesor: idProfesorEducacionFisica,
                    estudiantes: estudiantes
                });
                operationsInBatch++;
                totalCursos++;

                // Si el batch alcanza 500 operaciones, lo ejecutamos
                if (operationsInBatch >= 500) {
                    await batch.commit();
                    console.log(`Batch de ${operationsInBatch} cursos ejecutado.`);
                    batch = db.batch();
                    operationsInBatch = 0;
                    await delay(1000); // Pausa de 1 segundo para evitar sobrecarga
                }
            }
        }
    }

    // Ejecutar el último batch si tiene operaciones pendientes
    if (operationsInBatch > 0) {
        await batch.commit();
        console.log(`Último batch de ${operationsInBatch} cursos ejecutado.`);
    }

    console.log('Cursos creados:', totalCursos);
}

// Importar deadlines
async function importarDeadlines() {
    const deadlines = [
        { id: 'Bimestre1_2025', bimestre: 'Bimestre 1', fechaInicio: new Date('2025-03-17T00:00:00'), fechaCierre: new Date('2025-05-16T23:59:59') },
        { id: 'Bimestre2_2025', bimestre: 'Bimestre 2', fechaInicio: new Date('2025-05-26T00:00:00'), fechaCierre: new Date('2025-07-25T23:59:59') },
        { id: 'Bimestre3_2025', bimestre: 'Bimestre 3', fechaInicio: new Date('2025-08-11T00:00:00'), fechaCierre: new Date('2025-10-10T23:59:59') },
        { id: 'Bimestre4_2025', bimestre: 'Bimestre 4', fechaInicio: new Date('2025-10-20T00:00:00'), fechaCierre: new Date('2025-12-19T23:59:59') }
    ];

    for (const deadline of deadlines) {
        await db.collection('deadlines').doc(deadline.id).set({
            id: deadline.id,
            bimestre: deadline.bimestre,
            ano: 2025,
            fechaInicio: admin.firestore.Timestamp.fromDate(deadline.fechaInicio),
            fechaCierre: admin.firestore.Timestamp.fromDate(deadline.fechaCierre)
        });
    }
    console.log('Deadlines importados');
}

// Ejecutar importación
async function main() {
    await importarAlumnos();
    const docentes = await importarDocentes();
    await crearCursos(docentes);
    await importarDeadlines();
}

main().catch(console.error);