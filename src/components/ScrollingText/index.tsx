import { useRef, useEffect } from 'react';
import styles from './ScrollingText.module.scss';

interface Props
{
	text: string;
}

export function ScrollingText({ text }: Props)
{
	const containerRef = useRef<HTMLSpanElement>(null),
	firstTextRef = useRef<HTMLParagraphElement>(null),
	secondTextRef = useRef<HTMLParagraphElement>(null);

	useEffect(() =>
	{
		if (!containerRef.current || !firstTextRef.current || !secondTextRef.current) return;

		if (firstTextRef.current.offsetWidth > containerRef.current.offsetWidth) // needs scrolling
		{
			const visualSpeed = 50; // сonstant visual speed (pixels per second)
			const linearDuration = firstTextRef.current.offsetWidth / visualSpeed * 1000; // ms

			// First animation: ease-in over 10 seconds
			firstTextRef.current.style.animation = secondTextRef.current.style.animation =
				`${styles.scrollingText} ${linearDuration}ms cubic-bezier(0.5, 0, 0.25, 0.25) forwards`;

			setTimeout(() => firstTextRef.current!.style.animation = secondTextRef.current!.style.animation =
				`${styles.scrollingText} ${linearDuration}ms linear infinite`, 10000);

			/* const loopTime = Math.floor(firstTextRef.current.offsetWidth / containerRef.current.offsetWidth * 10000);

			firstTextRef.current.style.animation = secondTextRef.current.style.animation =
				`${styles.scrollingText} ${loopTime}ms cubic-bezier(0.5, 0, 0.25, 0.25) forwards`;

			setTimeout(() => firstTextRef.current!.style.animation = secondTextRef.current!.style.animation =
				`${styles.scrollingText} ${linearDuration}ms linear infinite`, 10000); */
		}
		else secondTextRef.current.remove();
	}, [text]);

	return (
		<span ref={containerRef} className={styles.scrollingTextContainer}>
			<p ref={firstTextRef}>{text}</p>
			<p ref={secondTextRef}>{text}</p>
		</span>
	);
}