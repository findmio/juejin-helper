const markdownImagePattern =
    /!\[[^\]\n]*\]\(\s*(<[^>\n]+>|[^\s)\n]+)(\s+(?:"[^"\n]*"|'[^'\n]*'|\([^)\n]*\)))?\s*\)/g;
const htmlImagePattern =
    /(<img\b[^>]*?\bsrc\s*=\s*)(["'])([^"']+)\2([^>]*>)/gi;

const imageContentTypeExtensions = new Map([
    ['image/jpeg', 'jpg'],
    ['image/jpg', 'jpg'],
    ['image/png', 'png'],
    ['image/gif', 'gif'],
    ['image/webp', 'webp'],
    ['image/svg+xml', 'svg'],
    ['image/avif', 'avif'],
    ['image/bmp', 'bmp'],
]);

const imagePathExtensions = new Set([
    'jpg',
    'jpeg',
    'png',
    'gif',
    'webp',
    'svg',
    'avif',
    'bmp',
]);

const isRemoteImageUrl = (url: string) => /^https?:\/\//i.test(url);

const normalizeMarkdownDestination = (destination: string) => {
    const trimmed = destination.trim();
    if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
        return trimmed.slice(1, -1);
    }
    return trimmed;
};

const addUniqueRemoteUrl = (urls: string[], url: string) => {
    if (isRemoteImageUrl(url) && !urls.includes(url)) {
        urls.push(url);
    }
};

export const collectRemoteMarkdownImageUrls = (markdown: string) => {
    const urls: string[] = [];

    markdown.replace(markdownImagePattern, (_match, destination: string) => {
        addUniqueRemoteUrl(urls, normalizeMarkdownDestination(destination));
        return _match;
    });

    markdown.replace(htmlImagePattern, (_match, _prefix, _quote, src: string) => {
        addUniqueRemoteUrl(urls, src);
        return _match;
    });

    return urls;
};

const getExtensionFromContentType = (contentType?: string) => {
    if (!contentType) {
        return;
    }

    const mimeType = contentType.split(';')[0].trim().toLowerCase();
    return imageContentTypeExtensions.get(mimeType);
};

const getExtensionFromUrl = (url: string) => {
    try {
        const { pathname } = new URL(url);
        const extension = pathname.split('.').pop()?.toLowerCase();
        if (extension && imagePathExtensions.has(extension)) {
            return extension === 'jpeg' ? 'jpg' : extension;
        }
    } catch {
        return;
    }
};

export const createMarkdownImageFilePath = (
    url: string,
    index: number,
    contentType?: string
) => {
    const extension =
        getExtensionFromContentType(contentType) ??
        getExtensionFromUrl(url) ??
        'image';
    const fileName = String(index + 1).padStart(3, '0');

    return `images/${fileName}.${extension}`;
};

export const replaceMarkdownImageUrls = (
    markdown: string,
    replacements: Map<string, string>
) => {
    const replacedMarkdownImages = markdown.replace(
        markdownImagePattern,
        match => {
            const destinationMatch = /!\[[^\]\n]*\]\(\s*(<[^>\n]+>|[^\s)\n]+)/.exec(
                match
            );
            const destination = destinationMatch?.[1];
            if (!destination) {
                return match;
            }

            const originalUrl = normalizeMarkdownDestination(destination);
            const replacement = replacements.get(originalUrl);
            if (!replacement) {
                return match;
            }

            const nextDestination =
                destination.trim().startsWith('<') &&
                destination.trim().endsWith('>')
                    ? `<${replacement}>`
                    : replacement;

            const destinationIndex = match.indexOf(destination);
            return `${match.slice(0, destinationIndex)}${nextDestination}${match.slice(
                destinationIndex + destination.length
            )}`;
        }
    );

    return replacedMarkdownImages.replace(
        htmlImagePattern,
        (match, prefix: string, quote: string, src: string, suffix: string) => {
            const replacement = replacements.get(src);
            if (!replacement) {
                return match;
            }
            return `${prefix}${quote}${replacement}${quote}${suffix}`;
        }
    );
};
