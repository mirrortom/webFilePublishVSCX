import Path from 'path';
import * as fs from 'fs';
import JSON5 from 'json5';

import { EnvVar } from "../helpers/EnvVar";
import { StringBuilder } from "../helpers/LikeCS";
import CmdContext from "../publish/CmdContext";
import Help from '../helpers/Help';
import BundleM from './BundleM';
import StylusM from './StylusM';

export default class ConfigM {
    /**服务地址 */
    Ip: string = "127.0.0.1";

    /** 服务端口*/
    Port: number = 50015;

    /** 源文件目录名(例如:src 相对路径,相对于项目根目录,这层目录不会发布,例如src/a/a.txt发布后是/a/a.txt)*/
    SourceDir: string = "src";

    /** 发布目录名(例如: 'dist' 或 'd:/pubdir' 相对路径或绝对路径)*/
    DistDir: string = "dist";

    /** 允许发布的文件扩展名列表*/
    AllowExts: string[] = [".htm", ".html", ".cshtml", ".config", ".js", ".css", ".json", ".jpg", ".jpeg", ".gif", ".png", ".bmp", ".woff", ".woff2", ".ttf", ".svg", ".eot", ".otf"];

    /** 不允许发布的文件后缀名*/
    DenySuffix: string[] = ["layout.cshtml", "part.cshtml", "part.js", "part.css"];

    /** 对js,css,html压缩输出(0=不压缩,7=都压缩(默认). 1=html,2=css,4=js)*/
    MiniOutput: number = 7;

    /** 不允许发布的文件(例如:bundleconfig.json data/data.mdb 相对路径的文件名,相对于项目根目录)*/
    DenyFiles: string[] = ["tscofnig.json", "package-lock.json", "package.json", "bundleconfig.json", "compilerconfig.json"];

    /** 不允许发布的目录(例如:cfg 相对路径,相对于项目根目录)*/
    DenyDirs: string[] = [];

    /** razor部分页搜索路径 相对路径,相对于项目根目录*/
    RazorSearchDirs: string[] = [];

    /** razor model数据*/
    RazorModel: any = {};

    /** 文件合并*/
    Bundle: BundleM[] | null = null;

    /** stylus编译 */
    Stylus: StylusM[] | null = null;

    /**
     * 根据发布配置文件生成发布配置对象.配置文件publish.json放在项目根目录下.
    如果没有配置文件,将使用默认配置,并在项目根目录下生成publish.json配置文件
    如果指定的配置文件不是有效的json,返回出错提示.
    如果配置文件的值无效,将置为默认值.
    失败时返回null
    */
    static CreatePublishCfg(): ConfigM | null {
        try {
            let cfgPath = Path.join(EnvVar.wsDir, EnvVar.PublishCfgName);

            // 没有配置文件时,在项目根目录下生成publish.json配置文件
            if (!fs.existsSync(cfgPath)) {
                var cfg = new ConfigM();
                fs.writeFileSync(cfgPath, ConfigM.CreateJson(cfg), { encoding: 'utf8' });
                return cfg;
            }
            // 已有
            let cfgjson = JSON5.parse(fs.readFileSync(cfgPath, { encoding: 'utf8' }));
            return Help.JsonToTsObject(ConfigM, cfgjson);
        }
        catch (e: any) {
            return null;
        }
    }


    /** 
     * 生成默认json配置文件.以json格式文本形式返回.
     * 在项目没有配置文件时执行一次.
    */
    private static CreateJson(cfg: ConfigM): string {
        let sb = new StringBuilder();
        sb.AppendLine("{");
        //
        sb.AppendLine("  // 服务Ip地址 127.0.0.1");
        sb.AppendLine(`  "ip": "${cfg.Ip}",`);

        sb.AppendLine("  // 服务端口 50_015");
        sb.AppendLine(`  "port": ${cfg.Port},`);

        sb.AppendLine("  // 源文件目录名(例如:src 相对路径,相对于项目根目录,这层目录不会发布,例如src/a/a.txt发布后是/a/a.txt)");
        sb.AppendLine(`  "sourceDir": "${cfg.SourceDir}",`);

        sb.AppendLine("  // 发布目录名(例如: 'dist' 或 'd:/pubdir' 相对路径或绝对路径)");
        sb.AppendLine(`  "distDir": "${cfg.DistDir}",`);

        sb.AppendLine("  // 对js,css,html压缩输出(0=不压缩,7=都压缩. 1=html,2=css,4=js)");
        sb.AppendLine(`  "miniOutput": "${cfg.MiniOutput}",`);

        sb.AppendLine("  // 允许发布的文件扩展名,例: .html(.号开头)");
        let vStr = '[\"' + (cfg.AllowExts as string[]).join('\",\"') + '\"]';
        sb.AppendLine(`  "allowExts": ${vStr},`);

        sb.AppendLine("  // 不允许发布的文件后缀名");
        vStr = '[\"' + (cfg.DenySuffix as string[]).join('\",\"') + '\"]';
        sb.AppendLine(`  "denySuffix": ${vStr},`);

        sb.AppendLine("  // 不允许发布的文件(例如:bundleconfig.json data/data.mdb 相对路径的文件名,相对于项目根目录)");
        vStr = '[\"' + (cfg.DenyFiles as string[]).join('\",\"') + '\"]';
        sb.AppendLine(`  "denyFiles": ${vStr},`);

        sb.AppendLine("  // 不允许发布的目录(例如:cfg 相对路径,相对于项目根目录)");
        sb.AppendLine(`  "denyDirs": [],`);

        sb.AppendLine("  // razor搜索路径(相对路径,相对于项目根目录,razor页面引用的母版页部分页在此目录下查找");
        sb.AppendLine(`  "razorSearchDirs": [],`);

        sb.AppendLine("  // razor model数据,一个json键值对例如{ name : 'mirror' , ... },将作为dynamic对象作为Model传给cshtml文件,调用方法@Model.name");
        sb.AppendLine(`  "razorModel": {},`);

        sb.AppendLine("  // 文件合并,全路径或相对于项目根目录 [{inputFiles:[输入文件数组],outputFile:输出文件}]");
        sb.AppendLine(`  "bundle": null,`);

        sb.AppendLine("  // 编译stylus文件,全路径或相对于项目根目录[{inputFile:要编译的styl文件,outputFile:css输出文件}]");
        sb.AppendLine(`  "stylus": null`);

        sb.AppendLine("}");
        return sb.ToString();
    }
}