import * as vscode from 'vscode';

import { CmdTypes } from "../helpers/EnvVar";
import Publisher from "./Publisher";
import VscOutPutWindow from '../helpers/OutPutInfo';

/**
 * 注册发布命令.在package.json里需要配置,name值对应command值,否则无效.
 * @param context 
 */
export function regeCmds(context: vscode.ExtensionContext) {
    let cmds = [
        // 1.PublishActiveFile 发布当前编辑的文件(alt+q q)
        { name: "cmd.PublishActiveFile", fun: publishActiveFile },
        // 2.PublishFile 发布选中的文件,只能用右键菜单,按快捷键无效(alt+1 1)
        { name: "cmd.PublishFile", fun: publishFile },
        // 3.PublishDir 发布选中的目录,只能用右键菜单,按快捷键无效(alt+2 2)
        { name: "cmd.PublishDir", fun: publishDir },
        // 4.PublishWeb 发布整个工作区(alt+3 3)
        { name: "cmd.PublishWeb", fun: publishWeb },
    ];
    for (let i = 0; i < cmds.length; i++) {
        const cmd = cmds[i];
        context.subscriptions.push(vscode.commands.registerCommand(cmd.name, cmd.fun));
    }
}

/**
 * 发布当前文档 cmd
 */
async function publishActiveFile() {
    await new Publisher(CmdTypes.PublishActiveFile).RunAsync();
}

/**
 * 发布目录 cmd
 */
async function publishDir(contextSelection: vscode.Uri, allSelections: vscode.Uri[]) {
    if (allSelections) {
        let selectedItems: string[] = [];
        for (let index = 0; index < allSelections.length; index++) {
            selectedItems.push(allSelections[index].fsPath)
        }
        // 执行任务
        await new Publisher(CmdTypes.PublishDir, selectedItems).RunAsync();
    } else {
        VscOutPutWindow('没有找到选中的目录.(尝试使用右键菜单)!');
    }
}

/**
 * 发布文件 cmd
 */
async function publishFile(contextSelection: vscode.Uri, allSelections: vscode.Uri[]) {

    if (allSelections) {
        let selectedItems: string[] = [];
        for (let index = 0; index < allSelections.length; index++) {
            selectedItems.push(allSelections[index].fsPath)
            //console.log(index + ' :' + item.fsPath);
        }
        // 执行任务
        await new Publisher(CmdTypes.PublishFile, selectedItems).RunAsync();
    } else {
        VscOutPutWindow('没有找到选中的文件.(尝试使用右键菜单)!');
    }
}

/**
 * 发布项目 cmd
 */
async function publishWeb() {
    // 执行任务
    await new Publisher(CmdTypes.PublishWeb).RunAsync();
}