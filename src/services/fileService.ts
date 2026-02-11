import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor, registerPlugin } from '@capacitor/core';

// Plugin nativo personalizado para compartir archivos con permisos correctos
interface FileSharePlugin {
    shareFile(options: { fileUri: string; title?: string; dialogTitle?: string }): Promise<void>;
}

const FileShare = registerPlugin<FileSharePlugin>('FileShare');

export const FileService = {
    /**
     * Exporta datos a un archivo JSON.
     * En plataformas nativas, guarda en caché (subdirectorio exports) y usa plugin nativo para compartir.
     * En Web, descarga el archivo mediante el navegador.
     */
    exportData: async (fileName: string, data: string, mimeType: string = 'application/json'): Promise<void> => {
        try {
            if (Capacitor.isNativePlatform()) {
                // Escribir archivo en caché/exports
                const path = `exports/${fileName}`;

                const result = await Filesystem.writeFile({
                    path: path,
                    data: data,
                    directory: Directory.Cache,
                    encoding: Encoding.UTF8,
                    recursive: true
                });

                console.log('Archivo escrito en Cache/exports:', result.uri);

                // Usar plugin nativo personalizado que otorga permisos URI explícitamente
                await FileShare.shareFile({
                    fileUri: result.uri,
                    title: `Exportar: ${fileName}`,
                    dialogTitle: 'Guardar o Compartir',
                });

            } else {
                // Método Web (Descarga directa mediante el navegador)
                const blob = new Blob([data], { type: mimeType });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Error al exportar archivo:', error);
            throw error;
        }
    }
};
