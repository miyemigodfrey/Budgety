import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ClownOne from "@/assets/Clown1.jpg";
import { ArrowLeftCircle } from "lucide-react";
import { useState } from "react";
import { login } from "@/api/auth";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const navigate = useNavigate();
	const { isAuthenticated, login: loginContext } = useAuth();
	const location = useLocation();

	const from = location.state?.from?.pathname || "/dashboard";

	if (isAuthenticated) {
		navigate(from, { replace: true });
	}

	const handleLogin = async () => {
		try {
			const loginData = await login({
				email,
				password,
			});
			console.log("Login successful:", loginData);
			//navigate to the dashboard page
			loginContext(loginData.accessToken, loginData.user);
			navigate(from, { replace: true });
		} catch (error) {
			console.error("Failed to fetch sources:", error);
		}
	};

	return (
		<>
			<div className="grid grid-cols-12 h-screen relative">
				<Link to="/" className="absolute z-50 top-3 right-3 ">
					<ArrowLeftCircle className="text-red-600" />
				</Link>

				<div className="col-span-6 hidden md:block">
					<div className="h-screen relative overflow-hidden">
						<img
							src={ClownOne}
							alt="Login i"
							className="w-full h-full object-cover object-center"
						/>
					</div>
				</div>

				<div className="col-span-12 md:col-span-6">
					<div className="flex flex-col justify-center items-center space-y-5 md:p-20 h-screen">
						<h1 className="font-semibold text-3xl">LOGIN</h1>

						<form className="w-full flex flex-col gap-6 flex-[0.5]">
							<input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="Enter Email"
								className="p-3 w-full lg:min-w-100 rounded-lg border"
							/>
							<input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Enter Password"
								className="p-3 w-full lg:min-w-100 rounded-lg border"
							/>
							<Button
								type={"button"}
								onClick={handleLogin}
								variant={"destructive"}
								className="w-full lg:min-w-100 rounded-lg">
								LOGIN
							</Button>
						</form>

						<p className="text-center mt-4 text-sm">
							Don't have an account?
							<Link
								to="/signup"
								className=" text-gray-500 px-0.5 hover:underline">
								Register
							</Link>
						</p>
					</div>
				</div>
			</div>
		</>
	);
}
