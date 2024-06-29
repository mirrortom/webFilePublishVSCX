import * as vscode from 'vscode';

// 需要保留引用的全局变量
export class EnvVar {
    static wsDir: string = '';
    static outPutWin: vscode.OutputChannel | null = null;
    static readonly outPutWinTitle = '<Web-Publiser-Vscx>';
    static readonly outPutWinId = '12349994';
    static readonly PublishCfgName = "publish.json";
}
export enum CmdTypes {
    PublishActiveFile,
    PublishFile,
    PublishDir,
    PublishWeb,
    BundleFiles,
    CompileStylus
}