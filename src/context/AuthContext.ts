import { createContext } from "react";
import type { User } from "@/api/auth";

export interface AuthContextType {
	user: User | null;
	token: string | null;
	isAuthenticated: boolean;
	signup: (data: {
		name: string;
		email: string;
		password: string;
	}) => Promise<void>;
	login: (token: string, user: User) => void;
	logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
	undefined,
);
