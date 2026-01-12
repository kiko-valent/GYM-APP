import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Upload, X, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * VideoUpload - Component for uploading and previewing technique videos
 * 
 * @param {string} value - Base64 encoded video string or empty
 * @param {function} onChange - Callback when video is selected (receives base64 string)
 * @param {function} onRemove - Callback when video is removed
 */
export default function VideoUpload({ value, onChange, onRemove }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);
    const videoRef = useRef(null);

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('video/')) {
            setError('Por favor selecciona un archivo de video válido');
            return;
        }

        // Limit file size to 10MB for base64 storage
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            setError('El video debe ser menor a 10MB');
            return;
        }

        setError(null);
        setIsLoading(true);

        try {
            // Convert to base64
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target.result;
                onChange(base64);
                setIsLoading(false);
            };
            reader.onerror = () => {
                setError('Error al procesar el video');
                setIsLoading(false);
            };
            reader.readAsDataURL(file);
        } catch (err) {
            setError('Error al cargar el video');
            setIsLoading(false);
        }
    };

    const handleRemove = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setIsPlaying(false);
        onRemove();
    };

    const togglePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleVideoEnded = () => {
        setIsPlaying(false);
    };

    return (
        <div className="space-y-2">
            <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
                id="video-upload"
            />

            <AnimatePresence mode="wait">
                {value ? (
                    // Video Preview
                    <motion.div
                        key="preview"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative rounded-xl overflow-hidden bg-black/50 border border-white/10"
                    >
                        <video
                            ref={videoRef}
                            src={value}
                            className="w-full h-32 object-cover"
                            onEnded={handleVideoEnded}
                            playsInline
                            muted
                        />

                        {/* Overlay Controls */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-between p-2">
                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={togglePlayPause}
                                className="text-white hover:bg-white/20 h-8 w-8 p-0"
                            >
                                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </Button>

                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={handleRemove}
                                className="text-red-400 hover:bg-red-500/20 hover:text-red-300 h-8 w-8 p-0"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Video indicator */}
                        <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/50 px-2 py-1 rounded-full">
                            <Video className="w-3 h-3 text-purple-400" />
                            <span className="text-xs text-white/80">Video de técnica</span>
                        </div>
                    </motion.div>
                ) : (
                    // Upload Button
                    <motion.label
                        key="upload"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        htmlFor="video-upload"
                        className={`
              flex flex-col items-center justify-center gap-2 
              h-24 rounded-xl border-2 border-dashed 
              cursor-pointer transition-all duration-200
              ${isLoading
                                ? 'border-purple-500/50 bg-purple-500/10'
                                : 'border-white/20 bg-white/5 hover:border-purple-500/50 hover:bg-purple-500/10'
                            }
            `}
                    >
                        {isLoading ? (
                            <>
                                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs text-purple-300">Procesando...</span>
                            </>
                        ) : (
                            <>
                                <Upload className="w-6 h-6 text-purple-400" />
                                <span className="text-xs text-white/60">Subir video de técnica</span>
                                <span className="text-[10px] text-white/30">MP4, MOV (máx. 10MB)</span>
                            </>
                        )}
                    </motion.label>
                )}
            </AnimatePresence>

            {/* Error Message */}
            {error && (
                <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-400 flex items-center gap-1"
                >
                    <X className="w-3 h-3" />
                    {error}
                </motion.p>
            )}
        </div>
    );
}
