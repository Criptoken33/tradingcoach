import { Share } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export const FileService = {
    /**
     * Exporta datos a un archivo, manejando la diferencia entre Web y Nativo.
     * En Nativo, guarda en caché y comparte el archivo.
     * En Web, descarga el archivo mediante un enlace.
     */
    exportData: async (fileName: string, data: string, mimeType: string = 'application/json'): Promise<void> => {
        try {
            if (Capacitor.isNativePlatform()) {
                // Escribir archivo en el sistema de archivos (Cache)
                const result = await Filesystem.writeFile({
                    path: fileName,
                    data: data,
                    directory: Directory.Cache,
                    encoding: Encoding.UTF8,
                });

                // Compartir el archivo
                await Share.share({
                    title: 'Exportar Archivo',
                    text: `Aquí tienes tu archivo: ${fileName}`,
                    url: result.uri, // Para versiones antiguas de Share
                    files: [result.uri], // Para versiones nuevas de Share
                    dialogTitle: 'Guardar o Compartir',
                });

            } else {
                // Método Web (Descarga directa)
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
            console.error('Error in FileService.exportData:', error);
            throw error;
        }
    }
};
