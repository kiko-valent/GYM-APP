import React, { useState, useEffect } from 'react';
import { getErrors, getErrorCount, clearErrors, exportErrors } from '@/utils/errorLogger';

/**
 * Componente flotante que muestra notificación de errores.
 * Aparece cuando hay errores pendientes y permite ver/copiar/limpiar.
 */
export default function ErrorNotification() {
    const [errorCount, setErrorCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [errors, setErrors] = useState([]);
    const [copied, setCopied] = useState(false);

    // Cargar errores al montar y escuchar eventos
    useEffect(() => {
        const updateCount = () => {
            setErrorCount(getErrorCount());
            if (isOpen) {
                setErrors(getErrors());
            }
        };

        updateCount();

        window.addEventListener('gym-error-logged', updateCount);
        window.addEventListener('gym-errors-cleared', updateCount);

        return () => {
            window.removeEventListener('gym-error-logged', updateCount);
            window.removeEventListener('gym-errors-cleared', updateCount);
        };
    }, [isOpen]);

    const handleOpen = () => {
        setErrors(getErrors());
        setIsOpen(true);
        setCopied(false);
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(exportErrors());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            console.error('Failed to copy:', e);
        }
    };

    const handleClear = () => {
        clearErrors();
        setErrors([]);
        setErrorCount(0);
        setIsOpen(false);
    };

    // No mostrar si no hay errores
    if (errorCount === 0 && !isOpen) {
        return null;
    }

    return (
        <>
            {/* Botón flotante con badge */}
            {!isOpen && errorCount > 0 && (
                <button
                    onClick={handleOpen}
                    className="fixed bottom-20 right-4 z-50 bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 animate-pulse"
                    aria-label="Ver errores"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="absolute -top-1 -right-1 bg-white text-red-600 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {errorCount > 9 ? '9+' : errorCount}
                    </span>
                </button>
            )}

            {/* Modal de errores */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col border border-slate-700">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-700">
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Errores ({errors.length})
                            </h2>
                            <button
                                onClick={handleClose}
                                className="text-slate-400 hover:text-white transition-colors"
                                aria-label="Cerrar"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Lista de errores */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {errors.length === 0 ? (
                                <p className="text-slate-400 text-center py-8">No hay errores registrados</p>
                            ) : (
                                errors.map((err) => (
                                    <div key={err.id} className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                                        <div className="flex items-start justify-between gap-2">
                                            <span className="text-red-400 font-mono text-sm">{err.context}</span>
                                            <span className="text-slate-500 text-xs whitespace-nowrap">
                                                {new Date(err.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <p className="text-slate-300 text-sm mt-1">{err.message}</p>
                                        {err.code && (
                                            <span className="inline-block mt-1 px-2 py-0.5 bg-red-900/30 text-red-300 text-xs rounded">
                                                {err.code}
                                            </span>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer con acciones */}
                        <div className="flex gap-2 p-4 border-t border-slate-700">
                            <button
                                onClick={handleCopy}
                                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                            >
                                {copied ? (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        ¡Copiado!
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                        </svg>
                                        Copiar errores
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleClear}
                                className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-lg transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Limpiar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
