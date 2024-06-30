import os from 'os';
import * as fs from 'fs';
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
        // 检查该文件是否在配置文件中bundle节inputFiles数组中,如果存在就合并.
        let targetLower = Help.PathSplitChar(targetFile).toLowerCase();
        let cfg = context.CfgM.Bundle;
        BundleFun.pathFull(cfg);
        for (let i = 0; i < cfg.length; i++) {
            const item = cfg[i];
            // target是否在在inputs里
            item.inputFiles.forEach(async (input) => {
                if (input.toLowerCase() == targetLower) {
                    // 合并这个
                    await BundleFun.unionFiles(item.outputFile, item.inputFiles, context);
                    // 下一项
                    return;
                }
            })
        }
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
            if (!fs.existsSync(item)) {
                context.Info.AppendLine(`--文件[ ${item} ]不存在.`);
                return;
            }
        }
        let sw: fs.WriteStream;
        try {
            // 写入流,是一个目标文件,多个文件将合并到这个文件里
            sw = fs.createWriteStream(outputFileName, 'utf8');
            // 循环多个文件,读取流,然后写入
            for (let i = 0; i < inputFiles.length; i++) {
                let item = inputFiles[i];
                // 读取流
                let sr = fs.createReadStream(item);
                // 关键点,使用pipeline管道操作,将读取流写入到写入流
                // end=false表示管道不关闭,因为还有下一个要写入.就是因为没搞懂这个参数,结果总是报错,说是内存泄漏问题.
                // 可能是因为,在没有设置end=false时,管道关闭了,然后下次循环时又打开管道,因为是同一个写入流,可能报错.
                // 设置后就不报错误了.
                await Stream.pipeline(sr, sw, { end: false });
                // 源文件读取流关闭
                sr.close();
                // 每次合并一个文件后,加一个换行.
                sw.write(os.EOL);
            }
            context.Info.AppendLine(`--[ ${inputFiles.length} ]个文件已合并到: ${outputFileName}`);
        } catch (err) {
            context.Info.AppendLine('--文件合并异常: ' + err.message);
        } finally {
            sw.close();
            // 最后关闭写入流.这样管道也关闭.pipeline内部有处理
            // sw.close((err) => {
            //     if (err) {
            //         console.log(err);
            //     } else {
            //         console.log('sw.close is ok!');
            //     }
            // });
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