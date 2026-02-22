import React from 'react';

const TermsPage = () => {
    return (
        <div className="page container" style={{ paddingTop: '100px' }}>
            <h1 className="text-4xl font-extrabold mb-8 text-primary">Conditions d'Utilisation</h1>
            
            <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4">1. Acceptation des Conditions</h2>
                <p className="text-muted leading-relaxed mb-4">
                    En accédant et en utilisant PermisFree.be, vous acceptez d'être lié par les présentes conditions d'utilisation. 
                    Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser le site.
                </p>
            </section>

            <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4">2. Description du Service</h2>
                <p className="text-muted leading-relaxed mb-4">
                    PermisFree.be est une plateforme éducative gratuite destinée à aider les utilisateurs à réviser le code de la route (Permis B). 
                    Nous fournissons des cours, des quiz et des examens blancs basés sur les règles de circulation en vigueur.
                </p>
            </section>

            <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4">3. Responsabilité</h2>
                <p className="text-muted leading-relaxed mb-4">
                    <strong>Contenu informatif :</strong> Bien que nous nous efforcions de maintenir les informations à jour, PermisFree.be ne peut être tenu responsable des erreurs ou omissions dans le contenu. 
                    Le site est un outil d'entraînement et ne remplace en aucun cas les cours officiels dispensés par une auto-école agréée.
                </p>
                <p className="text-muted leading-relaxed mb-4">
                    <strong>Utilisation du service :</strong> L'utilisation du site se fait à vos propres risques. Nous ne garantissons pas que le service sera ininterrompu ou sans erreur.
                </p>
            </section>

            <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4">4. Propriété Intellectuelle</h2>
                <p className="text-muted leading-relaxed mb-4">
                    L'architecture du site, son design et certains contenus textuels originaux sont la propriété de leurs créateurs respectifs. 
                    Toute reproduction non autorisée est interdite.
                </p>
            </section>

            <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4">5. Modifications</h2>
                <p className="text-muted leading-relaxed mb-4">
                    Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications prendront effet dès leur publication sur le site.
                </p>
            </section>

            <div className="mt-12 p-6 bg-surface-2 rounded-xl border border-border" style={{ textAlign: 'right' }}>
                <p className="text-sm text-muted">Dernière mise à jour : 22 février 2026</p>
            </div>
        </div>
    );
};

export default TermsPage;
