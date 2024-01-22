const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld(
	//Allowed 'ipcRenderer' methods
	'bridge', {
		//From main to renderer
		sendFilePath: (message) =>
		{
			ipcRenderer.on('sendFilePath', message);
		}
	}
);