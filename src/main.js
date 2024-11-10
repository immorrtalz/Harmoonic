const { invoke, convertFileSrc } = window.__TAURI__.tauri;
const { getMatches } = window.__TAURI__.cli;
const { platform, version } = window.__TAURI__.os;
const { exit } = window.__TAURI__.process;
const { appWindow, currentMonitor, PhysicalPosition } = window.__TAURI__.window;
const { appConfigDir, dataDir } = window.__TAURI__.path;
const { exists, createDir, readTextFile, writeTextFile } = window.__TAURI__.fs;
const { message, ask, open } = window.__TAURI__.dialog;
const { listen } = window.__TAURI__.event;
const { getVersion } = window.__TAURI__.app;
const shell_open = window.__TAURI__.shell.open;

const isDev = true;
const supportedExtensions = [ 'mp3', 'wav', 'weba', 'webm', 'm4a', 'ogg', 'oga', 'caf', 'flac', 'opus', 'mid', 'aiff', 'wma', 'au' ];

const mainGradient = document.querySelector('.main-gradient');
const noise = document.querySelector('.noise');
const allPages = document.querySelectorAll('.content-container');
const trackNameContainer = document.querySelector('.track-name-container');
const trackName = document.querySelector('.track-name');
const trackControlsPause = document.querySelector('.track-controls-pause');
const timeTexts = document.querySelector('.time-texts');
const timeText1 = document.querySelector('#time-text-1');
const timeText2 = document.querySelector('#time-text-2');
const trackTimelineFront = document.querySelector('.track-timeline-front');
const timelineHandle = document.querySelector('.track-timeline-handle-visual');
const musicPlayer = document.querySelector('#music');
const accentColorButtons = document.querySelectorAll('.settings-param-color');
const clearPlaylistOnNewFileCheckbox = document.getElementById('clearPlaylistOnNewFileCheckbox');
const enableShuffleByDefaultCheckbox = document.getElementById('enableShuffleByDefaultCheckbox');
const equalizerInputs = document.querySelectorAll('.equalizer-bar-front');
const equalizerBarHandles = document.querySelectorAll('.equalizer-bar-handle-visual');
const playlistTracksContainer = document.getElementById('playlistTracksContainer');
const shuffleBtn = document.getElementById('shuffleBtn')
const repeatBtn = document.getElementById('repeatBtn')

var playlist = [];
var currentTrackIndex = 0;
var EQContext = new AudioContext();
const EQFrequencies = [30, 125, 250, 500, 1000, 2000, 4000, 8000, 12000, 16000];
const EQFilters = EQFrequencies.map(createEQFilter);
var canTransitionBetweenPages = true;
var trackNameScrollTimeoutId;
var isPlayAfterTimelineValueChange = false;
var isTimelineValueInput = false;
var timelineValueInputTimeoutId;
var isShuffleEnabled = false;
var repeatState = 0;
var forceStartPaused = false;

class Settings
{
	accentColor = 16;
	eq;
	clearPlaylistOnNewFile = true;
	enableShuffleByDefault = false;

	constructor() { this.resetEQ(); }
	resetEQ() { this.eq = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]; }
}

const settings = new Settings();
var settingsFilePath = '';

appWindow.setTitle('Harmoonic');
musicPlayer.crossOrigin = 'anonymous';

//app entry point (sort of)
currentMonitor().then(async (currentMonitorResult) =>
{
	//set window position to center-bottom while it is invisible
	const windowSize = await appWindow.outerSize();
	const newWindowPositionX = (currentMonitorResult.size.width - windowSize.width) * 0.5;
	const newWindowPositionY = currentMonitorResult.size.height - windowSize.height - 47 - 16;
	appWindow.setPosition(new PhysicalPosition(newWindowPositionX, newWindowPositionY));
	await appWindow.show();

	//make window use acrylic background if it is supported on a current OS version (win11 build >=22621)
	const platformResult = await platform()
	if (platformResult !== 'win32') return;
	const OSVersion = await version();
	const sysVer = OSVersion.split('.');

	if (parseInt(sysVer[2], 10) >= 22621)
	{
		invoke('winacrylic', appWindow);
		await appWindow.onFocusChanged(({ payload: isFocused }) =>
		{
			mainGradient.style.opacity = isFocused ? '0.5' : '0.85';
			noise.style.opacity = isFocused ? '0.3' : '0.5';
		});
	}
	else mainGradient.style.opacity = '1';

	const matches = await getMatches().catch(() => { exit(0); });
	const filePath = matches.args.filePath.value;

	if (!isDev) await validateFilePath(filePath);
	addAudioFileToPlaylist(filePath);
	playAudioFile(playlist[currentTrackIndex]);

	await listen('single-instance', async (event) =>
	{
		const eventFilePath = event.payload.args[1];

		if (isFilePathOK(eventFilePath))
		{
			if (settings.clearPlaylistOnNewFile) clearPlaylist();
			addAudioFileToPlaylist(eventFilePath);

			if (settings.clearPlaylistOnNewFile)
			{
				playAudioFile(playlist[currentTrackIndex]);
				await appWindow.unminimize();
				await appWindow.setFocus();
			}
		}
	});

	await listen('tauri://file-drop', async (event) =>
	{
		const eventFilePaths = event.payload;

		for (var i = 0; i < eventFilePaths.length; i++)
		{
			if (isFilePathOK(eventFilePaths[i])) addAudioFileToPlaylist(eventFilePaths[i]);
		}
	});
});

//when the layout is loaded
document.addEventListener('DOMContentLoaded', async () =>
{
	document.addEventListener('contextmenu', (event) => event.preventDefault());

	initializeAccentColorButtons();
	initializeEQ();
	initializeClearPlaylistOnNewFileCheckbox();
	initializeEnableShuffleByDefaultCheckbox();
	await loadSettingsFromFile();

	const backBtns = document.querySelectorAll('.backBtn');
	for (var i = 0; i < backBtns.length; i++) backBtns[i].addEventListener('click', () => { openPage(0); });

	document.getElementById('openPlaylistBtn').addEventListener('click', () => { openPage(3); });
	document.getElementById('openEQBtn').addEventListener('click', () => { openPage(2); });
	document.getElementById('openSettingsBtn').addEventListener('click', () => { openPage(1); });
	document.getElementById('minimizeAppBtn').addEventListener('click', () => { appWindow.minimize(); });
	document.getElementById('closeAppBtn').addEventListener('click', () => { exit(0); });
	shuffleBtn.addEventListener('click', () => { switchShuffle(); });
	repeatBtn.addEventListener('click', () => { switchRepeat(); });
	document.getElementById('skipBackBtn').addEventListener('click', () => { skipBack(); });
	document.getElementById('playPauseBtn').addEventListener('click', () => { playPause(); });
	document.getElementById('skipForwardBtn').addEventListener('click', () => { skipForward(); });
	document.getElementById('resetEQBtn').addEventListener('click', () => { resetEQ(); });
	document.getElementById('addAudioFileToPlaylistBtn').addEventListener('click', () => { addAudioFilesToPlaylistViaOpenFile(); });
	document.getElementById('latestVersionLinkBtn').addEventListener('click', async () => { await shell_open('https://github.com/immorrtalz/Harmoonic/releases/latest'); });
	document.getElementById('gitHubLinkBtn').addEventListener('click', async () => { await shell_open('https://github.com/immorrtalz/Harmoonic'); });
	document.getElementById('devSiteLinkBtn').addEventListener('click', async () => { await shell_open('https://evermedia-project.ru'); });

	if (settings.enableShuffleByDefault) switchShuffle();
	document.getElementById('currentVersionText').textContent += await getVersion();

	trackTimelineFront.addEventListener('input', (e) =>
	{
		if (!isMusicSourceNull())
		{
			musicPlayer.currentTime = e.target.value;
			setTimelineHandlePosition();
			updateTimeText(1);
			if (!musicPlayer.paused) isPlayAfterTimelineValueChange = true;
			musicPlayer.pause();

			isTimelineValueInput = true;
			clearTimeout(timelineValueInputTimeoutId);
			timelineValueInputTimeoutId = setTimeout(() => { isTimelineValueInput = false; }, 100);
		}
	});

	trackTimelineFront.addEventListener('change', () =>
	{
		if (isPlayAfterTimelineValueChange)
		{
			isPlayAfterTimelineValueChange = false;
			musicPlayer.play();
		}
	});

	musicPlayer.addEventListener('loadeddata', () =>
	{
		trackTimelineFront.max = Number(musicPlayer.duration.toFixed(2));
		updateTimelineValue();
		updateTimeText(1);
		updateTimeText(2);
		if (forceStartPaused) pause(true);
		else play();
		forceStartPaused = false;
	});
	
	musicPlayer.addEventListener('pause', () => { pause(true); });
	musicPlayer.addEventListener('play', () => { play(true); });
	musicPlayer.addEventListener('ended', () =>
	{
		updateTimelineValue();
		updateTimeText(1);
		if (currentTrackIndex == playlist.length - 1 && repeatState == 0) pause(true);
		else if (!isTimelineValueInput) skipForward();
		isPlayAfterTimelineValueChange = false;
	});

	setInterval(() => { if (!musicPlayer.paused) updateTimelineValue(); }, 50);
	setInterval(() => { if (!musicPlayer.paused) updateTimeText(1); }, 100);
});

function initializeAccentColorButtons()
{
	for (var i = 0; i < accentColorButtons.length; i++)
	{
		accentColorButtons[i].style.background = `hsl(${18 * i}, 100%, 61%)`;

		accentColorButtons[i].addEventListener('click', (event) =>
		{
			settings.accentColor = Array.from(event.target.parentElement.children).indexOf(event.target) + 1;
			changeAccentColor();
			saveSettingsToFile();
		});
	}
}

function initializeEQ()
{
	const source = EQContext.createMediaElementSource(musicPlayer);

	for (var i = 0; i < EQFilters.length - 1; i++) EQFilters[i].connect(EQFilters[i + 1]);
	source.connect(EQFilters[0]);
	EQFilters[EQFilters.length - 1].connect(EQContext.destination);

	for (var i = 0; i < equalizerInputs.length; i++)
	{
		equalizerInputs[i].addEventListener('input', (event) =>
		{
			//snap to 0
			if (Math.abs(event.target.value) < 0.5) event.target.value = 0;
			const inputIndex = Array.from(event.target.parentElement.parentElement.children).indexOf(event.target.parentElement);
			settings.eq[inputIndex] = -event.target.value; //invert cuz sliders are actually upside down
			changeEQ(inputIndex);
			saveSettingsToFile();
		});
	}
}

function initializeClearPlaylistOnNewFileCheckbox()
{
	clearPlaylistOnNewFileCheckbox.addEventListener('click', () =>
	{
		settings.clearPlaylistOnNewFile = !settings.clearPlaylistOnNewFile;
		changeClearPlaylistOnNewFile();
		saveSettingsToFile();
	});
}

function initializeEnableShuffleByDefaultCheckbox()
{
	enableShuffleByDefaultCheckbox.addEventListener('click', () =>
	{
		settings.enableShuffleByDefault = !settings.enableShuffleByDefault;
		changeEnableShuffleByDefault();
		saveSettingsToFile();
	});
}

function updateTimelineValue()
{
	trackTimelineFront.value = musicPlayer.currentTime;
	setTimelineHandlePosition();
}

function setTimelineHandlePosition()
{
	const handlePosition = Number(remap(trackTimelineFront.value, 0, trackTimelineFront.max, 0, trackTimelineFront.offsetWidth - 10.4).toFixed(1));
	timelineHandle.style.left = `${handlePosition}px`;
}

function playAudioFile(filePath)
{
	musicPlayer.src = convertFileSrc(filePath);
	setTrackNameText(filePath);
}

function clearPlaylist()
{
	playlist = [];
	currentTrackIndex = 0;
	playlistTracksContainer.innerHTML = "";
}

function addAudioFileToPlaylist(filePath)
{
	playlist.push(filePath);
	const text = getTrackNameTextFromFilePath(filePath);

	playlistTracksContainer.insertAdjacentHTML('beforeend',
	`<div class="playlist-track playlist-track-unplayed">
		<div class="playlist-track-move-arrows"><img src="./assets/listarrowup.png"><img src="./assets/listarrowup.png"></div>
		<div class="playlist-track-name-container"><p class="playlist-track-name">${text}</p></div>
		<button class="btn btn-square playlistTrackRemoveBtn"><img src="./assets/delete.png"></button>
	</div>`);

	const addedPlaylistTrack = playlistTracksContainer.children[playlistTracksContainer.children.length - 1];
	addedPlaylistTrack.addEventListener('click', (event) => skipToTrack(event.target));
	const playlistTrackNameText = addedPlaylistTrack.querySelector('.playlist-track-name');
	setTextScrolling(playlistTrackNameText, playlistTrackNameText.parentElement.offsetWidth - 20, text);

	addedPlaylistTrack.querySelector('.playlistTrackRemoveBtn').addEventListener('click', (event) =>
	{
		removeTrackFromPlaylist(event.target.parentElement);
		event.stopPropagation();
	});

	const moveTrackArrows = addedPlaylistTrack.querySelector('.playlist-track-move-arrows').children;
	
	for (var i = 0; i < moveTrackArrows.length; i++)
	{
		moveTrackArrows[i].addEventListener('click', (event) =>
		{
			event.stopPropagation();

			var targetArrowIndex = Array.from(event.target.parentElement.children).indexOf(event.target);
			if (targetArrowIndex == 0) targetArrowIndex = -1;
			const targetTrackIndex = Array.from(playlistTracksContainer.children).indexOf(event.target.parentElement.parentElement);
			const targetTrackFromPlaylist = playlist[targetTrackIndex];

			playlist[targetTrackIndex] = playlist[targetTrackIndex + targetArrowIndex];
			playlist[targetTrackIndex + targetArrowIndex] = targetTrackFromPlaylist;

			if (targetArrowIndex == 1) targetArrowIndex = 2;
			playlistTracksContainer.insertBefore(playlistTracksContainer.children[targetTrackIndex], playlistTracksContainer.children[targetTrackIndex + targetArrowIndex]);
		});
	}
}

async function addAudioFilesToPlaylistViaOpenFile()
{
	const selected = await open(
	{
		directory: false,
		multiple: true,
		filters: [ { name: 'All Files', extensions: supportedExtensions }],
		title: 'Select audiofiles to add them to the playlist'
	});

	if (selected !== null)
	{
		if (Array.isArray(selected))
		{
			for (var i = 0; i < selected.length; i++)
			{
				if (isFilePathOK(selected[i])) addAudioFileToPlaylist(selected[i]);
			}
		}
		else if (isFilePathOK(selected)) addAudioFileToPlaylist(selected);
	}
}

function removeTrackFromPlaylist(trackElement)
{
	const trackElementIndex = Array.from(trackElement.parentElement.children).indexOf(trackElement);
	const newTracksCount = playlist.length - currentTrackIndex - 1;
	const playedTracksCount = playlist.length - newTracksCount - 1;

	if (trackElementIndex == currentTrackIndex)
	{
		if (newTracksCount > 0 || repeatState != 0) skipForward();
		else if (playedTracksCount > 0) skipBack(true);
		else exit(0);
	}

	if (trackElementIndex < currentTrackIndex) currentTrackIndex--;
	playlist.splice(trackElementIndex, 1);
	playlistTracksContainer.children[trackElementIndex].remove();
}

function playPause()
{
	if (!isMusicSourceNull())
	{
		updateTimelineValue();
		updateTimeText(1);

		if (musicPlayer.paused) play();
		else pause();
	}
}

function play(isOnlyVisual = false)
{
	trackControlsPause.children[0].src = './assets/pause.png';
	if (!isOnlyVisual) musicPlayer.play();
}

function pause(isOnlyVisual = false)
{
	trackControlsPause.children[0].src = './assets/play.png';
	if (!isOnlyVisual) musicPlayer.pause();
}

function switchShuffle()
{
	isShuffleEnabled = !isShuffleEnabled;
	if (shuffleBtn.classList.contains('shuffleBtn-checked')) shuffleBtn.classList.remove('shuffleBtn-checked');
	else shuffleBtn.classList.add('shuffleBtn-checked');
}

function switchRepeat()
{
	if (repeatState < 2) repeatState++;
	else repeatState = 0;

	if (repeatState == 0 && repeatBtn.classList.contains('repeatBtn-checked'))
	{
		repeatBtn.classList.remove('repeatBtn-checked');
		repeatBtn.classList.remove('repeatBtn-checked-2');
	}
	else repeatBtn.classList.add('repeatBtn-checked');

	if (repeatState == 2) repeatBtn.classList.add('repeatBtn-checked-2');
}

//skip to the beginning of current track or to previous track
function skipBack(skipDirectlyToPreviousTrack = false)
{
	if (!isMusicSourceNull())
	{
		const tempTime = musicPlayer.currentTime;
		musicPlayer.currentTime = 0;
		updateTimelineValue();
		updateTimeText(1);

		if (repeatState != 1 && currentTrackIndex > 0 && (tempTime < 1 || skipDirectlyToPreviousTrack))
		{
			currentTrackIndex--;
			playAudioFile(playlist[currentTrackIndex]);
			if (skipDirectlyToPreviousTrack) forceStartPaused = true;
			playlistTracksContainer.children[currentTrackIndex].classList.add('playlist-track-unplayed');
			playlistTracksContainer.children[currentTrackIndex].classList.remove('playlist-track-played');
			playlistTracksContainer.children[currentTrackIndex + 1].classList.add('playlist-track-unplayed');
			playlistTracksContainer.children[currentTrackIndex + 1].classList.remove('playlist-track-played');
		}
		else if (repeatState == 1) playAudioFile(playlist[currentTrackIndex]);
		else if (repeatState == 2 && (tempTime < 1 || skipDirectlyToPreviousTrack)) skipToTrack(playlistTracksContainer.children[playlistTracksContainer.children.length - 1]);
	}
}

//skip to the end of current track
function skipForward()
{
	if (!isMusicSourceNull())
	{
		if (!musicPlayer.ended)
		{
			musicPlayer.currentTime = musicPlayer.duration;
			pause(true);
		}

		updateTimelineValue();
		updateTimeText(1);

		if (repeatState != 1 && playlist.length - currentTrackIndex - 1 > 0)
		{
			currentTrackIndex++;
			if (isShuffleEnabled && playlist.length - 1 - currentTrackIndex > 1) doShuffle(playlist);
			playAudioFile(playlist[currentTrackIndex]);
			playlistTracksContainer.children[currentTrackIndex].classList.add('playlist-track-unplayed');
			playlistTracksContainer.children[currentTrackIndex].classList.remove('playlist-track-played');
			playlistTracksContainer.children[currentTrackIndex - 1].classList.remove('playlist-track-unplayed');
			playlistTracksContainer.children[currentTrackIndex - 1].classList.add('playlist-track-played');
		}
		else if (repeatState == 1) playAudioFile(playlist[currentTrackIndex]);
		else if (repeatState == 2) skipToTrack(playlistTracksContainer.children[0]);
	}
}

function skipToTrack(trackElement)
{
	if (trackElement.classList.contains('playlist-track-name-container')) trackElement = trackElement.parentElement;
	else if (trackElement.classList.contains('playlist-track-name')) trackElement = trackElement.parentElement.parentElement;

	const trackElementIndex = Array.from(trackElement.parentElement.children).indexOf(trackElement);
	if (trackElementIndex == currentTrackIndex) return;

	for (; trackElementIndex > currentTrackIndex; currentTrackIndex++)
	{
		playlistTracksContainer.children[currentTrackIndex].classList.remove('playlist-track-unplayed');
		playlistTracksContainer.children[currentTrackIndex].classList.add('playlist-track-played');
	}

	for (; trackElementIndex < currentTrackIndex; currentTrackIndex--)
	{
		playlistTracksContainer.children[currentTrackIndex].classList.add('playlist-track-unplayed');
		playlistTracksContainer.children[currentTrackIndex].classList.remove('playlist-track-played');
	}

	playlistTracksContainer.children[currentTrackIndex].classList.add('playlist-track-unplayed');
	playlistTracksContainer.children[currentTrackIndex].classList.remove('playlist-track-played');

	playAudioFile(playlist[currentTrackIndex]);
	updateTimelineValue();
	updateTimeText(1);
}

function doShuffle()
{
	const nextTrackIndex = randomIntFromInterval(currentTrackIndex, playlist.length - 1);
	const temp = playlist[currentTrackIndex];
	playlist[currentTrackIndex] = playlist[nextTrackIndex];
	playlist[nextTrackIndex] = temp;
	playlistTracksContainer.insertBefore(playlistTracksContainer.children[nextTrackIndex], playlistTracksContainer.children[currentTrackIndex]);
}

function setTrackNameText(filePath)
{
	const text = getTrackNameTextFromFilePath(filePath);
	trackName.style.removeProperty('animation-timing-function');
	trackName.style.removeProperty('--animationLoopTime');
	clearTimeout(trackNameScrollTimeoutId);
	setTextScrolling(trackName, trackNameContainer.offsetWidth - 32, text, true);
}

function setTextScrolling(textElement, visibleWidth, text, isTrackName = false)
{
	textElement.textContent = text;

	if (textElement.offsetWidth > visibleWidth)
	{
		textElement.textContent = `${text}               ${text}`; //15 spaces
		const animationLoopTime = Math.floor(textElement.offsetWidth / 80);
		textElement.style.setProperty('--animationLoopTime', `${animationLoopTime}s`);

		if (isTrackName) { trackNameScrollTimeoutId = setTimeout(() =>
			{ trackName.style.animationTimingFunction = 'linear'; }, animationLoopTime * 1000) };
	}
}

function getTrackNameTextFromFilePath(filePath)
{
	if (isDev) return filePath;
	const splitPath = filePath.split('\\');
	return splitPath[splitPath.length - 1];
}

//set one of time texts' content
function updateTimeText(index)
{
	const time = index == 1 ? musicPlayer.currentTime : musicPlayer.duration;

	const times = [
		String(Math.floor(time / 60 / 60)),
		Math.floor(time / 60 % 60).toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false }),
		Math.floor(time % 60).toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false })];

	if (times[0] == '0') times.splice(0, 1);

	const textElm = index == 1 ? timeText1 : timeText2;
	textElm.textContent = times.join(':');
}

//pages transition
function openPage(nextPageIndex)
{
	if (!canTransitionBetweenPages) return;
	const prevPageIndex = getCurrentPageIndex();
	if (prevPageIndex == nextPageIndex) return;
	canTransitionBetweenPages = false;

	const pageNames = ['main', 'settings', 'equalizer', 'playlist'];

	const prevPage = document.querySelector(`.page-${pageNames[prevPageIndex]}`);
	const nextPage = document.querySelector(`.page-${pageNames[nextPageIndex]}`);

	prevPage.style.opacity = '0';
	prevPage.style.transform = 'scale(0.9)';
	prevPage.style.pointerEvents = 'none';
	prevPage.style.zIndex = '-1';

	nextPage.style.opacity = '1';
	nextPage.style.transform = 'scale(1)';
	nextPage.style.zIndex = '0';

	setTimeout(() =>
	{
		prevPage.style.transform = 'scale(1.1)';
		nextPage.style.pointerEvents = 'all';
		canTransitionBetweenPages = true;
	}, 200);
}

//get index of page which is user currently on
function getCurrentPageIndex()
{
	for (var i = 0; i < allPages.length; i++) { if (parseFloat(allPages[i].style.opacity) > 0.9) return i; }
	return 0;
}

function changeAccentColor()
{
	document.documentElement.style.setProperty('--clr-accent', `hsl(${18 * (settings.accentColor - 1)}, 100%, 61%)`);

	for (var i = 0; i < accentColorButtons.length; i++)
	{
		accentColorButtons[i].style.removeProperty('outline');
		if (i == settings.accentColor - 1) accentColorButtons[i].style.outline = '2px solid white';
	}
}

//change value of one of EQ bars
function changeEQ(inputIndex, isManualInput = true)
{
	EQFilters[inputIndex].gain.value = settings.eq[inputIndex];
	if (!isManualInput) equalizerInputs[inputIndex].value = -settings.eq[inputIndex]; //invert cuz sliders are actually upside down
	const handlePosition = Number(remap(equalizerInputs[inputIndex].value, equalizerInputs[inputIndex].min, equalizerInputs[inputIndex].max, 0, 86).toFixed(1));
	equalizerBarHandles[inputIndex].style.top = `${handlePosition}px`;
}

//reset EQ to default
async function resetEQ()
{
	await ask("You're about to reset your EQ settings. This action cannot be reverted.\nAre you sure?",
		{ type: 'warning', cancelLabel: 'Wait, no', okLabel: 'Yes, just do it' }).then(async (isContinue) =>
	{
		if (!isContinue) return;
		settings.resetEQ();
		for (var i = 0; i < equalizerInputs.length; i++) changeEQ(i, false);
		await saveSettingsToFile();
	});
}

function changeClearPlaylistOnNewFile() { clearPlaylistOnNewFileCheckbox.checked = settings.clearPlaylistOnNewFile; }
function changeEnableShuffleByDefault() { enableShuffleByDefaultCheckbox.checked = settings.enableShuffleByDefault; }

async function loadSettingsFromFile()
{
	const appConfigDirPath = await appConfigDir();
	settingsFilePath = `${appConfigDirPath}settings.json`;
	const settingsFileExists = await exists(settingsFilePath);

	if (settingsFileExists) await readTextFile(settingsFilePath).then((settingsFileContent) => { Object.assign(settings, JSON.parse(settingsFileContent)); });
	else
	{
		await createDir(appConfigDirPath, { recursive: true });
		await writeTextFile(settingsFilePath, JSON.stringify(settings));
	}

	//apply loaded settings
	changeAccentColor();
	for (var i = 0; i < equalizerInputs.length; i++) changeEQ(i, false);
	changeClearPlaylistOnNewFile();
	changeEnableShuffleByDefault();
}

async function saveSettingsToFile() { if (settingsFilePath != '') await writeTextFile(settingsFilePath, JSON.stringify(settings)); }

function createEQFilter(frequency)
{
	var filter = EQContext.createBiquadFilter();

	filter.type = frequency == EQFrequencies[0] ? 'lowshelf' : frequency == EQFrequencies[EQFrequencies.length - 1] ? 'highshelf' : 'peaking';
	filter.frequency.value = frequency;
	filter.Q.value = 0.75;
	filter.gain.value = 0;

	return filter;
}

function validateFilePath(filePath) { if (!isFilePathOK(filePath)) exit(0); }
function isFilePathOK(filePath) { return filePath !== undefined && filePath !== null && filePath !== false && filePath !== '' && filePath !== ' ' || isExtensionSupported(filePath) }
function isExtensionSupported(filePath) { return filePath === null ? true : supportedExtensions.includes(filePath.split('.').slice(-1).toString().toLowerCase()); }
function isMusicSourceNull() { return musicPlayer.src === null || musicPlayer.src.trim() == ''; }
function remap(value, low1, high1, low2, high2) { return low2 + (high2 - low2) * (value - low1) / (high1 - low1); }
function randomIntFromInterval(min, max) { return Math.floor(Math.random() * (max - min + 1) + min); } // min and max included