const path = require('path');
const { app, BrowserWindow, Menu } = require('electron');

var additionalDataFilePath = "";

if (process.argv.length >= 2)
	additionalDataFilePath = process.argv[1];

/* if (process.platform === 'linux')
	additionalDataFilePath = additionalDataFilePath.replaceAll("\\", "/"); */

const isSingleInstance = app.requestSingleInstanceLock(additionalDataFilePath);

//runs on second instance
if (!isSingleInstance)
	app.exit(0);

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

var mainWindow;

process.env.NODE_ENV = 'production';

const isDev = process.env.NODE_ENV !== 'production';
const isMac = process.platform === 'darwin';
const useTransparentDesign = false;

//create the main window
function createMainWindow()
{
	if (useTransparentDesign)
	{
		mainWindow = new BrowserWindow(
		{
			title: 'Harmoonic',
			x: 8,
			y: 8,
			width: isDev ? 1000 : 400,
			height: isDev ? 700 : 200,
			center: false,
			titleBarStyle: 'hidden',
			/* titleBarOverlay: true, */
			titleBarOverlay:
			{
				color: '#0000',
				symbolColor: '#ffffff64',
				height: 20,
			},
			maximizable: false,
			fullscreenable: false,
			resizable: false,
			backgroundColor: '#0000',
			backgroundMaterial: 'acrylic',
			transparent: true,
			thickFrame: false,
			//opacity: 0.75,
			frame: false,
			webPreferences:
			{
				nodeIntegration: true,
				contextIsolation: true,
				preload: path.join(__dirname, './preload.js')
			}
		});

		const [w, h] = mainWindow.getSize();
		mainWindow.setSize(w + 1, h);
		mainWindow.setSize(w, h);
		mainWindow.setContentProtection(true);
	}
	else //normal design
	{
		mainWindow = new BrowserWindow(
		{
			title: 'Harmoonic',
			x: 8,
			y: 8,
			width: isDev ? 1000 : 400,
			height: isDev ? 700 : 200,
			center: false,
			titleBarStyle: 'hidden',
			/* titleBarOverlay: true, */
			titleBarOverlay:
			{
				color: '#0000',
				symbolColor: '#ffffff64',
				height: 20,
			},
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
	}

	//open devtools if in dev env
	if (isDev) mainWindow.webContents.openDevTools();

	var filePath = "";

	if (process.argv.length >= 2)
		filePath = process.argv[1];

	/* filePath = filePath.replaceAll("\\", "/"); */

	mainWindow.loadFile(path.join(__dirname, './renderer/index.html')).then(() =>
		{
			mainWindow.webContents.send('sendFilePath', filePath);
		}).then(() =>
		{
			mainWindow.show();
		});
}

//app is ready
app.whenReady().then(() =>
{
	if (!mainWindow)
	{
		createMainWindow();

		//implement menu
		const mainMenu = Menu.buildFromTemplate(menu);
		Menu.setApplicationMenu(mainMenu);

		app.on('activate', () =>
		{
			if (BrowserWindow.getAllWindows().length === 0)
				createMainWindow();
		});
	}
});

//menu template
const menu = [];

app.on('window-all-closed', () =>
{
	if (!isMac) app.quit();
});

/*app.on('render-process-gone', (event, details) =>
{
	app.exit();
}

process.on('uncaughtException', (error) =>
{
	// Handle the error
}*/