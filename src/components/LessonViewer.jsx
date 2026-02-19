import React, { useRef } from 'react';
import globalStyles from '../assets/styles.css?inline';
import { ArrowLeft } from 'lucide-react';

const LessonViewer = ({ lessonFile, quizId, onBack, onStartQuiz, onOpenLesson, theme }) => {
    const [srcDoc, setSrcDoc] = React.useState('');
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchLesson = async () => {
            setLoading(true);
            try {
                const base = import.meta.env.BASE_URL || '/';
                const response = await fetch(`${base}lecon/${lessonFile}`);
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

                    .lesson-video {
                        width: 100%;
                        aspect-ratio: 16 / 9;
                        height: auto;
                        border-radius: 8px;
                        display: block;
                        margin: 20px 0;
                        border: none;
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

                    /* Infractions Table Styling */
                    .infractions-table {
                        width: 100%;
                        border-collapse: separate;
                        border-spacing: 0;
                        margin: 20px 0;
                        border-radius: 12px;
                        overflow: hidden;
                        border: 1px solid var(--border);
                    }
                    .infractions-table thead th {
                        background-color: var(--surface);
                        color: var(--primary);
                        padding: 16px;
                        text-align: left;
                        font-weight: 700;
                        border-bottom: 2px solid var(--border);
                        border-right: 1px solid var(--border); /* Vertical separator */
                    }
                    .infractions-table thead th:last-child {
                        border-right: none;
                    }
                    .infractions-table td {
                        padding: 16px;
                        vertical-align: middle;
                        border-bottom: 1px solid var(--border);
                        border-right: 1px solid var(--border); /* Vertical separator */
                        color: var(--text);
                    }
                    .infractions-table td:last-child {
                        border-right: none;
                    }
                    .infractions-table tr:last-child td {
                        border-bottom: none;
                    }
                    .infractions-table tr:nth-child(even) {
                        background-color: color-mix(in oklab, var(--surface) 30%, transparent);
                    }
                    .infractions-table tr:hover {
                         background-color: color-mix(in oklab, var(--primary) 5%, transparent);
                    }
                    .infractions-table td:nth-child(1) { /* Number column */
                        width: 60px;
                        text-align: center;
                        font-weight: bold;
                        color: var(--muted-foreground);
                    }
                    .infractions-table td:nth-child(3) { /* Lesson Ref column */
                        width: 120px;
                        text-align: center;
                        font-size: 0.9em;
                        color: var(--primary);
                        font-weight: 600;
                    }
                    /* Image inside content cell - FIX CRUSHED IMAGES */
                    .infractions-table img {
                        height: auto !important;
                        max-width: 100%;
                        width: auto !important; /* Override inline width to prevent squashing */
                        object-fit: contain;
                        display: inline-block;
                        vertical-align: middle;
                    }
                    .infractions-table td:nth-child(2) img {
                         /* Keep existing specific logic if needed, but the above general rule is safer */
                         float: left;
                         margin-right: 16px;
                         margin-bottom: 8px;
                         border-radius: 8px;
                         box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    /* Specific fix for the flex containers to respect image size */
                    .infractions-table div[style*="display: flex"] img {
                        margin: 0 !important; /* Let flex gap handle spacing */
                        max-height: 80px; /* Limit height of signs in flex rows */
                    }
                    
                    /* Link Styling - MODERN CHIPS */
                    .infractions-table a {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        background-color: var(--primary); /* Fallback */
                        background: linear-gradient(135deg, var(--primary) 0%, color-mix(in oklab, var(--primary) 80%, black) 100%);
                        color: white !important;
                        text-decoration: none !important;
                        font-weight: 500;
                        font-size: 0.85rem;
                        padding: 6px 12px;
                        border-radius: 9999px; /* Pill shape */
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                        margin: 2px;
                        border: 1px solid rgba(255,255,255,0.1);
                        white-space: nowrap;
                    }
                    .infractions-table a:visited {
                        color: white !important;
                    }
                    .infractions-table a:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
                        filter: brightness(1.1);
                        text-decoration: none !important;
                    }
                    .infractions-table a:active {
                        transform: translateY(0);
                        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
                    }

                    .infractions-table td:nth-child(2) {
                        line-height: 1.6;
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

                    /* Mobile Responsive for Lesson Content */
                    @media (max-width: 600px) {
                        body {
                            padding: 12px;
                        }
                        .lesson-detail-table, .lesson-detail-table tbody, .lesson-detail-table tr, .lesson-detail-table td {
                            display: block;
                            width: 100% !important;
                            min-width: 0 !important;
                            box-sizing: border-box;
                        }
                        .lesson-detail-table td:first-child {
                            width: 100%;
                            min-width: 0;
                            margin-bottom: 15px;
                            border-bottom: 1px solid var(--border);
                            padding-bottom: 15px;
                        }
                        .lesson-detail-table img {
                            max-height: 200px;
                            width: auto;
                            margin: 0 auto;
                            display: block;
                        }
                        .lesson-detail-table td:first-child p {
                            justify-content: center;
                        }
                    }
                `;
                doc.head.appendChild(style);

                // 3. Fix Image Paths
                const images = doc.body.getElementsByTagName('img');
                for (let img of images) {
                    const src = img.getAttribute('src');
                    if (src) {
                        if (src.startsWith('uploads/')) {
                            img.src = `https://www.permisdeconduire-online.be/${src}`;
                        } else if (!src.startsWith('http') && !src.startsWith('/') && !src.startsWith('data:')) {
                             // Relative path (e.g. "infractions_images/img.png")
                             // We need to rebasing it relative to the lesson file location.
                             // lessonFile = "infractions/infractions.html" -> baseDir = "infractions/"
                             // We are fetching from `${base}lecon/${lessonFile}`.
                             const base = import.meta.env.BASE_URL || '/';
                             
                             // Extract directory from lessonFile
                             const lastSlashIndex = lessonFile.lastIndexOf('/');
                             let subDir = '';
                             if (lastSlashIndex !== -1) {
                                 subDir = lessonFile.substring(0, lastSlashIndex + 1); // "infractions/"
                             }
                             
                             // Construct absolute path
                             // e.g. /permis-online-free/lecon/infractions/infractions_images/img.png
                             img.src = `${base}lecon/${subDir}${src}`;
                        }
                    }
                }

                // 3b. Fix Videos (add fullscreen and styling helpers)
                const iframes = doc.body.getElementsByTagName('iframe');
                for (let iframe of iframes) {
                    iframe.setAttribute('allowfullscreen', 'true');
                    iframe.setAttribute('mozallowfullscreen', 'true');
                    iframe.setAttribute('webkitallowfullscreen', 'true');
                    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');

                    // Add class if not present
                    if (!iframe.classList.contains('lesson-video')) {
                        iframe.classList.add('lesson-video');
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

                // 5. Inject "Start Quiz" button at the bottom if quizId is present
                if (quizId) {
                    const quizContainer = doc.createElement('div');
                    quizContainer.style.marginTop = '40px';
                    quizContainer.style.paddingTop = '20px';
                    quizContainer.style.borderTop = '1px solid var(--border)';
                    quizContainer.style.textAlign = 'center';
                    quizContainer.style.marginBottom = '60px';

                    const quizBtn = doc.createElement('button');
                    quizBtn.textContent = 'Démarrer le Quiz sur ce thème';
                    quizBtn.style.backgroundColor = 'var(--primary)';
                    quizBtn.style.color = 'white';
                    quizBtn.style.border = 'none';
                    quizBtn.style.padding = '14px 28px';
                    quizBtn.style.borderRadius = '8px';
                    quizBtn.style.fontSize = '1.1rem';
                    quizBtn.style.fontWeight = '600';
                    quizBtn.style.cursor = 'pointer';
                    quizBtn.style.boxShadow = '0 4px 12px rgba(var(--primary-rgb), 0.3)';
                    
                    quizBtn.setAttribute('onclick', `window.parent.postMessage({ type: 'START_QUIZ', quizId: '${quizId}' }, '*')`);

                    quizContainer.appendChild(quizBtn);
                    doc.body.appendChild(quizContainer);
                }

                // Inject script for link handling
                const script = doc.createElement('script');
                script.textContent = `
                    document.addEventListener('click', function(e) {
                         const link = e.target.closest('a');
                         if (link) {
                             const href = link.getAttribute('href');
                             if (href && href.endsWith('.html')) {
                                 e.preventDefault();
                                 window.parent.postMessage({ type: 'OPEN_LESSON', file: href.split('/').pop() }, '*');
                             }
                         }
                    });
                `;
                doc.body.appendChild(script);

                // Serialize back to string
                setSrcDoc(doc.documentElement.outerHTML);
                setLoading(false);

            } catch (error) {
                console.error("Failed to load lesson:", error);
                setSrcDoc(`<p>Erreur lors du chargement de la leçon.</p>`);
                setLoading(false);
            }
        };

        const handleMessage = (event) => {
            if (event.data && event.data.type === 'START_QUIZ' && event.data.quizId === quizId) {
                onStartQuiz(quizId);
            }
        };
        window.addEventListener('message', handleMessage);


        // Special handling for PDF files
        if (lessonFile.toLowerCase().endsWith('.pdf')) {
            const base = import.meta.env.BASE_URL || '/';
            // Construct path to PDF. Assuming they are in public/pdf/ if not absolute.
            // But from the plan, we put them in public/pdf, so we need to prepend 'pdf/' if not present,
            // or just rely on the lessonFile path being correct.
            // Let's assume lessonFile passed from themes.json will be "pdf/syntheseB.pdf" or similar?
            // Wait, standard lessons are in "lecon/" automatically in the fetch below:
            // fetch(`${base}lecon/${lessonFile}`);
            
            // So if I pass "pdf/syntheseB.pdf", the fetch below would be "lecon/pdf/syntheseB.pdf" which is wrong.
            // I should change the logic to:
            
            setLoading(false); // PDF iframe loads instantly/natively
            // We can't really "inject styles" into a PDF iframe easily or "fix images".
            // So we just set srcDoc or src.
            // Using `src` is better for PDFs.
            return;
        }

        fetchLesson();

        // Lock body scroll
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('message', handleMessage);
        };
    }, [lessonFile, quizId, theme]);

    // Listen for messages from iframe
    React.useEffect(() => {
        const handleMessage = (event) => {
            if (event.data?.type === 'START_QUIZ' && onStartQuiz) {
                onStartQuiz(event.data.quizId);
            }
            if (event.data?.type === 'OPEN_LESSON' && onOpenLesson) {
                onOpenLesson(event.data.file);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [onStartQuiz, onOpenLesson]);

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
                <span style={{ fontWeight: 600, fontSize: '1.1rem', flex: 1 }}>Leçon</span>
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
                {lessonFile && lessonFile.toLowerCase().endsWith('.pdf') ? (
                    <iframe 
                        src={`${import.meta.env.BASE_URL || '/'}pdf/${lessonFile.replace('pdf/', '')}`} // specialized handling or just expect 'syntheseB.pdf' and prepend 'pdf/'? 
                        // Let's keep it simple: we will put "syntheseB.pdf" in themes.json, and here we prepend "pdf/"
                        // actually, let's just use the logic: if it ends in .pdf, assume it is in /pdf folder relative to base.
                        title="Leçon PDF"
                        style={{
                            width: '100%',
                            height: '100%',
                            border: 'none',
                        }}
                    />
                ) : (
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
                )}
            </div>
        </div>
    );
};

export default LessonViewer;
