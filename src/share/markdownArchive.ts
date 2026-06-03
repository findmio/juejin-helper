import * as JSZip from 'jszip';

import {
    collectRemoteMarkdownImageUrls,
    createMarkdownImageFilePath,
    replaceMarkdownImageUrls,
} from './markdownImages';

export type MarkdownImageDownloadResult = {
    data: ArrayBuffer;
    contentType?: string;
};

export type MarkdownArchiveProgress =
    | {
          stage: 'image';
          current: number;
          total: number;
          url: string;
      }
    | {
          stage: 'zip';
          total: number;
          downloaded: number;
          failed: number;
      };

type CreateMarkdownArchiveOptions = {
    markdown: string;
    markdownFileName: string;
    downloadImage: (url: string) => Promise<MarkdownImageDownloadResult>;
    modifiedAt?: Date;
    imageDownloadRetryCount?: number;
    onProgress?: (progress: MarkdownArchiveProgress) => void;
};

export type MarkdownArchiveResult = {
    blob: Blob;
    totalImages: number;
    downloadedImages: number;
    failedUrls: string[];
};

const DEFAULT_IMAGE_DOWNLOAD_RETRY_COUNT = 3;

const createZipLocalDate = (date: Date) =>
    new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);


const downloadImageWithRetry = async (
    url: string,
    downloadImage: (url: string) => Promise<MarkdownImageDownloadResult>,
    retryCount: number
) => {
    for (let retryIndex = 0; retryIndex <= retryCount; retryIndex++) {
        try {
            return await downloadImage(url);
        } catch (error) {
            if (retryIndex === retryCount) {
                throw error;
            }
        }
    }

    throw new Error('Image download failed');
};

export const createMarkdownArchive = async ({
    markdown,
    markdownFileName,
    downloadImage,
    modifiedAt = new Date(),
    imageDownloadRetryCount = DEFAULT_IMAGE_DOWNLOAD_RETRY_COUNT,
    onProgress,
}: CreateMarkdownArchiveOptions): Promise<MarkdownArchiveResult> => {
    const zip = JSZip();
    const imageUrls = collectRemoteMarkdownImageUrls(markdown);
    const replacements = new Map<string, string>();
    const failedUrls: string[] = [];
    const zipFileOptions = {
        date: createZipLocalDate(modifiedAt),
    };

    for (let index = 0; index < imageUrls.length; index++) {
        const url = imageUrls[index];
        onProgress?.({
            stage: 'image',
            current: index + 1,
            total: imageUrls.length,
            url,
        });

        try {
            const image = await downloadImageWithRetry(
                url,
                downloadImage,
                imageDownloadRetryCount
            );
            const filePath = createMarkdownImageFilePath(
                url,
                replacements.size,
                image.contentType
            );

            zip.file(filePath, image.data, zipFileOptions);
            replacements.set(url, `./${filePath}`);
        } catch {
            failedUrls.push(url);
        }
    }

    const nextMarkdown = replaceMarkdownImageUrls(markdown, replacements);
    zip.file(markdownFileName, nextMarkdown, zipFileOptions);

    if (failedUrls.length > 0) {
        zip.file('failed-images.txt', failedUrls.join('\n'), zipFileOptions);
    }

    onProgress?.({
        stage: 'zip',
        total: imageUrls.length,
        downloaded: replacements.size,
        failed: failedUrls.length,
    });

    return {
        blob: await zip.generateAsync({ type: 'blob' }),
        totalImages: imageUrls.length,
        downloadedImages: replacements.size,
        failedUrls,
    };
};
