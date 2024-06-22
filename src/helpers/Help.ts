import * as fs from 'fs';
import Path from 'path';

import "./LikeCS";
export default class Help {
    /**
     * 字符串首字母小写
     */
    static StartLower(str: string): string {
        return str.replace(str[0], str[0].toLowerCase());
    }

    /**
     * 去掉路径结尾的斜杠(/或者\)
     * @param path 
     * @param startAndEnd 开始结尾都去掉为true
     * @returns 
     */
    static PathTrim(path: string, startAndEnd: boolean = false): string {
        if (startAndEnd == true) {
            return path.Trim('/\\');
        }
        return path.TrimEnd('/\\');
    }
    /**
     * 将路径的\变为/
     */
    static PathSplitChar(path: string): string {
        return path.replaceAll('\\', '/');
    }

    /**
     * 获取目录中的所有文件,包含子文件,返回一个数组.为空时返回[]
     * @param dirs 目录
     */
    static GetAllFiles(dirs: string[]): string[] {
        let getFiles = (dir: string, list: string[]) => {
            let items = fs.readdirSync(dir);
            for (let i = 0; i < items.length; i++) {
                let fsPath = Path.join(dir, items[i]);
                if (fs.statSync(fsPath).isDirectory()) {
                    getFiles(fsPath, list);
                } else if (fs.statSync(fsPath).isFile()) {
                    list.push(fsPath);
                }
            }
        }
        //
        let list: string[] = [];
        for (let i = 0; i < dirs.length; i++) {
            const item = dirs[i];
            getFiles(item, list);
        }
        return list;
    }

    /**
     * 将js的json实例(any)转换为ts的T实例.具体是复制属性值的过程,忽略属性名大小写.
     * @param type 要转换成的实例类型
     * @param json 源json实例
     * @returns 
     */
    static JsonToTsObject<T>(type: new () => T, json: any): T {
        let instance = new type();
        let srcKeys = Object.keys(json);
        for (let k in instance) {
            srcKeys.findIndex((v) => {
                if (v.toLowerCase() == k.toLowerCase()) {
                    instance[k] = json[v];
                }
            });
        }
        return instance;
    }

    /**
     * 字符串转为unit8Array字节数组,utf8编码
     * @param str 
     */
    static StringToUnit8Array(str: string) {
        let encode = new TextEncoder();
        return encode.encode(str);
    }
    static Unit8ArrayToString(u8arr: Uint8Array) {
        let decode = new TextDecoder();
        return decode.decode(u8arr);
    }
}