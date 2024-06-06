const { invoke } = window.__TAURI__.tauri;
const { getMatches } = window.__TAURI__.cli;
const { platform, version } = window.__TAURI__.os;
const { exit } = window.__TAURI__.process;
const { appWindow, currentMonitor, LogicalPosition } = window.__TAURI__.window;

currentMonitor().then(async (currentMonitorResult) =>
{
	const windowScaleFactor = await appWindow.scaleFactor();
	const windowSize = await appWindow.outerSize();
	const newWindowPositionX = (currentMonitorResult.size.toLogical(windowScaleFactor).width - windowSize.toLogical(windowScaleFactor).width) / 2;
	const newWindowPositionY = currentMonitorResult.size.toLogical(windowScaleFactor).height - windowSize.toLogical(windowScaleFactor).height - 47 - 16;
	appWindow.setPosition(new LogicalPosition(newWindowPositionX, newWindowPositionY));
});

const isDev = true;
var useTransparentDesign = false;

platform().then(async (platformResult) =>
{
	const isWin = platformResult === 'win32';
	const OSVersion = await version();

	const sysVer = OSVersion.split('.');
	useTransparentDesign = isWin && parseInt(sysVer[2], 10) >= 22621;
	if (useTransparentDesign) invoke("winacrylic", appWindow);
});

const trackName = document.querySelector(".track-name");
const trackControlsPause = document.querySelector(".track-controls-pause");
const timeTexts = document.querySelector(".time-texts");
const timeText1 = document.querySelector("#time-text-1");
const timeText2 = document.querySelector("#time-text-2");
const trackTimelineFront = document.querySelector(".track-timeline-front");
const timelineHandle = document.querySelector(".track-timeline-handle-visual");
const musicPlayer = document.querySelector('#music');
const equalizerBarFronts = document.querySelectorAll(".equalizer-bar-front");
const equalizerBarHandles = document.querySelectorAll(".equalizer-bar-handle-visual");

var inputs;
var settings = 'accentColor 10\neq 0/0/0/0/0/0/0/0/0/0';
var additionalDataFilePath = "";
var canTransitionBetweenPages = true;

getMatches().then((matches) =>
{
	if (matches.args.length >= 2) additionalDataFilePath = matches.args[1];

	console.log(additionalDataFilePath);
});

if (!isDev && (additionalDataFilePath == "." || additionalDataFilePath == "" || additionalDataFilePath == " " || !isExtensionSupported())) exit(0);

function isExtensionSupported()
{
	const exts = [ "mp3", "wav", "weba", "webm", "m4a", "ogg", "oga", "caf", "flac", "opus", "mid", "aiff", "wma", "au" ];
	return exts.includes(additionalDataFilePath.split('.').slice(-1).toString().toLowerCase());
}

document.addEventListener("DOMContentLoaded", () =>
{
	document.getElementById('minimizeAppBtn').addEventListener("click", () => { appWindow.minimize(); });
	document.getElementById('closeAppBtn').addEventListener("click", () => { exit(0); });

	trackTimelineFront.addEventListener("input", (e) =>
	{
		if (!isMusicSourceNull())
		{
			musicPlayer.currentTime = e.target.value;
			if (musicPlayer.duration - musicPlayer.currentTime < 1) musicPlayer.play();
			setTimelineHandlePosition();
			setTimeText(1);
		}
	});
	
	trackTimelineFront.addEventListener("mouseenter", () =>
	{
		if (!isMusicSourceNull())
		{
			timeTexts.classList.add('time-texts-hovered');
			timelineHandle.classList.add('track-timeline-handle-visual-hovered');
		}
	});
	
	trackTimelineFront.addEventListener("mouseleave", () =>
	{
		if (!isMusicSourceNull())
		{
			timeTexts.classList.remove('time-texts-hovered');
			timelineHandle.classList.remove('track-timeline-handle-visual-hovered');
		}
	});

	musicPlayer.addEventListener('loadeddata', () =>
	{
		trackTimelineFront.max = Math.floor(musicPlayer.duration);
		setTimelineValue();
		setTimeText(1);
		setTimeText(2);
		play(true);
	});
	
	musicPlayer.addEventListener("pause", () =>
	{
		pause(true);
		//window.bridge.sendPlayPauseToMain(musicPlayer.paused);
	});

	musicPlayer.addEventListener("play", () =>
	{
		play(true);
		//window.bridge.sendPlayPauseToMain(musicPlayer.paused);
	});

	musicPlayer.addEventListener("ended", () =>
	{
		pause(true);
		//window.bridge.sendPlayPauseToMain(musicPlayer.paused);
	});

	equalize();
});

/* window.bridge.sendFilePath((event, filePath) =>
{
	playSelectedFile(filePath);
});

window.bridge.windowFocused((event, isFocused) =>
{
	document.querySelector('.main-gradient').style.opacity = isFocused ? 0.5 : 0.85;
	const temp = isFocused ? "transparent);" : "var(--clr-background));";
	document.querySelector('.main-gradient').style.background = "linear-gradient(to top, var(--clr-accent), " + temp;
});

window.bridge.sendSettingsToRenderer((event, data) =>
{
	if (data !== null && data.trim() != '') settings = data;

	var colorIndex = parseInt(settings.split('\n')[0].split(' ')[1], 10);
	if (colorIndex === null || colorIndex === undefined) colorIndex = 10;
	changeAccentColor(colorIndex, null, false);

	var eq = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	var temp = settings.split('\n')[1].split(' ')[1];
	for (var i = 0; i < eq.length; i++)
	{
		eq[i] = parseFloat(temp.split('/')[i]);
		if (eq[i] === null || eq[i] === undefined) eq[i] = 0;
	}
	setEQ(eq, false);
});

window.bridge.sendPlayPauseToRenderer((event, data) =>
{
	playPause(false);
});

window.bridge.sendSkipBackToRenderer((event, data) =>
{
	skipBack();
});

window.bridge.sendSkipForwardToRenderer((event, data) =>
{
	skipForward();
}); */

function setTimelineValue()
{
	trackTimelineFront.value = musicPlayer.currentTime;
	setTimelineHandlePosition();
}

function setTimelineHandlePosition()
{
	var handlePosition = trackTimelineFront.offsetWidth * remap(trackTimelineFront.value, 0, Math.floor(musicPlayer.duration), 0, 1) * 0.975;
	timelineHandle.style.left = handlePosition + 'px';
}

//var context = window.AudioContext;
var context = new AudioContext();
var filters;
const frequencies = [30, 125, 250, 500, 1000, 2000, 4000, 8000, 12000, 16000];

var createFilter = function(frequency)
{
	var filter = context.createBiquadFilter();

	if (frequency == frequencies[0]) filter.type = 'lowshelf';
	else if (frequency == frequencies[frequencies.length - 1]) filter.type = 'highshelf';
	else filter.type = 'peaking';

	filter.frequency.value = frequency;
	filter.Q.value = 0.75;
	filter.gain.value = 0;

	return filter;
}

function equalize()
{
	var source = context.createMediaElementSource(musicPlayer);
	filters = frequencies.map(createFilter);

	for (var i = 0; i < filters.length - 1; i++)
		filters[i].connect(filters[i + 1]);

	source.connect(filters[0]);
	filters[filters.length - 1].connect(context.destination);

	inputs = document.querySelectorAll('.equalizer-bar-front');

	for (var i = 0; i < inputs.length; i++)
	{
		inputs[i].addEventListener('input', (e) =>
		{
			const index = Array.from(e.target.parentElement.parentElement.children).indexOf(e.target.parentElement);

			if (Math.abs(e.target.value) < 0.5) e.target.value = 0;
			filters[index].gain.value = e.target.value;
			setEqualizerBarHandlePosition(index);

			var data = settings.split('\n')[1].split(' ')[1].split('/');
			data[index] = e.target.value;
			changeSetting(1, data.join('/'), true);
		}, false);
	}
}

function setEqualizerBarHandlePosition(index)
{
	var handlePosition = remap(equalizerBarFronts[index].value, equalizerBarFronts[index].min, equalizerBarFronts[index].max, 104, 0) * 0.925;
	equalizerBarHandles[index].style.top = handlePosition + 'px';
}

function setEQ(values, saveToSettings = true)
{
	if (values.length != filters.length) values = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

	for (var i = 0; i < filters.length; i++)
	{
		filters[i].gain.value = values[i];
		inputs[i].value = values[i];
		setEqualizerBarHandlePosition(i);
	}

	changeSetting(1, values.join('/'), saveToSettings);
}

function playSelectedFile(filePath)
{
	musicPlayer.src = filePath;
	play();
	setTrackNameText(filePath);

	setInterval(() =>
	{
		if (!musicPlayer.paused)
		{
			setTimelineValue();
			setTimeText(1);
			if (musicPlayer.duration - musicPlayer.currentTime <= 1) pause(true);
		}
	}, 100);
}

function playPause(sendToMain = true)
{
	if (!isMusicSourceNull())
	{
		setTimelineValue();
		setTimeText(1);

		if (musicPlayer.paused) play();
		else pause();

		if (sendToMain) window.bridge.sendPlayPauseToMain(musicPlayer.paused);
	}
}

function play(isOnlyVisual = false)
{
	trackControlsPause.children[0].src = "./assets/pause.png";
	if (!isOnlyVisual) musicPlayer.play();
}

function pause(isOnlyVisual = false)
{
	trackControlsPause.children[0].src = "./assets/play.png";
	if (!isOnlyVisual) musicPlayer.pause();
}

function skipBack()
{
	if (!isMusicSourceNull())
	{
		musicPlayer.currentTime = 0;
		setTimelineValue();
		setTimeText(1);
	}
}

function skipForward()
{
	if (!isMusicSourceNull())
	{
		musicPlayer.currentTime = musicPlayer.duration;
		if (musicPlayer.duration - musicPlayer.currentTime < 1) musicPlayer.play();
		setTimelineValue();
		setTimeText(1);
	}
}

function setTrackNameText(filePath)
{
	pathSep = '';
	if (filePath.includes('\\')) pathSep = '\\';
	if (filePath.includes('/')) pathSep = '/';
	trackName.textContent = pathSep != '' ? filePath.split(pathSep)[filePath.split(pathSep).length - 1] : filePath;
}

function setTimeText(index)
{
	var time = index == 1 ? musicPlayer.currentTime : musicPlayer.duration;

	var hours = String(Math.floor(time / 60 / 60));
	var minutes = String(Math.floor(time / 60 % 60));
	var seconds = String(Math.floor(time % 60));

	if (minutes.length < 2) minutes = '0' + minutes;
	if (seconds.length < 2) seconds = '0' + seconds;

	var textElm = index == 1 ? timeText1 : timeText2;
	textElm.textContent = (hours == '0' ? '' : (hours + ":")) + minutes + ":" + seconds;
}

function getCurrentPageIndex()
{
	const pages = document.querySelectorAll('.content-container');

	for (var i = 0; i < pages.length; i++)
	{
		if (parseFloat(pages[i].style.opacity) > 0.9) return i;
	}

	return 0;
}

function openPage(nextPageIndex)
{
	if (!canTransitionBetweenPages) return;
	const prevPageIndex = getCurrentPageIndex();
	if (prevPageIndex == nextPageIndex) return;
	canTransitionBetweenPages = false;

	var prevPageName = '.page-';
	var nextPageName = '.page-';

	const pageNames = ['main', 'settings', 'equalizer'];

	prevPageName += pageNames[prevPageIndex];
	nextPageName += pageNames[nextPageIndex];

	document.querySelector(prevPageName).style.opacity = '0';
	document.querySelector(prevPageName).style.transform = 'scale(0.9)';
	document.querySelector(prevPageName).style.pointerEvents = 'none';
	document.querySelector(prevPageName).style.zIndex = '-1';

	document.querySelector(nextPageName).style.opacity = '1';
	document.querySelector(nextPageName).style.transform = 'scale(1)';
	document.querySelector(nextPageName).style.zIndex = '0';

	setTimeout(() =>
	{
		document.querySelector(prevPageName).style.transform = 'scale(1.1)';
		document.querySelector(nextPageName).style.pointerEvents = 'all';
		canTransitionBetweenPages = true;
	}, 200);
}

function changeAccentColor(index, sender, saveToSettings = true)
{
	if (1 <= index <= 12)
	{
		document.documentElement.style.setProperty("--clr-accent", "var(--clr-template-" + index.toString() + ")");

		if (sender === null) sender = document.querySelector('.settings-params-accentcolors').children[index - 1];

		for (var i = 0; i < sender.parentElement.children.length; i++)
			sender.parentElement.children[i].style.outline = "2px solid var(--clr-white-transparent-50)";

		sender.style.outline = "2px solid rgba(255, 255, 255, 1)";

		changeSetting(0, index.toString(), saveToSettings);
	}
}

function changeSetting(settingIndex, settingValue, saveToSettings = true)
{
	var _settings = settings.split('\n');

	var settingName;

	switch (settingIndex)
	{
		case 0:
			settingName = 'accentColor';
			break;

		case 1:
			settingName = 'eq';
			break;
	}

	_settings[settingIndex] = settingName + ' ' + settingValue;

	settings = _settings.join('\n');
	if (saveToSettings) window.bridge.sendSettings(settings);
}

function remap(value, low1, high1, low2, high2) { return low2 + (high2 - low2) * (value - low1) / (high1 - low1); }
function isMusicSourceNull() { return musicPlayer.src === null || musicPlayer.src.trim() == ''; }