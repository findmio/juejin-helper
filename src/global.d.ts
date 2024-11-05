/// <reference path="./share/types.ts" />

declare module '*.svg' {
    interface Svg {
        content: string;
        id: string;
        viewBox: string;
        node: any;
    }
    const svg: Svg;
    export default svg;
}

declare module '*.png' {
    const png: string;
    export default png;
}

declare module '*.less';

declare interface Window {
    __NUXT__: {
        state: {
            view: {
                column: {
                    entry: {
                        article_info: Article_Info_Type;
                    };
                };
            };
        };
    };
}
