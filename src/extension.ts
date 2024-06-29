// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';


import { EnvVar } from './helpers/EnvVar';
import ProjectHelpers from './helpers/ProjectHelpers';
import { regeCmds as regePublishCmds } from './publish/cmds';
import { regeFuns } from './functions/funs';


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// 获取工作区根目录,置于全局变量
	initForEnv();

	// ctrl+s事件注册:活动文档按
	// 在package.json也要设置,否则无效. "activationEvents" : ["workspaceContains:*"]
	regeFuns(context);

	// 注册4个命令 PublishActiveFile/PublishDir/PublishFile/PublishWeb
	regePublishCmds(context);
}

// This method is called when your extension is deactivated
export function deactivate() { }

/**
 * 一些全局的初始化工作
 */
function initForEnv() {
	// 获取工作区根目录,置于全局变量
	EnvVar.wsDir = ProjectHelpers.GetActiveProjectRootDir();
}