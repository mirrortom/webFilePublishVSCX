import * as vscode from 'vscode';

import { CmdTypes } from "../helpers/EnvVar";
import FunContext from "./FunContext";
import ConfigM from '../entity/ConfigM';
import VscOutPutWindow from '../helpers/OutPutInfo';
import BundleFun from './BundleFun';
import StylusFun from './StylusFun';

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
     * 按保存时执行,目标是当前保存的文档
     */
    async RunOnSaveAsync(targetFile: string) {
        if (this.funcontext.CfgM == null) {
            VscOutPutWindow('publish.json获取失败,发生了异常!');
            return;
        }
        this.funcontext.targetFile = targetFile;
        // 2.执行功能
        BundleFun.ExecOnSave(this.funcontext);
        StylusFun.ExecOnSave(this.funcontext);
        //
        VscOutPutWindow(this.funcontext.Info.ToString());
    }

    /** 项目范围内执行*/
    async ExecFun(cmdType: CmdTypes) {
        if (this.funcontext.CfgM == null) {
            VscOutPutWindow('publish.json获取失败,发生了异常!');
            return;
        }
        if (cmdType == CmdTypes.BundleFiles) {
            await BundleFun.ExecByCfg(this.funcontext);
        } else if (cmdType == CmdTypes.CompileStylus) {
            await StylusFun.ExecByCfg(this.funcontext);
        }
        VscOutPutWindow(this.funcontext.Info.ToString());
    }
}