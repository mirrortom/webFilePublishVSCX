import * as fs from 'fs';
import Path from 'path';
import net from 'net';
import PromiseSocket from 'promise-socket';

import { CmdTypes, EnvVar } from "../helpers/EnvVar";
import CmdContext from "./CmdContext";
import ProjectHelpers from "../helpers/ProjectHelpers";
import ConfigM from "./ConfigM";
import Help from '../helpers/Help';
import VscOutPutWindow from '../helpers/OutPutInfo';

/** 发布帮助类*/
export default class Publisher {
    private readonly cmdcontext: CmdContext;

    /**
     * 在vscode插件中,使用右键菜单发布时,需要设置这个属性,值是右键菜单
     */
    private readonly selectedItems: string[] = [];

    /**
     * 发布流程
     * @param cmdType 命令类型
     * @param rightKeyItems 右键菜单发布时,选中的文件/目录的路径
     */
    constructor(cmdType: CmdTypes, rightKeyItems: string[] = []) {
        this.cmdcontext = new CmdContext();
        this.cmdcontext.CmdType = cmdType;
        this.selectedItems = rightKeyItems;
    }

    /** 运行发布流程*/
    async RunAsync() {
        this.cmdcontext.Info.AppendLine("START 发布开始>>>".padEnd(50, '-'));
        this.cmdcontext.Info.AppendLine();

        // 1.获取数据
        //// 1.1发布相关基础数据(项目根目录,配置文件等)
        if (!this.GetDataForPublish()) {
            VscOutPutWindow(this.cmdcontext.Info.ToString(), true);
            return;
        }
        //// 1.2要发布的文件
        if (!await this.GetFileToPublish()) {
            VscOutPutWindow(this.cmdcontext.Info.ToString(), true);
            return;
        }

        // 2.配置数据
        // 输出路径计算
        this.TargetPath();

        // 3.连接,调用服务
        await this.RequestServeAsync();

        // 4.结果
        this.cmdcontext.Info.AppendLine("END 发布结束<<<".padEnd(50, '-'));
        VscOutPutWindow(this.cmdcontext.Info.ToString(), true);
    }


    /** 
     * 获取要发布的文件.筛选出符合发布要求的文件.
     * */
    private async GetFileToPublish(): Promise<boolean> {
        this.cmdcontext.SrcFiles = [];
        let pType = this.cmdcontext.CmdType;
        // 根据不同的命令,选取要发布的文件
        if (pType == CmdTypes.PublishActiveFile) {
            // 当前编辑的文件
            let docPath = ProjectHelpers.getActiveDocFsPath();
            if (docPath != '') {
                this.cmdcontext.SrcFiles.push(docPath);
            }
        }
        else if (pType == CmdTypes.PublishWeb) {
            let pathItems = await ProjectHelpers.GetItemsPathOfWorkSpace0();
            this.cmdcontext.SrcFiles = this.cmdcontext.SrcFiles.concat(pathItems);
        }
        else if (pType == CmdTypes.PublishFile) {
            // 右键点击后选中的文件(一般是一个,但也可以多个)
            for (let i = 0; i < this.selectedItems.length; i++) {
                const item = this.selectedItems[i];
                // 只取文件
                if (fs.statSync(item).isFile()) {
                    this.cmdcontext.SrcFiles.push(item);
                }
            }
        }
        else if (pType == CmdTypes.PublishDir) {
            // 右键点击后选中的文件夹(一般是一个,但也可以多个)
            let dirs: string[] = [];
            for (let i = 0; i < this.selectedItems.length; i++) {
                const item = this.selectedItems[i];
                // 只取文件夹
                if (fs.statSync(item).isDirectory()) {
                    if (ProjectHelpers.IsIgnoreDir(item))
                        continue;
                    dirs.push(item);
                }
            }
            this.cmdcontext.SrcFiles = Help.GetAllFiles(dirs);
        }

        // 根据发布条件筛选
        this.FilterFiles();
        // 至少要有一个文件发布
        if (this.cmdcontext.SrcFiles.length == 0) {
            this.cmdcontext.Info.AppendLine("没有可发布的文件,发布已停止!");
            return false;
        }
        return true;
    }


    /** 获取发布时需要的相关数据,并检查*/
    private GetDataForPublish(): boolean {
        // 最先获取基础数据
        let rootDir = EnvVar.wsDir
        // 活动项目根路径,最基础数据
        if (rootDir == '') {
            this.cmdcontext.Info.AppendLine("未选择活动项目,根路径获取失败,发布已停止!");
            return false;
        }

        // 获取发布配置文件,必要数据
        ConfigM.CreatePublishCfg(this.cmdcontext);
        if (this.cmdcontext.CfgM == null) {
            return false;
        }

        // 如果输出目录是相对目录,需要加上项目根目录,成为全路径
        if (!Path.isAbsolute(this.cmdcontext.CfgM.DistDir)) {
            this.cmdcontext.CfgM.DistDir = Path.join
                (rootDir, this.cmdcontext.CfgM.DistDir);
        }

        // razor页面搜索目录,加上全路径
        if (this.cmdcontext.CfgM.RazorSearchDirs.length > 0) {
            for (let i = 0; i < this.cmdcontext.CfgM.RazorSearchDirs.length; i++) {
                const p = this.cmdcontext.CfgM.RazorSearchDirs[i];
                this.cmdcontext.CfgM.RazorSearchDirs[i] =
                    Help.PathSplitChar(Path.join(rootDir, p));
            }
        }
        return true;
    }

    /**
     * 使用预定规则将不需要发布处理的文件清除,筛选出发布文件列表.
     */
    private FilterFiles() {
        let files: string[] = [];
        // 此时的发布目录DistDir,必须已经是全路径
        let outDirLower = Help.PathSplitChar(this.cmdcontext.CfgM.DistDir).toLowerCase();
        let jsonCfgPathLower = Help.PathSplitChar(Path.join(EnvVar.wsDir, EnvVar.PublishCfgName)).toLowerCase();

        // 循环所有文件,筛选
        for (let i = 0; i < this.cmdcontext.SrcFiles.length; i++) {
            const item = this.cmdcontext.SrcFiles[i];
            let filePathLower: string = Help.PathSplitChar(item).toLowerCase();
            // 如果文件位于发布目录下要排除掉.避免发布"发布目录里的文件".
            // 例如发布目录是默认值dist时,这是位于项目根目录下的dist文件夹,如果意外被包含进项目,就会发生此情况
            if (filePathLower.startsWith(outDirLower))
                continue;

            // 只发布支持的扩展名
            if (this.FilterByInAllowExtName(filePathLower))
                continue;

            // 排除不允许发布的文件后缀名
            if (this.FilterByDenySuffix(filePathLower))
                continue;

            // 排除不允许发布的目录,比较文件目录,是否为禁发目录开头
            if (this.FilterByDenyDirs(filePathLower))
                continue;

            // 排除不允许发布的文件,比较文件全路径名
            if (this.FilterByDenyFiles(filePathLower))
                continue;

            // 不发布配置文件
            if (filePathLower == jsonCfgPathLower)
                continue;
            //
            files.push(Help.PathSplitChar(item));
        }
        this.cmdcontext.SrcFiles = files;
    }
    /**
     * 筛选:文件扩展名不在发布列表中,为true
     * @param path 
     */
    private FilterByInAllowExtName(path: string): boolean {
        return this.cmdcontext.CfgM.AllowExts.indexOf(Path.extname(path)) == -1;
    }
    /**
     * 筛选:文件后缀名在不允许发布列表,为true
     * @param path 
     */
    private FilterByDenySuffix(path: string): boolean {
        for (let i = 0; i < this.cmdcontext.CfgM.DenySuffix.length; i++) {
            const item = this.cmdcontext.CfgM.DenySuffix[i];
            if (path.endsWith(item))
                return true;
        }
        return false;
    }
    /**
     * 筛选:文件属于不允许发布的目录,为true
     * @param path 
     */
    private FilterByDenyDirs(path: string): boolean {
        for (let i = 0; i < this.cmdcontext.CfgM.DenyDirs.length; i++) {
            const item = this.cmdcontext.CfgM.DenyDirs[i];
            let denyDir: string = Help.PathSplitChar(Path.join(EnvVar.wsDir, item)).toLowerCase();
            if (path.startsWith(denyDir)) {
                return true;
            }
        }
        return false;
    }
    /**
    * 筛选:文件是不允许发布的文件,为true
    * @param path 
    */
    private FilterByDenyFiles(path: string): boolean {
        for (let i = 0; i < this.cmdcontext.CfgM.DenyFiles.length; i++) {
            const item = this.cmdcontext.CfgM.DenyFiles[i];
            let denyFile: string = Help.PathSplitChar(Path.join(EnvVar.wsDir, item)).toLowerCase();
            if (path == denyFile)
                return true;
        }
        return false;
    }

    /**
     *  根据要发布的源文件路径,计算出目标路径.
     */
    private TargetPath() {
        this.cmdcontext.TargetFiles = [];
        for (let i = 0; i < this.cmdcontext.SrcFiles.length; i++) {
            const item = this.cmdcontext.SrcFiles[i];
            // 源文件从项目根目录起始的相对路径,如: wwwroot/xxx/yy
            let rootDir = Help.PathTrim(EnvVar.wsDir);
            let relPath = item.substring(rootDir.length + 1);
            // 源代码目录这一级(或者几级),去掉
            if (this.cmdcontext.CfgM.SourceDir.length > 0) {
                let srcDirLower = Help.PathTrim(this.cmdcontext.CfgM.SourceDir, true).toLowerCase();
                // 如果是源代码目录下的,才要去掉
                if (relPath.toLowerCase().startsWith(srcDirLower)) {
                    relPath = relPath.substring(srcDirLower.length + 1);
                }
            }

            // 目标文件全路径 输出目录+相对路径
            this.cmdcontext.TargetFiles.push(Help.PathSplitChar(Path.join(this.cmdcontext.CfgM.DistDir, relPath)));
        }
    }


    private async RequestServeAsync() {
        // instance
        const socket = new net.Socket()
        const client = new PromiseSocket(socket)
        try {
            // 建立连接
            await client.connect({ port: this.cmdcontext.CfgM.Port, host: this.cmdcontext.CfgM.Ip });

            // 参数包装
            let bytes: Uint8Array = this.GetRequestData();

            // send
            await client.writeAll(Buffer.from(bytes));

            // return
            const buffer = await client.readAll();
            let buf = buffer as Buffer;

            // info
            this.cmdcontext.Info.AppendLine(buffer[0] == 1 ? "^_^服务执行成功!" : ":(服务执行失败!");
            this.cmdcontext.Info.AppendLine("<服务消息>");
            // \0是字符串结尾,如果在stringbuild中加入了此字符,后面再append()其它字符串就徒劳了,
            // ToString()时被限制在\0位置,\0后面的字符不出来.
            // socket传字符串就会带来\0这个问题,要去掉这个字符. lastIndex-1
            let u8arr = new Uint8Array(buf.byteLength - 2);
            buf.copy(u8arr, 0, 1);
            let srvmsg = Help.Unit8ArrayToString(u8arr);
            this.cmdcontext.Info.AppendLine(srvmsg);
        }
        catch (e: any) {
            this.cmdcontext.Info.AppendLine(`RequestServeAsync()异常,请检查插件服务! ${e.message}`);
        }
        finally {
            client.destroy();
        }
    }


    /**
     * 打包参数,按协议格式.
     * 协议:第1个字节是命令是否成功,后面是数据
    */
    private GetRequestData(): Uint8Array {
        // json数据
        let p: any = {};
        p.SrcFiles = this.cmdcontext.SrcFiles;
        p.TargetFiles = this.cmdcontext.TargetFiles;
        // razor搜索路径,默认项目根路径
        p.SearchDirs = this.cmdcontext.CfgM.RazorSearchDirs.concat([EnvVar.wsDir]);
        p.Model = this.cmdcontext.CfgM.RazorModel;
        p.MiniOutput = this.cmdcontext.CfgM.MiniOutput;
        let paraStr = JSON.stringify(p);
        //
        let paraU8Array = Help.StringToUnit8Array(paraStr)

        //
        let bytes = new Uint8Array(paraU8Array.length + 1);
        // 命令编号 3 ,对应VSIXService.cmds.ForVSIX
        bytes[0] = 3;
        bytes.set(paraU8Array, 1);

        return bytes;
    }
}