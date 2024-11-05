import * as htmlparser2 from 'htmlparser2';
import { saveAs } from 'file-saver';
import TurndownService from 'turndown';
import { replaceFileName } from 'share/utils.ts';

export function parseHtml(article_info: Article_Info_Type) {
    const { web_html_content, title } = article_info;
    const turndownService = new TurndownService();

    const handler = new htmlparser2.DefaultHandler((error, dom) => {
        if (error) {
            console.error(error);
        } else {
            const cleanHtml = dom
                .filter(node => node.type !== 'style')
                .map(node => htmlparser2.DomUtils.getOuterHTML(node))
                .join('');
            const markdown = turndownService.turndown(cleanHtml);
            var blob = new Blob([markdown], {
                type: 'text/plain;charset=utf-8',
            });
            saveAs(blob, `${replaceFileName(title)}.md`);
            return markdown;
        }
    });

    const parser = new htmlparser2.Parser(handler);
    parser.parseComplete(web_html_content);
}
