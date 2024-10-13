import { convertFileSrc } from '@tauri-apps/api/core';
import { getMatches } from '@tauri-apps/plugin-cli';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { appConfigDir, dataDir } from '@tauri-apps/api/path';
import { exists, mkdir, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
/* import { message, ask, open } from '@tauri-apps/plugin-dialog'; //npm i @tauri-apps/plugin-dialog --save */
import { listen } from '@tauri-apps/api/event';
import { getVersion } from '@tauri-apps/api/app';

/* import { shell_open } from '@tauri-apps/api/open'; */

/* const appWindow = getCurrentWindow();
const isDev = false;
const supportedExtensions = [ 'mp3', 'wav', 'weba', 'webm', 'm4a', 'ogg', 'oga', 'caf', 'flac', 'opus', 'mid', 'aiff', 'wma', 'au' ];

const allPages = document.querySelectorAll('.page');

const trackNameContainer = document.querySelector('.currently-playing-track-name-container');
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