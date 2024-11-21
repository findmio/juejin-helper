/** 使用 Unicode 字符替换文件名中的特殊字符 */
export const replaceFileName = (fileName: string) => {
    // https://docs.microsoft.com/zh-cn/windows/desktop/FileIO/naming-a-file#naming_conventions
    const replaceMap = new Map([
        ['<', '\uFF1C'], // Fullwidth Less-Than Sign
        ['>', '\uFF1E'], // Fullwidth Greater-Than Sign
        [':', '\uFF1A'], // Fullwidth Colon
        ['/', '\uFF0F'], // Fullwidth Solidus
        ['\\', '\uFF3C'], // Fullwidth Reverse Solidus
        ['|', '\uFF5C'], // Fullwidth Vertical Line
        ['?', '\uFF1F'], // Fullwidth Question Mark
        ['*', '\uFF0A'], // Fullwidth Asterisk
        ['"', '\uFF02'], // Fullwidth Quotation Mark
    ]);

    const pattern = [...replaceMap.keys()].map(key => '\\' + key).join('|');

    const regex = new RegExp(pattern, 'g');

    return fileName.replace(regex, match => replaceMap.get(match)!);
};

export const sleep = async (timeout = 1000) => {
    return new Promise<void>(resolve => {
        setTimeout(() => {
            resolve();
        }, timeout);
    });
};
