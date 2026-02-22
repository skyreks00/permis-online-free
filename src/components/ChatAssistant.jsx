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
            content: `Tu es un moniteur d'auto-école expérimenté, cool et humain. 
            L'utilisateur vient de faire quelques fautes au code, pas de panique !
            
            TES OBJECTIFS :
            TES OBJECTIFS :
            1. Être BREF et DIRECT. Pas de pavés. Une réponse = 2 ou 3 phrases max.
            2. Adopter un ton oral, encourageant et naturel (tu peux utiliser "on", "t'inquiète", etc.).
            3. Expliquer SIMPLEMENT pourquoi la réponse de l'utilisateur est fausse, sans jargon compliqué.
            4. Si on te pose une question, réponds comme un vrai humain, pas comme un robot.
            5. STRICTEMENT INTERDIT : Ne réponds PAS aux sujets hors-sujet (politique, cuisine, etc.). Dis gentiment que tu ne parles que du Code de la Route.

            Contexte des erreurs (Question | Réponse Utilisateur | Bonne réponse | Explication):
            ${mistakes.map((m) => `
                Question ${m.questionIndex + 1} (ID: ${m.q.id}): ${m.q.question}
                Il a répondu: ${m.a.userAnswer || 'Rien'}
                Il fallait répondre: ${m.q.correctAnswer}
                Pourquoi: ${m.q.explanation}
            `).join('\n')}
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
                <div
                    className="fixed bottom-6 right-6 z-[9999]"
                    style={{ position: 'fixed', bottom: '24px', right: '24px' }}
                >
                    <button
                        onClick={() => setIsOpen(true)}
                        className="btn-primary shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                        title="Discuter avec le moniteur IA"
                        style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            padding: 0,
                            animation: 'chat-open 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                    >
                        <Bot size={32} />
                    </button>
                </div>
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
                        className="z-[9999]"
                        style={{
                            position: 'fixed',
                            bottom: '24px',
                            right: '24px',
                            width: '320px',
                            height: '450px',
                            maxWidth: 'calc(100% - 3rem)',
                            backgroundColor: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: '12px',
                            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            transformOrigin: 'bottom right',
                            animation: 'chat-open 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
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
                            <div
                                className="flex items-center gap-2 font-bold text-primary"
                                style={{ paddingLeft: '16px' }}
                            >
                                <Bot size={20} /> Moniteur IA
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-muted hover-text-primary hover-scale"
                                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div
                            className="flex-1 p-4 no-scrollbar"
                            style={{
                                flex: '1 1 auto',
                                minHeight: 0,
                                overflowY: 'auto',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px' // Explicit gap for vertical spacing
                            }}
                        >
                            {messages.map((m, i) => (
                                <div
                                    key={i}
                                    style={{
                                        display: 'flex',
                                        justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                                        width: '100%'
                                    }}
                                >
                                    <div
                                        style={{
                                            maxWidth: '85%',
                                            padding: '12px 16px', // Comfortable padding
                                            borderRadius: '12px',
                                            backgroundColor: m.role === 'user' ? 'var(--primary)' : 'var(--surface-2)',
                                            color: m.role === 'user' ? '#fff' : 'var(--text)',
                                            borderTopRightRadius: m.role === 'user' ? '4px' : '12px',
                                            borderTopLeftRadius: m.role === 'user' ? '12px' : '4px',
                                            borderBottomLeftRadius: '12px',
                                            borderBottomRightRadius: '12px',
                                            border: m.role === 'assistant' ? '1px solid var(--border)' : 'none',
                                            wordBreak: 'break-word',
                                            lineHeight: '1.5',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        {m.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div
                                        className="p-4 rounded-lg flex gap-1"
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
                            className="p-4 flex gap-2"
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
                                    padding: '10px 14px'
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
