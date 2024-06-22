import os from 'os';
/**
 * 使用cs语言的一些方法名字来扩展的方法.
 */
declare global {
    interface String {
        Trim(chars: string): string;
        TrimStart(chars: string): string;
        TrimEnd(chars: string): string;
    }
}
/**
* 去除开头结尾处指定字符,默认空格字符
* @param str 
* @param char 
* @returns 
*/
String.prototype.Trim = function (this: string, chars: string): string {
    let s = _trim(this, chars);
    return _trim(s, chars, true);
}
/**
 * 去除字符串尾部指定字符,默认空格字符
 * @param str 
 * @param char 
 * @returns 
 */
String.prototype.TrimEnd = function (this: string, chars: string): string {
    return _trim(this, chars, true);
}
/**
 * 去除字符串头部指定字符,默认空格字符
 * @param str 
 * @param char 
 * @returns 
 */
String.prototype.TrimStart = function (this: string, chars: string): string {
    return _trim(this, chars);
}
function _trim(str: string, chars: string, startOnEnd: boolean = false) {
    let s = str;
    if (startOnEnd) {
        s = Array.from(s).reverse().join('');
    }
    for (let i = 0; i < chars.length; i++) {
        const c = chars[i];
        let posi = 0;
        for (let j = 0; j < s.length; j++) {
            const item = s[j];
            if (item != c) {
                posi = j;
                break;
            }
        }
        s = s.substring(posi);
    }
    return startOnEnd ? Array.from(s).reverse().join('') : s;
}

/**
 * StringBuilder类
 */
export class StringBuilder {
    private buffer: string[] = [];
    public Append(val: string) {
        this.buffer.push(val);
    }
    public AppendLine(val: string = '') {
        this.Append(val);
        this.buffer.push(os.EOL);
    }
    public ToString() {
        return this.buffer.join('');
    }
}
export { }