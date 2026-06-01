import JSZip from 'jszip';

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
    onProgress?: (progress: MarkdownArchiveProgress) => void;
};

export type MarkdownArchiveResult = {
    blob: Blob;
    totalImages: number;
    downloadedImages: number;
    failedUrls: string[];
};

export const createMarkdownArchive = async ({
    markdown,
    markdownFileName,
    downloadImage,
    onProgress,
}: CreateMarkdownArchiveOptions): Promise<MarkdownArchiveResult> => {
    const zip = JSZip();
    const imageUrls = collectRemoteMarkdownImageUrls(markdown);
    const replacements = new Map<string, string>();
    const failedUrls: string[] = [];

    for (let index = 0; index < imageUrls.length; index++) {
        const url = imageUrls[index];
        onProgress?.({
            stage: 'image',
            current: index + 1,
            total: imageUrls.length,
            url,
        });

        try {
            const image = await downloadImage(url);
            const filePath = createMarkdownImageFilePath(
                url,
                replacements.size,
                image.contentType
            );

            zip.file(filePath, image.data);
            replacements.set(url, `./${filePath}`);
        } catch {
            failedUrls.push(url);
        }
    }

    const nextMarkdown = replaceMarkdownImageUrls(markdown, replacements);
    zip.file(markdownFileName, nextMarkdown);

    if (failedUrls.length > 0) {
        zip.file('failed-images.txt', failedUrls.join('\n'));
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
