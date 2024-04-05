const { contextBridge, ipcRenderer, ipcMain } = require('electron');

contextBridge.exposeInMainWorld(
	//Allowed 'ipcRenderer' methods
	'bridge',
	{
		//From main to renderer
		sendFilePath: (message) =>
		{
			ipcRenderer.on('sendFilePath', message);
		},
		windowFocused: (data) =>
		{
			ipcRenderer.on('windowFocused', data);
		},
		sendSettings: (data) =>
		{
			ipcRenderer.send('sendSettings', data);
		},
		sendSettingsToRenderer: (data) =>
		{
			ipcRenderer.on('sendSettingsToRenderer', data);
		}
	}
);