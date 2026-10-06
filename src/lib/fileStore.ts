/**
 * In-memory buffer store for uploaded PDF files and seal images.
 * Keeps React state lightweight and avoids localStorage size limits.
 */

const fileBuffers = new Map<string, ArrayBuffer>();

export function setFileBuffer(fileId: string, buffer: ArrayBuffer): void {
  fileBuffers.set(fileId, buffer);
}

export function getFileBuffer(fileId: string): ArrayBuffer | undefined {
  return fileBuffers.get(fileId);
}

export function deleteFileBuffer(fileId: string): void {
  fileBuffers.delete(fileId);
}

export function clearFileBuffers(): void {
  fileBuffers.clear();
}
