/** 使用 Unicode 字符替换文件名中的特殊字符 */
export const replaceFileName = (fileName: string) => {
    // https://docs.microsoft.com/zh-cn/windows/desktop/FileIO/naming-a-file#naming_conventions
    const replaceMap = new Map([
        ['<', '\uFE64'],
        ['>', '\uFE65'],
        [':', '\uA789'],
        ['/', '\u2215'],
        ['\\', '\uFE68'],
        ['|', '\u2758'],
        ['?', '\uFE16'],
        ['*', '\uFE61'],
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
