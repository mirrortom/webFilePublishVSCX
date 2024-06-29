import os from 'os';
import * as fs from 'fs';
import Path from 'path';
import * as Stream from 'stream/promises';

import FunContext from './FunContext';
import { EnvVar } from '../helpers/EnvVar';
import Help from '../helpers/Help';

export default class BundleFun {
    /**
     * 保存文件时执行合并
     * @param doc 
     */
    static ExecOnSave(context: FunContext) {
        //  context.targetFile;
        // 检查该文件是否在配置文件中bundle节inputFiles数组中,不存在直接返回
        return;
        // 执行合并.所有使用了该文件的合并项.
    }

    /**
     * 全局执行合并,根据配置文件(alt+4 4)
     */
    static async ExecByCfg(context: FunContext) {
        if (context.CfgM.Bundle == null) {
            // 没有配置绑定文件,不动作
            return;
        }
        let cfg = context.CfgM.Bundle;
        // 路径补齐为全路径
        cfg.forEach(item => {
            if (!Path.isAbsolute(item.outputFile))
                item.outputFile = Help.PathSplitChar(Path.join(EnvVar.wsDir, item.outputFile));
            item.inputFiles.forEach((input, index) => {
                if (!Path.isAbsolute(input))
                    item.inputFiles[index] = Help.PathSplitChar(Path.join(EnvVar.wsDir, input));
            })
        })
        // 开始合并
        context.Info.AppendLine('BundleFun: 开始执行文件合并...');
        for (let i = 0; i < cfg.length; i++) {
            const item = cfg[i];
            await BundleFun.unionFiles(item.outputFile, item.inputFiles, context);
        }
        context.Info.AppendLine('BundleFun: 文件合并结束!');
    }

    /**
     * 合并文件.成功时返回null,失败时返回错误信息
     * @param cfg 配置参数
     * @returns 
     */
    private static async unionFiles(outputFileName: string, inputFiles: string[], context: FunContext) {
        try {
            // 写入流,是一个目标文件,多个文件将合并到这个文件里
            let sw = fs.createWriteStream(outputFileName);
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
            context.Info.AppendLine(`--[${inputFiles.length}]个文件已合并到: ${outputFileName}`);
            // 最后关闭写入流.这样管道也关闭.pipeline内部有处理
            // sw.close((err) => {
            //     if (err) {
            //         console.log(err);
            //     } else {
            //         console.log('sw.close is ok!');
            //     }
            // });
        } catch (err) {
            context.Info.AppendLine('--文件合并异常: ' + err.message);
        }
    }
}