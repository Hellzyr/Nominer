// Importaciones de React y Firebase
import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc } from 'firebase/firestore';
import { useReactToPrint } from 'react-to-print';

// ----------------------------------------------------------------------
// COMPONENTES INDIVIDUALES
// ----------------------------------------------------------------------

/**
 * Componente del Dashboard.
 * @param {object} props - Propiedades del componente.
 * @param {number} props.employeeCount - Número de empleados.
 * @param {number} props.invoiceCount - Número de facturas.
 * @returns {JSX.Element} El JSX del componente Dashboard.
 */
function Dashboard({ employeeCount, invoiceCount }) {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between">
                    <div>
                        <h2 className="text-sm text-gray-500 uppercase font-semibold">Total Empleados</h2>
                        <p className="text-4xl font-extrabold text-blue-600 mt-2">{employeeCount}</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-blue-200">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.684.282c.28 0 .56-.013.837-.038a1.35 1.35 0 011.543 1.29L20 20.5a.5.5 0 01-.5.5h-11a.5.5 0 01-.5-.5l-.014-.093a1.35 1.35 0 011.543-1.29c.277.025.557.038.837.038a9.38 9.38 0 002.684-.282m-3.5 0a9.38 9.38 0 01-5.684.282c-.28 0-.56.013-.837.038a1.35 1.35 0 01-1.543-1.29L2 20.5a.5.5 0 00.5.5h11a.5.5 0 00.5-.5l.014-.093a1.35 1.35 0 00-1.543-1.29zM12 11a4 4 0 100-8 4 4 0 000 8z" />
                    </svg>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between">
                    <div>
                        <h2 className="text-sm text-gray-500 uppercase font-semibold">Total Facturas</h2>
                        <p className="text-4xl font-extrabold text-green-600 mt-2">{invoiceCount}</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-green-200">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6M7.5 7.5l-3.5 3.5M16.5 7.5l3.5 3.5M7.5 16.5l-3.5-3.5M16.5 16.5l3.5-3.5" />
                    </svg>
                </div>
            </div>
        </div>
    );
}

/**
 * Componente para gestionar empleados.
 * @param {object} props - Propiedades del componente.
 * @param {object} props.db - Instancia de la base de datos de Firestore.
 * @param {string} props.userId - ID del usuario autenticado.
 * @param {string} props.appId - ID de la aplicación.
 * @returns {JSX.Element} El JSX del componente Employees.
 */
function Employees({ db, userId, appId }) {
    const [employees, setEmployees] = useState([]);
    const [formData, setFormData] = useState({
        employeeName: '',
        documentType: 'Cédula de Ciudadanía (CC)',
        documentNumber: '',
        monthlySalary: '',
    });
    const [message, setMessage] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Carga de datos de empleados en tiempo real
    useEffect(() => {
        if (db && userId) {
            const employeeCollection = collection(db, `artifacts/${appId}/users/${userId}/employees`);
            const unsubscribe = onSnapshot(employeeCollection, (snapshot) => {
                const employeeList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setEmployees(employeeList);
            }, (error) => {
                console.error("Error al cargar empleados:", error);
            });
            return () => unsubscribe();
        }
    }, [db, userId, appId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({ ...prevData, [name]: value }));
    };

    const saveEmployee = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);
        
        if (!formData.employeeName || !formData.documentNumber || !formData.monthlySalary) {
            setMessage({ text: "Todos los campos son obligatorios.", type: "error" });
            setIsSaving(false);
            return;
        }

        try {
            const employeeCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/employees`);
            await addDoc(employeeCollectionRef, {
                ...formData,
                monthlySalary: parseFloat(formData.monthlySalary),
                createdAt: new Date().toISOString()
            });
            setMessage({ text: "Empleado guardado exitosamente.", type: "success" });
            setFormData({ employeeName: '', documentType: 'Cédula de Ciudadanía (CC)', documentNumber: '', monthlySalary: '' });
        } catch (error) {
            console.error("Error al guardar el empleado:", error);
            setMessage({ text: "Error al guardar. Intenta de nuevo.", type: "error" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Gestión de Empleados</h1>
            
            {message && (
                <div className={`p-4 mb-4 text-sm rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}
            
            <section className="bg-white p-6 rounded-xl shadow-lg mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Ingresar nuevo empleado</h2>
                <form onSubmit={saveEmployee} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="employeeName" className="block text-sm font-medium text-gray-700">Nombre</label>
                            <input type="text" id="employeeName" name="employeeName" value={formData.employeeName} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                        </div>
                        <div>
                            <label htmlFor="documentType" className="block text-sm font-medium text-gray-700">Tipo de Documento</label>
                            <select id="documentType" name="documentType" value={formData.documentType} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                                <option>Cédula de Ciudadanía (CC)</option>
                                <option>Tarjeta de Identidad (TI)</option>
                                <option>Cédula de Extranjería (CE)</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="documentNumber" className="block text-sm font-medium text-gray-700">Número de Documento</label>
                            <input type="text" id="documentNumber" name="documentNumber" value={formData.documentNumber} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                        </div>
                        <div>
                            <label htmlFor="monthlySalary" className="block text-sm font-medium text-gray-700">Salario Mensual</label>
                            <input type="number" id="monthlySalary" name="monthlySalary" value={formData.monthlySalary} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" disabled={isSaving}>
                            {isSaving ? "Guardando..." : "Guardar Empleado"}
                        </button>
                    </div>
                </form>
            </section>
            
            <section className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Lista de Empleados</h2>
                <div className="overflow-x-auto">
                    {employees.length > 0 ? (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo Documento</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
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
                        <p className="text-center text-gray-500 mt-4">No hay empleados registrados.</p>
                    )}
                </div>
            </section>
        </div>
    );
}

/**
 * Componente para gestionar facturas.
 * @param {object} props - Propiedades del componente.
 * @param {object} props.db - Instancia de la base de datos de Firestore.
 * @param {string} props.userId - ID del usuario autenticado.
 * @param {string} props.appId - ID de la aplicación.
 * @returns {JSX.Element} El JSX del componente Invoicing.
 */
function Invoicing({ db, userId, appId }) {
    const [invoices, setInvoices] = useState([]);
    const [formData, setFormData] = useState({
        customerName: '',
        invoiceDate: new Date().toISOString().substring(0, 10),
        invoiceAmount: '',
        status: 'Pendiente',
    });
    const [message, setMessage] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Carga de datos de facturas en tiempo real
    useEffect(() => {
        if (db && userId) {
            const invoiceCollection = collection(db, `artifacts/${appId}/users/${userId}/invoices`);
            const unsubscribe = onSnapshot(invoiceCollection, (snapshot) => {
                const invoiceList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setInvoices(invoiceList);
            }, (error) => {
                console.error("Error al cargar facturas:", error);
            });
            return () => unsubscribe();
        }
    }, [db, userId, appId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({ ...prevData, [name]: value }));
    };

    const saveInvoice = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);

        if (!formData.customerName || !formData.invoiceAmount) {
            setMessage({ text: "El nombre del cliente y el monto son obligatorios.", type: "error" });
            setIsSaving(false);
            return;
        }

        try {
            const invoiceCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/invoices`);
            await addDoc(invoiceCollectionRef, {
                ...formData,
                invoiceAmount: parseFloat(formData.invoiceAmount),
                createdAt: new Date().toISOString()
            });
            setMessage({ text: "Factura guardada exitosamente.", type: "success" });
            setFormData({
                customerName: '',
                invoiceDate: new Date().toISOString().substring(0, 10),
                invoiceAmount: '',
                status: 'Pendiente',
            });
        } catch (error) {
            console.error("Error al guardar la factura:", error);
            setMessage({ text: "Error al guardar. Intenta de nuevo.", type: "error" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Facturación</h1>
            
            {message && (
                <div className={`p-4 mb-4 text-sm rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}
            
            <section className="bg-white p-6 rounded-xl shadow-lg mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Crear nueva factura</h2>
                <form onSubmit={saveInvoice} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">Nombre del Cliente</label>
                            <input type="text" id="customerName" name="customerName" value={formData.customerName} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                        </div>
                        <div>
                            <label htmlFor="invoiceDate" className="block text-sm font-medium text-gray-700">Fecha</label>
                            <input type="date" id="invoiceDate" name="invoiceDate" value={formData.invoiceDate} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                        </div>
                        <div>
                            <label htmlFor="invoiceAmount" className="block text-sm font-medium text-gray-700">Monto</label>
                            <input type="number" id="invoiceAmount" name="invoiceAmount" value={formData.invoiceAmount} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                        </div>
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Estado</label>
                            <select id="status" name="status" value={formData.status} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                                <option>Pendiente</option>
                                <option>Pagada</option>
                                <option>Vencida</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500" disabled={isSaving}>
                            {isSaving ? "Guardando..." : "Crear Factura"}
                        </button>
                    </div>
                </form>
            </section>

            <section className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Facturas</h2>
                <div className="overflow-x-auto">
                    {invoices.length > 0 ? (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {invoices.map((inv) => (
                                    <tr key={inv.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">{inv.customerName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{inv.invoiceDate}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">${inv.invoiceAmount.toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${inv.status === 'Pagada' ? 'bg-green-100 text-green-800' : inv.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-center text-gray-500 mt-4">No hay facturas registradas.</p>
                    )}
                </div>
            </section>
        </div>
    );
}

/**
 * Componente de reportes.
 * @param {object} props - Propiedades del componente.
 * @param {object} props.db - Instancia de la base de datos de Firestore.
 * @param {string} props.userId - ID del usuario autenticado.
 * @param {string} props.appId - ID de la aplicación.
 * @returns {JSX.Element} El JSX del componente Reports.
 */
function Reports({ db, userId, appId }) {
    const [employees, setEmployees] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const componentRef = React.useRef();

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        documentTitle: "Reporte de Nómina y Facturación",
        onAfterPrint: () => alert("Reporte generado exitosamente.") // Usamos alert para simplicidad
    });

    useEffect(() => {
        if (db && userId) {
            const employeeCollection = collection(db, `artifacts/${appId}/users/${userId}/employees`);
            const invoiceCollection = collection(db, `artifacts/${appId}/users/${userId}/invoices`);

            const unsubscribeEmployees = onSnapshot(employeeCollection, (snapshot) => {
                const employeeList = snapshot.docs.map(doc => ({ ...doc.data() }));
                setEmployees(employeeList);
            });

            const unsubscribeInvoices = onSnapshot(invoiceCollection, (snapshot) => {
                const invoiceList = snapshot.docs.map(doc => ({ ...doc.data() }));
                setInvoices(invoiceList);
            });

            return () => {
                unsubscribeEmployees();
                unsubscribeInvoices();
            };
        }
    }, [db, userId, appId]);

    const totalSalaries = employees.reduce((acc, emp) => acc + emp.monthlySalary, 0);
    const totalInvoiced = invoices.reduce((acc, inv) => acc + inv.invoiceAmount, 0);
    const totalPendingInvoiced = invoices.filter(inv => inv.status === 'Pendiente').reduce((acc, inv) => acc + inv.invoiceAmount, 0);

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Reportes</h1>
            <div ref={componentRef} className="bg-white p-8 rounded-xl shadow-lg mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Resumen Financiero</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-blue-100 p-4 rounded-lg">
                        <p className="text-sm text-blue-800 font-semibold">Costo Total de Salarios Mensuales</p>
                        <p className="text-2xl font-bold text-blue-900">${totalSalaries.toLocaleString()}</p>
                    </div>
                    <div className="bg-green-100 p-4 rounded-lg">
                        <p className="text-sm text-green-800 font-semibold">Total Facturado</p>
                        <p className="text-2xl font-bold text-green-900">${totalInvoiced.toLocaleString()}</p>
                    </div>
                    <div className="bg-yellow-100 p-4 rounded-lg">
                        <p className="text-sm text-yellow-800 font-semibold">Monto Pendiente de Cobro</p>
                        <p className="text-2xl font-bold text-yellow-900">${totalPendingInvoiced.toLocaleString()}</p>
                    </div>
                </div>
            </div>
            <div className="mt-4 text-center">
                <button
                    onClick={handlePrint}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Generar Reporte PDF
                </button>
            </div>
        </div>
    );
}


// ----------------------------------------------------------------------
// COMPONENTE PRINCIPAL DE LA APLICACIÓN
// ----------------------------------------------------------------------

/**
 * Componente principal de la aplicación.
 * @returns {JSX.Element} El JSX del componente App.
 */
function App() {
    // Definimos el estado de la aplicación
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [loading, setLoading] = useState(true);
    const [db, setDb] = useState(null);
    const [userId, setUserId] = useState(null);
    const [message, setMessage] = useState(null);
    
    // Contadores para el dashboard
    const [employeeCount, setEmployeeCount] = useState(0);
    const [invoiceCount, setInvoiceCount] = useState(0);

    // ======================================================================
    // CONFIGURACIÓN DE FIREBASE
    // ======================================================================
    useEffect(() => {
        const initializeFirebase = async () => {
            try {
                // Variables globales proporcionadas por el entorno
                const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
                const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
                const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
                
                // Verificar si la configuración de Firebase es válida
                if (!firebaseConfig || Object.keys(firebaseConfig).length === 0) {
                    console.error("Firebase config is not available.");
                    setLoading(false);
                    return;
                }
                
                // Inicializar Firebase
                const app = initializeApp(firebaseConfig);
                const firestoreDb = getFirestore(app);
                const firebaseAuth = getAuth(app);
                
                // Autenticar con el token o de forma anónima si no hay token
                if (initialAuthToken) {
                    await signInWithCustomToken(firebaseAuth, initialAuthToken);
                } else {
                    await signInAnonymously(firebaseAuth);
                }
                
                setDb(firestoreDb);
                setUserId(firebaseAuth.currentUser?.uid || crypto.randomUUID());
                setLoading(false);
            } catch (error) {
                console.error("Error al inicializar Firebase:", error);
                setMessage({ text: "Error de configuración. La aplicación no funcionará correctamente.", type: "error" });
                setLoading(false);
            }
        };
        initializeFirebase();
    }, []);
    
    // Escucha de datos en tiempo real para los contadores del dashboard
    useEffect(() => {
        if (db && userId) {
            const employeeCollection = collection(db, `artifacts/${__app_id}/users/${userId}/employees`);
            const invoiceCollection = collection(db, `artifacts/${__app_id}/users/${userId}/invoices`);

            const unsubscribeEmployees = onSnapshot(employeeCollection, (snapshot) => {
                setEmployeeCount(snapshot.size);
            });

            const unsubscribeInvoices = onSnapshot(invoiceCollection, (snapshot) => {
                setInvoiceCount(snapshot.size);
            });

            return () => {
                unsubscribeEmployees();
                unsubscribeInvoices();
            };
        }
    }, [db, userId]);

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
    
    const renderPage = () => {
        const componentProps = { db, userId, appId: typeof __app_id !== 'undefined' ? __app_id : 'default-app-id' };
        switch (currentPage) {
            case 'dashboard':
                return <Dashboard employeeCount={employeeCount} invoiceCount={invoiceCount} />;
            case 'employees':
                return <Employees {...componentProps} />;
            case 'invoicing':
                return <Invoicing {...componentProps} />;
            case 'reports':
                return <Reports {...componentProps} />;
            default:
                return <Dashboard employeeCount={employeeCount} invoiceCount={invoiceCount} />;
        }
    };
    
    const navItems = [
        { id: 'dashboard', name: 'Dashboard', icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-10v10a1 1 0 01-1 1h-3m-6 0h6m-6 0v-6m0 6h6m-6 0v-6" />
            </svg>
        )},
        { id: 'employees', name: 'Empleados', icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.684.282c.28 0 .56-.013.837-.038a1.35 1.35 0 011.543 1.29L20 20.5a.5.5 0 01-.5.5h-11a.5.5 0 01-.5-.5l-.014-.093a1.35 1.35 0 011.543-1.29c.277.025.557.038.837.038a9.38 9.38 0 002.684-.282m-3.5 0a9.38 9.38 0 01-5.684.282c-.28 0-.56.013-.837.038a1.35 1.35 0 01-1.543-1.29L2 20.5a.5.5 0 00.5.5h11a.5.5 0 00.5-.5l.014-.093a1.35 1.35 0 00-1.543-1.29zM12 11a4 4 0 100-8 4 4 0 000 8z" />
            </svg>
        )},
        { id: 'invoicing', name: 'Facturación', icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6M7.5 7.5l-3.5 3.5M16.5 7.5l3.5 3.5M7.5 16.5l-3.5-3.5M16.5 16.5l3.5-3.5" />
            </svg>
        )},
        { id: 'reports', name: 'Reportes', icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v2.25H21a.75.75 0 00.75-.75v-1.5a.75.75 0 00-.75-.75h-1.5zM6 16.5h1.5a.75.75 0 00.75-.75v-1.5a.75.75 0 00-.75-.75H6v2.25z" />
            </svg>
        )},
    ];
    
    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Barra Lateral (Sidebar) */}
            <aside className="w-64 bg-gray-900 text-gray-200 p-6 flex flex-col shadow-xl">
                <div className="mb-8 pb-4 border-b border-gray-700">
                    <h1 className="text-3xl font-extrabold text-white">Siigo Clon</h1>
                    <h2 className="text-sm font-light text-gray-400">Software de Gestión</h2>
                </div>
                <nav className="flex-1">
                    <ul>
                        {navItems.map(item => (
                            <li key={item.id}>
                                <a
                                    href="#"
                                    onClick={() => setCurrentPage(item.id)}
                                    className={`flex items-center p-3 mb-2 rounded-lg transition-all duration-200 ${currentPage === item.id ? 'bg-gray-800 text-white shadow-md' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
                                >
                                    {item.icon}
                                    <span className="font-semibold">{item.name}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
                <div className="mt-auto pt-4 border-t border-gray-700 text-xs text-gray-500">
                    <p>ID de Usuario:</p>
                    <p className="font-mono break-all text-sm">{userId}</p>
                </div>
            </aside>
            
            {/* Contenido Principal */}
            <main className="flex-1 overflow-y-auto">
                {renderPage()}
            </main>
        </div>
    );
}

// Renderizar el componente en el DOM
const domNode = document.getElementById('root');
const root = ReactDOM.createRoot(domNode);
root.render(<App />);

