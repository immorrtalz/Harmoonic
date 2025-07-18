import { ReactElement } from 'react';
import styles from './Button.module.scss';

export enum ButtonType
{
	Primary,
	Secondary
}

interface Props
{
	type?: ButtonType;
	icon?: ReactElement;
	title?: string;
	disabled?: boolean;
	onClick?: (...args: any[]) => any;
}

export function Button(props: Props)
{
	const onClick = (e: React.MouseEvent<HTMLElement>) => props.onClick?.(e);
	var dynamicClassNames: string[] = [];

	switch (props.type)
	{
		case ButtonType.Primary:
			dynamicClassNames.push(styles.primaryButton);
			break;

		case ButtonType.Secondary:
			dynamicClassNames.push(styles.secondaryButton);
			break;
	}

	if (props.icon && props.title) dynamicClassNames.push(styles.withIconAndTitle);
	else if (!props.icon) dynamicClassNames.push(styles.withTitleOnly);
	else dynamicClassNames.push(styles.withIconOnly);

	return (
		<button className={`${styles.button} ${dynamicClassNames.join(' ')} fontSemibold`} onClick={onClick} disabled={props.disabled}>
			{props.icon}
			{props.title}
		</button>
	);
}