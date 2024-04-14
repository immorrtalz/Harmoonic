const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld(
	'bridge',
	{
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
		},
		minimizeApp: () =>
		{
			ipcRenderer.send('minimizeApp');
		},
		closeApp: () =>
		{
			ipcRenderer.send('closeApp');
		},
		sendPlayPauseToRenderer: (data) =>
		{
			ipcRenderer.on('sendPlayPauseToRenderer', data);
		},
		sendSkipBackToRenderer: (data) =>
		{
			ipcRenderer.on('sendSkipBackToRenderer', data);
		},
		sendSkipForwardToRenderer: (data) =>
		{
			ipcRenderer.on('sendSkipForwardToRenderer', data);
		},
		sendPlayPauseToMain: (isPause) =>
		{
			ipcRenderer.send('sendPlayPauseToMain', isPause);
		}
	}
);