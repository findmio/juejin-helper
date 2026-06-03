const markdownImagePattern =
    /!\[[^\]\n]*\]\(\s*(<[^>\n]+>|[^\s)\n]+)(\s+(?:"[^"\n]*"|'[^'\n]*'|\([^)\n]*\)))?\s*\)/g;
const htmlImagePattern =
    /(<img\b[^>]*?\bsrc\s*=\s*)(["'])([^"']+)\2([^>]*>)/gi;
const fencedCodeLinePattern = /^( {0,3})(`{3,}|~{3,})/;

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

interface MarkdownSegment {
    content: string;
    isCode: boolean;
}

const escapeRegExp = (value: string) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const splitInlineCodeSegments = (markdown: string): MarkdownSegment[] => {
    const segments: MarkdownSegment[] = [];
    let index = 0;

    while (index < markdown.length) {
        const codeStart = markdown.indexOf('`', index);
        if (codeStart === -1) {
            segments.push({
                content: markdown.slice(index),
                isCode: false,
            });
            break;
        }

        const delimiterMatch = /^`+/.exec(markdown.slice(codeStart));
        const delimiter = delimiterMatch?.[0];
        if (!delimiter) {
            break;
        }

        const codeEnd = markdown.indexOf(
            delimiter,
            codeStart + delimiter.length
        );
        if (codeEnd === -1) {
            segments.push({
                content: markdown.slice(index),
                isCode: false,
            });
            break;
        }

        if (codeStart > index) {
            segments.push({
                content: markdown.slice(index, codeStart),
                isCode: false,
            });
        }

        segments.push({
            content: markdown.slice(codeStart, codeEnd + delimiter.length),
            isCode: true,
        });
        index = codeEnd + delimiter.length;
    }

    return segments.filter(segment => segment.content.length > 0);
};

const splitMarkdownSegments = (markdown: string): MarkdownSegment[] => {
    const segments: MarkdownSegment[] = [];
    let lineStart = 0;
    let textStart = 0;
    let codeStart: number | undefined;
    let closingFencePattern: RegExp | undefined;

    while (lineStart < markdown.length) {
        const newlineIndex = markdown.indexOf('\n', lineStart);
        const lineEnd =
            newlineIndex === -1 ? markdown.length : newlineIndex + 1;
        const line = markdown.slice(lineStart, lineEnd);

        if (closingFencePattern) {
            if (closingFencePattern.test(line.trimEnd())) {
                segments.push({
                    content: markdown.slice(codeStart, lineEnd),
                    isCode: true,
                });
                textStart = lineEnd;
                codeStart = undefined;
                closingFencePattern = undefined;
            }

            lineStart = lineEnd;
            continue;
        }

        const fenceMatch = fencedCodeLinePattern.exec(line);
        if (fenceMatch) {
            if (lineStart > textStart) {
                segments.push(
                    ...splitInlineCodeSegments(
                        markdown.slice(textStart, lineStart)
                    )
                );
            }

            const fence = fenceMatch[2];
            const fenceChar = fence[0];
            codeStart = lineStart;
            closingFencePattern = new RegExp(
                `^ {0,3}${escapeRegExp(fenceChar)}{${fence.length},}\\s*$`
            );
        }

        lineStart = lineEnd;
    }

    if (closingFencePattern && codeStart !== undefined) {
        segments.push({
            content: markdown.slice(codeStart),
            isCode: true,
        });
        return segments;
    }

    if (textStart < markdown.length) {
        segments.push(
            ...splitInlineCodeSegments(markdown.slice(textStart))
        );
    }

    return segments;
};

export const collectRemoteMarkdownImageUrls = (markdown: string) => {
    const urls: string[] = [];

    splitMarkdownSegments(markdown).forEach(segment => {
        if (segment.isCode) {
            return;
        }

        segment.content.replace(
            markdownImagePattern,
            (_match, destination: string) => {
                addUniqueRemoteUrl(
                    urls,
                    normalizeMarkdownDestination(destination)
                );
                return _match;
            }
        );

        segment.content.replace(
            htmlImagePattern,
            (_match, _prefix, _quote, src: string) => {
                addUniqueRemoteUrl(urls, src);
                return _match;
            }
        );
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
    return splitMarkdownSegments(markdown)
        .map(segment => {
            if (segment.isCode) {
                return segment.content;
            }

            const replacedMarkdownImages = segment.content.replace(
                markdownImagePattern,
                match => {
                    const destinationMatch =
                        /!\[[^\]\n]*\]\(\s*(<[^>\n]+>|[^\s)\n]+)/.exec(
                            match
                        );
                    const destination = destinationMatch?.[1];
                    if (!destination) {
                        return match;
                    }

                    const originalUrl =
                        normalizeMarkdownDestination(destination);
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
                (
                    match,
                    prefix: string,
                    quote: string,
                    src: string,
                    suffix: string
                ) => {
                    const replacement = replacements.get(src);
                    if (!replacement) {
                        return match;
                    }
                    return `${prefix}${quote}${replacement}${quote}${suffix}`;
                }
            );
        })
        .join('');
};
