import { useNavigate, useLocation } from "react-router-dom";

export default function VoltarBtn() {
  const navigate = useNavigate();
  const location = useLocation();

  function voltar() {
    // Se a página anterior for o /login (ou se não houver histórico), não deixa voltar
    if (
      location.key === "default" ||  // significa que entrou direto na rota
      document.referrer.includes("/login")
    ) {
      navigate("/admin"); // volta sempre para o painel admin
      return;
    }

    navigate(-1); // volta normalmente
  }

  return (
    <button
      onClick={voltar}
      style={{
        position: "absolute",
        right: "15px",
        top: "15px",
        background: "#000",
        color: "#fff",
        padding: "4px 8px",
        borderRadius: "4px",
        border: "none",
        cursor: "pointer",
        fontWeight: "bold",
        fontSize: "11px",
        zIndex: 5
      }}
    >
      Voltar
    </button>
  );
}
