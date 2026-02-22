import React from 'react';
import { 
    Instagram, 
    Mail, 
    Github, 
    ExternalLink, 
    Heart,
    MessageCircle,
    Info,
    Shield,
    FileText
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer-premium">
            <div className="footer-content">
                {/* Branding & Mission */}
                <div className="footer-section branding">
                    <div className="footer-logo">
                        <span className="logo-text">Permis<span>Free</span>.be</span>
                    </div>
                    <p className="footer-tagline">
                        Votre succès au code de la route commence ici. 
                        Entraînement gratuit, moderne et efficace.
                    </p>
                    <div className="footer-socials">
                        <a href="https://www.instagram.com/permisfree.be/" target="_blank" rel="noreferrer" className="social-link insta" title="Instagram">
                            <Instagram size={20} />
                        </a>
                        <a href="https://www.tiktok.com/@permisfree.be" target="_blank" rel="noreferrer" className="social-link tiktok" title="TikTok">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                            </svg>
                        </a>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="footer-section links">
                    <h3>Navigation</h3>
                    <ul>
                        <li><Link to="/" onClick={() => window.scrollTo(0, 0)}>Accueil</Link></li>
                        <li><Link to="/lecons" onClick={() => window.scrollTo(0, 0)}>Cours Théoriques</Link></li>
                        <li><Link to="/quiz" onClick={() => window.scrollTo(0, 0)}>Quiz par Thèmes</Link></li>
                        <li><Link to="/examen-b" onClick={() => window.scrollTo(0, 0)}>Examen Blanc</Link></li>
                        <li><Link to="/profil" onClick={() => window.scrollTo(0, 0)}>Mon Profil</Link></li>
                    </ul>
                </div>

                {/* Support & Legal */}
                <div className="footer-section support">
                    <h3>Support</h3>
                    <div className="support-item">
                        <Mail size={16} />
                        <a href="mailto:support@permisfree.be">support@permisfree.be</a>
                    </div>
                    <div className="legal-links mt-4">
                        <h3>Légal</h3>
                        <ul>
                            <li><Link to="/confidentialite" onClick={() => window.scrollTo(0, 0)}><Shield size={14} /> Confidentialité</Link></li>
                            <li><Link to="/conditions" onClick={() => window.scrollTo(0, 0)}><FileText size={14} /> Conditions</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Credits */}
                <div className="footer-section credits">
                    <h3>Créateurs</h3>
                    <div className="creators-group">
                        <a href="https://github.com/stotwo" target="_blank" rel="noreferrer" className="creator-card">
                            <Github size={16} />
                            <span>stotwo</span>
                        </a>
                        <a href="https://github.com/skyreks00/" target="_blank" rel="noreferrer" className="creator-card">
                            <Github size={16} />
                            <span>skyreks</span>
                        </a>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <div className="footer-bottom-inner">
                    <p>© {currentYear} Permis Online Free. Tous droits réservés.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
