import * as vscode from 'vscode';

import FunManager from './FunManager';
import { CmdTypes } from '../helpers/EnvVar';

/**
 * 注册命令到扩展,所有本地功能在此注册.每个功能建立一个类,名字以Fun结尾.
 * @param context 
 */
export function regeFuns(context: vscode.ExtensionContext) {
    // onsave事件
    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(onDidSaveTextDocumentHandler));

    // 整个项目内的,合并文件和编译stylus,做成命令绑定快捷键.根据配置文件的设定执行.
    let cmds = [
        // 1.合并文件,根据配置文件(alt+4 4)
        { name: "cmd.BundleFiles", fun: bundleByCfg },
        // 2.编译stylus文件,根据配置文件(alt+5 5)
        { name: "cmd.CompileStylus", fun: stylusByCfg },
        // 3.编译单个styl文件,右键(资源管理器)
        { name: "cmd.CompileStylFile", fun: stylusCompileFile }
    ];
    for (let i = 0; i < cmds.length; i++) {
        const cmd = cmds[i];
        context.subscriptions.push(vscode.commands.registerCommand(cmd.name, cmd.fun));
    }
}

async function onDidSaveTextDocumentHandler(listener: vscode.TextDocument) {
    if (!listener) return;
    await new FunManager().RunOnSaveAsync(listener.uri.fsPath);
}

async function bundleByCfg() {
    await new FunManager().ExecFun(CmdTypes.BundleFiles);
}
async function stylusByCfg() {
    await new FunManager().ExecFun(CmdTypes.CompileStylus);
}
async function stylusCompileFile(contextSelection: vscode.Uri, allSelections: vscode.Uri[]) {
    if (allSelections) {
        let selectedItems: string[] = [];
        for (let index = 0; index < allSelections.length; index++) {
            selectedItems.push(allSelections[index].fsPath)
            //console.log(index + ' :' + item.fsPath);
        }
        // 执行任务
        await new FunManager().CompileStylFile(selectedItems);
    }
}

