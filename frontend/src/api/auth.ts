import api from "./axios";

export type LoginDto = {
	email: string;
	password: string;
};

export type User = {
	id: string;
	email: string;
	name: string;
};

export type LoginResponse = {
	accessToken: string;
	user: User;
};

export const login = async (data: LoginDto) => {
	// Implementation for login API call
	const res = await api.post<LoginResponse>("auth/login", data);
	console.log(res);
	return res.data;
};
