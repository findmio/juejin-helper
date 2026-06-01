export interface DownloadedImage {
    data: ArrayBuffer;
    contentType?: string;
}

export const downloadRemoteImage = async (
    url: string,
    fetcher: typeof fetch = fetch
): Promise<DownloadedImage> => {
    const response = await fetcher(url, { credentials: 'omit' });

    if (!response.ok) {
        throw new Error(`download image failed: ${response.status}`);
    }

    return {
        data: await response.arrayBuffer(),
        contentType: response.headers.get('content-type') ?? undefined,
    };
};
