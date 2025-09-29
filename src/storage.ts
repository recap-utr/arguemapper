import { useEffect, useState } from "react";

export function getSessionStorage<T>(key: string, initialValue: T): T {
	const storedValue = sessionStorage.getItem(key);

	if (storedValue === null) {
		return initialValue;
	}

	return JSON.parse(storedValue);
}

export function setSessionStorage<T>(key: string, value: T): void {
	sessionStorage.setItem(key, JSON.stringify(value));
}

export function useSessionStorage<T>(
	key: string,
	initialValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
	const [value, setValue] = useState<T>(getSessionStorage(key, initialValue));

	useEffect(() => {
		setSessionStorage(key, value);
	}, [value, key]);

	return [value, setValue];
}
