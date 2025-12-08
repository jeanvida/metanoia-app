import { Routes, Route, Link, Outlet } from "react-router-dom";
import Home from "./pages/Home";
import Cardapio from "./pages/Cardapio";
import Admin from "./pages/Admin";

import AdminHamburgueres from "./pages/admin/AdminHamburgueres.jsx";
import AdminCombos from "./pages/admin/AdminCombos.jsx";
import AdminAcompanhamentos from "./pages/admin/AdminAcompanhamentos.jsx";
import AdminBebidas from "./pages/admin/AdminBebidas.jsx";
import AdminPedidos from "./pages/admin/AdminPedidos.jsx";

import logo from "/logo.png";

export default function App() {
  return (
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
        {/* Admin - tela inteira */}
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/hamburgueres" element={<AdminHamburgueres />} />
        <Route path="/admin/combos" element={<AdminCombos />} />
        <Route path="/admin/acompanhamentos" element={<AdminAcompanhamentos />} />
        <Route path="/admin/bebidas" element={<AdminBebidas />} />
        <Route path="/admin/pedidos" element={<AdminPedidos />} />

        {/* Layout padrão envolvendo Home e Cardápio */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/cardapio" element={<Cardapio />} />
        </Route>
      </Routes>
    </div>
  );
}

/* Layout com header, nav e Outlet */
function Layout() {
  return (
    <div style={styles.appWrapper}>
      <div style={styles.appContainer}>
        <header style={styles.header}>
          <img src={logo} alt="Metanoia Burger" style={styles.logo} />
        </header>

        <nav style={styles.nav}>
          <Link to="/" style={styles.navItem}>Início</Link>
          <Link to="/cardapio" style={styles.navItem}>Cardápio</Link>
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
