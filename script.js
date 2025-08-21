// Comentarios en español para facilitar la comprensión.

// Importaciones de React
const { useState, useEffect } = React;

/**
 * Componente principal de la aplicación.
 * @returns {JSX.Element} El JSX del componente App.
 */
function App() {
    // Definimos el estado de la aplicación
    const [employees, setEmployees] = useState([]);
    const [formData, setFormData] = useState({
        employeeName: '',
        documentType: 'Cédula de Ciudadanía (CC)',
        documentNumber: '',
        monthlySalary: '',
    });
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // ======================================================================
    // CONFIGURACIÓN DE FIREBASE
    // ======================================================================
    useEffect(() => {
        const initializeFirebase = async () => {
            try {
                // Obtener las variables globales de Firebase
                const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
                const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');

                if (Object.keys(firebaseConfig).length === 0) {
                    console.error("Firebase config is not available. Check environment variables.");
                    setLoading(false);
                    return;
                }

                // Importar los módulos de Firebase
                const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js");
                const { getAuth, signInWithCustomToken, signInAnonymously } = await import("https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js");
                const { getFirestore, collection, onSnapshot, addDoc, query } = await import("https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js");
                
                // Inicializar Firebase
                const app = initializeApp(firebaseConfig);
                const firestoreDb = getFirestore(app);
                const firebaseAuth = getAuth(app);
                
                // Autenticar con el token o de forma anónima
                const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
                if (initialAuthToken) {
                    await signInWithCustomToken(firebaseAuth, initialAuthToken);
                } else {
                    await signInAnonymously(firebaseAuth);
                }

                // Asignar los servicios al estado
                setDb(firestoreDb);
                setAuth(firebaseAuth);
                setUserId(firebaseAuth.currentUser.uid);
                setLoading(false);
                
                console.log("Firebase inicializado y autenticación exitosa.");
            } catch (error) {
                console.error("Error al inicializar Firebase o autenticar:", error);
                setMessage({ text: "Error de configuración. La aplicación no funcionará correctamente.", type: "error" });
                setLoading(false);
            }
        };

        initializeFirebase();
    }, []);

    // ======================================================================
    // CARGA DE DATOS DESDE FIRESTORE
    // ======================================================================
    useEffect(() => {
        // Solo suscribirse si Firebase y el usuario están listos
        if (db && userId) {
            const employeeCollection = collection(db, `artifacts/${__app_id}/users/${userId}/employees`);
            const employeeQuery = query(employeeCollection);

            const unsubscribe = onSnapshot(employeeQuery, (snapshot) => {
                const employeeList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setEmployees(employeeList);
                console.log("Empleados cargados en tiempo real:", employeeList.length);
            }, (error) => {
                console.error("Error al escuchar cambios en la colección:", error);
                setMessage({ text: "Error al cargar la lista de empleados.", type: "error" });
            });

            // Limpiar el listener cuando el componente se desmonte
            return () => unsubscribe();
        }
    }, [db, userId]);

    // ======================================================================
    // MANEJO DEL FORMULARIO
    // ======================================================================
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({ ...prevData, [name]: value }));
    };

    /**
     * Guarda un nuevo empleado en la base de datos.
     * @param {Event} e El evento del formulario.
     */
    const saveEmployee = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);

        // Validar que los campos no estén vacíos
        if (!formData.employeeName || !formData.documentNumber || !formData.monthlySalary) {
            setMessage({ text: "Todos los campos son obligatorios.", type: "error" });
            setIsSaving(false);
            return;
        }

        try {
            // Referencia a la colección de empleados del usuario
            const employeeCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/employees`);
            await addDoc(employeeCollectionRef, {
                ...formData,
                monthlySalary: parseFloat(formData.monthlySalary), // Convertir a número
                createdAt: new Date().toISOString()
            });

            setMessage({ text: "Empleado guardado exitosamente.", type: "success" });
            
            // Limpiar el formulario después de guardar
            setFormData({
                employeeName: '',
                documentType: 'Cédula de Ciudadanía (CC)',
                documentNumber: '',
                monthlySalary: ''
            });
            
        } catch (error) {
            console.error("Error al guardar el empleado:", error);
            setMessage({ text: "Error al guardar el empleado. Por favor, inténtalo de nuevo.", type: "error" });
        } finally {
            setIsSaving(false);
        }
    };

    // ======================================================================
    // RENDERIZADO DEL COMPONENTE
    // ======================================================================
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <p className="text-xl text-gray-700">Cargando...</p>
            </div>
        );
    }
    
    // Si la autenticación falla, mostramos un mensaje de error
    if (!userId) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <p className="text-xl text-red-500 font-bold text-center">
                    Error de autenticación. No se puede cargar la aplicación.
                </p>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Barra Lateral (Sidebar) */}
            <aside className="w-64 bg-gray-900 text-gray-200 p-6 flex flex-col shadow-xl">
                <div className="mb-8 pb-4 border-b border-gray-700">
                    <h1 className="text-3xl font-extrabold text-white">Nómina</h1>
                    <h2 className="text-sm font-light text-gray-400">Software para la DIAN</h2>
                </div>
                <nav className="flex-1">
                    <ul>
                        <li>
                            <a href="#" className="flex items-center p-3 mb-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="font-semibold">Generar Nómina</span>
                            </a>
                        </li>
                        <li>
                            <a href="#" className="flex items-center p-3 mb-2 rounded-lg bg-gray-800 text-white transition-all duration-200">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
                                </svg>
                                <span className="font-semibold">Empleados</span>
                            </a>
                        </li>
                    </ul>
                </nav>
                <div className="mt-auto pt-4 border-t border-gray-700 text-xs text-gray-500">
                    <p>ID de Usuario:</p>
                    <p className="font-mono break-all text-sm">{userId}</p>
                </div>
            </aside>
            
            {/* Contenido Principal */}
            <main className="flex-1 p-8 bg-white overflow-y-auto">
                <header className="mb-8">
                    <h1 className="text-4xl font-extrabold text-gray-900">Gestión de Empleados</h1>
                </header>
                
                {/* Mensajes de éxito/error */}
                {message && (
                    <div className={`p-4 mb-4 text-sm rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                {/* Formulario de Empleado */}
                <section className="bg-gray-50 p-6 rounded-xl shadow-lg mb-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Ingresa los datos del empleado para agregarlo a la base de datos.</h2>
                    <form onSubmit={saveEmployee} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="employeeName" className="block text-sm font-medium text-gray-700">Nombre del Empleado</label>
                                <input
                                    type="text"
                                    id="employeeName"
                                    name="employeeName"
                                    value={formData.employeeName}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="documentType" className="block text-sm font-medium text-gray-700">Tipo de Documento</label>
                                <select
                                    id="documentType"
                                    name="documentType"
                                    value={formData.documentType}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    <option>Cédula de Ciudadanía (CC)</option>
                                    <option>Tarjeta de Identidad (TI)</option>
                                    <option>Cédula de Extranjería (CE)</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="documentNumber" className="block text-sm font-medium text-gray-700">Número de Documento</label>
                                <input
                                    type="text"
                                    id="documentNumber"
                                    name="documentNumber"
                                    value={formData.documentNumber}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="monthlySalary" className="block text-sm font-medium text-gray-700">Salario Básico Mensual</label>
                                <input
                                    type="number"
                                    id="monthlySalary"
                                    name="monthlySalary"
                                    value={formData.monthlySalary}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                disabled={isSaving}
                            >
                                {isSaving ? "Guardando..." : "Guardar Empleado"}
                            </button>
                        </div>
                    </form>
                </section>

                {/* Tabla de Empleados */}
                <section className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Lista de Empleados</h2>
                    <div className="overflow-x-auto">
                        {employees.length > 0 ? (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo Documento</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número de Documento</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salario</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {employees.map((emp) => (
                                        <tr key={emp.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">{emp.employeeName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{emp.documentType}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{emp.documentNumber}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">${emp.monthlySalary.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-center text-gray-500">No hay empleados registrados. ¡Agrega uno nuevo!</p>
                        )}
                    </div>
                </section>

            </main>
        </div>
    );
}

// Renderizar el componente en el DOM
const domNode = document.getElementById('root');
const root = ReactDOM.createRoot(domNode);
root.render(<App />);
