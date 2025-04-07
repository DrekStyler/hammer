import React from "react";
import { Link } from "react-router-dom";
import useTranslation from "../utils/useTranslation";
import { useLanguage } from "../contexts/LanguageContext";
import "./Footer.css";

function Footer() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const currentYear = new Date().getFullYear();

  // Add translations for footer content
  const translations = {
    companyName: {
      English: "Oak Industries",
      Español: "Oak Industries"
    },
    tagline: {
      English: "Connecting skilled contractors with project leaders since 2023",
      Español: "Conectando contratistas especializados con líderes de proyectos desde 2023"
    },
    company: {
      English: "Company",
      Español: "Empresa"
    },
    about: {
      English: "About Us",
      Español: "Sobre Nosotros"
    },
    services: {
      English: "Services",
      Español: "Servicios"
    },
    careers: {
      English: "Careers",
      Español: "Carreras"
    },
    contact: {
      English: "Contact",
      Español: "Contacto"
    },
    resources: {
      English: "Resources",
      Español: "Recursos"
    },
    help: {
      English: "Help Center",
      Español: "Centro de Ayuda"
    },
    blog: {
      English: "Blog",
      Español: "Blog"
    },
    faq: {
      English: "FAQ",
      Español: "Preguntas Frecuentes"
    },
    legal: {
      English: "Legal",
      Español: "Legal"
    },
    terms: {
      English: "Terms of Service",
      Español: "Términos de Servicio"
    },
    privacy: {
      English: "Privacy Policy",
      Español: "Política de Privacidad"
    },
    copyright: {
      English: `© ${currentYear} Oak Industries. All rights reserved.`,
      Español: `© ${currentYear} Oak Industries. Todos los derechos reservados.`
    },
  };

  // Use the current language to get the appropriate text
  const getText = (key) => {
    return translations[key][language] || translations[key].English;
  };

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>{getText("companyName")}</h3>
          <p>{getText("tagline")}</p>
        </div>

        <div className="footer-section">
          <h3>{getText("company")}</h3>
          <ul>
            <li>
              <Link to="/about">{getText("about")}</Link>
            </li>
            <li>
              <Link to="/services">{getText("services")}</Link>
            </li>
            <li>
              <Link to="/careers">{getText("careers")}</Link>
            </li>
            <li>
              <Link to="/contact">{getText("contact")}</Link>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>{getText("resources")}</h3>
          <ul>
            <li>
              <Link to="/help">{getText("help")}</Link>
            </li>
            <li>
              <Link to="/blog">{getText("blog")}</Link>
            </li>
            <li>
              <Link to="/faq">{getText("faq")}</Link>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>{getText("legal")}</h3>
          <ul>
            <li>
              <Link to="/terms">{getText("terms")}</Link>
            </li>
            <li>
              <Link to="/privacy">{getText("privacy")}</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>{getText("copyright")}</p>
      </div>
    </footer>
  );
}

export default Footer;
