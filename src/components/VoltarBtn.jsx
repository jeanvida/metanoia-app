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
        right: "20px",
        top: "20px",
        background: "#000",
        color: "#fff",
        padding: "10px 14px",
        borderRadius: "10px",
        border: "none",
        cursor: "pointer",
        fontWeight: "bold"
      }}
    >
      Voltar
    </button>
  );
}
