import type { ArticleInfoType, JuejinNuxtState } from './types';

export const PageStateEvent = {
    RequestArticleInfo: 'juejin-helper:request-article-info',
    ResponseArticleInfo: 'juejin-helper:response-article-info',
} as const;

export interface ArticleInfoRequestPayload {
    requestId: string;
}

export interface ArticleInfoResponsePayload {
    requestId: string;
    articleInfo?: ArticleInfoType;
}

export const serializeBridgeDetail = (payload: unknown) =>
    JSON.stringify(payload);

export const parseBridgeDetail = <T>(detail: unknown): T | null => {
    if (typeof detail !== 'string') {
        return null;
    }

    try {
        const parsed = JSON.parse(detail) as unknown;
        if (!parsed || typeof parsed !== 'object') {
            return null;
        }
        return parsed as T;
    } catch {
        return null;
    }
};

export const getArticleInfoFromNuxtState = (
    nuxtState?: JuejinNuxtState
) => nuxtState?.state?.view?.column?.entry?.article_info;
