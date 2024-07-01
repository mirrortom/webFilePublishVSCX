import * as vscode from 'vscode';
import Path from 'path';
import { EnvVar } from './EnvVar';
import Help from './Help';

/** 获取项目内资源*/
export default class ProjectHelpers {

    /** 获取活动项目根目录路径(workspace的目录路径).无效返回''
     * 目前只支持一个工作区
    */
    static GetActiveProjectRootDir(): string {
        let wsArray = vscode.workspace.workspaceFolders;
        return wsArray ? wsArray[0].uri.fsPath : '';
    }

    /**
     * 获取当前编辑的文件的路径
     * 没找到时返回''
     */
    static getActiveDocFsPath(): string {
        var editor = vscode.window.activeTextEditor;
        return editor ? editor.document.uri.fsPath : '';
    }

    /**
     * 获取第一个工作区目录中的所有ProjectItem的路径(它不含.vscode,node_modules目录下的内容,含项目源文件).
     * 用于发布项目中的文件时,获取源文件路径.
     * 没有项目时,或者项目中无文件时,返回空数组[]
     */
    static async GetItemsPathOfWorkSpace0(): Promise<string[]> {
        // 递归获取所有文件.
        let getFiles = async (uri: vscode.Uri, list: string[]) => {
            let dirPath = uri.fsPath;
            if (isSkip < 2) {
                //.vscode,node_modules这2个目录排除
                if (this.IsIgnoreDir(dirPath)) {
                    isSkip += 1;
                    return;
                }
            }
            // 获取目录下的文件和目录
            let files = await vscode.workspace.fs.readDirectory(uri);
            for (let i = 0; i < files.length; i++) {
                const item = files[i];
                let fsPath = Path.join(dirPath, item[0]);
                let fsType = item[1];
                if (fsType == vscode.FileType.File) {
                    list.push(fsPath);
                } else if (fsType == vscode.FileType.Directory) {
                    // 目录继续递归
                    await getFiles(vscode.Uri.file(fsPath), list);
                }
            }
        }
        // 
        let list: string[] = [];
        let isSkip = 0;
        let wsDirPath = '';
        let wsList = vscode.workspace.workspaceFolders;
        if (wsList) {
            wsDirPath = wsList[0].uri.fsPath;
            await getFiles(wsList[0].uri, list);
        }
        return list;
    }

    /**
     * 目录是否为.vscode|node_modules,这些需要忽略的特定目录
     * @param dir 
     */
    static IsIgnoreDir(dir: string) {
        if (dir == Path.join(EnvVar.wsDir, 'node_modules') ||
            dir == Path.join(EnvVar.wsDir, ".vscode")) {
            return true;
        }
        return false;
    }

    /**
     * 判断路径是否为配置文件(publish.json)
     */
    static IsPublishJsonPath(targetFile: string): boolean {
        let jsonCfgPathLower = Help.PathSplitChar(Path.join(EnvVar.wsDir, EnvVar.PublishCfgName)).toLowerCase();
        let target = Help.PathSplitChar(targetFile).toLowerCase();
        return target == jsonCfgPathLower;
    }

    /**
     * onsave时,检查目标文件的扩展名是否为支持的文件
     */
    static targetFileExtNameCheckForOnSave(targetFile: string): boolean {
        let suppertExt = ['.styl', '.html', '.css', '.js', '.txt'];
        let extN = Path.extname(targetFile).toLowerCase();
        return suppertExt.indexOf(extN) >= 0;
    }

    /**
     * 检查文件扩展名是否为.styl,用于stylus编译
     * @param targetFile 
     */
    static targetFileExtNameIsStyl(targetFile: string): boolean {
        return Path.extname(targetFile).toLowerCase() == '.styl';
    }
}