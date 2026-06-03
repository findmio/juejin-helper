import * as htmlparser2 from 'htmlparser2';
import * as TurndownService from 'turndown';

import type { ArticleInfoType } from '../share/types';

type TurndownServiceConstructor = typeof import('turndown');

interface ResolveArticleMarkdownOptions {
    getArticleRootHtml?: () => string | undefined | null;
}

const hasContent = (content: string | undefined | null): content is string =>
    typeof content === 'string' && content.trim().length > 0;

const getArticleRootHtml = () =>
    document.getElementById('article-root')?.innerHTML;

const getTurndownServiceConstructor = () =>
    (TurndownService as unknown as { default?: TurndownServiceConstructor })
        .default ?? (TurndownService as unknown as TurndownServiceConstructor);

const createTurndownService = () => {
    const TurndownServiceConstructor = getTurndownServiceConstructor();
    return new TurndownServiceConstructor({
        codeBlockStyle: 'fenced',
        headingStyle: 'atx',
    });
};

const htmlToMarkdown = (html: string) => {
    const parsedDocument = htmlparser2.parseDocument(html);
    const cleanHtml = parsedDocument.children
        .filter(node => node.type !== 'style')
        .map(node => htmlparser2.DomUtils.getOuterHTML(node))
        .join('');
    const markdown = createTurndownService().turndown(cleanHtml);

    return hasContent(markdown) ? markdown : undefined;
};

export const resolveArticleMarkdown = (
    articleInfo: ArticleInfoType | undefined,
    {
        getArticleRootHtml: getRootHtml = getArticleRootHtml,
    }: ResolveArticleMarkdownOptions = {}
): string | undefined => {
    if (hasContent(articleInfo?.mark_content)) {
        return articleInfo.mark_content;
    }

    if (hasContent(articleInfo?.web_html_content)) {
        return htmlToMarkdown(articleInfo.web_html_content);
    }

    const articleRootHtml = getRootHtml();
    if (hasContent(articleRootHtml)) {
        return htmlToMarkdown(articleRootHtml);
    }

    return undefined;
};
