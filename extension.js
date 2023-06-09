// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs=require("fs");
var axios = require('axios');

// Supported Languages
var langs=["cpp","c","py","java"]

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "codeonline" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('codeonline.run', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Running code in online compiler...');

		// Get the required file paths
		var currentlyOpenFile = vscode.window.activeTextEditor?.document.uri.fsPath;
		var inputFile = currentlyOpenFile.substring(0, currentlyOpenFile.lastIndexOf('\\'))+"\\input.txt";
		let outputFile = currentlyOpenFile.substring(0, currentlyOpenFile.lastIndexOf('.')) + '-output.txt';

		// Variable to store the code, language and custom inputs
		var content={
			"code":"",
			"language": "",
			"input":""
		}
		
		// Get language from file extension
		content["language"]=currentlyOpenFile.substring(currentlyOpenFile.lastIndexOf('.')+1);

		// Check if valid language
		if(!langs.includes(content["language"])){
			vscode.window.showInformationMessage('Error: Unsupported File/Language');
		}else{
			// Read code from current active file
			content["code"]=fs.readFileSync(currentlyOpenFile,{encoding:"utf-8"});

			// Read input from input.txt file
			if(fs.existsSync(inputFile)){
				content["input"]=fs.readFileSync(inputFile,{encoding:"utf-8"});
			}

			// Convert the data to JSON
			var data=JSON.stringify(content);

			// Configuration for API
			var config = {
				method: 'post',
				url: 'https://load-balancer-1l8h.onrender.com/compile',
				headers: { 
				'Content-Type': 'application/json'
				},
				data : data
			};
			
			// Making an axios request to the API with the JSON content
			axios(config)
			.then(function (response) {
				fs.writeFileSync(outputFile,response.data);
			})
			.catch(function (error) {
				// Message to user
			vscode.window.showInformationMessage(data);
				fs.writeFileSync(outputFile,error);
			});

			// Message to user
			vscode.window.showInformationMessage('Check the ', outputFile ,'file...');

		}
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
