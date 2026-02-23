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
    FileText,
    Crown
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.1
            }
        }
    };

    const sectionVariants = {
        hidden: { opacity: 0, scale: 0.98 },
        visible: { 
            opacity: 1, 
            scale: 1,
            transition: { duration: 0.5, ease: "easeOut" } 
        }
    };

    const linkHover = {
        x: 4,
        color: 'var(--primary)',
        transition: { duration: 0.2, ease: "easeInOut" }
    };

    return (
        <motion.footer 
            className="footer-premium"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true, margin: "-100px" }}
        >
            {/* Animated Background Blobs */}
            <div className="footer-bg-blobs">
                <motion.div 
                    className="footer-blob footer-blob-1"
                    animate={{
                        x: [-100, 100, -100],
                        y: [-50, 50, -50],
                        scale: [1, 1.3, 1],
                    }}
                    transition={{
                        duration: 15,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />
                <motion.div 
                    className="footer-blob footer-blob-2"
                    animate={{
                        x: [100, -100, 100],
                        y: [50, -50, 50],
                        scale: [1, 1.4, 1],
                    }}
                    transition={{
                        duration: 18,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />
            </div>

            <motion.div 
                className="footer-content"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
            >
                {/* Brand & Mission */}
                <motion.div className="footer-section brand-section" variants={sectionVariants}>
                    <div className="footer-logo">
                        <Link to="/" onClick={() => window.scrollTo(0, 0)} className="footer-logo-link">
                            <span className="logo-text">Permis<span>Free</span>.be</span>
                        </Link>
                    </div>
                    <p className="footer-tagline">
                        Votre succès au code de la route commence ici. 
                        Entraînement gratuit, moderne et efficace.
                    </p>
                    <div className="footer-social-links">
                        <motion.a 
                            href="https://www.instagram.com/permisfree.be/" 
                            target="_blank" 
                            rel="noreferrer" 
                            className="social-link insta" 
                            whileHover={{ scale: 1.05, rotate: 3 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Instagram size={20} />
                        </motion.a>
                        <motion.a 
                            href="https://www.tiktok.com/@permisfree.be" 
                            target="_blank" 
                            rel="noreferrer" 
                            className="social-link tiktok" 
                            whileHover={{ scale: 1.05, rotate: -3 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                            </svg>
                        </motion.a>
                    </div>
                </motion.div>

                {/* Quick Links */}
                <motion.div className="footer-section links" variants={sectionVariants}>
                    <h3>Navigation</h3>
                    <ul>
                        <li><motion.div whileHover={linkHover}><Link to="/" onClick={() => window.scrollTo(0, 0)}>Accueil</Link></motion.div></li>
                        <li><motion.div whileHover={linkHover}><Link to="/lecons" onClick={() => window.scrollTo(0, 0)}>Cours Théoriques</Link></motion.div></li>
                        <li><motion.div whileHover={linkHover}><Link to="/quiz" onClick={() => window.scrollTo(0, 0)}>Quiz par Thèmes</Link></motion.div></li>
                        <li><motion.div whileHover={linkHover}><Link to="/examen-b" onClick={() => window.scrollTo(0, 0)}>Examen Blanc</Link></motion.div></li>
                        <li><motion.div whileHover={linkHover}><Link to="/profil" onClick={() => window.scrollTo(0, 0)}>Mon Profil</Link></motion.div></li>
                    </ul>
                </motion.div>

                {/* Support & Legal */}
                <motion.div className="footer-section support" variants={sectionVariants}>
                    <h3>Support</h3>
                    <motion.div className="support-item" whileHover={{ x: 5 }}>
                        <Mail size={16} />
                        <a href="mailto:support@permisfree.be">support@permisfree.be</a>
                    </motion.div>
                    <div className="legal-links mt-4">
                        <h3>Légal</h3>
                        <ul>
                            <li><motion.div whileHover={linkHover}><Link to="/confidentialite" onClick={() => window.scrollTo(0, 0)}><Shield size={14} /> Confidentialité</Link></motion.div></li>
                            <li><motion.div whileHover={linkHover}><Link to="/conditions" onClick={() => window.scrollTo(0, 0)}><FileText size={14} /> Conditions</Link></motion.div></li>
                        </ul>
                    </div>
                </motion.div>

                {/* Credits */}
                <motion.div className="footer-section credits" variants={sectionVariants}>
                    <h3>Créateurs</h3>
                    <div className="creators-group">
                        <motion.a 
                            href="https://github.com/stotwo" 
                            target="_blank" 
                            rel="noreferrer" 
                            className="creator-card"
                            whileHover={{ scale: 1.05, x: 5 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Github size={16} style={{ color: '#ff69b4' }} />
                            <span className="shiny-stotwo">stotwo</span>
                            <div style={{ display: 'flex', gap: '2px', marginLeft: '4px' }}>
                                <Crown size={11} className="shiny-crown" style={{ color: '#ff69b4' }} />
                                <Crown size={11} className="shiny-crown" style={{ color: '#ff69b4' }} />
                            </div>
                        </motion.a>
                        <motion.a 
                            href="https://github.com/skyreks00/" 
                            target="_blank" 
                            rel="noreferrer" 
                            className="creator-card"
                            whileHover={{ scale: 1.05, x: 5 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Github size={16} />
                            <span className="shiny-skyreks">skyreks</span>
                            <Crown size={11} className="shiny-crown" style={{ color: '#facc15', marginLeft: '4px' }} />
                        </motion.a>
                    </div>
                </motion.div>

                {/* Copyright Integrated */}
                <motion.div 
                    className="footer-copyright"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 0.6 }}
                    transition={{ delay: 0.8 }}
                >
                    <p>© {currentYear} Permis Online Free. Tous droits réservés.</p>
                </motion.div>
            </motion.div>
        </motion.footer>
    );
};

export default Footer;
