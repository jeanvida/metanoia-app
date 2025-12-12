import { Routes, Route, Link, Outlet } from "react-router-dom";
import { lazy, Suspense } from "react";
import Home from "./pages/Home";
import Cardapio from "./pages/Cardapio";

// Lazy load admin pages para melhor performance
const Admin = lazy(() => import("./pages/Admin"));
const AdminHamburgueres = lazy(() => import("./pages/admin/AdminHamburgueres.jsx"));
const AdminCombos = lazy(() => import("./pages/admin/AdminCombos.jsx"));
const AdminAcompanhamentos = lazy(() => import("./pages/admin/AdminAcompanhamentos.jsx"));
const AdminBebidas = lazy(() => import("./pages/admin/AdminBebidas.jsx"));
const AdminPedidos = lazy(() => import("./pages/admin/AdminPedidos.jsx"));
const AdminIngredientes = lazy(() => import("./pages/admin/AdminIngredientes.jsx"));

import { LanguageProvider, useLanguage } from "./contexts/LanguageContext";
import { getTranslation } from "./i18n/translations";

import logo from "/logo.png";

// Loading component
const LoadingFallback = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '100vh', 
    background: '#F1B100' 
  }}>
    <h2>Carregando...</h2>
  </div>
);

export default function App() {
  return (
    <LanguageProvider>
      <div
        style={{
          minHeight: "100vh",
          width: "100%",
          backgroundColor: "#F1B100",
          backgroundImage: `url("/bg.png")`,
          backgroundRepeat: "repeat",
          backgroundSize: "600px 600px",
          backgroundPosition: "top left",
        }}
      >
        <Routes>
          {/* Admin - tela inteira com lazy loading */}
          <Route path="/admin" element={<Suspense fallback={<LoadingFallback />}><Admin /></Suspense>} />
          <Route path="/admin/hamburgueres" element={<Suspense fallback={<LoadingFallback />}><AdminHamburgueres /></Suspense>} />
          <Route path="/admin/combos" element={<Suspense fallback={<LoadingFallback />}><AdminCombos /></Suspense>} />
          <Route path="/admin/acompanhamentos" element={<Suspense fallback={<LoadingFallback />}><AdminAcompanhamentos /></Suspense>} />
          <Route path="/admin/bebidas" element={<Suspense fallback={<LoadingFallback />}><AdminBebidas /></Suspense>} />
          <Route path="/admin/pedidos" element={<Suspense fallback={<LoadingFallback />}><AdminPedidos /></Suspense>} />
          <Route path="/admin/ingredientes" element={<Suspense fallback={<LoadingFallback />}><AdminIngredientes /></Suspense>} />

          {/* Layout padrão envolvendo Home e Cardápio */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/cardapio" element={<Cardapio />} />
          </Route>
        </Routes>
    </div>
    </LanguageProvider>
  );
}

/* Layout com header, nav e Outlet */
function Layout() {
  const { idioma } = useLanguage();
  const t = (key) => getTranslation(idioma, key);

  return (
    <div style={styles.appWrapper}>
      <div style={styles.appContainer}>
        <header style={styles.header}>
          <img src={logo} alt="Metanoia Burger" style={styles.logo} />
        </header>

        <nav style={styles.nav}>
          <Link to="/" style={styles.navItem}>{t("inicio")}</Link>
          <Link to="/cardapio" style={styles.navItem}>{t("cardapio")}</Link>
        </nav>

        <main style={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const styles = {
  appWrapper: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    justifyContent: "center",
    background: "transparent", // importante para o background do App aparecer
  },
  appContainer: {
    width: "100%",
    maxWidth: "900px",
    padding: "20px",
    color: "#000",
    fontFamily: "Arial, sans-serif",
    textAlign: "center",
    background: "transparent", // evita sobrepor o background do App
  },
  header: { marginBottom: "20px" },
  logo: { width: "180px" },
  nav: {
    display: "flex",
    justifyContent: "center",
    gap: "20px",
    marginBottom: "30px",
  },
  navItem: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#000",
    textDecoration: "none",
    backgroundColor: "#fff",
    padding: "10px 22px",
    borderRadius: "10px",
  },
  main: { padding: "10px", width: "100%" },
};
