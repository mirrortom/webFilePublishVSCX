// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import fs from 'fs/promises';
import Path from 'path';

import { EnvVar } from './helpers/EnvVar';
import { CmdTypes } from './helpers/EnvVar';
import CmdContext from './publish/CmdContext';
import VscOutPutWindow from './helpers/OutPutInfo';
import { getDefaultHighWaterMark } from 'stream';
import { env } from 'process';
import ProjectHelpers from './helpers/ProjectHelpers';
import Publisher from './publish/Publisher';


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// 获取工作区根目录,置于全局变量
	EnvVar.wsDir = ProjectHelpers.GetActiveProjectRootDir();

	// 在此方法内注册4个命令 PublishActiveFile/PublishDir/PublishFile/PublishWeb

	// 1.PublishActiveFile 发布当前编辑的文件
	const disposable1 = vscode.commands.registerCommand('cmd.PublishActiveFile', async () => {
		// 执行任务
		await new Publisher(CmdTypes.PublishActiveFile).RunAsync();
	});

	// 2.PublishDir (发布选中的目录,只能用右键菜单,按快捷键无效)
	const disposable2 = vscode.commands.registerCommand('cmd.PublishDir',
		async (contextSelection: vscode.Uri, allSelections: vscode.Uri[]) => {
			if (allSelections) {
				let selectedItems: string[] = [];
				for (let index = 0; index < allSelections.length; index++) {
					selectedItems.push(allSelections[index].fsPath)
					//console.log(index + ' :' + item.fsPath);
				}
				// 执行任务
				await new Publisher(CmdTypes.PublishDir, selectedItems).RunAsync();
			} else {
				VscOutPutWindow('没有找到选中的目录.(尝试使用右键菜单)!', true);
			}
		});

	// 3.PublishFile (发布选中的文件,只能用右键菜单,按快捷键无效)
	const disposable3 = vscode.commands.registerCommand('cmd.PublishFile',
		async (contextSelection: vscode.Uri, allSelections: vscode.Uri[]) => {
			if (allSelections) {
				let selectedItems: string[] = [];
				for (let index = 0; index < allSelections.length; index++) {
					selectedItems.push(allSelections[index].fsPath)
					//console.log(index + ' :' + item.fsPath);
				}
				// 执行任务
				await new Publisher(CmdTypes.PublishFile, selectedItems).RunAsync();
			} else {
				VscOutPutWindow('没有找到选中的文件.(尝试使用右键菜单)!', true);
			}
		});

	// 4.PublishWeb 发布整个工作区
	const disposable4 = vscode.commands.registerCommand('cmd.PublishWeb', async () => {
		// 执行任务
		await new Publisher(CmdTypes.PublishWeb).RunAsync();
	});

	//
	context.subscriptions.push(disposable1, disposable2, disposable3, disposable4);
}

// This method is called when your extension is deactivated
export function deactivate() { }
