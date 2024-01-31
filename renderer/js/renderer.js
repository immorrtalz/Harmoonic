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

//inputNode.addEventListener('change', playSelectedFile, false);

window.bridge.sendFilePath((event, filePath) =>
{
	playSelectedFile(filePath);
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