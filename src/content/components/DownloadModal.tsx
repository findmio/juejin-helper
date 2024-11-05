import { useRef, useState } from 'react';
import { Alert, Collapse, ConfigProvider, Modal } from 'antd';
import { useMount } from 'ahooks';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

import type { SectionType } from '../api.ts';
import { getBookInfo, getSectionInfo } from '../api.ts';
import { replaceFileName, sleep } from 'share/utils.ts';

const DownloadModal = () => {
    const [open, setOpen] = useState(true); 

    const [message, setMessage] = useState('获取目录数据');
    const messagesRef = useRef<string[]>([message]);
    const bookNameRef = useRef('');
    const messagesEle = useRef<HTMLDivElement>(null);
    const [bookFile, setBookFile] = useState<Blob>();

    const handleMessage = (msg: string) => {
        messagesRef.current = [...messagesRef.current, msg];
        setMessage(msg);
        if (messagesEle.current) {
            // 将数据保持在最新的一行
            messagesEle.current.scrollTop =
                messagesEle.current.scrollHeight -
                messagesEle.current.clientHeight;
        }
    };

    const saveBook = async (sections: SectionType[]) => {
        const zip = JSZip();
        const book = zip.folder(bookNameRef.current);
        if (!book) {
            handleMessage('压缩文件失败');
            return;
        }
        sections.forEach(section => {
            book.file(
                `${replaceFileName(section.title)}.md`,
                section.markdown_show
            );
        });
        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, `${bookNameRef.current}.zip`);
        setBookFile(content);
    };

    const bookId = window.location.pathname.split('/').at(-1)!;

    useMount(async () => {
        const bookInfo = await getBookInfo(bookId);
        if (bookInfo.err_no !== 0) {
            handleMessage('获取目录错误');
            return;
        }
        bookNameRef.current = bookInfo.data.booklet.base_info.title;
        const [finishSections, progressSections] =
            bookInfo.data.sections.reduce<[SectionType[], SectionType[]]>(
                (prev, curr) => {
                    if (curr.status === 1) {
                        prev[0].push(curr);
                    } else {
                        prev[1].push(curr);
                    }
                    return prev;
                },
                [[], []]
            );

        handleMessage(
            `获取目录成功：完结 ${finishSections.length} 章，写作中 ${progressSections.length} 章`
        );

        for (let index = 0; index < finishSections.length; index++) {
            const section = finishSections[index];
            // 防止请求过快被平台限制
            await sleep();
            const sectionInfo = await getSectionInfo(section.section_id);
            if (sectionInfo.err_no !== 0) {
                handleMessage(`第 ${index + 1} 章下载失败}，下载终止`);
                return;
            }
            const sectionTitle = sectionInfo.data.section.title;
            section.markdown_show = sectionInfo.data.section.markdown_show;
            section.title = `${index + 1}. ${sectionTitle}`;
            handleMessage(`第 ${index + 1} 章下载完成：${sectionTitle}`);
        }
        await saveBook(finishSections);
        handleMessage('下载完成');
    });

    return (
        <ConfigProvider
            theme={{
                components: {
                    Collapse: {
                        headerPadding: '12px 0',
                        contentPadding: '0',
                    },
                },
            }}
        >
            <Modal
                title='下载小册'
                centered
                open={open}
                okText={false}
                zIndex={2000}
                maskClosable={false}
                footer={false}
                onCancel={() => setOpen(false)}
            >
                <div>
                    <p className='my-4'>
                        <strong className='mr-1'>
                            <a
                                className='text-black text-xl font-bold'
                                target='_blank'
                                href='https://github.com/findmio/juejin-helper'
                            >
                                本项目
                            </a>
                        </strong>
                        代码开源，所有操作均在本地进行，请放心使用
                    </p>
                    <p className='flex items-center'>
                        如果对你有帮助，给我一个 ✨ 好不好
                        <a
                            target='_blank'
                            href='https://github.com/findmio/juejin-helper'
                        >
                            <img
                                className='ml-2'
                                alt='GitHub Repo stars'
                                src='https://img.shields.io/github/stars/findmio/juejin-helper'
                            />
                        </a>
                    </p>
                    <p>本项目只做个人学习研究之用，不得用于商业用途</p>
                </div>

                {!!bookFile && (
                    <Alert
                        message={
                            <>
                                <span>没有自动下载？点此</span>
                                <a
                                    download={`${bookNameRef.current}.zip`}
                                    href={window.URL.createObjectURL(bookFile)}
                                >
                                    下载链接
                                </a>
                            </>
                        }
                        type='info'
                    />
                )}

                <Collapse
                    bordered={false}
                    ghost
                    items={[
                        {
                            label: message,
                            children: (
                                <div
                                    className='h-28 overflow-y-scroll'
                                    ref={messagesEle}
                                >
                                    {messagesRef.current.map(message => (
                                        <div key={message} className='my-1'>
                                            {message}
                                        </div>
                                    ))}
                                </div>
                            ),
                        },
                    ]}
                />
            </Modal>
        </ConfigProvider>
    );
};

export default DownloadModal;
