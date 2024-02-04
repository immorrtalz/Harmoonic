const path = require('path');
const { app, BrowserWindow, Menu, screen } = require('electron');

var additionalDataFilePath = "";

if (process.argv.length >= 2)
	additionalDataFilePath = process.argv[1];

/* if (additionalDataFilePath == "." || additionalDataFilePath == "" || additionalDataFilePath == " ")
	app.exit(0); */

//TODO: exit if file extension/format isn't supported

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
const isWin = process.platform === 'win32';
const isMac = process.platform === 'darwin'; //technically the app can be built for MacOS and Linux, but they're NOT supported by me

var useTransparentDesign = false;

if (isWin)
{
	const sysVer = require('os').release().split('.');
	useTransparentDesign = sysVer.slice(-1) > 22621;
}

//create the main window
function createMainWindow()
{
	const windowWidth = isDev ? 1000 : 400;
	const windowHeight = isDev ? 700 : 200;

	mainWindow = new BrowserWindow(
	{
		title: 'Harmoonic',
		x: (screen.getPrimaryDisplay().workAreaSize.width - windowWidth) / 2,
		y: screen.getPrimaryDisplay().workAreaSize.height - windowHeight - 16,
		width: windowWidth,
		height: windowHeight,
		center: false,
		titleBarStyle: 'hidden',
		titleBarOverlay:
		{
			color: '#0000',
			symbolColor: '#ffffff64',
			height: 20,
		},
		backgroundColor: '#0000',
		backgroundMaterial: 'acrylic',//if using a function below, the window glitches
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

	if (useTransparentDesign)
	{
		//mainWindow.setBackgroundColor('#0000');
		//mainWindow.setBackgroundMaterial('acrylic');
	}

	//open devtools if in dev env
	if (isDev) mainWindow.webContents.openDevTools();

	var filePath = "";

	if (process.argv.length >= 2)
		filePath = process.argv[1];

	mainWindow.loadFile(path.join(__dirname, './renderer/index.html')).then(() =>
		{
			mainWindow.webContents.send('sendFilePath', filePath);
		}).then(() =>
		{
			mainWindow.show();
		});
}

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

//menu template (the app doesn't have menu by a concept)
const menu = [];

app.on('window-all-closed', () =>
{
	if (!isMac) app.quit();
});

//add errors catcher to prevent the app from crashing
/*app.on('render-process-gone', (event, details) =>
{
	app.exit();
}

process.on('uncaughtException', (error) =>
{
	// Handle the error
}*/