import React from "react";
import { Link } from "react-router-dom";
import useTranslation from "../utils/useTranslation";
import { useLanguage } from "../contexts/LanguageContext";

// Footer styles
const styles = {
  footer: {
    backgroundColor: "#f8f9fa",
    borderTop: "1px solid #e0e0e0",
    padding: "40px 0 0 0",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    color: "#5f6368",
  },
  footerContent: {
    display: "flex",
    flexWrap: "wrap",
    maxWidth: "1600px",
    margin: "0 auto",
    padding: "0 20px",
    justifyContent: "space-between",
  },
  footerSection: {
    flex: "1",
    minWidth: "200px",
    marginBottom: "30px",
    padding: "0 20px",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "500",
    color: "#202124",
    marginBottom: "16px",
  },
  tagline: {
    fontSize: "14px",
    lineHeight: "1.5",
    maxWidth: "300px",
  },
  linksList: {
    listStyle: "none",
    padding: "0",
    margin: "0",
  },
  linkItem: {
    marginBottom: "12px",
  },
  link: {
    color: "#5f6368",
    textDecoration: "none",
    fontSize: "14px",
    transition: "color 0.2s",
  },
  linkHover: {
    color: "#1a73e8",
  },
  footerBottom: {
    borderTop: "1px solid #e0e0e0",
    padding: "20px",
    textAlign: "center",
    fontSize: "14px",
    color: "#757575",
    backgroundColor: "#f1f3f4",
  },
  socialIcons: {
    display: "flex",
    gap: "16px",
    marginTop: "16px",
  },
  socialIcon: {
    color: "#5f6368",
    fontSize: "18px",
    transition: "color 0.2s",
  },
  // Responsive styles
  '@media (max-width: 768px)': {
    footerContent: {
      flexDirection: "column",
    },
    footerSection: {
      width: "100%",
      padding: "0",
    }
  },
};

function Footer() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const currentYear = new Date().getFullYear();
  const [hoveredLink, setHoveredLink] = React.useState(null);

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

  // Handle hover state for links
  const handleLinkHover = (linkKey) => {
    setHoveredLink(linkKey);
  };

  const handleLinkLeave = () => {
    setHoveredLink(null);
  };

  // Get responsive styles based on window width
  const getResponsiveStyles = () => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      return {
        footerContent: {
          ...styles.footerContent,
          flexDirection: "column",
        },
        footerSection: {
          ...styles.footerSection,
          width: "100%",
          padding: "0",
        }
      };
    }
    return {
      footerContent: styles.footerContent,
      footerSection: styles.footerSection,
    };
  };

  const responsiveStyles = getResponsiveStyles();

  return (
    <footer style={styles.footer}>
      <div style={responsiveStyles.footerContent}>
        <div style={responsiveStyles.footerSection}>
          <h3 style={styles.sectionTitle}>{getText("companyName")}</h3>
          <p style={styles.tagline}>{getText("tagline")}</p>
          <div style={styles.socialIcons}>
            <i className="fab fa-facebook-f" style={styles.socialIcon}></i>
            <i className="fab fa-twitter" style={styles.socialIcon}></i>
            <i className="fab fa-linkedin-in" style={styles.socialIcon}></i>
            <i className="fab fa-instagram" style={styles.socialIcon}></i>
          </div>
        </div>

        <div style={responsiveStyles.footerSection}>
          <h3 style={styles.sectionTitle}>{getText("company")}</h3>
          <ul style={styles.linksList}>
            <li style={styles.linkItem}>
              <Link 
                to="/about" 
                style={{
                  ...styles.link,
                  ...(hoveredLink === 'about' ? styles.linkHover : {})
                }}
                onMouseEnter={() => handleLinkHover('about')}
                onMouseLeave={handleLinkLeave}
              >
                {getText("about")}
              </Link>
            </li>
            <li style={styles.linkItem}>
              <Link 
                to="/services" 
                style={{
                  ...styles.link,
                  ...(hoveredLink === 'services' ? styles.linkHover : {})
                }}
                onMouseEnter={() => handleLinkHover('services')}
                onMouseLeave={handleLinkLeave}
              >
                {getText("services")}
              </Link>
            </li>
            <li style={styles.linkItem}>
              <Link 
                to="/careers" 
                style={{
                  ...styles.link,
                  ...(hoveredLink === 'careers' ? styles.linkHover : {})
                }}
                onMouseEnter={() => handleLinkHover('careers')}
                onMouseLeave={handleLinkLeave}
              >
                {getText("careers")}
              </Link>
            </li>
            <li style={styles.linkItem}>
              <Link 
                to="/contact" 
                style={{
                  ...styles.link,
                  ...(hoveredLink === 'contact' ? styles.linkHover : {})
                }}
                onMouseEnter={() => handleLinkHover('contact')}
                onMouseLeave={handleLinkLeave}
              >
                {getText("contact")}
              </Link>
            </li>
          </ul>
        </div>

        <div style={responsiveStyles.footerSection}>
          <h3 style={styles.sectionTitle}>{getText("resources")}</h3>
          <ul style={styles.linksList}>
            <li style={styles.linkItem}>
              <Link 
                to="/help" 
                style={{
                  ...styles.link,
                  ...(hoveredLink === 'help' ? styles.linkHover : {})
                }}
                onMouseEnter={() => handleLinkHover('help')}
                onMouseLeave={handleLinkLeave}
              >
                {getText("help")}
              </Link>
            </li>
            <li style={styles.linkItem}>
              <Link 
                to="/blog" 
                style={{
                  ...styles.link,
                  ...(hoveredLink === 'blog' ? styles.linkHover : {})
                }}
                onMouseEnter={() => handleLinkHover('blog')}
                onMouseLeave={handleLinkLeave}
              >
                {getText("blog")}
              </Link>
            </li>
            <li style={styles.linkItem}>
              <Link 
                to="/faq" 
                style={{
                  ...styles.link,
                  ...(hoveredLink === 'faq' ? styles.linkHover : {})
                }}
                onMouseEnter={() => handleLinkHover('faq')}
                onMouseLeave={handleLinkLeave}
              >
                {getText("faq")}
              </Link>
            </li>
          </ul>
        </div>

        <div style={responsiveStyles.footerSection}>
          <h3 style={styles.sectionTitle}>{getText("legal")}</h3>
          <ul style={styles.linksList}>
            <li style={styles.linkItem}>
              <Link 
                to="/terms" 
                style={{
                  ...styles.link,
                  ...(hoveredLink === 'terms' ? styles.linkHover : {})
                }}
                onMouseEnter={() => handleLinkHover('terms')}
                onMouseLeave={handleLinkLeave}
              >
                {getText("terms")}
              </Link>
            </li>
            <li style={styles.linkItem}>
              <Link 
                to="/privacy" 
                style={{
                  ...styles.link,
                  ...(hoveredLink === 'privacy' ? styles.linkHover : {})
                }}
                onMouseEnter={() => handleLinkHover('privacy')}
                onMouseLeave={handleLinkLeave}
              >
                {getText("privacy")}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      
      <div style={styles.footerBottom}>
        <p>{getText("copyright")}</p>
      </div>
    </footer>
  );
}

export default Footer;
