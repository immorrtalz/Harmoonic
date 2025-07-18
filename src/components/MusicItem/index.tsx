import styles from './MusicItem.module.scss';
import { DragSVG, FolderSVG } from '../SVGLibrary';

export enum MusicItemType
{
	LibraryTrack,
	PlaylistTrack,
	Folder
}

interface Props
{
	type?: MusicItemType;
	order?: number;
	title?: string;
	folderInfo?: string;
	disabled?: boolean;
	onClick?: (...args: any[]) => any;
}

export function MusicItem(props: Props)
{
	const order = props.order ? Math.round(props.order) : 0;

	const onClick = (e: React.MouseEvent<HTMLElement>) => props.onClick?.(e);
	var dynamicClassNames: string[] = [];

	switch (props.type)
	{
		case MusicItemType.LibraryTrack:
			dynamicClassNames.push(styles.libraryTrack);
			break;

		case MusicItemType.PlaylistTrack:
			dynamicClassNames.push(styles.playlistTrack);
			break;

		case MusicItemType.Folder:
			dynamicClassNames.push(styles.folder);
			break;
	}

	return (
		<button className={`${styles.musicItem} ${dynamicClassNames.join(' ')} fontMedium`} onClick={onClick} disabled={props.disabled}>
			{ props.type === MusicItemType.LibraryTrack && order > 0 && <p className={styles.order}>{order < 10 && '0'}{order}</p> }
			{ props.type === MusicItemType.PlaylistTrack && <DragSVG className={styles.icon}/> }
			{ props.type === MusicItemType.Folder && <FolderSVG className={styles.icon}/> }

			{ props.type === MusicItemType.Folder ?
				<span className={styles.folderTexts}>
					<p className={styles.title}>{props.title}</p>
					<p className={styles.folderInfo}>{props.folderInfo}</p>
				</span>
				: <p className={styles.title}>{props.title}</p>
			}
		</button>
	);
}