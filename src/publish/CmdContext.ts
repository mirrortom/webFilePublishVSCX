import { CmdTypes } from '../helpers/EnvVar';
import { StringBuilder } from '../helpers/LikeCS';
import ConfigM from './ConfigM';

// 命令工作数据对象,在命令开始时建立
export default class CmdContext {
    /**命令工作数据上下文对象*/
    constructor() {
        this.Info = new StringBuilder();
    }
    /**命令类型*/
    CmdType: CmdTypes | null = null;

    /**要发布的项目的根路径.(vscode下使用EnvVar.wsDir)*/
    ProjectRootDir: string = '';

    /**要发布的文件(全路径名)*/
    SrcFiles: string[] | null = null;

    /**目标文件,与SrcFiles下标对应(全路径名)*/
    TargetFiles: string[] | null = null;

    /***消息字符串缓存 */
    Info: StringBuilder;

    /**发布配置文件对象(用于公用)*/
    CfgM: ConfigM | null = null;
}