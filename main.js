const path = require('path');
const fs = require('fs');
const { app, BrowserWindow, Menu, ipcMain, screen } = require('electron');

var additionalDataFilePath = "";

if (process.argv.length >= 2)
	additionalDataFilePath = process.argv[1];

process.env.NODE_ENV = 'production';

const isDev = process.env.NODE_ENV !== 'production';
const isWin = process.platform === 'win32';
const isMac = process.platform === 'darwin';

var useTransparentDesign = false;

if (isWin)
{
	const sysVer = require('os').release().split('.');
	useTransparentDesign = sysVer.slice(-1) > 22621;
}

if (!isDev && (additionalDataFilePath == "." || additionalDataFilePath == "" || additionalDataFilePath == " " || !isExtensionSupported())) app.exit(0);

function isExtensionSupported()
{
	const exts = [ "mp3", "wav", "weba", "webm", "m4a", "ogg", "oga", "caf", "flac", "opus", "mid", "aiff", "wma", "au" ];
	return exts.includes(additionalDataFilePath.split('.').slice(-1).toString().toLowerCase());
}

const isSingleInstance = app.requestSingleInstanceLock(additionalDataFilePath);

//runs on second instance
if (!isSingleInstance) app.exit(0);

var mainWindow;

//runs on main instance
app.on('second-instance', (event, commandLine, workingDirectory, additionalData) =>
{
	if (mainWindow)
	{
		if (mainWindow.isMinimized()) mainWindow.restore();
		mainWindow.webContents.send('sendFilePath', additionalData);
		mainWindow.focus();
	}
});

//create the main window
function createMainWindow()
{
	const windowWidth = isDev ? 1000 : 400;
	const windowHeight = isDev ? 700 : 200;
	const workAreaSize = screen.getPrimaryDisplay().workAreaSize;

	mainWindow = new BrowserWindow(
	{
		title: 'Harmoonic',
		x: (workAreaSize.width - windowWidth) / 2,
		y: workAreaSize.height - windowHeight - 16,
		width: windowWidth,
		height: windowHeight,
		center: false,
		titleBarStyle: 'hidden',
		backgroundColor: useTransparentDesign ? '#0000' : '#101015',
		backgroundMaterial: useTransparentDesign ? 'acrylic' : 'none',
		maximizable: false,
		fullscreenable: false,
		resizable: false,
		webPreferences:
		{
			nodeIntegration: true,
			contextIsolation: true,
			preload: path.join(__dirname, './preload.js')
		}
	});

	//open devtools if in dev env
	if (isDev) mainWindow.webContents.openDevTools();

	mainWindow.loadFile(path.join(__dirname, './renderer/index.html')).then(() =>
	{
		mainWindow.webContents.send('sendFilePath', process.argv.length >= 2 ? process.argv[1] : '');
	}).then(() =>
	{
		mainWindow.show();

		var thumbarButtons1 = [
		{
			icon: path.join(__dirname, './renderer/images/thumbarButtons/skipback.png'),
			click: () => { mainWindow.webContents.send('sendSkipBackToRenderer', ''); }
		},
		{
			icon: path.join(__dirname, './renderer/images/thumbarButtons/pause.png'),
			click: () =>
			{
				mainWindow.webContents.send('sendPlayPauseToRenderer');
				mainWindow.setThumbarButtons(thumbarButtons2);
			}
		},
		{
			icon: path.join(__dirname, './renderer/images/thumbarButtons/skipforward.png'),
			click: () =>
			{
				mainWindow.webContents.send('sendSkipForwardToRenderer', '');
				mainWindow.setThumbarButtons(thumbarButtons2);
			}
		}];

		var thumbarButtons2 = [
		{
			icon: path.join(__dirname, './renderer/images/thumbarButtons/skipback.png'),
			click: () => { mainWindow.webContents.send('sendSkipBackToRenderer', ''); }
		},
		{
			icon: path.join(__dirname, './renderer/images/thumbarButtons/play.png'),
			click: () =>
			{
				mainWindow.webContents.send('sendPlayPauseToRenderer');
				mainWindow.setThumbarButtons(thumbarButtons1);
			}
		},
		{
			icon: path.join(__dirname, './renderer/images/thumbarButtons/skipforward.png'),
			click: () =>
			{
				mainWindow.webContents.send('sendSkipForwardToRenderer', '');
				mainWindow.setThumbarButtons(thumbarButtons2);
			}
		}];

		mainWindow.setThumbarButtons(thumbarButtons1);

		ipcMain.on('sendPlayPauseToMain', (event, isPause) =>
		{
			if (isPause) mainWindow.setThumbarButtons(thumbarButtons2);
			else mainWindow.setThumbarButtons(thumbarButtons1);
		});
	});
}

app.whenReady().then(() =>
{
	if (!mainWindow)
	{
		const settingsFilePath = path.join(app.getPath('userData'), "settings.txt");

		ipcMain.on('sendSettings', (event, data) =>
		{
			try { fs.writeFileSync(settingsFilePath, data, 'utf-8'); }
			catch (e) { /* TODO: error message "Failed to save settings file" */ }
		});

		ipcMain.on('minimizeApp', (event) => { mainWindow.minimize(); });
		ipcMain.on('closeApp', (event) => { app.exit(0); });

		createMainWindow();

		//implement menu
		Menu.setApplicationMenu(Menu.buildFromTemplate([]));

		app.on('activate', () =>
		{
			if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
		});

		var settingsData = '';
		if (fs.existsSync(settingsFilePath)) settingsData = fs.readFileSync(settingsFilePath, { encoding: 'utf-8', flag: 'r' });

		mainWindow.webContents.on('did-finish-load', () =>
		{
			mainWindow.webContents.send('sendSettingsToRenderer', settingsData);
		});

		/* for (var i = 0; i < process.argv.length; i++)
		{
			console.log(process.argv[i]); //TODO: tracks queue
		} */
	}
});

app.on('browser-window-blur', () =>
{
	if (useTransparentDesign) mainWindow.webContents.send('windowFocused', false);
});

app.on('browser-window-focus', () =>
{
	if (useTransparentDesign) mainWindow.webContents.send('windowFocused', true);
});

app.on('window-all-closed', () =>
{
	if (!isMac) app.quit();
});

process.on('uncaughtException', (error) => console.log(error) );
app.on('render-process-gone', (event, details) => app.exit(0));