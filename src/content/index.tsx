import React from 'react';
import ReactDOM from 'react-dom/client';
import { Popconfirm } from 'antd';
import { PostMessageType } from 'share/constant';

import DownloadModal from './components/DownloadModal';
import DownloadPost from './components/DownloadPost';

import './index.css';

const script = document.createElement('script');
script.setAttribute('type', 'text/javascript');
script.setAttribute('src', chrome.runtime.getURL('inject.js'));
document.documentElement.appendChild(script);

window.addEventListener('message', event => {
    if (event.source !== window) return;
    if (event.data.type === PostMessageType.EMIT_POST_STATE) {
        window.__NUXT__ = event.data.data;
    }
});

const showConfirm = () => {
    const downloadEle = document.createElement('div');
    document.body.appendChild(downloadEle);
    ReactDOM.createRoot(downloadEle).render(
        <React.StrictMode>
            <DownloadModal />
        </React.StrictMode>
    );
};

const injectDownloadBtn = () => {
    const buyEle = document.querySelector('.is-buy')!;

    const downloadEle = document.createElement('div');
    downloadEle.id = 'download';

    ReactDOM.createRoot(downloadEle).render(
        <React.StrictMode>
            <Popconfirm
                title='是否下载此小册'
                onConfirm={showConfirm}
                okText='确认'
                cancelText='取消'
            >
                <a style={{ padding: '0 20px' }}>下载小册</a>
            </Popconfirm>
        </React.StrictMode>
    );
    buyEle.appendChild(downloadEle);
};

const callback: MutationCallback = (mutationsList, observer) => {
    const buyEle = document.querySelector('.is-buy');

    if (document.querySelector('#download')) {
        return;
    }

    if (buyEle) {
        injectDownloadBtn();
    }
    const panelEle = document.querySelector('.article-suspended-panel');
    if (document.querySelector('#download')) {
        return;
    }
    
    if (panelEle) {
        const downloadEle = document.createElement('div');
        downloadEle.id = 'download';
        downloadEle.classList.add('panel-btn');
        ReactDOM.createRoot(downloadEle).render(
            <React.StrictMode>
                <DownloadPost />
            </React.StrictMode>
        );
        panelEle.appendChild(downloadEle);
    }
};

const observer = new MutationObserver(callback);
observer.observe(document, { childList: true, subtree: true });
