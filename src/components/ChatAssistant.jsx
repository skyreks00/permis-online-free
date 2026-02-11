import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Bot, User, AlertCircle, Loader } from 'lucide-react';
import { chatWithGroq } from '../utils/groq';

const ChatAssistant = ({ question, userAnswer, correction, explanation, apiKey, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Initial system message and context
        const initialMessages = [
            {
                role: "system",
                content: `Tu es un moniteur d'auto-école pédagogique, patient et encourageant.
Ta mission est d'expliquer à l'élève pourquoi sa réponse est fausse et pourquoi la bonne réponse est la bonne.
Utilise le code de la route belge comme référence.
Sois concis mais clair. N'hésite pas à donner des astuces mnémotechniques.

Contexte de la question :
Question : "${question}"
Réponse de l'élève : "${userAnswer || 'Aucune réponse'}"
Bonne réponse : "${correction}"
Explication fournie : "${explanation}"
`
            },
            {
                role: "assistant",
                content: `Bonjour ! Je vois que tu as trébuché sur cette question. Veux-tu que je t'explique pourquoi "${correction}" est la bonne réponse ?`
            }
        ];
        setMessages(initialMessages);
    }, [question, userAnswer, correction, explanation]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        if (!apiKey) {
            setMessages(prev => [...prev, { role: "assistant", content: "Erreur : Clé API manquante. Configure-la dans le profil." }]);
            return;
        }

        const userMsg = { role: "user", content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            // Filter out system message for display, but keep for API
            // Actually API needs all history.
            // We just need to safeguard against duplicate system messages if re-renders happen, but useEffect [] handles valid init.

            const responseContent = await chatWithGroq([...messages, userMsg], apiKey);

            setMessages(prev => [...prev, { role: "assistant", content: responseContent }]);

        } catch (error) {
            setMessages(prev => [...prev, { role: "assistant", content: "Désolé, je n'ai pas pu joindre le serveur. (" + error.message + ")" }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
            {/* Backdrop - optional, maybe invisible if we want to allow seeing the background? 
                User said "fenetre sur la droite", often implies side panel. 
                Let's make it a drawer style. pointer-events-auto for the drawer itself.
            */}
            <button onClick={onClose} className="absolute inset-0 bg-black/20 pointer-events-auto backdrop-blur-[1px] transition-opacity" />

            <div className="bg-surface-1 w-full max-w-md h-full shadow-2xl flex flex-col border-l border-border pointer-events-auto animate-slide-in-right">
                {/* Header */}
                <div className="p-4 border-b border-border flex justify-between items-center bg-primary/10">
                    <div className="flex items-center gap-2 font-bold text-primary">
                        <Bot size={24} />
                        <span>Assistant Moniteur</span>
                    </div>
                    <button onClick={onClose} className="btn-ghost btn-square btn-sm text-muted hover:text-danger">
                        <X size={20} />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.slice(1).map((msg, idx) => ( // Skip system message
                        <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-secondary text-white'}`}>
                                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                            </div>
                            <div className={`p-3 rounded-lg max-w-[80%] text-sm leading-relaxed ${msg.role === 'user'
                                ? 'bg-primary text-primary-content rounded-tr-none'
                                : 'bg-surface-2 text-text rounded-tl-none border border-border'
                                }`}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center flex-shrink-0">
                                <Bot size={16} />
                            </div>
                            <div className="bg-surface-2 p-3 rounded-lg rounded-tl-none border border-border flex items-center gap-2 text-muted text-sm">
                                <Loader size={14} className="animate-spin" /> En train d'écrire...
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-border bg-surface-2/30">
                    <div className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={apiKey ? "Posez votre question..." : "Clé API manquante (voir profil)"}
                            disabled={isLoading || !apiKey}
                            className="input w-full pr-12"
                            autoFocus
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || !input.trim() || !apiKey}
                            className="absolute right-2 top-1/2 -translate-y-1/2 btn-ghost btn-sm text-primary disabled:text-muted"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                    {!apiKey && (
                        <div className="mt-2 text-xs text-danger flex items-center gap-1 justify-center">
                            <AlertCircle size={12} />
                            <span>Configurez votre clé Groq dans le profil pour activer le chat.</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatAssistant;
