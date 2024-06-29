import { CmdTypes } from '../helpers/EnvVar';
import { StringBuilder } from '../helpers/LikeCS';
import ConfigM from '../entity/ConfigM';

// 插件本地功能,上下文数据对象
export default class FunContext {
    constructor() {
        this.Info = new StringBuilder();
    }
    /** 保存时的目标文件(全路径) */
    targetFile: string | null = null;

    /**命令类型*/
    CmdType: CmdTypes | null = null;

    /***消息字符串缓存 */
    Info: StringBuilder;

    /**发布配置文件对象(用于公用)*/
    CfgM: ConfigM | null = null;
}