import { useEffect, useMemo, useState } from "react";
import { klona as clone } from "klona/json";

type JsonValue = boolean | number | string | null;

type Json = JsonValue | JsonValue[] | { [key: string]: Json };

export type UseReplicantOptions<T> = {
	defaultValue?: T;
	bundle?: string;
	persistent?: boolean;
};

/**
 * Subscribe to a replicant, returns tuple of the replicant value and `setValue` function.
 * The component using this function gets re-rendered when the value is updated.
 * The `setValue` function can be used to update replicant value.
 * @param replicantName The name of the replicant to use
 * @param initialValue Initial value to pass to `useState` function
 * @param options Options object. Currently supports the optional `namespace` option
 */
export const useReplicant = <T extends Json>(
	replicantName: string,
	{ bundle, defaultValue, persistent }: UseReplicantOptions<T> = {},
) => {
	const replicant = useMemo(() => {
		if (typeof bundle === "string") {
			return nodecg.Replicant<T>(replicantName, bundle, {
				defaultValue,
				persistent,
			});
		}
		return nodecg.Replicant<T>(replicantName, { defaultValue, persistent });
	}, [bundle, defaultValue, persistent, replicantName]);

	const [value, setValue] = useState(replicant.value);

	useEffect(() => {
		const changeHandler = (newValue: T | undefined): void => {
			setValue((oldValue) => {
				if (newValue !== oldValue) {
					return newValue;
				}
				return clone(newValue);
			});
		};
		replicant.on("change", changeHandler);
		return () => {
			replicant.removeListener("change", changeHandler);
		};
	}, [replicant]);

	return [
		value,
		(newValue: T | ((oldValue?: T) => void)) => {
			if (typeof newValue === "function") {
				newValue(replicant.value);
			} else {
				replicant.value = newValue;
			}
		},
	] as const;
};
