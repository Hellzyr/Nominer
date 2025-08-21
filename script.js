// Importar los módulos de Firebase
// La importación de React y ReactDOM se hace desde el HTML
// import React, { useState, useEffect } from 'react';
// import ReactDOM from 'react-dom';

const { useState, useEffect } = React;
const { render } = ReactDOM;

// Importar Firebase y Firestore (usando un truco para que funcione en el navegador)
const firebaseApp = typeof firebase !== 'undefined' ? firebase.initializeApp : null;
const firestore = typeof firebase !== 'undefined' ? firebase.firestore : null;
const auth = typeof firebase !== 'undefined' ? firebase.auth : null;

// URL del CDN de Firebase para usar en el script
const firebaseCDN = 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
const firestoreCDN = 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';
const authCDN = 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';

// Definir los colores principales para el tema
const colors = {
  primary: '#132F63',
  secondary: '#FABB5A',
  background: '#F8F9FA',
  text: '#6B7280',
};

// Componente principal de la aplicación
const App = () => {
    // Definir estados para la aplicación
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [xmlOutput, setXmlOutput] = useState('');
    const [view, setView] = useState('nomina');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);

    // useEffect para inicializar Firebase y manejar la autenticación
    useEffect(() => {
        const initFirebase = async () => {
            try {
                // Ensure Firebase SDKs are loaded
                await Promise.all([
                    loadScript(firebaseCDN),
                    loadScript(firestoreCDN),
                    loadScript(authCDN)
                ]);

                // Read global variables for config and auth token
                const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
                const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
                const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

                // Initialize Firebase app
                const app = firebase.initializeApp(firebaseConfig);
                const firestore = firebase.firestore(app);
                const firebaseAuth = firebase.auth(app);

                setDb(firestore);
                setAuth(firebaseAuth);

                // Handle user authentication
                firebaseAuth.onAuthStateChanged(async (user) => {
                    if (user) {
                        setUserId(user.uid);
                    } else {
                        // If no authenticated user, sign in with custom token or anonymously
                        if (initialAuthToken) {
                            await firebaseAuth.signInWithCustomToken(initialAuthToken);
                        } else {
                            await firebaseAuth.signInAnonymously();
                        }
                    }
                    setLoading(false);
                });

            } catch (error) {
                console.error("Error initializing Firebase:", error);
                setMessage("Error al conectar con la base de datos. Intente recargar la página.");
                setLoading(false);
            }
        };

        const loadScript = (src) => {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        };

        initFirebase();
    }, []);

    // useEffect para escuchar los cambios en la colección de empleados
    useEffect(() => {
        // Solo ejecutar si Firebase y el usuario están listos
        if (db && userId) {
            const employeesCollectionRef = db.collection(`artifacts/${__app_id}/users/${userId}/employees`);

            // Escuchar los cambios en tiempo real
            const unsubscribe = employeesCollectionRef.onSnapshot((snapshot) => {
                const employeesList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setEmployees(employeesList);
            }, (error) => {
                console.error("Error al obtener los empleados:", error);
                setMessage("Error al cargar la lista de empleados.");
            });

            // Limpiar el listener cuando el componente se desmonta o los datos cambian
            return () => unsubscribe();
        }
    }, [db, userId]);

    // Función para manejar el envío del formulario de empleados
    const handleAddEmployee = async (event) => {
        event.preventDefault();
        setMessage('');

        // Obtener datos del formulario
        const formData = new FormData(event.target);
        const employeeData = Object.fromEntries(formData.entries());

        // Validar que todos los campos requeridos estén llenos
        const requiredFields = ['nombreEmpleado', 'tipoDocumento', 'identificacion', 'salarioBase', 'cargo', 'fechaIngreso'];
        const isFormValid = requiredFields.every(field => employeeData[field]);
        if (!isFormValid) {
            setMessage("Por favor, complete todos los campos requeridos.");
            return;
        }

        // Convertir campos numéricos
        employeeData.salarioBase = parseFloat(employeeData.salarioBase);

        try {
            // Guardar el nuevo empleado en Firestore. Usamos el 'identificacion' como ID del documento
            const employeeDocRef = db.collection(`artifacts/${__app_id}/users/${userId}/employees`).doc(employeeData.identificacion);
            await employeeDocRef.set(employeeData);
            setMessage("¡Empleado guardado con éxito!");
            event.target.reset(); // Limpiar el formulario
        } catch (e) {
            console.error("Error al agregar el empleado:", e);
            setMessage("Error al guardar el empleado. Intente de nuevo.");
        }
    };

    // Función para generar un documento XML para un solo empleado
    const generateXml = (employee) => {
        const { identificacion, razonSocial, nombreEmpleado, tipoDocumento, salarioBase, cargo, fechaIngreso, periodo, fechaPago, diasTrabajados, horasExtras, comisiones, salud, pension, prestamo, nit } = employee;
        
        // Calcular los totales, usando 0 si los campos no existen
        const totalDevengos = (salarioBase || 0) + (parseFloat(horasExtras) || 0) + (parseFloat(comisiones) || 0);
        const totalDeducciones = (parseFloat(salud) || 0) + (parseFloat(pension) || 0) + (parseFloat(prestamo) || 0);
        const totalPagar = totalDevengos - totalDeducciones;

        return `
<NominaElectronica>
    <Empleador>
        <NIT>${nit || 'No especificado'}</NIT>
        <RazonSocial>${razonSocial || 'No especificada'}</RazonSocial>
    </Empleador>
    <Empleado>
        <Nombre>${nombreEmpleado}</Nombre>
        <TipoDocumento>${tipoDocumento}</TipoDocumento>
        <Identificacion>${identificacion}</Identificacion>
        <SalarioBase>${salarioBase}</SalarioBase>
        <Cargo>${cargo}</Cargo>
        <FechaIngreso>${fechaIngreso}</FechaIngreso>
    </Empleado>
    <DetallesNomina>
        <Periodo>${periodo || 'No especificado'}</Periodo>
        <FechaPago>${fechaPago || 'No especificada'}</FechaPago>
        <DiasTrabajados>${diasTrabajados || 'No especificados'}</DiasTrabajados>
        <Devengos>
            <Salario>${salarioBase}</Salario>
            <HorasExtras>${parseFloat(horasExtras) || 0}</HorasExtras>
            <Comisiones>${parseFloat(comisiones) || 0}</Comisiones>
        </Devengos>
        <Deducciones>
            <Salud>${parseFloat(salud) || 0}</Salud>
            <Pension>${parseFloat(pension) || 0}</Pension>
            <Prestamo>${parseFloat(prestamo) || 0}</Prestamo>
        </Deducciones>
        <Totales>
            <TotalDevengos>${totalDevengos}</TotalDevengos>
            <TotalDeducciones>${totalDeducciones}</TotalDeducciones>
            <TotalPagar>${totalPagar}</TotalPagar>
        </Totales>
    </DetallesNomina>
</NominaElectronica>
        `.trim();
    };

    // Función para generar XML de todos los empleados
    const handleGenerateAllXml = () => {
        if (employees.length === 0) {
            setMessage("No hay empleados para generar el XML.");
            return;
        }

        const allXml = employees.map(emp => {
            return `<!-- XML para el empleado: ${emp.nombreEmpleado} (${emp.identificacion}) -->\n${generateXml(emp)}\n`;
        }).join('\n'); // Unir todos los XML en un solo string

        setXmlOutput(allXml);
    };

    // Componente de menú lateral
    const Sidebar = () => (
        <aside className="sidebar">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-white">Nomina</h1>
                <h2 className="text-xs font-light text-gray-300">Software para la DIAN</h2>
            </div>
            <nav>
                <ul>
                    <li>
                        <a href="#" onClick={() => setView('nomina')} className={view === 'nomina' ? 'active-menu' : ''}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="16" x2="8" y1="13" y2="13"/>
                                <line x1="16" x2="8" y1="17" y2="17"/>
                                <line x1="10" x2="8" y1="9" y2="9"/>
                            </svg>
                            Generar Nómina
                        </a>
                    </li>
                    <li>
                        <a href="#" onClick={() => setView('employees')} className={view === 'employees' ? 'active-menu' : ''}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                                <circle cx="9" cy="7" r="4"/>
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                            </svg>
                            Empleados
                        </a>
                    </li>
                </ul>
            </nav>
            {userId && (
                <div className="mt-auto text-sm text-gray-400">
                    <p>ID de usuario:</p>
                    <p className="break-all font-mono">{userId}</p>
                </div>
            )}
        </aside>
    );

    // Componente de encabezado
    const Header = ({ title }) => (
        <header>
            <h1>{title}</h1>
            <div className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-white font-bold">
                    UN
                </div>
            </div>
        </header>
    );

    // Componente del formulario para agregar empleados
    const EmployeeForm = () => (
        <div className="form-container">
            <p className="text-sm text-gray-600 mb-8 text-center sm:text-base">
                Ingresa los datos del empleado para agregarlo a la base de datos.
            </p>
            <hr className="border-gray-200 mb-8" />
            
            <form onSubmit={handleAddEmployee} className="form-grid">
                <div className="full-span">
                    <h2 className="text-2xl font-bold mb-4" style={{ color: colors.primary }}>Datos del Empleado</h2>
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="nombreEmpleado" className="block text-sm font-medium text-gray-700">Nombre del Empleado</label>
                            <input type="text" name="nombreEmpleado" required />
                        </div>
                        <div>
                            <label htmlFor="tipoDocumento" className="block text-sm font-medium text-gray-700">Tipo de Documento</label>
                            <select name="tipoDocumento" required>
                                <option value="CC">Cédula de Ciudadanía (CC)</option>
                                <option value="CE">Cédula de Extranjería (CE)</option>
                                <option value="PA">Pasaporte (PA)</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="identificacion" className="block text-sm font-medium text-gray-700">Número de Documento</label>
                            <input type="text" name="identificacion" required />
                        </div>
                        <div>
                            <label htmlFor="salarioBase" className="block text-sm font-medium text-gray-700">Salario Básico Mensual</label>
                            <input type="number" name="salarioBase" required />
                        </div>
                        <div>
                            <label htmlFor="cargo" className="block text-sm font-medium text-gray-700">Cargo</label>
                            <input type="text" name="cargo" required />
                        </div>
                        <div>
                            <label htmlFor="fechaIngreso" className="block text-sm font-medium text-gray-700">Fecha de Ingreso</label>
                            <input type="date" name="fechaIngreso" required />
                        </div>
                    </div>
                </div>
                
                <div className="full-span mt-8 flex justify-center">
                    <button type="submit">
                        Guardar Empleado
                    </button>
                </div>
                {message && <p className="full-span text-center text-sm mt-4 text-blue-600">{message}</p>}
            </form>
        </div>
    );

    // Componente de la lista de empleados y generación de XML
    const EmployeeList = () => (
        <div className="form-container">
            <p className="text-sm text-gray-600 mb-8 text-center sm:text-base">
                Lista de todos los empleados guardados.
            </p>
            <hr className="border-gray-200 mb-8" />

            {employees.length > 0 ? (
                <>
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Identificación</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salario</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {employees.map(emp => (
                                <tr key={emp.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{emp.nombreEmpleado}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.identificacion}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${emp.salarioBase}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.cargo}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="mt-8 flex justify-center">
                        <button onClick={handleGenerateAllXml}>
                            Generar XML de todos los empleados
                        </button>
                    </div>

                    {xmlOutput && (
                        <div className="xml-output">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">XML de Nómina Generado</h3>
                            <pre dangerouslySetInnerHTML={{ __html: xmlOutput.replace(/<(\/?\w+)/g, '<span class="tag">&lt;$1')}}></pre>
                        </div>
                    )}
                </>
            ) : (
                <p className="text-center text-gray-500">No hay empleados guardados. Agregue uno primero.</p>
            )}
        </div>
    );

    // Renderizar la interfaz según el estado
    if (loading) {
        return <div className="p-8 text-center text-gray-500">Cargando...</div>;
    }

    return (
        <div className="flex w-full">
            <Sidebar />
            <main className="flex-1 flex flex-col">
                <Header title={view === 'nomina' ? 'Generar Nómina' : 'Gestión de Empleados'} />
                <div className="main-content">
                    {view === 'nomina' ? <EmployeeForm /> : <EmployeeList />}
                </div>
            </main>
        </div>
    );
};

// Renderizar la aplicación en el DOM
const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(React.createElement(App));
