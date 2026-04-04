export interface IStorageProvider {
  uploadFile(key: string, buffer: Buffer, mimeType: string): Promise<string>;
}
