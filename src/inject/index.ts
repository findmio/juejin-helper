import { PostMessageType } from "share/constant";

window.onload = function () {
    window.postMessage(
        {
            type: PostMessageType.EMIT_POST_STATE,
            data: window.__NUXT__,
        },
        "*"
    );
};
