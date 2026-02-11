import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { getChatResponse } from '../utils/groq';

const ChatAssistant = ({ mistakes }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const apiKey = localStorage.getItem('groq_api_key');

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            // Initial greeting
            setMessages([
                {
                    role: 'assistant',
                    content: `Bonjour ! Je vois que vous avez fait ${mistakes.length} erreur${mistakes.length > 1 ? 's' : ''}. Je suis là pour vous aider à comprendre. Posez-moi une question ou demandez-moi d'analyser vos fautes.`
                }
            ]);
        }
    }, [isOpen, mistakes]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !apiKey) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        // Prepare context
        const systemPrompt = {
            role: 'system',
            content: `Tu es un moniteur d'auto-école pédagogue et bienveillant.
            L'utilisateur vient de terminer un quiz de code de la route et a fait des erreurs.
            Voici les erreurs qu'il a commises (Format: Question | Réponse Utilisateur | Réponse Correcte | Explication):
            ${mistakes.map((m, i) => `
                ${i + 1}. Q: ${m.q.question}
                Réponse joueur: ${m.a.userAnswer || 'Aucune'}
                Bonne réponse: ${m.q.correctAnswer}
                Explication: ${m.q.explanation}
            `).join('\n')}

            CONSIGNES:
            1. Réponds de manière CONCISE (max 3-4 phrases).
            2. Explique pourquoi la réponse de l'utilisateur est fausse et pourquoi la bonne réponse est la bonne.
            3. Sois encourageant.
            4. Ne donne pas de longues leçons théoriques sauf si demandé.
            `
        };

        const apiMessages = [systemPrompt, ...messages, userMsg];

        try {
            const response = await getChatResponse(apiKey, apiMessages);
            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Désolé, je ne peux pas répondre pour le moment. Vérifiez votre clé API." }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!apiKey) return null; // Don't show if no key

    return createPortal(
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 btn-primary rounded-full shadow-lg p-4 animate-bounce-in z-50 flex items-center gap-2"
                    title="Discuter avec le moniteur IA"
                    style={{ zIndex: 9999 }}
                >
                    <Bot size={24} />
                    <span className="font-bold hidden md:inline">Analyse IA</span>
                </button>
            )}

            {/* Chat Window with Backdrop */}
            {isOpen && (
                <>
                    {/* Backdrop - Click to close */}
                    <div
                        className="fixed inset-0 z-[9990]"
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            transition: 'opacity 0.3s'
                        }}
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Chat Container */}
                    <div
                        className="z-[9999] animate-in slide-in-from-bottom-10 fade-in duration-300"
                        style={{
                            position: 'fixed',
                            bottom: '24px',
                            right: '24px',
                            width: '320px',
                            height: '400px',
                            maxWidth: 'calc(100vw - 3rem)',
                            backgroundColor: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: '12px',
                            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        {/* Header */}
                        <div
                            className="p-3 flex justify-between items-center rounded-t-xl"
                            style={{
                                borderBottom: '1px solid var(--border)',
                                backgroundColor: 'var(--surface-2)',
                                flexShrink: 0
                            }}
                        >
                            <div className="flex items-center gap-2 font-bold text-primary">
                                <Bot size={20} /> Moniteur IA
                            </div>
                            <button onClick={() => setIsOpen(false)} className="btn-ghost btn-sm btn-circle">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div
                            className="flex-1 overflow-y-auto p-4 space-y-4"
                            style={{ flex: '1 1 auto', minHeight: 0 }}
                        >
                            {messages.map((m, i) => (
                                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        className={`max-w-[85%] p-3 rounded-lg text-sm`}
                                        style={{
                                            backgroundColor: m.role === 'user' ? 'var(--primary)' : 'var(--surface-2)',
                                            color: m.role === 'user' ? '#fff' : 'var(--text)',
                                            borderTopRightRadius: m.role === 'user' ? 0 : '12px',
                                            borderTopLeftRadius: m.role === 'user' ? '12px' : 0,
                                            borderBottomLeftRadius: '12px',
                                            borderBottomRightRadius: '12px',
                                            border: m.role === 'assistant' ? '1px solid var(--border)' : 'none',
                                            wordBreak: 'break-word'
                                        }}
                                    >
                                        {m.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div
                                        className="p-3 rounded-lg flex gap-1"
                                        style={{ backgroundColor: 'var(--surface-2)', borderTopLeftRadius: 0 }}
                                    >
                                        <span className="w-2 h-2 bg-muted rounded-full animate-bounce"></span>
                                        <span className="w-2 h-2 bg-muted rounded-full animate-bounce delay-100"></span>
                                        <span className="w-2 h-2 bg-muted rounded-full animate-bounce delay-200"></span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div
                            className="p-3 flex gap-2"
                            style={{
                                borderTop: '1px solid var(--border)',
                                flexShrink: 0
                            }}
                        >
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSend()}
                                placeholder="Posez une question..."
                                className="input flex-1 text-sm h-10"
                                disabled={isLoading}
                                style={{
                                    backgroundColor: 'var(--bg-elev)',
                                    border: '1px solid var(--border)',
                                    color: 'var(--text)',
                                    borderRadius: '8px',
                                    padding: '8px 12px'
                                }}
                            />
                            <button
                                onClick={handleSend}
                                disabled={isLoading || !input.trim()}
                                className="btn-primary h-10 w-10 p-0 flex items-center justify-center rounded-lg"
                                style={{
                                    backgroundColor: 'var(--primary)',
                                    border: 'none',
                                    color: 'white',
                                    cursor: 'pointer',
                                    display: 'grid',
                                    placeItems: 'center'
                                }}
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </>,
        document.body
    );
};

export default ChatAssistant;
