import * as vscode from 'vscode';

import FunManager from './FunManager';
import { CmdTypes } from '../helpers/EnvVar';

/**
 * 注册命令到扩展,所有本地功能在此注册.每个功能建立一个类,名字以Fun结尾.
 * @param context 
 */
export function regeFuns(context: vscode.ExtensionContext) {
    let disposable1 = vscode.workspace.onDidSaveTextDocument(async (listener: vscode.TextDocument) => {
        if (!listener) return;
        await new FunManager().RunOnSaveAsync(listener.uri.fsPath);
    })
    context.subscriptions.push(disposable1);

    // 整个项目内的,合并文件和编译stylus,做成命令绑定快捷键.根据配置文件的设定执行.
    let cmds = [
        // 1.合并文件,根据配置文件(alt+4 4)
        { name: "cmd.BundleFiles", fun: bundleByCfg },
        // 2.编译stylus文件,根据配置文件(alt+5 5)
        { name: "cmd.CompileStylus", fun: stylusByCfg },
    ];
    for (let i = 0; i < cmds.length; i++) {
        const cmd = cmds[i];
        context.subscriptions.push(vscode.commands.registerCommand(cmd.name, cmd.fun));
    }
}

async function bundleByCfg() {
    await new FunManager().ExecFun(CmdTypes.BundleFiles);
}
async function stylusByCfg() {
    await new FunManager().ExecFun(CmdTypes.CompileStylus);
}

