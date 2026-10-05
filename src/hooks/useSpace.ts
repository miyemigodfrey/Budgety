"use client";

import { useContext } from "react";
import { SpaceContext } from "@/context/SpaceContext";

export function useSpace() {
	const ctx = useContext(SpaceContext);
	if (!ctx) {
		throw new Error("useSpace must be used within a SpaceProvider");
	}
	return ctx;
}
