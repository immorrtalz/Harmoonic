import { useRef, useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import "./App.scss";
import { EqualizerSVG, MenuSVG, PlaylistSVG, SettingsSVG } from "./components/SVGLibrary";
import { MusicItem, MusicItemType } from "./components/MusicItem";
import { ScrollingText } from "./components/ScrollingText";
import { Button, ButtonType } from "./components/Button";

async function pickDirectory()
{
	try
	{
		const result = await invoke('open_directory_picker') as { uri: string };
		const uri = result.uri;

		console.log("RESULT:", uri);
		return uri;
	}
	catch (error) { console.error('Directory picker error:', error); }
}

function App()
{
	const pagesNames = [ "Library", "Playlist", "Equalizer", "Settings" ];
	const [currentPageIndex, setCurrentPageIndex] = useState(0);

	const sideBarRef = useRef<HTMLDivElement>(null);

	const changeToPage = (index: number) =>
	{
		if (index < 0 || index >= pagesNames.length) return;
		setCurrentPageIndex(index);
	};

	const openCloseSideBar = (i: number) =>
	{
		if (!sideBarRef.current) return;
		
		sideBarRef.current.classList.toggle("closed", i !== 0);
		sideBarRef.current.classList.toggle("opened", i === 0);
	};

	return (
		<main>

			<span className="noiseBg"/>

			<div className="sideBar closed" ref={sideBarRef}>

				<span className="sideBarBgDarkBlur" onClick={() => openCloseSideBar(1)}/>

				<div className="sideBarContainer">
					<p className="appName fontSemibold">Harmoonic</p>
					<Button type={ButtonType.Secondary} icon={<EqualizerSVG/>} title="Equalizer" onClick={() => console.log('Equalizer page opened')}/>
					<Button type={ButtonType.Secondary} icon={<SettingsSVG/>} title="Settings" onClick={() => console.log('Settings page opened')}/>

					<p className="appVersion fontSemibold">v1.0.1</p>
				</div>

			</div>

			<div className="topContainer">

				<Button type={ButtonType.Secondary} icon={<MenuSVG/>} onClick={() => openCloseSideBar(0)}/>
				<h1 className="currentPageName fontBold">
					<span>{pagesNames[currentPageIndex]}</span>
					<span>{pagesNames[currentPageIndex]}</span>
				</h1>
				<Button type={ButtonType.Secondary} icon={<PlaylistSVG/>} onClick={() => console.log('Playlist page opened')}/>

			</div>

			<div className="pagesContainer">

				<div className="page">
					<div className="musicItemsContainer">
						{/* <ScrollingText text="Super long track file name that doesn't fit here Super long track file name that doesn't fit here Super long track file name that doesn't fit here"/>
						<ScrollingText text="Super long track file name that doesn't fit here Super long track file name that doesn't fit here"/>
						<ScrollingText text="Super long track file name that doesn't fit here"/> */}
						<MusicItem type={MusicItemType.LibraryTrack} order={1} title="Super long track file name that doesn't fit here"/>
						<MusicItem type={MusicItemType.PlaylistTrack} order={2} title="Super long track file name that doesn't fit here"/>
						<MusicItem type={MusicItemType.PlaylistTrack} order={3} title="Super long track file name that doesn't fit here"/>
						<MusicItem type={MusicItemType.Folder} order={4} title="Super long track file name that doesn't fit here" folderInfo="54 audiofiles in /storage/emulated/0/Music/Folder"/>
						<MusicItem type={MusicItemType.LibraryTrack} order={5} title="Super long track file name that doesn't fit here"/>
						<MusicItem type={MusicItemType.LibraryTrack} order={6} title="Super long track file name that doesn't fit here"/>
						<MusicItem type={MusicItemType.LibraryTrack} order={7} title="Super long track file name that doesn't fit here"/>
						<MusicItem type={MusicItemType.LibraryTrack} order={8} title="Super long track file name that doesn't fit here"/>
						<MusicItem type={MusicItemType.LibraryTrack} order={9} title="Super long track file name that doesn't fit here"/>
						<MusicItem type={MusicItemType.LibraryTrack} order={10} title="Super long track file name that doesn't fit here"/>
						<MusicItem type={MusicItemType.LibraryTrack} order={11} title="Super long track file name that doesn't fit here"/>
						<MusicItem type={MusicItemType.LibraryTrack} order={12} title="Super long track file name that doesn't fit here"/>
						<MusicItem type={MusicItemType.LibraryTrack} order={13} title="Super long track file name that doesn't fit here"/>
					</div>
				</div>

			</div>

			{/* <div className="row">
				<a href="https://vitejs.dev" target="_blank">
					<img src="./vite.svg" className="logo vite" alt="Vite logo" />
				</a>
				<a href="https://reactjs.org" target="_blank">
					<img src={reactLogo} className="logo react" alt="React logo" />
				</a>
			</div> */}

		</main>
	);
}

export default App;