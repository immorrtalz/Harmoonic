const trackName = document.querySelector(".track-name");
const trackControlsPause = document.querySelector(".track-controls-pause");
const timeTexts = document.querySelector(".time-texts");
const timeText1 = document.querySelector("#time-text-1");
const timeText2 = document.querySelector("#time-text-2");
const trackTimelineFront = document.querySelector(".track-timeline-front");
const timelineHandle = document.querySelector(".track-timeline-handle-visual");
const musicPlayer = document.querySelector('#music');
//const inputNode = document.querySelector('#music-select');

trackTimelineFront.addEventListener("input", (e) =>
	{
		if (!isMusicSourceNull())
		{
			musicPlayer.currentTime = e.target.value;
			setTimelineHandlePosition();
		}
	})

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

function remap(value, low1, high1, low2, high2)
{
	return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

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

musicPlayer.addEventListener('loadedmetadata', () =>
	{
		trackTimelineFront.max = Math.floor(musicPlayer.duration);
		setTimelineValue();
		setTimeText1();
		setTimeText2();
		play(true);
	});

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
			setTimeText1();
		}
	}, 100);
}

var canTransitionBetweenPages = true;

function openPage(nextPageIndex)
{
	if (!canTransitionBetweenPages) return;
	canTransitionBetweenPages = false;

	switch (nextPageIndex)
	{
		case 0: //settings
			document.querySelector('.page-main').style.opacity = '0';
			document.querySelector('.page-main').style.transform = 'scale(0.9)';
			document.querySelector('.page-main').style.pointerEvents = 'none';

			document.querySelector('.page-settings').style.opacity = '1';
			document.querySelector('.page-settings').style.transform = 'scale(1)';
			document.querySelector('.page-settings').style.pointerEvents = 'all';

			setTimeout(() =>
			{
				document.querySelector('.page-main').style.transform = 'scale(1.1)';
				canTransitionBetweenPages = true;
			}, 200);
			break;

		case 1: //equalizer
			break;
	}
}

function goBack(currentPageIndex)
{
	if (!canTransitionBetweenPages) return;
	canTransitionBetweenPages = false;

	switch (currentPageIndex)
	{
		case 0: //settings
			document.querySelector('.page-settings').style.opacity = '0';
			document.querySelector('.page-settings').style.transform = 'scale(0.9)';
			document.querySelector('.page-settings').style.pointerEvents = 'none';

			document.querySelector('.page-main').style.opacity = '1';
			document.querySelector('.page-main').style.transform = 'scale(1)';
			document.querySelector('.page-main').style.pointerEvents = 'all';

			setTimeout(() =>
			{
				document.querySelector('.page-settings').style.transform = 'scale(1.1)';
				canTransitionBetweenPages = true;
			}, 200);
			break;

		case 1: //equalizer
			break;
	}
}

function changeAccentColor(index, sender, saveToSettings = true)
{
	if (0 < index < 13)
	{
		document.documentElement.style.setProperty("--clr-accent", "var(--clr-template-" + index.toString() + ")");

		if (sender === null) sender = document.querySelector('.settings-params-accentcolors').children[index - 1];

		for (var i = 0; i < sender.parentElement.children.length; i++)
			sender.parentElement.children[i].style.outline = "2px solid var(--clr-white-transparent-50)";

		sender.style.outline = "2px solid rgba(255, 255, 255, 1)";

		if (saveToSettings)
		{
			var settings = new Settings(index);
			window.bridge.sendSettings(JSON.stringify(settings, undefined, 3));
		}
	}
}

window.bridge.sendSettingsToRenderer((event, data) =>
{
	var settings = JSON.parse(data); //Object.assign(new Settings, data);
	changeAccentColor(settings.accentColor, null, false);
});

class Settings
{
	constructor(_accentColor)
	{
		this.accentColor = _accentColor;
	}
}

function playPause()
{
	if (!isMusicSourceNull())
	{
		setTimelineValue();
		setTimeText1();

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
		setTimeText1();
	}
}

function skipForward()
{
	if (!isMusicSourceNull())
	{
		musicPlayer.currentTime = musicPlayer.duration;
		setTimelineValue();
		setTimeText1();
		pause(true);
	}
}

function isMusicSourceNull()
{
	return musicPlayer.src === "" || musicPlayer.src === null;
}

function setTrackNameText(filePath)
{
	pathSep = '';
	if (filePath.includes('\\')) pathSep = '\\';
	if (filePath.includes('/')) pathSep = '/';
	fPath = pathSep != '' ? filePath.split(pathSep)[filePath.split(pathSep).length - 1] : filePath;
	trackName.textContent = fPath;
}

function setTimeText1()
{
	var hours = String(Math.floor(musicPlayer.currentTime / 3600));
	var minutes = String(Math.floor(musicPlayer.currentTime % 3600 / 60));
	var seconds = String(Math.floor(musicPlayer.currentTime % 3600 % 60));

	if (minutes.length < 2) minutes = '0' + minutes;
	if (seconds.length < 2) seconds = '0' + seconds;

	if (musicPlayer.currentTime / 60 < 60) timeText1.textContent = minutes + ":" + seconds;
	else timeText1.textContent = hours + ":" + minutes + ":" + seconds;
}

function setTimeText2()
{
	var hours = String(Math.floor(musicPlayer.duration / 3600));
	var minutes = String(Math.floor(musicPlayer.duration % 3600 / 60));
	var seconds = String(Math.floor(musicPlayer.duration % 3600 % 60));

	if (minutes.length < 2) minutes = '0' + minutes;
	if (seconds.length < 2) seconds = '0' + seconds;

	if (musicPlayer.duration / 60 < 60) timeText2.textContent = minutes + ":" + seconds;
	else timeText2.textContent = hours + ":" + minutes + ":" + seconds;
}