import React, { useRef } from 'react';
import globalStyles from '../assets/styles.css?inline';
import { ArrowLeft } from 'lucide-react';

const LessonViewer = ({ lessonFile, onBack, theme }) => {
    const [srcDoc, setSrcDoc] = React.useState('');
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchLesson = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/lecon/${lessonFile}`);
                const html = await response.text();

                // Parse the HTML
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                // 1. Inject global theme attribute
                doc.documentElement.setAttribute('data-theme', theme);

                // 2. Inject Styles
                const style = doc.createElement('style');
                style.textContent = globalStyles + `
                    /* Ensure text color is inherited everywhere */
                    body, p, h1, h2, h3, h4, h5, h6, li, td, span, div {
                        color: inherit;
                    }
                    /* Custom classes from lessons */
                    .box-yellow {
                        background-color: color-mix(in oklab, var(--warning) 10%, transparent);
                        border: 1px solid var(--warning);
                        padding: 15px;
                        border-radius: 8px;
                        margin: 15px 0;
                    }
                    .red, .text-red {
                        color: var(--danger) !important;
                    }
                    .subtitle {
                        color: var(--primary);
                        font-weight: 600;
                        margin-bottom: 5px;
                    }

                    /* Scrollbar styling */
                    ::-webkit-scrollbar {
                        width: 10px;
                        height: 10px;
                    }
                    ::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    ::-webkit-scrollbar-thumb {
                        background: var(--border);
                        border-radius: 5px;
                        border: 2px solid var(--bg);
                    }
                    ::-webkit-scrollbar-thumb:hover {
                        background: var(--muted);
                    }

                    img {
                        max-width: 100%;
                        height: auto;
                        display: inline-block;
                        border-radius: 8px;
                        margin-right: 4px;
                        vertical-align: middle;
                    }
                    /* Use specific styling for the layout tables */
                    .lesson-detail-table {
                        width: 100%;
                        border-collapse: separate;
                        border-spacing: 0 10px;
                    }
                    .lesson-detail-table td {
                        vertical-align: top;
                        padding: 10px;
                        background: color-mix(in oklab, var(--surface) 50%, transparent);
                        border-radius: 8px;
                    }
                    /* Force the image column (first column) to a fixed width container */
                    .lesson-detail-table td:first-child {
                        width: 280px;
                        min-width: 280px;
                        vertical-align: top;
                    }
                    /* Use flexbox on P tags to handle multiple images side-by-side in the first column */
                    .lesson-detail-table td:first-child p {
                        display: flex;
                        flex-wrap: wrap;
                        justify-content: center;
                        gap: 8px;
                        margin: 0 0 8px 0;
                    }
                    /* Images are flex items in first col, but inline-block elsewhere */
                    .lesson-detail-table img {
                        flex: 1 1 120px; 
                        max-width: 100%;
                        width: auto;
                        height: auto;
                        max-height: 180px; 
                        object-fit: contain;
                        background-color: transparent;
                        display: inline-block;
                        margin-right: 4px;
                    }
                    /* Clean up paragraphs with no images if needed, or links */
                    .lesson-detail-table td:first-child a {
                        display: contents; 
                    }
                    /* Sign tables (usually 3 columns) should not be forced */
                    .lesson-signs-3-columns td {
                        text-align: center;
                        padding: 10px;
                    }
                    .lesson-signs-3-columns img {
                        max-height: 150px;
                        width: auto;
                        margin: 0 auto;
                    }
                    
                    /* Body styling */
                    body {
                        max-width: 1100px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: var(--bg);
                        color: var(--text);
                        overflow-y: auto; /* Allow scrolling inside iframe body */
                    }
                `;
                doc.head.appendChild(style);

                // 3. Fix Image Paths
                const images = doc.body.getElementsByTagName('img');
                for (let img of images) {
                    const src = img.getAttribute('src');
                    if (src && src.startsWith('uploads/')) {
                        img.src = `https://www.permisdeconduire-online.be/${src}`;
                    }
                }

                // 4. Remove Footer Sections
                const h2s = Array.from(doc.body.getElementsByTagName('h2'));
                const startHeader = h2s.find(h2 =>
                    h2.textContent.trim() === 'Exercices' ||
                    h2.textContent.trim() === 'Les examens'
                );

                if (startHeader) {
                    const prev = startHeader.previousElementSibling;
                    if (prev && prev.tagName === 'HR') {
                        prev.remove();
                    }
                    let currentElement = startHeader;
                    while (currentElement) {
                        const nextElement = currentElement.nextElementSibling;
                        currentElement.remove();
                        currentElement = nextElement;
                    }
                }
                const links = Array.from(doc.body.getElementsByTagName('a'));
                const retourLink = links.find(a => a.textContent.includes('Retour à la page précédente'));
                if (retourLink) {
                    const container = retourLink.closest('div.align-center') || retourLink;
                    container.remove();
                }

                // Serialize back to string
                setSrcDoc(doc.documentElement.outerHTML);
                setLoading(false);

            } catch (error) {
                console.error("Failed to load lesson:", error);
                setSrcDoc(`<p>Erreur lors du chargement de la leçon.</p>`);
                setLoading(false);
            }
        };

        fetchLesson();

        // Lock body scroll
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, [lessonFile, theme]);

    return (
        <div className="lesson-viewer" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 100,
            backgroundColor: 'var(--bg)',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <div className="actions" style={{
                padding: '12px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--surface)',
                gap: '16px'
            }}>
                <button className="btn-ghost" onClick={onBack} style={{ border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ArrowLeft size={16} /> Retour
                </button>
                <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Leçon</span>
            </div>
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
                <div style={{
                    opacity: loading ? 1 : 0,
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                    transition: 'opacity 0.2s'
                }}>
                    Chargement...
                </div>
                <iframe
                    srcDoc={srcDoc}
                    title="Leçon"
                    style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        opacity: loading ? 0 : 1,
                        transition: 'opacity 0.3s ease-in-out'
                    }}
                />
            </div>
        </div>
    );
};

export default LessonViewer;
