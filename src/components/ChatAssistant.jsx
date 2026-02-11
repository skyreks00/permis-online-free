import React, { useState, useRef, useEffect } from 'react';
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

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 btn-primary rounded-full shadow-lg p-4 animate-bounce-in z-50 flex items-center gap-2"
                    title="Discuter avec le moniteur IA"
                >
                    <Bot size={24} />
                    <span className="font-bold hidden md:inline">Analyse IA</span>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 w-80 h-96 bg-surface-1 border border-border rounded-xl shadow-2xl flex flex-col z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
                    {/* Header */}
                    <div className="p-3 border-b border-border flex justify-between items-center bg-primary/10 rounded-t-xl">
                        <div className="flex items-center gap-2 font-bold text-primary">
                            <Bot size={20} /> Moniteur IA
                        </div>
                        <button onClick={() => setIsOpen(false)} className="btn-ghost btn-sm btn-circle">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-lg text-sm ${m.role === 'user'
                                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                                    : 'bg-surface-2 border border-border rounded-tl-none'
                                    }`}>
                                    {m.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-surface-2 p-3 rounded-lg rounded-tl-none flex gap-1">
                                    <span className="w-2 h-2 bg-muted rounded-full animate-bounce"></span>
                                    <span className="w-2 h-2 bg-muted rounded-full animate-bounce delay-100"></span>
                                    <span className="w-2 h-2 bg-muted rounded-full animate-bounce delay-200"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-border flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            placeholder="Posez une question..."
                            className="input flex-1 text-sm h-10"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || !input.trim()}
                            className="btn-primary h-10 w-10 p-0 flex items-center justify-center rounded-lg"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatAssistant;
