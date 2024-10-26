import { convertFileSrc } from '@tauri-apps/api/core';
import { getMatches } from '@tauri-apps/plugin-cli';
import { platform } from '@tauri-apps/plugin-os';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { appConfigDir, dataDir, join } from '@tauri-apps/api/path';
import { exists, mkdir, readDir, readTextFile, writeTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';
/* import { message, ask, open } from '@tauri-apps/plugin-dialog'; //npm i @tauri-apps/plugin-dialog --save */
import { EventCallback, listen } from '@tauri-apps/api/event';
import { getVersion } from '@tauri-apps/api/app';

/* import { shell_open } from '@tauri-apps/api/open'; */

const appWindow = getCurrentWindow();
const isDev = false;
const supportedExtensions = [ 'mp3', 'wav', 'weba', 'webm', 'm4a', 'ogg', 'oga', 'caf', 'flac', 'opus', 'mid', 'aiff', 'wma', 'au' ];
var musicPlayer : HTMLAudioElement;

const mainContentWrapper = getElement('#main-content-wrapper');
const allPages = getElementsByClassName('page');
const backBtn = getElement('#backBtn');
const pageNameTexts = getElementsByClassName('page-name');

const sideMenu = getElement('.side-menu');
const sideMenuBg = getElement('.side-menu-bg');
const sideMenuContainer = getElement('.side-menu-container');
const openEqualizerPageBtn = getElement('#openEqualizerPageBtn');
const openSettingsPageBtn = getElement('#openSettingsPageBtn');

var playlist = [];
var EQContext = new AudioContext();
const EQFrequencies = [30, 125, 250, 500, 1000, 2000, 4000, 8000, 12000, 16000];
/* const EQFilters = EQFrequencies.map(createEQFilter); */
var isSideMenuOpened = false;
var canTransitionBetweenPages = true;
var sideMenuCloseTimeoutId : number;
/* var trackNameScrollTimeoutId;
var isPlayAfterTimelineValueChange = false;
var isTimelineValueInput = false;
var timelineValueInputTimeoutId; */

class Settings
{
	accentColor = 16;
	eq = [0, 0, 0, -2.1, -2.2, -2, -2.1, -2.1, -1.8, -0.6];
	library = [];

	constructor() { this.resetEQ(); }
	resetEQ() { this.eq = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]; }
}

const settings = new Settings();
var settingsFilePath = '';

/* const platformResult = await platform();
if (platformResult !== 'android') return; */

/* const matches = await getMatches().catch(() => { console.log('error in getMatches'); });
const filePath = matches.args.filePath.value; */

/* if (!isDev) await validateFilePath(filePath);
addAudioFileToPlaylist(filePath);
playAudioFile(playlist[0]); */

document.addEventListener('DOMContentLoaded', () =>
{
	musicPlayer = <HTMLAudioElement> document.getElementById('music');

	getElement('#openSideMenuBtn').addEventListener('click', () => openOrCloseSideMenu(0));
	sideMenuBg.addEventListener('click', () => openOrCloseSideMenu(1));

	getElement('#openPlaylistPageBtn').addEventListener('click', () => openPage(1));
	openEqualizerPageBtn.addEventListener('click', () => { openPage(2); removeRipplesInChildren(openEqualizerPageBtn); });
	openSettingsPageBtn.addEventListener('click', () => { openPage(3); removeRipplesInChildren(openSettingsPageBtn); });

	getElement('#testBtn').addEventListener('click', () => addMusicFilesLocation());
});

async function addMusicFilesLocation()
{
	const entries = await readDir('', { baseDir: BaseDirectory.Home });
	console.log(entries);
	console.log(entries[0]); //doesn't work
}

function hideOrRevealElement(element : HTMLElement, hideOrReveal : number)
{
	switch (hideOrReveal)
	{
		case 0:
			element.style.opacity = '0';
			setTimeout(() =>
			{
				element.style.display = 'none';
				removeRipplesInChildren(element);
			}, 300);
			break;
	
		case 1:
			element.style.display = 'unset';
			setTimeout(() => { element.style.opacity = '1'; }, 0);
			break;

		default: throw new Error('Either 0 or 1 must be passed to hideOrReveal property of hideOrRevealElement()');
	}
}

function removeRipplesInChildren(element : HTMLElement)
{
	var ripples = element.getElementsByClassName('ripple');
	while (ripples.length > 0) ripples[0].parentElement?.remove();
}

function openOrCloseSideMenu(openOrClose : number)
{
	switch (openOrClose)
	{
		case 0:
			if (isSideMenuOpened) return;

			if (sideMenuCloseTimeoutId !== undefined && sideMenuCloseTimeoutId !== null) clearTimeout(sideMenuCloseTimeoutId);

			isSideMenuOpened = true;
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
			if (!isSideMenuOpened) return;

			sideMenuCloseTimeoutId = setTimeout(() =>
			{
				sideMenu.style.display = '';
				isSideMenuOpened = false;
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
	const prevPageIndex = getCurrentPageIndex();
	if (!canTransitionBetweenPages) return;
	if (prevPageIndex == nextPageIndex) { if (isSideMenuOpened) openOrCloseSideMenu(1); return; }
	canTransitionBetweenPages = false;

	hideOrRevealElement(backBtn, Number(nextPageIndex != 0));
	eval(`backBtn.${nextPageIndex == 0 ? 'remove' : 'add'}EventListener('click', () => openPage(0));`);
	if (isSideMenuOpened && (nextPageIndex == 2 || nextPageIndex == 3)) openOrCloseSideMenu(1);

	const pageNames = ['main', 'playlist', 'equalizer', 'settings'];

	pageNameTexts[1].textContent = nextPageIndex == 0 ? 'Library' : pageNames[nextPageIndex][0].toUpperCase() + pageNames[nextPageIndex].slice(1);
	hideOrRevealElement(pageNameTexts[0], 0);
	hideOrRevealElement(pageNameTexts[1], 1);
	setTimeout(() => { [pageNameTexts[0], pageNameTexts[1]] = [pageNameTexts[1], pageNameTexts[0]]; }, 300);

	const prevPage = getElement(`.${pageNames[prevPageIndex]}-page`);
	const nextPage = getElement(`.${pageNames[nextPageIndex]}-page`);

	prevPage.style.opacity = '0';
	prevPage.style.transform = 'scale(0.9)';
	prevPage.style.zIndex = '-1';
	prevPage.style.pointerEvents = 'none';
	nextPage.style.display = 'unset !important';

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
	}, 300);
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