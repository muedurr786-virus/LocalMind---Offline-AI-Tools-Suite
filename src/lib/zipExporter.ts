import JSZip from 'jszip';
import { PROJECT_FILES } from './projectSourceFiles';

export async function generateProjectZip(
  onProgress?: (progressPercent: number, currentFile: string) => void
): Promise<Blob> {
  const zip = new JSZip();

  const files = Object.entries(PROJECT_FILES);
  const totalFiles = files.length;

  for (let i = 0; i < totalFiles; i++) {
    const [path, content] = files[i];
    // Remove leading slash for standard zip directory structure
    const relativePath = path.startsWith('/') ? path.slice(1) : path;
    zip.file(relativePath, content);

    if (onProgress) {
      const pct = Math.round(((i + 1) / totalFiles) * 70);
      onProgress(pct, relativePath);
    }
  }

  // Generate the zip blob
  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 },
    },
    (metadata) => {
      if (onProgress) {
        onProgress(70 + Math.round(metadata.percent * 0.3), 'Compressing archive...');
      }
    }
  );

  return zipBlob;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
