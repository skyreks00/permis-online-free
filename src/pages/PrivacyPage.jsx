import React from 'react';

const PrivacyPage = () => {
    return (
        <div className="page container" style={{ paddingTop: '100px' }}>
            <h1 className="text-4xl font-extrabold mb-8 text-primary">Politique de Confidentialité</h1>
            
            <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
                <p className="text-muted leading-relaxed mb-4">
                    Bienvenue sur PermisFree.be. Nous accordons une importance primordiale à la protection de vos données personnelles. 
                    Cette politique explique comment nous traitons vos informations lors de votre utilisation de notre plateforme d'apprentissage.
                </p>
            </section>

            <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4">2. Collecte des Données</h2>
                <p className="text-muted leading-relaxed mb-4">
                    <strong>Utilisation sans compte :</strong> Si vous utilisez PermisFree.be sans vous connecter, aucune donnée personnelle n'est collectée sur nos serveurs. 
                    Votre progression (scores, leçons lues) est stockée uniquement dans le "Local Storage" de votre propre navigateur.
                </p>
                <p className="text-muted leading-relaxed mb-4">
                    <strong>Utilisation avec compte (GitHub) :</strong> Lorsque vous vous connectez via GitHub, nous recevons uniquement votre identifiant unique GitHub, votre nom d'utilisateur et votre adresse email (si publique). 
                    Ces informations servent exclusivement à synchroniser votre progression sur plusieurs appareils via Firebase.
                </p>
            </section>

            <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4">3. Utilisation des API Tierces</h2>
                <p className="text-muted leading-relaxed mb-4">
                    Nous utilisons Groq pour l'intelligence artificielle et ElevenLabs pour la synthèse vocale. 
                    Si vous configurez vos propres clés API dans votre profil, celles-ci sont stockées de manière sécurisée et ne sont jamais partagées.
                </p>
            </section>

            <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4">4. Cookies</h2>
                <p className="text-muted leading-relaxed mb-4">
                    PermisFree.be n'utilise pas de cookies publicitaires ou de traçage tiers. Nous utilisons uniquement le stockage local pour des raisons techniques (thème sombre/clair, progression).
                </p>
            </section>

            <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4">5. Vos Droits</h2>
                <p className="text-muted leading-relaxed mb-4">
                    Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. 
                    Vous pouvez réinitialiser votre progression à tout moment depuis votre profil ou nous contacter pour toute question.
                </p>
            </section>

            <div className="mt-12 p-6 bg-surface-2 rounded-xl border border-border" style={{ textAlign: 'right' }}>
                <p className="text-sm text-muted">Dernière mise à jour : 22 février 2026</p>
                <p className="text-sm text-muted mt-2">Contact : <a href="mailto:support@permisfree.be" className="text-primary hover:underline">support@permisfree.be</a></p>
            </div>
        </div>
    );
};

export default PrivacyPage;
