import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Heart } from 'lucide-react';

const TipeeePopup = ({ isOpen, setIsOpen }) => {
    const [mounted, setMounted] = React.useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Load script and lock scroll when modal opens
    useEffect(() => {
        if (!isOpen) {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
            return;
        }

        // Lock background scroll
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';

        const timeout = setTimeout(() => {
            const scriptId = 'tipeee-script';

            // If script already exists and widget is already initialized by Tipeee
            // we might not need to re-inject. However, the iframe widget 
            // often needs a fresh script execution to find the new DOM element.
            const oldScript = document.getElementById(scriptId);
            if (oldScript) {
                oldScript.remove();
            }

            const script = document.createElement('script');
            script.id = scriptId;
            script.src = "https://plugin.tipeee.com/widget.js";
            script.async = true;
            script.charset = "utf-8";
            document.body.appendChild(script);
        }, 100);

        return () => {
            clearTimeout(timeout);
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        };
    }, [isOpen]);

    if (!mounted) return null;

    return createPortal(
        <>
            {/* The Custom Modal Overlay */}
            {isOpen && (
                <div
                    className="custom-tipeee-modal-overlay animate-fade-in"
                    onClick={(e) => {
                        e.preventDefault();
                        setIsOpen(false);
                    }}
                >
                    {/* The Modal Content (stops propagation so clicking inside doesn't close) */}
                    <div className="custom-tipeee-modal-content" onClick={(e) => e.stopPropagation()}>

                        {/* Custom Header with Close Button */}
                        <div className="custom-tipeee-modal-header">
                            <span className="custom-tipeee-modal-title">Soutenez permisfree</span>
                            <button
                                className="custom-tipeee-modal-close"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setIsOpen(false);
                                }}
                            >
                                <X size={20} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Tipeee iframe widget container */}
                        <div className="custom-tipeee-widget-container">
                            <a
                                href="https://fr.tipeee.com/permisfree"
                                className="tipeee-project-cart-iframe"
                                data-orientation="line"
                                data-rewards="0"
                            >
                                Soutenez permisfree sur Tipeee
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </>,
        document.body
    );
};

export default TipeeePopup;
