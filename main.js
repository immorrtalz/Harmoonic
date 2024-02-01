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
const isMac = process.platform === 'darwin'; //technically the app can be ran on MacOS, but officially it's NOT supported for now. You CAN try to use the app on MacOS if you want
const useTransparentDesign = true; //idk if this will be implemented cuz there are some Electron issues with Windows' transparent materials

//create the main window
function createMainWindow()
{
	const screenWidth = screen.getPrimaryDisplay().workAreaSize.width;
	const screenHeight = screen.getPrimaryDisplay().workAreaSize.height;

	var windowWidth = isDev ? 1000 : 400;
	var windowHeight = isDev ? 700 : 200;

	if (useTransparentDesign) //ADD WIN VER CHECK cuz backgroundMaterial doesn't work everywhere
	{
		mainWindow = new BrowserWindow(
		{
			title: 'Harmoonic',
			x: (screenWidth - windowWidth) / 2,
			y: screenHeight - windowHeight - 16,
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
			maximizable: false,
			fullscreenable: false,
			resizable: false,
			backgroundColor: '#0000',
			backgroundMaterial: 'acrylic',
			/* transparent: true,
			thickFrame: false,
			frame: false, */
			webPreferences:
			{
				nodeIntegration: true,
				contextIsolation: true,
				preload: path.join(__dirname, './preload.js')
			}
		});
	}
	else //normal design
	{
		mainWindow = new BrowserWindow(
		{
			title: 'Harmoonic',
			x: (screenWidth - windowWidth) / 2,
			y: screenHeight - windowHeight - 16,
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

		/* for (var i = 0; i < process.argv.length; i++)
		{
			console.log(process.argv[i]); //TODO: tracks queue
		} */
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