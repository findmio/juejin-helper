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

declare module '*.css';

declare module '*.less';
