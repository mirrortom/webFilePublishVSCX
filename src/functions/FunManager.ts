import Path from 'path';
import * as vscode from 'vscode';

import { CmdTypes, EnvVar } from "../helpers/EnvVar";
import FunContext from "./FunContext";
import ConfigM from '../entity/ConfigM';
import VscOutPutWindow from '../helpers/OutPutInfo';
import BundleFun from './BundleFun';
import StylusFun from './StylusFun';
import Help from '../helpers/Help';
import ProjectHelpers from '../helpers/ProjectHelpers';

export default class FunManager {
    private readonly funcontext: FunContext;
    /**
     * 功能流程处理
     */
    constructor() {
        this.funcontext = new FunContext();
        // 获取配置文件
        this.funcontext.CfgM = ConfigM.CreatePublishCfg();
    }

    /**
     * 按保存时执行所有功能,目标是当前保存的文档
     */
    async RunOnSaveAsync(targetFile: string) {
        if (ProjectHelpers.IsPublishJsonPath(targetFile)) {
            // 如果是配置文件,不动作
            return;
        }

        this.funcontext.Info.AppendLine('文档保存事件执行...');
        if (this.funcontext.CfgM == null) {
            VscOutPutWindow('-- publish.json获取失败,发生了异常!');
            return;
        }
        // 2.执行功能
        await BundleFun.ExecOnSave(this.funcontext, targetFile);
        await StylusFun.ExecOnSave(this.funcontext, targetFile);
        //
        VscOutPutWindow(this.funcontext.Info.ToString());
    }

    /** 在workspace范围内执行功能*/
    async ExecFun(cmdType: CmdTypes) {
        if (this.funcontext.CfgM == null) {
            VscOutPutWindow('publish.json获取失败,发生了异常!');
            return;
        }
        if (cmdType == CmdTypes.BundleFiles) {
            await BundleFun.CombineByCfg(this.funcontext);
        } else if (cmdType == CmdTypes.CompileStylus) {
            await StylusFun.CompileByCfg(this.funcontext);
        }
        VscOutPutWindow(this.funcontext.Info.ToString());
    }

    /** styl文件右键菜单执行编译 */
    async CompileStylFile(targets: string[]) {
        await StylusFun.ExecByFile(this.funcontext, targets);
        VscOutPutWindow(this.funcontext.Info.ToString());
    }
}