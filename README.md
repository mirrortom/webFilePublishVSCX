# WebFilePublishVSCX for vscode
razor页面生成插件vscode版本.  
前端项目使用vscode比较好,插件丰富,启动也比VS快.所以就开发了vscode版本.
## 差异
和vs插件一样,使用的是同一个服务,插件端的任务也是收集参数调用服务完成任务.就是将C#版本用TS实现了.

没有实现的功能: 当用鼠标左键选中资源管理器的文件或者目录后,必须使用右键菜单执行命令,如果用快捷键则无效,因为没有找到API.

支持一个workspace,而不是多个.所有操作都在第一个workspace的目录上进行.这点和VS的解决方案可以有多个项目不同.相当于只有一个项目,但多数情况下,一个项目一个根文件夹够用了.

默认的忽略文件增加了几个,比如package.json,tsconfig.json这些都是node/ts项目的配置文件,用TS的项目会有这些.

### 用到的工具和库
按照文档介绍的方式建立项目.  
主要工具和库:   
node/ts,yeoman,generator-code  
[promise-socket](https://github.com/dex4er/js-promise-socket) , 
[json5](https://github.com/json5/json5)

[vscode开发官方文档](https://code.visualstudio.com/api/working-with-extensions/publishing-extension
)