import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query 
} from 'firebase/firestore';

// --- Personalización del Autor ---
const AUTOR_NOMBRE_APELLIDO = "Tu Nombre y Apellido Aquí"; // <--- CAMBIA ESTA LÍNEA

// Las variables de Firebase se configuran como nulas aquí. 
// Para que la app funcione con tu base de datos real, debes configurar tus claves
// como variables de entorno en Vercel (REACT_APP_FIREBASE_API_KEY, etc.).
const appId = 'recipe-manager-app'; 
const firebaseConfig = null; 
const initialAuthToken = null;

// Inicialización de App y Servicios
const app = firebaseConfig ? initializeApp(firebaseConfig) : null;
const db = app ? getFirestore(app) : null;
const auth = app ? getAuth(app) : null;

// --- Componente de Formulario con Validación ---

const RecipeForm = ({ initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    ingredients: initialData?.ingredients || '',
    instructions: initialData?.instructions || '',
    rating: initialData?.rating || 3, // Default rating
  });
  const [errors, setErrors] = useState({});
  const isEditing = !!initialData?.id;

  const validate = () => {
    let newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'El nombre de la receta es obligatorio.';
    if (!formData.ingredients.trim()) newErrors.ingredients = 'Los ingredientes son obligatorios.';
    if (!formData.instructions.trim()) newErrors.instructions = 'Las instrucciones son obligatorias.';
    
    const ratingNum = parseInt(formData.rating, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      newErrors.rating = 'La calificación debe estar entre 1 y 5.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSave({ ...formData, rating: parseInt(formData.rating, 10) });
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-xl rounded-lg">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-2">
        {isEditing ? 'Editar Receta' : 'Crear Nueva Receta'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre de la Receta */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre</label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500`}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        {/* Ingredientes */}
        <div>
          <label htmlFor="ingredients" className="block text-sm font-medium text-gray-700">Ingredientes (Separados por comas)</label>
          <textarea
            id="ingredients"
            name="ingredients"
            rows="3"
            value={formData.ingredients}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border ${errors.ingredients ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500`}
          ></textarea>
          {errors.ingredients && <p className="mt-1 text-sm text-red-600">{errors.ingredients}</p>}
        </div>

        {/* Instrucciones */}
        <div>
          <label htmlFor="instructions" className="block text-sm font-medium text-gray-700">Instrucciones</label>
          <textarea
            id="instructions"
            name="instructions"
            rows="5"
            value={formData.instructions}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border ${errors.instructions ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500`}
          ></textarea>
          {errors.instructions && <p className="mt-1 text-sm text-red-600">{errors.instructions}</p>}
        </div>

        {/* Calificación */}
        <div>
          <label htmlFor="rating" className="block text-sm font-medium text-gray-700">Calificación (1-5)</label>
          <input
            id="rating"
            name="rating"
            type="number"
            min="1"
            max="5"
            value={formData.rating}
            onChange={handleChange}
            className={`mt-1 block w-20 px-3 py-2 border ${errors.rating ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500`}
          />
          {errors.rating && <p className="mt-1 text-sm text-red-600">{errors.rating}</p>}
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md shadow-sm hover:bg-gray-200 transition duration-150"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150"
          >
            {isEditing ? 'Guardar Cambios' : 'Crear Receta'}
          </button>
        </div>
      </form>
    </div>
  );
};

// --- Componente de Detalle ---

const DetailPage = ({ recipe, goToList, onEdit, onDelete }) => {
  if (!recipe) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white shadow-xl rounded-lg text-center">
        <h2 className="text-3xl font-bold mb-4 text-red-600">Receta no encontrada</h2>
        <button 
          onClick={goToList}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition"
        >
          Volver al Listado
        </button>
      </div>
    );
  }

  const ingredientsList = recipe.ingredients.split(',').map(item => item.trim()).filter(Boolean);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-2xl rounded-xl">
      <div className="flex justify-between items-start mb-6 border-b pb-4">
        <h1 className="text-4xl font-extrabold text-gray-900">{recipe.name}</h1>
        <div className="flex space-x-2">
          <button 
            onClick={() => onEdit(recipe)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg shadow-md hover:bg-blue-600 transition"
          >
            Editar
          </button>
          <button 
            onClick={() => {
              if (window.confirm('¿Estás seguro de que quieres eliminar esta receta?')) {
                onDelete(recipe.id);
              }
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg shadow-md hover:bg-red-600 transition"
          >
            Eliminar
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">Instrucciones</h2>
          <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{recipe.instructions}</p>
        </div>
        <div className="md:col-span-1 bg-gray-50 p-4 rounded-lg">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">Ingredientes</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            {ingredientsList.map((item, index) => (
              <li key={index} className="text-sm">{item}</li>
            ))}
          </ul>
          <div className="mt-4 pt-4 border-t">
            <p className="font-semibold text-lg text-gray-800">Calificación:</p>
            <span className="text-3xl text-yellow-500">
              {'★'.repeat(recipe.rating)}{'☆'.repeat(5 - recipe.rating)}
            </span>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-right">
        <button 
          onClick={goToList}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
        >
          &larr; Volver al Listado
        </button>
      </div>
    </div>
  );
};

// --- Componente de Listado ---

const HomePage = ({ recipes, goToDetail, onCreate, onDelete }) => {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900">Mis Recetas (Total: {recipes.length})</h1>
        <button 
          onClick={onCreate}
          className="px-6 py-3 text-lg font-bold text-white bg-green-600 rounded-xl shadow-lg hover:bg-green-700 transition transform hover:scale-105"
        >
          + Agregar Receta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {recipes.length === 0 ? (
          <p className="col-span-3 text-center text-xl text-gray-500 p-10">
            Aún no hay recetas. ¡Crea una para empezar!
          </p>
        ) : (
          recipes.map(recipe => (
            <div key={recipe.id} className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition duration-300 flex flex-col justify-between">
              <div className="p-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2 truncate">{recipe.name}</h2>
                <p className="text-sm text-yellow-500 mb-3">
                  {'★'.repeat(recipe.rating)}{'☆'.repeat(5 - recipe.rating)}
                </p>
                <p className="text-gray-600 text-sm line-clamp-3 mb-4">{recipe.instructions.substring(0, 100)}...</p>
              </div>
              <div className="p-4 border-t border-gray-100 flex justify-end space-x-2">
                <button 
                  onClick={() => goToDetail(recipe.id)}
                  className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition"
                >
                  Ver Detalle
                </button>
                <button 
                  onClick={() => {
                    if (window.confirm('¿Estás seguro de que quieres eliminar esta receta?')) {
                      onDelete(recipe.id);
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-red-100 rounded-lg hover:bg-red-200 transition"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// --- Componentes Reutilizables ---

const Navbar = ({ navigate }) => (
  <header className="bg-indigo-700 shadow-lg sticky top-0 z-10">
    <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
      <div 
        className="text-2xl font-bold text-white cursor-pointer hover:text-indigo-200 transition"
        onClick={() => navigate('/')}
      >
        Gestor de Recetas
      </div>
      <div className="flex space-x-4">
        <button 
          onClick={() => navigate('/')}
          className="text-white hover:text-indigo-200 px-3 py-2 rounded-md text-sm font-medium transition"
        >
          Inicio / Listado
        </button>
        <button 
          onClick={() => navigate('/create')}
          className="text-white bg-indigo-500 hover:bg-indigo-400 px-3 py-2 rounded-md text-sm font-medium transition"
        >
          Crear Receta
        </button>
      </div>
    </nav>
  </header>
);

const Footer = () => (
  <footer className="bg-gray-800 text-white mt-12 py-6">
    <div className="max-w-6xl mx-auto px-4 text-center text-sm">
      <p>Gestor de Recetas | Proyecto SPA React & Firebase CRUD.</p>
      <p className="mt-1 text-gray-400">
        <strong className="text-indigo-300">Desarrollador:</strong> {AUTOR_NOMBRE_APELLIDO}
      </p>
      <p className="mt-2 text-gray-500">
        <span className="text-xs">Requisito de estructura y funcionalidad frontend.</span>
      </p>
    </div>
  </footer>
);

// --- Componente Principal (App) ---

const App = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [path, setPath] = useState('/'); 
  const [resourceId, setResourceId] = useState(null); 
  const [authStatus, setAuthStatus] = useState('pending');

  const navigate = useCallback((newPath) => {
    if (newPath === '/' || newPath === '/create') {
      setPath(newPath);
      setResourceId(null);
    } 
    else if (newPath.startsWith('/recipe/')) {
      const id = newPath.split('/recipe/')[1];
      setPath('/recipe');
      setResourceId(id);
    } else if (newPath.startsWith('/edit/')) {
      const id = newPath.split('/edit/')[1];
      setPath('/edit');
      setResourceId(id);
    }
  }, []);

  // --- Lógica de Autenticación de Firebase ---
  useEffect(() => {
    if (!auth) {
      console.warn("Firebase no inicializado. Operaciones CRUD serán solo simuladas.");
      setAuthStatus('uninitialized');
      setLoading(false);
      return;
    }

    const signIn = async () => {
      try {
        if (initialAuthToken) {
          await signInWithCustomToken(auth, initialAuthToken);
        } else {
          await signInAnonymously(auth);
        }
        setAuthStatus('authenticated');
      } catch (e) {
        console.error("Error de autenticación de Firebase:", e);
        setError("Error al autenticar con Firebase.");
        setAuthStatus('error');
      }
    };

    signIn();
  }, []);

  const getCollectionRef = useCallback(() => {
    if (!db || authStatus !== 'authenticated') return null;
    const userId = auth.currentUser?.uid || 'default_user';
    return collection(db, 'artifacts', appId, 'public', 'data', 'recipes');
  }, [authStatus]);

  // --- CRUD: READ (onSnapshot) ---
  useEffect(() => {
    const recipesCollectionRef = getCollectionRef();
    if (!recipesCollectionRef) {
      if (authStatus !== 'pending') setLoading(false);
      return;
    }
    
    const q = query(recipesCollectionRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRecipes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecipes(fetchedRecipes);
      setLoading(false);
    }, (e) => {
      console.error("Error al obtener recetas:", e);
      setError("Error al cargar las recetas desde Firestore.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [getCollectionRef, authStatus]);

  // --- CRUD: CREATE ---
  const handleCreateRecipe = async (newRecipe) => {
    const recipesCollectionRef = getCollectionRef();
    if (!recipesCollectionRef) return;

    try {
      await addDoc(recipesCollectionRef, newRecipe);
      navigate('/'); 
    } catch (e) {
      console.error("Error al crear receta:", e);
      setError("Fallo al crear la receta. Inténtelo de nuevo.");
    }
  };

  // --- CRUD: UPDATE ---
  const handleUpdateRecipe = async (id, updatedFields) => {
    const recipesCollectionRef = getCollectionRef();
    if (!recipesCollectionRef) return;
    
    try {
      const recipeDocRef = doc(recipesCollectionRef, id);
      await updateDoc(recipeDocRef, updatedFields);
      navigate('/');
    } catch (e) {
      console.error("Error al actualizar receta:", e);
      setError("Fallo al actualizar la receta. Inténtelo de nuevo.");
    }
  };

  // --- CRUD: DELETE ---
  const handleDeleteRecipe = async (id) => {
    const recipesCollectionRef = getCollectionRef();
    if (!recipesCollectionRef) return;
    
    try {
      const recipeDocRef = doc(recipesCollectionRef, id);
      await deleteDoc(recipeDocRef);
      if (path === '/recipe' && resourceId === id) {
        navigate('/');
      }
    } catch (e) {
      console.error("Error al eliminar receta:", e);
      setError("Fallo al eliminar la receta. Inténtelo de nuevo.");
    }
  };

  let content = null;
  const currentRecipe = recipes.find(r => r.id === resourceId);

  if (loading || authStatus === 'pending') {
    content = <div className="text-center p-20 text-xl font-semibold text-indigo-600">Cargando aplicación y datos...</div>;
  } else if (error || authStatus === 'error' || authStatus === 'uninitialized') {
    content = <div className="text-center p-20 text-xl font-semibold text-red-600">Error: {error || "No se pudo conectar a Firebase o no está configurado."}</div>;
  } else {
    switch (path) {
      case '/':
        content = <HomePage 
          recipes={recipes} 
          goToDetail={(id) => navigate(`/recipe/${id}`)}
          onCreate={() => navigate('/create')}
          onDelete={handleDeleteRecipe}
        />;
        break;
      case '/create':
        content = <RecipeForm 
          onSave={handleCreateRecipe} 
          onCancel={() => navigate('/')} 
        />;
        break;
      case '/recipe':
        content = <DetailPage 
          recipe={currentRecipe} 
          goToList={() => navigate('/')}
          onEdit={() => navigate(`/edit/${resourceId}`)}
          onDelete={handleDeleteRecipe}
        />;
        break;
      case '/edit':
        if (currentRecipe) {
          content = <RecipeForm 
            initialData={currentRecipe}
            onSave={(data) => handleUpdateRecipe(resourceId, data)}
            onCancel={() => navigate(`/recipe/${resourceId}`)}
          />;
        } else {
           navigate('/');
        }
        break;
      default:
        content = <div className="text-center p-20 text-xl font-semibold text-gray-500">404 | Página no encontrada</div>;
    }
  }

  const displayUserId = authStatus === 'authenticated' ? auth.currentUser?.uid : 'N/A';
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <Navbar navigate={navigate} />
      <main className="flex-grow p-4 sm:p-8">
        <div className="max-w-6xl mx-auto mb-4 p-3 bg-yellow-100 rounded-lg shadow-sm text-sm text-yellow-800">
            **ID de Usuario Actual (para Firestore):** {displayUserId}
        </div>
        {content}
      </main>
      <Footer />
    </div>
  );
};

// Punto de montaje: renderiza la aplicación en el 'root' div de index.html
const container = document.getElementById('root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(<App />);
}