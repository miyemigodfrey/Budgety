"use client";

/**
 * Minimal react-router-dom → Next.js App Router shim.
 *
 * The feature pages were written against react-router v7. Rather than rewrite
 * every `useNavigate`/`Link`/`useParams` call, `react-router-dom` is aliased to
 * this module via tsconfig `paths`. Only the surface the app actually used is
 * implemented.
 */

import NextLink from "next/link";
import {
	useRouter,
	usePathname,
	useParams as useNextParams,
} from "next/navigation";
import { useEffect } from "react";
import type { ComponentProps } from "react";

type LinkProps = Omit<ComponentProps<typeof NextLink>, "href"> & {
	to: string;
	state?: unknown;
};

export function Link({ to, state: _state, ...props }: LinkProps) {
	return <NextLink href={to} {...props} />;
}

type NavigateFn = {
	(to: string, opts?: { replace?: boolean; state?: unknown }): void;
	(delta: number): void;
};

export function useNavigate(): NavigateFn {
	const router = useRouter();
	return ((to: string | number, opts?: { replace?: boolean }) => {
		if (typeof to === "number") {
			if (to < 0) router.back();
			else router.forward();
			return;
		}
		if (opts?.replace) router.replace(to);
		else router.push(to);
	}) as NavigateFn;
}

export function useLocation() {
	const pathname = usePathname();
	// `state` is not carried across App Router navigations; callers that read
	// location.state?.from fall back to a default.
	return { pathname, state: null as { from?: { pathname: string } } | null };
}

export function useParams<
	T extends Record<string, string | undefined> = Record<
		string,
		string | undefined
	>,
>(): T {
	return useNextParams() as T;
}

export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
	const router = useRouter();
	useEffect(() => {
		if (replace) router.replace(to);
		else router.push(to);
	}, [to, replace, router]);
	return null;
}
