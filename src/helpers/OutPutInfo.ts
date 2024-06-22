import * as vscode from 'vscode';

import { EnvVar } from './EnvVar';
/**
 * 使用vscode输出窗口输出信息
 * msg:消息文本
 * clear:是否清空原有信息.默认false不清空
 * */
export default function VscOutPutWindow(
    msg: string, clear: boolean = false
) {
    if (!EnvVar.outPutWin) {
        EnvVar.outPutWin = vscode.window.createOutputChannel
            (EnvVar.outPutWinTitle, EnvVar.outPutWinId);
    }
    // 清空消息
    if (clear)
        EnvVar.outPutWin.clear();
    // 输出消息
    EnvVar.outPutWin.appendLine(msg);
    // 显示
    EnvVar.outPutWin.show();
}