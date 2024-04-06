const trackName = document.querySelector(".track-name");
const trackControlsPause = document.querySelector(".track-controls-pause");
const timeTexts = document.querySelector(".time-texts");
const timeText1 = document.querySelector("#time-text-1");
const timeText2 = document.querySelector("#time-text-2");
const trackTimelineFront = document.querySelector(".track-timeline-front");
const timelineHandle = document.querySelector(".track-timeline-handle-visual");
const musicPlayer = document.querySelector('#music');
//const inputNode = document.querySelector('#music-select');

var settings = 'accentColor 10';

window.bridge.sendFilePath((event, filePath) =>
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
	const colorIndex = parseInt(settings.split('\n')[0].split(' ')[1], 10);
	if (colorIndex === null || colorIndex === undefined) colorIndex = 10;
	changeAccentColor(colorIndex, null, false);
});

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

musicPlayer.addEventListener('loadeddata', () =>
{
	trackTimelineFront.max = Math.floor(musicPlayer.duration);
	setTimelineValue();
	setTimeText(1);
	setTimeText(2);
	play(true);
});

musicPlayer.addEventListener("pause", (event) => pause(true));
musicPlayer.addEventListener("play", (event) => play(true));
musicPlayer.addEventListener("ended", (event) => pause(true));

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

function playPause()
{
	if (!isMusicSourceNull())
	{
		setTimelineValue();
		setTimeText(1);

		if (musicPlayer.paused) play();
		else pause();
	}
}

function play(isOnlyVisual = false)
{
	trackControlsPause.children[0].src = "images/pause.png";
	if (!isOnlyVisual) musicPlayer.play();
}

function pause(isOnlyVisual = false)
{
	trackControlsPause.children[0].src = "images/play.png";
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

var canTransitionBetweenPages = true;

function openPage(prevPageIndex, nextPageIndex)
{
	if (!canTransitionBetweenPages || prevPageIndex == nextPageIndex) return;
	canTransitionBetweenPages = false;

	var prevPageName = '.page-';
	var nextPageName = '.page-';

	const pageNames = ['main', 'settings', 'equalizer'];

	prevPageName += pageNames[prevPageIndex];
	nextPageName += pageNames[nextPageIndex];

	document.querySelector(prevPageName).style.opacity = '0';
	document.querySelector(prevPageName).style.transform = 'scale(0.9)';
	document.querySelector(prevPageName).style.pointerEvents = 'none';

	document.querySelector(nextPageName).style.opacity = '1';
	document.querySelector(nextPageName).style.transform = 'scale(1)';

	setTimeout(() =>
	{
		document.querySelector(prevPageName).style.transform = 'scale(1.1)';
		document.querySelector(nextPageName).style.pointerEvents = 'all';
		canTransitionBetweenPages = true;
	}, 200);
}

function minimizeApp()
{
	window.bridge.minimizeApp();
}

function closeApp()
{
	window.bridge.closeApp();
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

		changeSetting('accentColor', index.toString(), saveToSettings);
	}
}

function changeSetting(settingName, settingValue, saveToSettings = true)
{
	var _settings = settings.split('\n');
	_settings[0] = settingName + ' ' + settingValue;
	settings = _settings.join('\n');
	if (saveToSettings) window.bridge.sendSettings(settings);
}

function remap(value, low1, high1, low2, high2)
{
	return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

function isMusicSourceNull()
{
	return musicPlayer.src === null || musicPlayer.src.trim() == '';
}