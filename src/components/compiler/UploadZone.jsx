import React, { useState, useRef } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import JSZip from 'jszip';

// Valida se o arquivo é um ZIP válido com estrutura de projeto React ou build compilado
async function validateZipFile(file) {
    if (!file.name.endsWith('.zip')) {
        return { valid: false, error: 'O arquivo não é um .zip' };
    }
    if (file.size > 150 * 1024 * 1024) {
        return { valid: false, error: 'Arquivo muito grande (máx. 150MB)' };
    }
    try {
        const zip = await JSZip.loadAsync(file);
        const files = Object.keys(zip.files);

        // Aceita projeto React (tem package.json)
        const hasPackageJson = files.some(f => f.endsWith('package.json'));
        if (hasPackageJson) return { valid: true };

        // Aceita arquivos JSX/JS soltos
        const hasJSX = files.some(f => f.endsWith('.jsx') || f.endsWith('.js') || f.endsWith('.tsx') || f.endsWith('.ts'));
        if (hasJSX) return { valid: true };

        // Aceita build compilado (tem index.html ou arquivos web)
        const hasWeb = files.some(f => f.endsWith('.html') || f.endsWith('.css'));
        if (hasWeb) return { valid: true };

        return { valid: false, error: 'ZIP não contém um projeto React, arquivos JSX ou build válido.' };
    } catch {
        return { valid: false, error: 'Arquivo ZIP inválido ou corrompido.' };
    }
}

function FileItem({ fileState, onRemove, isProcessing }) {
    const { file, status, error, uploadProgress } = fileState;
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);

    return (
        <div className={cn(
            "flex items-center gap-3 bg-white rounded-xl p-4 border shadow-sm transition-all",
            status === 'error' ? 'border-red-300 bg-red-50' :
            status === 'valid' ? 'border-green-300 bg-green-50' :
            status === 'uploading' ? 'border-violet-300' :
            'border-gray-200'
        )}>
            <div className={cn(
                "w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center",
                status === 'error' ? 'bg-red-100' :
                status === 'valid' ? 'bg-green-100' : 'bg-violet-100'
            )}>
                {status === 'validating' || status === 'uploading'
                    ? <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
                    : status === 'error'
                    ? <AlertCircle className="w-5 h-5 text-red-500" />
                    : status === 'valid'
                    ? <CheckCircle className="w-5 h-5 text-green-600" />
                    : <File className="w-5 h-5 text-violet-600" />
                }
            </div>

            <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">{file.name}</p>
                <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500">{sizeMB} MB</p>
                    {status === 'validating' && <span className="text-xs text-violet-500">Validando...</span>}
                    {status === 'valid' && <span className="text-xs text-green-600">✓ Válido</span>}
                    {status === 'error' && <span className="text-xs text-red-600">{error}</span>}
                    {status === 'uploading' && <span className="text-xs text-violet-500">Enviando... {uploadProgress}%</span>}
                </div>

                {/* Upload progress bar */}
                {status === 'uploading' && (
                    <div className="mt-1.5 w-full bg-gray-200 rounded-full h-1.5">
                        <div
                            className="bg-violet-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                )}

                {/* Validation progress bar */}
                {status === 'validating' && (
                    <div className="mt-1.5 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-violet-400 h-1.5 rounded-full animate-pulse w-2/3" />
                    </div>
                )}
            </div>

            {!isProcessing && status !== 'uploading' && (
                <button
                    onClick={() => onRemove(file.name)}
                    className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
                >
                    <X className="w-4 h-4 text-gray-400" />
                </button>
            )}
        </div>
    );
}

export default function UploadZone({ onFileSelect, isProcessing, externalReset }) {
    const [isDragging, setIsDragging] = useState(false);
    const [fileStates, setFileStates] = useState([]); // [{file, status, error, uploadProgress}]
    const inputRef = useRef(null);

    React.useEffect(() => {
        if (externalReset) {
            setFileStates([]);
            onFileSelect(null);
        }
    }, [externalReset]);

    const processFiles = async (rawFiles) => {
        const newFiles = Array.from(rawFiles).filter(f =>
            f.name.endsWith('.zip') || f.name.endsWith('.jsx') || f.name.endsWith('.js') ||
            f.name.endsWith('.tsx') || f.name.endsWith('.ts')
        );
        if (newFiles.length === 0) return;

        // Evitar duplicatas pelo nome
        setFileStates(prev => {
            const existingNames = new Set(prev.map(s => s.file.name));
            const toAdd = newFiles
                .filter(f => !existingNames.has(f.name))
                .map(f => ({ file: f, status: 'validating', error: null, uploadProgress: 0 }));
            const updated = [...prev, ...toAdd];
            // Notifica o pai com a lista de arquivos válidos (será atualizado após validação)
            return updated;
        });

        // Validar cada arquivo novo
        for (const file of newFiles) {
            // Arquivos JSX/JS soltos são aceitos diretamente sem validação de ZIP
            const isLooseFile = !file.name.endsWith('.zip');
            const result = isLooseFile ? { valid: true } : await validateZipFile(file);
            setFileStates(prev => {
                const updated = prev.map(s =>
                    s.file.name === file.name
                        ? { ...s, status: result.valid ? 'valid' : 'error', error: result.error || null }
                        : s
                );
                // Notifica o pai com arquivos válidos
                const validFiles = updated.filter(s => s.status === 'valid').map(s => s.file);
                onFileSelect(validFiles.length === 1 ? validFiles[0] : validFiles.length > 1 ? validFiles : null);
                return updated;
            });
        }
    };

    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = () => setIsDragging(false);

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        processFiles(e.dataTransfer.files);
    };

    const handleFileInput = (e) => {
        processFiles(e.target.files);
        e.target.value = ''; // reset input para permitir re-seleção do mesmo arquivo
    };

    const handleRemove = (fileName) => {
        setFileStates(prev => {
            const updated = prev.filter(s => s.file.name !== fileName);
            const validFiles = updated.filter(s => s.status === 'valid').map(s => s.file);
            onFileSelect(validFiles.length === 1 ? validFiles[0] : validFiles.length > 1 ? validFiles : null);
            return updated;
        });
    };

    const validCount = fileStates.filter(s => s.status === 'valid').length;
    const errorCount = fileStates.filter(s => s.status === 'error').length;

    return (
        <div className="space-y-3">
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isProcessing && inputRef.current?.click()}
                className={cn(
                    "relative border-2 border-dashed rounded-2xl transition-all duration-300 cursor-pointer",
                    "hover:border-violet-400 hover:bg-violet-50/50",
                    isDragging ? "border-violet-500 bg-violet-100/50 scale-[1.02]" : "border-gray-300",
                    isProcessing && "opacity-50 pointer-events-none"
                )}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept=".zip,.jsx,.js,.tsx,.ts"
                    multiple
                    onChange={handleFileInput}
                    className="hidden"
                    disabled={isProcessing}
                />

                <div className="flex flex-col items-center justify-center p-10">
                    <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <Upload className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                        Arraste seus projetos React aqui
                    </h3>
                    <p className="text-gray-500 text-sm mb-1">ou clique para selecionar</p>
                    <p className="text-xs text-gray-400">Aceita .zip (projeto React ou build) ou arquivos .jsx/.js soltos • Máx. 150MB</p>
                </div>
            </div>

            {/* File list */}
            {fileStates.length > 0 && (
                <div className="space-y-2">
                    {fileStates.map((state) => (
                        <FileItem
                            key={state.file.name}
                            fileState={state}
                            onRemove={handleRemove}
                            isProcessing={isProcessing}
                        />
                    ))}

                    {/* Summary */}
                    {fileStates.length > 1 && (
                        <div className="flex gap-4 text-xs text-gray-500 px-1">
                            {validCount > 0 && <span className="text-green-600 font-medium">{validCount} válido{validCount > 1 ? 's' : ''}</span>}
                            {errorCount > 0 && <span className="text-red-500 font-medium">{errorCount} com erro</span>}
                            {fileStates.some(s => s.status === 'validating') && <span className="text-violet-500">Validando...</span>}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}