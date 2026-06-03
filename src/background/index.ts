import {
    arrayBufferToBase64,
    isImageDownloadRequestPayload,
    type ImageDownloadResponsePayload,
} from '../share/imageDownloadBridge';

const downloadImage = async (
    url: string,
    fetcher: typeof fetch = fetch
): Promise<ImageDownloadResponsePayload> => {
    try {
        const response = await fetcher(url, { credentials: 'omit' });

        if (!response.ok) {
            return {
                ok: false,
                error: `download image failed: ${response.status}`,
            };
        }

        return {
            ok: true,
            dataBase64: arrayBufferToBase64(await response.arrayBuffer()),
            contentType: response.headers.get('content-type') ?? undefined,
        };
    } catch (error) {
        return {
            ok: false,
            error:
                error instanceof Error
                    ? error.message
                    : 'download image failed',
        };
    }
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!isImageDownloadRequestPayload(message)) {
        return false;
    }

    downloadImage(message.url).then(sendResponse);
    return true;
});
