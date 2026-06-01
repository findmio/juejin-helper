import {
    type ArticleInfoRequestPayload,
    PageStateEvent,
    getArticleInfoFromNuxtState,
    parseBridgeDetail,
    serializeBridgeDetail,
} from 'share/pageStateBridge';

window.addEventListener(PageStateEvent.RequestArticleInfo, event => {
    const payload = parseBridgeDetail<ArticleInfoRequestPayload>(
        (event as CustomEvent<string>).detail
    );

    if (!payload?.requestId) {
        return;
    }

    window.dispatchEvent(
        new CustomEvent(PageStateEvent.ResponseArticleInfo, {
            detail: serializeBridgeDetail({
                requestId: payload.requestId,
                articleInfo: getArticleInfoFromNuxtState(window.__NUXT__),
            }),
        })
    );
});
