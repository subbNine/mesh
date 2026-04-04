export interface IStorageProvider {
  uploadFile(key: string, buffer: Buffer, mimeType: string): Promise<string>;
  deleteFile(key: string): Promise<void>;
}
