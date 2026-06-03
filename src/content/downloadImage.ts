import {
    base64ToArrayBuffer,
    ImageDownloadMessageType,
    type ImageDownloadRequestPayload,
    type ImageDownloadResponsePayload,
} from '../share/imageDownloadBridge';

export interface DownloadedImage {
    data: ArrayBuffer;
    contentType?: string;
}

type RuntimeSendMessage = (
    message: ImageDownloadRequestPayload,
    callback: (response?: ImageDownloadResponsePayload) => void
) => void;

interface DownloadRemoteImageOptions {
    fetcher?: typeof fetch;
    sendMessage?: RuntimeSendMessage;
    getLastError?: () => chrome.runtime.LastError | undefined;
    allowFetchFallback?: boolean;
}

const getDefaultSendMessage = (): RuntimeSendMessage | undefined => {
    if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
        return;
    }

    return chrome.runtime.sendMessage.bind(chrome.runtime);
};

const getDefaultLastError = () => {
    if (typeof chrome === 'undefined') {
        return;
    }

    return chrome.runtime?.lastError;
};

const normalizeOptions = (
    options: typeof fetch | DownloadRemoteImageOptions = {}
): DownloadRemoteImageOptions =>
    typeof options === 'function'
        ? { fetcher: options, allowFetchFallback: true }
        : {
              ...options,
              allowFetchFallback:
                  options.allowFetchFallback ?? !!options.fetcher,
          };

const downloadRemoteImageByMessage = (
    url: string,
    sendMessage: RuntimeSendMessage,
    getLastError: () => chrome.runtime.LastError | undefined = getDefaultLastError
) =>
    new Promise<DownloadedImage>((resolve, reject) => {
        sendMessage(
            {
                type: ImageDownloadMessageType,
                url,
            },
            response => {
                const lastError = getLastError();
                if (lastError?.message) {
                    reject(new Error(lastError.message));
                    return;
                }

                if (!response) {
                    reject(new Error('download image failed: empty response'));
                    return;
                }

                if (!response.ok) {
                    reject(new Error(response.error));
                    return;
                }

                resolve({
                    data: base64ToArrayBuffer(response.dataBase64),
                    contentType: response.contentType,
                });
            }
        );
    });

const downloadRemoteImageByFetch = async (
    url: string,
    fetcher: typeof fetch = fetch
) => {
    const response = await fetcher(url, { credentials: 'omit' });

    if (!response.ok) {
        throw new Error(`download image failed: ${response.status}`);
    }

    return {
        data: await response.arrayBuffer(),
        contentType: response.headers.get('content-type') ?? undefined,
    };
};

export const downloadRemoteImage = async (
    url: string,
    options: typeof fetch | DownloadRemoteImageOptions = {}
): Promise<DownloadedImage> => {
    const normalizedOptions = normalizeOptions(options);
    const sendMessage =
        normalizedOptions.sendMessage ?? getDefaultSendMessage();

    if (sendMessage) {
        return downloadRemoteImageByMessage(
            url,
            sendMessage,
            normalizedOptions.getLastError
        );
    }

    if (!normalizedOptions.allowFetchFallback) {
        throw new Error('图片下载通道不可用，请重新加载插件和页面后重试');
    }

    return downloadRemoteImageByFetch(url, normalizedOptions.fetcher);
};
