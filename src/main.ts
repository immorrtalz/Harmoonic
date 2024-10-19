import { convertFileSrc } from '@tauri-apps/api/core';
import { getMatches } from '@tauri-apps/plugin-cli';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { appConfigDir, dataDir } from '@tauri-apps/api/path';
import { exists, mkdir, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
/* import { message, ask, open } from '@tauri-apps/plugin-dialog'; //npm i @tauri-apps/plugin-dialog --save */
import { listen } from '@tauri-apps/api/event';
import { getVersion } from '@tauri-apps/api/app';

/* import { shell_open } from '@tauri-apps/api/open'; */

/* const trackNameContainer = document.querySelector('.currently-playing-track-name-container');
const trackName = document.querySelector('.currently-playing-track-name');
const trackControlsPause = document.querySelector('.currently-playing-pause-button');

const timeTexts = document.querySelector('.time-texts');
const timeText1 = document.querySelector('#time-text-1');
const timeText2 = document.querySelector('#time-text-2');

const trackTimelineFront = document.querySelector('.track-timeline-front'); */

/* const timelineHandle = document.querySelector('.track-timeline-handle-visual'); */

/* const musicPlayer = document.querySelector('#music');
const accentColorButtons = document.querySelectorAll('.settings-param-color');
const clearPlaylistOnNewFileCheckbox = document.getElementById('clearPlaylistOnNewFileCheckbox');
const equalizerInputs = document.querySelectorAll('.equalizer-bar-front');
const equalizerBarHandles = document.querySelectorAll('.equalizer-bar-handle-visual');
const playlistTracksContainer = document.getElementById('playlistTracksContainer'); */

const appWindow = getCurrentWindow();
const isDev = false;
const supportedExtensions = [ 'mp3', 'wav', 'weba', 'webm', 'm4a', 'ogg', 'oga', 'caf', 'flac', 'opus', 'mid', 'aiff', 'wma', 'au' ];

const mainContentWrapper = getElement('#main-content-wrapper');

const allPages = getElementsByClassName('page');

const topSection = getElement('.top-section');
const currentlyPlayingBar = getElement('.currently-playing-bar');

const sideMenu = getElement('.side-menu');
const sideMenuBg = getElement('.side-menu-bg');
const sideMenuContainer = getElement('.side-menu-container');

const backBtn = getElement('#backBtn');

var playlist = [];
var EQContext = new AudioContext();
const EQFrequencies = [30, 125, 250, 500, 1000, 2000, 4000, 8000, 12000, 16000];
/* const EQFilters = EQFrequencies.map(createEQFilter); */
var sideMenuOpened = false;
var canTransitionBetweenPages = true;
var sideMenuCloseTimeoutId : number;
/* var trackNameScrollTimeoutId;
var isPlayAfterTimelineValueChange = false;
var isTimelineValueInput = false;
var timelineValueInputTimeoutId; */

document.addEventListener('DOMContentLoaded', () =>
{
	getElement('#openSideMenuBtn').addEventListener('click', () => openOrCloseSideMenu(0));
	sideMenuBg.addEventListener('click', () => openOrCloseSideMenu(1));

	getElement('#openPlaylistPageBtn').addEventListener('click', () => openPage(1));
});

function hideOrRevealObject(element : HTMLElement, hideOrReveal : number)
{
	switch (hideOrReveal)
	{
		case 0:
			element.style.opacity = '0';
			setTimeout(() =>
			{
				element.style.display = 'none';
				var ripples = element.getElementsByClassName('ripple');
				while (ripples.length > 0) ripples[0].parentElement?.remove();
			}, 300);
			break;
	
		case 1:
			element.style.display = 'unset';
			setTimeout(() => { element.style.opacity = '1'; }, 0);
			break;

		default: throw new Error('Either 0 or 1 must be passed to hideOrRevealObject()');
	}
}

function openOrCloseSideMenu(openOrClose : number)
{
	switch (openOrClose)
	{
		case 0:
			if (sideMenuOpened) return;

			clearTimeout(sideMenuCloseTimeoutId);

			sideMenuOpened = true;
			canTransitionBetweenPages = false;
			sideMenu.style.display = 'unset';

			// without this animations are bugged
			setTimeout(() =>
			{
				sideMenuBg.style.opacity = '1';
				sideMenuBg.style.backdropFilter = 'blur(2px)';
				sideMenuContainer.style.boxShadow = '0 0 50px rgba(0, 0, 0, 0.5)';
				sideMenuContainer.style.transform = 'translateX(0%)';
			}, 0);

			mainContentWrapper.style.transform += ' translateX(10%)';
			break;
	
		case 1:
			if (!sideMenuOpened) return;

			sideMenuCloseTimeoutId = setTimeout(() =>
			{
				sideMenu.style.display = '';
				sideMenuOpened = false;
				canTransitionBetweenPages = true;
			}, 500);

			sideMenuBg.style.opacity = '';
			sideMenuBg.style.backdropFilter = '';
			sideMenuContainer.style.boxShadow = '';
			sideMenuContainer.style.transform = '';

			mainContentWrapper.style.transform = mainContentWrapper.style.transform.replace('translateX(10%)', '');
			break;

		default: throw new Error('Either 0 or 1 must be passed to openOrCloseSideMenu()');
	}
}

// pages transition
function openPage(nextPageIndex : number)
{
	if (!canTransitionBetweenPages) return;
	const prevPageIndex = getCurrentPageIndex();
	if (prevPageIndex == nextPageIndex) return;
	canTransitionBetweenPages = false;

	console.log(backBtn);
	hideOrRevealObject(backBtn, Number(nextPageIndex != 0));
	backBtn.addEventListener('click', () => openPage(0));

	const pageNames = ['main', 'playlist', 'equalizer', 'settings'];

	const prevPage = getElement(`.${pageNames[prevPageIndex]}-page`);
	const nextPage = getElement(`.${pageNames[nextPageIndex]}-page`);

	prevPage.style.opacity = '0';
	prevPage.style.transform = 'scale(0.9)';
	prevPage.style.pointerEvents = 'none';
	prevPage.style.zIndex = '-1';
	nextPage.style.display = 'unset';

	setTimeout(() =>
	{
		nextPage.style.opacity = '1';
		nextPage.style.transform = 'scale(1)';
		nextPage.style.zIndex = '0';
	}, 0);

	setTimeout(() =>
	{
		prevPage.style.display = 'none';
		prevPage.style.transform = 'scale(1.1)';
		nextPage.style.pointerEvents = 'all';
		canTransitionBetweenPages = true;
	}, 250);
}

// get index of page which user is currently on
function getCurrentPageIndex()
{
	for (var i = 0; i < allPages.length; i++) { if (parseFloat(allPages[i].style.opacity) > 0.9) return i; }
	return 0;
}

function getElement(classNameOrId : string)
{
	if (classNameOrId[0] == '.') return <HTMLElement> document.getElementsByClassName(classNameOrId.substring(1))[0];
	else if (classNameOrId[0] == '#') return <HTMLElement> document.getElementById(classNameOrId.substring(1));
	else throw new Error('ClassName or id must be passed. Got "' + classNameOrId + '" instead');
}

function getElementsByClassName(className : string) { return Array.from(document.getElementsByClassName(className) as HTMLCollectionOf<HTMLElement>); }
function remap(value : number, low1 : number, high1 : number, low2 : number, high2 : number) { return low2 + (high2 - low2) * (value - low1) / (high1 - low1); }