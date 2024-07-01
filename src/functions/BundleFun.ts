import os from 'os';
import * as fsSync from 'fs';
import * as fs from 'fs/promises';
import Path from 'path';
import * as Stream from 'stream/promises';

import FunContext from './FunContext';
import { EnvVar } from '../helpers/EnvVar';
import Help from '../helpers/Help';
import BundleM from '../entity/BundleM';

export default class BundleFun {
    /**
     * 保存文件时执行合并
     * @param doc 
     */
    static async ExecOnSave(context: FunContext, targetFile: string) {
        if (BundleFun.cfgCheck(context) == false)
            return;
        let targetLower = Help.PathSplitChar(targetFile).toLowerCase();
        let cfg = context.CfgM.Bundle;
        BundleFun.pathFull(cfg);

        context.Info.AppendLine('BundleFun: 保存事件--开始执行文件合并...');
        for (let i = 0; i < cfg.length; i++) {
            const item = cfg[i];
            let isIn = false;
            // 检查该文件是否在配置文件中bundle节inputFiles数组中,如果存在就合并.
            item.inputFiles.forEach((input) => {
                if (input.toLowerCase() == targetLower) {
                    isIn = true;
                    return;
                }
            })
            if (isIn) {
                // 合并文件.不要到forEach里await,会错误.
                await BundleFun.unionFiles(item.outputFile, item.inputFiles, context);
            }
        }
        context.Info.AppendLine('BundleFun: 保存事件--执行文件合并结束!');
    }

    /**
     * 全局执行合并,根据配置文件(alt+4 4)
     */
    static async CombineByCfg(context: FunContext) {
        if (BundleFun.cfgCheck(context) == false)
            return;
        let cfg = context.CfgM.Bundle;
        // 路径补齐为全路径
        BundleFun.pathFull(cfg);
        // 开始合并
        context.Info.AppendLine('BundleFun: 开始执行全项目文件合并...');
        for (let i = 0; i < cfg.length; i++) {
            const item = cfg[i];
            await BundleFun.unionFiles(item.outputFile, item.inputFiles, context);
        }
        context.Info.AppendLine('BundleFun: 全项目文件合并结束!');
    }

    /**
     * 合并文件.
     * @param cfg 配置参数
     * @returns 
     */
    private static async unionFiles(outputFileName: string, inputFiles: string[], context: FunContext) {
        // 检查inputFiles文件是否存在
        for (let i = 0; i < inputFiles.length; i++) {
            const item = inputFiles[i];
            if (!fsSync.existsSync(item)) {
                context.Info.AppendLine(`--文件[ ${item} ]不存在.`);
                return;
            }
        }
        let sw: fsSync.WriteStream;
        try {
            // 写入流,是一个目标文件,多个文件将合并到这个文件里
            sw = fsSync.createWriteStream(outputFileName);
            // 循环多个文件,读取流,然后写入
            for (let i = 0; i < inputFiles.length; i++) {
                let item = inputFiles[i];
                // 读取到buffer
                let buffer = await fs.readFile(item);
                // 检查带bom的utf8
                if (Help.IsUtf8WithBom(buffer)) {
                    sw.write(buffer.subarray(3));
                } else {
                    sw.write(buffer);
                }
                // 每次合并一个文件后,加一个换行.
                sw.write(os.EOL);
            }
            context.Info.AppendLine(`--[ ${inputFiles.length} ]个文件已合并到: ${outputFileName}`);
        } catch (err) {
            context.Info.AppendLine('--文件合并异常: ' + err.message);
        } finally {
            sw.close();
        }
    }

    /**
     * 路径补齐为全路径,并且将\变为/
     * @param cfg 
     */
    private static pathFull(cfg: BundleM[]) {
        cfg.forEach(item => {
            if (!Path.isAbsolute(item.outputFile))
                item.outputFile = Help.PathSplitChar(Path.join(EnvVar.wsDir, item.outputFile));
            item.inputFiles.forEach((input, index) => {
                if (!Path.isAbsolute(input))
                    item.inputFiles[index] = Help.PathSplitChar(Path.join(EnvVar.wsDir, input));
            })
        })
    }

    /**
     * 检查配置文件的Bundle节点是否为空.为空时返回false,并输入提示信息.
     * @param cfg 
     */
    private static cfgCheck(context: FunContext): boolean {
        if (context.CfgM.Bundle == null || context.CfgM.Bundle.length == 0) {
            context.Info.AppendLine('--缺少配置节Bundle.');
            return false;
        }
        return true;
    }
}