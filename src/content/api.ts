export interface SectionType {
    section_id: string;
    title: string;
    booklet_id: string;
    status: number;
    markdown_show: string;
}

export interface BookInfoType {
    data: {
        booklet: {
            base_info: {
                title: string;
            };
        };
        introduction: {
            markdown_show: string;
        };
        sections: SectionType[];
    };
    err_no: number;
}

export interface SectionInfoType {
    data: {
        section: SectionType;
    };
    err_no: number;
}

export async function getBookInfo(bookId: string) {
    const response = await fetch(
        'https://api.juejin.cn/booklet_api/v1/booklet/get',
        {
            method: 'POST',
            body: JSON.stringify({
                booklet_id: bookId,
            }),
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        }
    );
    const data: BookInfoType = await response.json();
    return data;
}

export async function getSectionInfo(sectionId: string) {
    const response = await fetch(
        'https://api.juejin.cn/booklet_api/v1/section/get',
        {
            method: 'POST',
            body: JSON.stringify({
                section_id: sectionId,
            }),
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        }
    );
    const data: SectionInfoType = await response.json();
    return data;
}
