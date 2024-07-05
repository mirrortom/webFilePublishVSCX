import os from 'os';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import Path from 'path';
import util from 'util';
import stylus from "stylus";

import FunContext from './FunContext';
import { EnvVar } from '../helpers/EnvVar';
import Help from '../helpers/Help';
import StylusM from '../entity/StylusM';
import ProjectHelpers from '../helpers/ProjectHelpers';

export default class StylusFun {

    /**
     * 选中styl文件时,右键菜单项
     * @param context 
     */
    static async ExecByFile(context: FunContext, targets: string[]) {
        if (StylusFun.cfgCheck(context) == false)
            return;
        let cfg = context.CfgM.Stylus;
        StylusFun.pathFull(cfg);
        context.Info.AppendLine('StylusFun: 右键菜单--开始编译styl文件...');
        for (let i = 0; i < targets.length; i++) {
            const item = targets[i];
            if (!ProjectHelpers.targetFileExtNameIsStyl(item))
                continue;
            await StylusFun.CompileFile(item, context);
        }
        context.Info.AppendLine('StylusFun: 右键菜单--编译styl文件结束!');
    }

    /**
     * 保存文件时执行编译
     * @param context 
     */
    static async ExecOnSave(context: FunContext, targetFile: string) {
        if (!ProjectHelpers.targetFileExtNameIsStyl(targetFile))
            return;
        if (StylusFun.cfgCheck(context) == false)
            return;
        StylusFun.pathFull(context.CfgM.Stylus);
        context.Info.AppendLine('StylusFun: 保存事件--开始编译styl文件...');
        await StylusFun.CompileFile(targetFile, context);
        context.Info.AppendLine('StylusFun: 保存事件--编译styl文件结束!');
    }

    /**
     * 全局执行编译stylus文件,根据配置文件
     */
    static async CompileByCfg(context: FunContext) {
        if (context.CfgM.Stylus == null) {
            // 没有配置绑定文件,不动作
            return;
        }
        let cfg = context.CfgM.Stylus;
        // 路径补齐为全路径
        StylusFun.pathFull(cfg);
        // 开始编译
        context.Info.AppendLine('StylusFun: 开始编译全项目styl文件...');
        for (let i = 0; i < cfg.length; i++) {
            const item = cfg[i];

            await StylusFun.CompileStylus(item.outputFile, item.inputFile, context);
        }
        context.Info.AppendLine('StylusFun: 全项目styl文件编译结束!');
    }

    /**
     * 编译一个styl文件
     * @param file 
     * @param context 
     */
    private static async CompileFile(targetFile: string, context: FunContext) {
        // 检查文件地址,是否在配置文件中Stylus节inputFile中,存在则编译
        let targetLower = Help.PathSplitChar(targetFile).toLowerCase();
        let cfg = context.CfgM.Stylus;
        let inTheInputFile = 0;
        for (let i = 0; i < cfg.length; i++) {
            const item = cfg[i];
            if (item.inputFile.toLowerCase() == targetLower) {
                // 编译
                inTheInputFile++;
                await StylusFun.CompileStylus(item.outputFile, item.inputFile, context);
            }
        }
        // 检查stylus配置的所有inputFile,找出@import了该文件的项.只考虑一级,不要递归查询.
        let fileIndexs: number[] = await StylusFun.findFilesWhenImprotTarget(targetLower, cfg);
        if (fileIndexs.length == 0 && inTheInputFile == 0) {
            context.Info.AppendLine(`--文件[ ${targetFile} ]未编译,因为没有配置.`);
            return;
        };
        for (let i = 0; i < fileIndexs.length; i++) {
            const index = fileIndexs[i];
            // 编译
            await StylusFun.CompileStylus(cfg[index].outputFile, cfg[index].inputFile, context);
        }
    }



    /**
     * 编译stys文件,使用stylus库
     * @param outputFile 
     * @param inputFile 
     * @param context 
     */
    private static async CompileStylus(outputFile: string, inputFile: string, context: FunContext) {
        try {
            // 检查文件是否存在
            if (!fsSync.existsSync(inputFile)) {
                context.Info.AppendLine(`--文件[ ${inputFile} ]不存在.`);
                return;
            }

            // 这个工具将callback转换为promise函数形式,泛型最后一个参数是promise函数返回值
            let stylusAsync = util.promisify<string, stylus.RenderOptions, string>(stylus.render);

            // 这里utf8不能省略,否则读出的内容不对,报解析失败
            let src = await fs.readFile(inputFile, 'utf8');
            /*
            src就是inputFile文件内容,op参数里又指定了这个文件的路径.经过测试,如果不指定这个路径也可以成功编译.
            但是,inputFile文件里@import引用的其它styl文件的路径要写成相对于执行目录的路径,否则会报错找不到文件.
            如果传了这个文件路径,那么inputFile里@import的文件,就可以正常的写相对于inputFile自己的路径了.
            */
            let op = { 'filename': inputFile };
            let css = await stylusAsync(src, op);
            await fs.writeFile(outputFile, css);
            context.Info.AppendLine(`--文件[ ${inputFile} ]编译成功,输出文件:[ ${outputFile} ]`);
        } catch (err) {
            context.Info.AppendLine(`--文件[ ${inputFile} ]编译失败,异常:[ ${err.message} ]`);
        }
    }

    /**
     * 在配置文件中查找,所有import了target文件的项
     * @param target 比对文件
     * @param cfg 
     */
    private static async findFilesWhenImprotTarget(target: string, cfg: StylusM[]): Promise<number[]> {
        let indexs: number[] = [];
        for (let i = 0; i < cfg.length; i++) {
            const item = cfg[i];
            // 检查文件存在
            if (!fsSync.existsSync(item.inputFile)) {
                continue;
            }
            // 读取文件内容,分析@import的行.只取开头为@improt的行
            let src = await fs.readFile(item.inputFile, 'utf8');
            let lines = src.split(os.EOL);
            lines.forEach((row) => {
                if (row.trim().startsWith('@import')) {
                    // 取得import的文件地址,去掉空格和引号
                    let p = row.trim().substring('@import'.length).Trim(' "');
                    // import的文件路径,是以inputFile文件为参照根起点(不考虑..向上,只考虑./向下)
                    let importFileFullPath = Help.PathSplitChar(Path.join(Path.dirname(item.inputFile), p).toLowerCase());
                    // (可能没有.styl扩展名)
                    if (!importFileFullPath.endsWith('.styl'))
                        importFileFullPath += '.styl';
                    // 比较
                    if (target == importFileFullPath) {
                        // 记录索引号
                        indexs.push(i);
                        // 检查下一个inputFile项
                        return;
                    }
                }
            })
        }
        return indexs;
    }

    /**
     * 路径补齐为全路径,并且将\换成/
     * @param cfg 
     */
    private static pathFull(cfg: StylusM[]) {
        cfg.forEach(item => {
            if (!Path.isAbsolute(item.outputFile))
                item.outputFile = Help.PathSplitChar(Path.join(EnvVar.wsDir, item.outputFile));
            if (!Path.isAbsolute(item.inputFile))
                item.inputFile = Help.PathSplitChar(Path.join(EnvVar.wsDir, item.inputFile));
        })
    }

    /**
     * 检查配置文件的Stylus节点是否为空.为空时返回false,并输入提示信息.
     * @param cfg 
     */
    private static cfgCheck(context: FunContext): boolean {
        if (context.CfgM.Stylus == null) {
            context.Info.AppendLine('--缺少配置节Stylus.');
            return false;
        }
        if (!typeof context.CfgM.Stylus.length) {
            context.Info.AppendLine('--配置节Stylus必须是一个数组,请参考注释说明配置.');
            return false;
        }
        return true;
    }
}