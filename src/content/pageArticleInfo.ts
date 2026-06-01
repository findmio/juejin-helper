import type { ArticleInfoType } from '../share/types';
import {
    type ArticleInfoRequestPayload,
    type ArticleInfoResponsePayload,
    PageStateEvent,
    parseBridgeDetail,
    serializeBridgeDetail,
} from '../share/pageStateBridge';

export const ARTICLE_INFO_REQUEST_TIMEOUT_MESSAGE =
    '获取文章内容超时，请刷新重试';

interface ArticleInfoRequestTarget {
    addEventListener: Window['addEventListener'];
    removeEventListener: Window['removeEventListener'];
    dispatchEvent: Window['dispatchEvent'];
}

interface RequestArticleInfoFromPageOptions {
    target?: ArticleInfoRequestTarget;
    timeoutMs?: number;
    createRequestId?: () => string;
}

let requestIndex = 0;

const createRequestId = () =>
    `juejin-helper-${Date.now()}-${requestIndex++}`;

export const requestArticleInfoFromPage = ({
    target = window,
    timeoutMs = 3000,
    createRequestId: createId = createRequestId,
}: RequestArticleInfoFromPageOptions = {}) =>
    new Promise<ArticleInfoType | undefined>((resolve, reject) => {
        const requestId = createId();
        let timeoutId: ReturnType<typeof setTimeout>;

        const cleanup = () => {
            clearTimeout(timeoutId);
            target.removeEventListener(
                PageStateEvent.ResponseArticleInfo,
                handleResponse
            );
        };

        const handleResponse = (event: Event) => {
            const payload = parseBridgeDetail<ArticleInfoResponsePayload>(
                (event as CustomEvent<string>).detail
            );

            if (payload?.requestId !== requestId) {
                return;
            }

            cleanup();
            resolve(payload.articleInfo);
        };

        timeoutId = setTimeout(() => {
            cleanup();
            reject(new Error(ARTICLE_INFO_REQUEST_TIMEOUT_MESSAGE));
        }, timeoutMs);

        target.addEventListener(
            PageStateEvent.ResponseArticleInfo,
            handleResponse
        );
        target.dispatchEvent(
            new CustomEvent(PageStateEvent.RequestArticleInfo, {
                detail: serializeBridgeDetail({
                    requestId,
                } satisfies ArticleInfoRequestPayload),
            })
        );
    });
