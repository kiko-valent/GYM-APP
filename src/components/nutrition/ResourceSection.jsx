import React, { useState, useEffect } from 'react';
import { FileText, Download, Upload, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from "@/components/ui/use-toast";

export default function ResourceSection() {
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        fetchDocs();
    }, []);

    const fetchDocs = async () => {
        const { data, error } = await supabase.storage.from('documents').list('', { sortBy: { column: 'created_at', order: 'desc' } });
        if (!error) {
            setDocs(data || []);
        }
        setLoading(false);
    };

    const handleUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        // Using simple filename for now, could organize by user folder
        const fileName = `${Date.now()}_${file.name}`;

        const { error } = await supabase.storage.from('documents').upload(fileName, file);

        if (error) {
            toast({
                variant: "destructive",
                title: "Error al subir",
                description: error.message
            });
        } else {
            toast({
                title: "Documento subido",
                description: "Se ha guardado correctamente."
            });
            fetchDocs();
        }
        setUploading(false);
    };

    const handleDownload = async (name) => {
        const { data } = supabase.storage.from('documents').getPublicUrl(name);
        window.open(data.publicUrl, '_blank');
    };

    return (
        <div className="space-y-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan" /> Recursos
            </h3>

            <div className="card-dark p-4 space-y-3">
                <div className="relative">
                    <input
                        type="file"
                        id="doc-upload"
                        onChange={handleUpload}
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                    />
                    <Button
                        variant="outline"
                        className="w-full border-dashed border-white/20 hover:bg-white/5 text-secondary hover:text-white"
                        disabled={uploading}
                        onClick={() => document.getElementById('doc-upload').click()}
                    >
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                        Subir PDF / Guía
                    </Button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {docs.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-dark-card-lighter rounded-lg group">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <FileText className="w-4 h-4 text-secondary flex-shrink-0" />
                                <span className="text-sm text-white truncate">{doc.name}</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-cyan hover:bg-cyan/10"
                                onClick={() => handleDownload(doc.name)}
                            >
                                <Download className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
