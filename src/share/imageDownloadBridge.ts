export const ImageDownloadMessageType = 'juejin-helper:download-image';

export interface ImageDownloadRequestPayload {
    type: typeof ImageDownloadMessageType;
    url: string;
}

export type ImageDownloadResponsePayload =
    | {
          ok: true;
          dataBase64: string;
          contentType?: string;
      }
    | {
          ok: false;
          error: string;
      };

export const isImageDownloadRequestPayload = (
    payload: unknown
): payload is ImageDownloadRequestPayload =>
    !!payload &&
    typeof payload === 'object' &&
    (payload as ImageDownloadRequestPayload).type ===
        ImageDownloadMessageType &&
    typeof (payload as ImageDownloadRequestPayload).url === 'string';

export const arrayBufferToBase64 = (data: ArrayBuffer) => {
    const bytes = new Uint8Array(data);
    let binary = '';
    const chunkSize = 0x8000;

    for (let index = 0; index < bytes.length; index += chunkSize) {
        const chunk = bytes.subarray(index, index + chunkSize);
        binary += String.fromCharCode(...chunk);
    }

    return btoa(binary);
};

export const base64ToArrayBuffer = (base64: string) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index++) {
        bytes[index] = binary.charCodeAt(index);
    }

    return bytes.buffer;
};
