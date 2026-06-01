import { useState } from 'react';
import { message, Popover } from 'antd';
import saveAs from 'file-saver';
import { createMarkdownArchive } from 'share/markdownArchive';
import { replaceFileName } from 'share/utils';

import {
    ARTICLE_INFO_REQUEST_TIMEOUT_MESSAGE,
    requestArticleInfoFromPage,
} from '../pageArticleInfo';
import { downloadRemoteImage } from '../downloadImage';

const downloadMessageKey = 'download-post';

const DownloadPost = () => {
    const [messageApi, contextHolder] = message.useMessage();
    const [downloading, setDownloading] = useState(false);

    const handleDownload = async () => {
        if (downloading) {
            return;
        }

        setDownloading(true);

        try {
            messageApi.open({
                key: downloadMessageKey,
                type: 'loading',
                content: '正在读取文章内容...',
                duration: 0,
            });

            const article_info = await requestArticleInfoFromPage();
            const mark_content = article_info?.mark_content;
            if (!mark_content) {
                messageApi.open({
                    key: downloadMessageKey,
                    type: 'error',
                    content: '未获取到文章内容，请刷新重试',
                    duration: 3,
                });
                return;
            }

            const { title } = article_info;
            const fileName = replaceFileName(title);

            messageApi.open({
                key: downloadMessageKey,
                type: 'loading',
                content: '正在解析图片链接...',
                duration: 0,
            });

            const archive = await createMarkdownArchive({
                markdown: mark_content,
                markdownFileName: `${fileName}.md`,
                downloadImage: downloadRemoteImage,
                onProgress: progress => {
                    if (progress.stage === 'image') {
                        messageApi.open({
                            key: downloadMessageKey,
                            type: 'loading',
                            content: `正在下载图片 ${progress.current}/${progress.total}`,
                            duration: 0,
                        });
                        return;
                    }

                    messageApi.open({
                        key: downloadMessageKey,
                        type: 'loading',
                        content: `正在打包文件（成功 ${progress.downloaded}/${progress.total} 张）...`,
                        duration: 0,
                    });
                },
            });

            saveAs(archive.blob, `${fileName}.zip`);

            if (archive.failedUrls.length > 0) {
                messageApi.open({
                    key: downloadMessageKey,
                    type: 'warning',
                    content: `${archive.downloadedImages}/${archive.totalImages} 张图片已打包，${archive.failedUrls.length} 张下载失败，已保留原链接`,
                    duration: 5,
                });
                return;
            }

            messageApi.open({
                key: downloadMessageKey,
                type: 'success',
                content:
                    archive.totalImages > 0
                        ? `下载完成，已打包 ${archive.totalImages} 张图片`
                        : '下载完成，未发现图片',
                duration: 3,
            });
        } catch (error) {
            console.error(error);
            const content =
                error instanceof Error &&
                error.message === ARTICLE_INFO_REQUEST_TIMEOUT_MESSAGE
                    ? ARTICLE_INFO_REQUEST_TIMEOUT_MESSAGE
                    : '下载失败，请稍后重试';

            messageApi.open({
                key: downloadMessageKey,
                type: 'error',
                content,
                duration: 3,
            });
        } finally {
            setDownloading(false);
        }
    };
    return (
        <>
            {contextHolder}
            <Popover content='下载文章与图片'>
                <div className='w-16 h-16 rounded-full flex items-center justify-center cursor-pointer shadow-[0_2px_4px_0_rgba(50, 50, 50, .04)] bg-[var(--juejin-layer-5)] text-[var(--juejin-font-3)] hover:text-[var(--juejin-font-2)]'>
                    <div
                        className={`w-6 ${downloading ? 'opacity-50 pointer-events-none' : ''}`}
                        onClick={handleDownload}
                    >
                        <svg
                            viewBox='0 0 1024 1024'
                            version='1.1'
                            xmlns='http://www.w3.org/2000/svg'
                        >
                            <path
                                fill='currentColor'
                                d='M895.5 831.7H128c-35.1 0-63.8 28.7-63.8 63.8 0 35.1 28.7 63.8 63.8 63.8h767.5c35.1 0 63.8-28.7 63.8-63.8 0-35.1-28.7-63.8-63.8-63.8zM811 383H672.2V123.8c0-33.3-27-60.4-60.4-60.4H412.4c-33.3 0-60.4 27-60.4 60.4V383H213.2c-26.7 0-40.7 31.8-22.5 51.5L489.6 758c12.1 13.1 32.9 13.1 45.1 0l298.8-323.5c18.1-19.7 4.2-51.5-22.5-51.5z'
                            />
                        </svg>
                    </div>
                </div>
            </Popover>
        </>
    );
};
export default DownloadPost;
