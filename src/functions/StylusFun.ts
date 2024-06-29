import * as fs from 'fs/promises';
import Path from 'path';
import util from 'util';
import stylus from "stylus";
import * as process from 'process';

import VscOutPutWindow from '../helpers/OutPutInfo';
import FunContext from './FunContext';
import { EnvVar } from '../helpers/EnvVar';
import Help from '../helpers/Help';

export default class StylusFun {
    /**
     * 保存文件时执行编译
     * @param doc 
     */
    static ExecOnSave(context: FunContext) {
        if (!context.targetFile.endsWith('styl')) {
            return;
        }
        // 检查文件地址,在publish.json中是否已经配置
        // 如果不在,检查stylus配置的所有预编译文件,找出任何@import了该文件的文件.需要递归查询.
        context.Info.AppendLine('--配置文件stylus节缺少该文件: ' + context.targetFile);
        // 编译该文件或者所有引用该文件的预编译项
    }

    /**
     * 项目范围内,编译stylus文件,根据配置文件
     */
    static async ExecByCfg(context: FunContext) {
        if (context.CfgM.Stylus == null) {
            // 没有配置绑定文件,不动作
            return;
        }
        let cfg = context.CfgM.Stylus;
        // 路径补齐为全路径
        cfg.forEach(item => {
            if (!Path.isAbsolute(item.outputFile))
                item.outputFile = Help.PathSplitChar(Path.join(EnvVar.wsDir, item.outputFile));
            if (!Path.isAbsolute(item.inputFile))
                item.inputFile = Help.PathSplitChar(Path.join(EnvVar.wsDir, item.inputFile));
        })
        // 开始编译
        context.Info.AppendLine('StylusFun: 开始编译styl文件...');
        for (let i = 0; i < cfg.length; i++) {
            const item = cfg[i];
            await StylusFun.CompileStylus(item.outputFile, item.inputFile, context);
        }
        context.Info.AppendLine('StylusFun: styl文件编译结束!');
    }

    private static async CompileStylus(outputFile: string, inputFile: string, context: FunContext) {
        try {
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
            context.Info.AppendLine('--编译styl成功,输出文件: ' + outputFile);
            console.log(process.cwd());
        } catch (err) {
            context.Info.AppendLine('--编译styl发生了错误: ' + err.message);
        }
    }
}