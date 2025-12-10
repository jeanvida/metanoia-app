import { useState } from "react";
import { translations, getTranslation } from "../i18n/translations";

export default function Home() {
  const [idioma, setIdioma] = useState("pt");
  const t = (key) => getTranslation(idioma, key);

  const isMobile = window.innerWidth <= 768;

  const styles = {
    languageSelector: { 
      position: "fixed", 
      top: isMobile ? "10px" : "20px", 
      left: isMobile ? "10px" : "20px", 
      display: "flex", 
      gap: isMobile ? "6px" : "10px", 
      zIndex: 999 
    },
    flagBtn: { 
      width: isMobile ? "40px" : "50px", 
      height: isMobile ? "40px" : "50px", 
      fontSize: isMobile ? "12px" : "14px", 
      fontWeight: "bold",
      background: "#fff", 
      border: "2px solid #000", 
      borderRadius: "10px", 
      cursor: "pointer", 
      transition: "all 0.3s",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#000"
    },
    flagBtnActivePT: { 
      backgroundImage: "url('/flags/br.svg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      color: "#fff",
      border: "2px solid #000",
      fontWeight: "bold",
      textShadow: "2px 2px 4px rgba(0,0,0,0.9)"
    },
    flagBtnActiveES: { 
      backgroundImage: "url('/flags/es.svg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      color: "#fff",
      border: "2px solid #000",
      fontWeight: "bold",
      textShadow: "2px 2px 4px rgba(0,0,0,0.9)"
    },
    flagBtnActiveEN: { 
      backgroundImage: "url('/flags/us.svg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      color: "#fff",
      border: "2px solid #3c3b6e",
      fontWeight: "bold",
      textShadow: "2px 2px 4px rgba(0,0,0,0.9)"
    }
  };

  return (
    <div style={{ 
      textAlign: "center", 
      marginTop: isMobile ? "80px" : "30px", 
      color: "#000",
      padding: isMobile ? "0 15px" : "0 20px"
    }}>
      <div style={styles.languageSelector}>
        <button 
          onClick={() => setIdioma("pt")} 
          style={{
            ...styles.flagBtn,
            ...(idioma === "pt" ? styles.flagBtnActivePT : {})
          }}
          title="Português"
        >
          PT
        </button>
        <button 
          onClick={() => setIdioma("es")} 
          style={{
            ...styles.flagBtn,
            ...(idioma === "es" ? styles.flagBtnActiveES : {})
          }}
          title="Español"
        >
          ES
        </button>
        <button 
          onClick={() => setIdioma("en")} 
          style={{
            ...styles.flagBtn,
            ...(idioma === "en" ? styles.flagBtnActiveEN : {})
          }}
          title="English"
        >
          EN
        </button>
      </div>
      
      <h1 style={{ fontSize: isMobile ? "24px" : "32px", fontWeight: "bold" }}>{t("bemVindo")}</h1>
      <p style={{ fontSize: isMobile ? "16px" : "20px" }}>
        {t("subtitulo")}
      </p>
    </div>
  );
}

