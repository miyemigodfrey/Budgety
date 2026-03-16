import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import ClownTwo from "@/assets/Clown2.jpg";
import { ArrowLeftCircle } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function SignupPage() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const { isAuthenticated, signup } = useAuth();

	const navigate = useNavigate();

	if (isAuthenticated) {
		navigate("/dashboard", { replace: true });
	}

	const handleSignup = async () => {
		if (password !== confirmPassword) {
			console.error("Passwords do not match");
			return;
		}

		try {
			const signupData = await signup({
				name,
				email,
				password,
			});
			console.log("Signup successful:", signupData);
			navigate("/login", { replace: true });
		} catch (error) {
			console.error("Failed to signup:", error);
		}
	};

	return (
		<>
			<div className="grid grid-cols-12 h-screen">
				<Link to="/" className="absolute z-50 top-3 left-3">
					<ArrowLeftCircle className="text-red-600" />
				</Link>

				<div className="col-span-12 md:col-span-6">
					<div className="flex flex-col justify-center items-center space-y-5 md:p-20 h-screen">
						<h1 className="font-semibold text-3xl">SIGNUP</h1>

						<form className="flex flex-col gap-6 flex-[0.5]">
							<input
								type="text"
								id="name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Enter Username"
								className="p-3 w-full lg:min-w-100 rounded-lg border"
							/>

							<input
								type="email"
								id="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="Enter Email"
								className="p-3 w-full lg:min-w-100 rounded-lg border"
							/>
							<input
								type="password"
								id="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Set Password"
								className="p-3 w-full lg:min-w-100 rounded-lg border"
							/>
							<input
								type="password"
								id="confirmPassword"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								placeholder="Confirm Password"
								className="p-3 w-full lg:min-w-100 rounded-lg border"
							/>
							<Button
								onClick={handleSignup}
								variant={"destructive"}
								className="w-full lg:min-w-100 rounded-lg"
								type={"button"}>
								SIGN UP
							</Button>

							<p className="text-center mt-4 text-sm text-gray-600">
								Already have an account?
								<Link to="/login" className="text-pink-600 hover:underline">
									Login
								</Link>
							</p>
						</form>
					</div>
				</div>

				<div className="col-span-6 hidden md:block">
					<div className="h-screen relative overflow-hidden">
						<img
							src={ClownTwo}
							alt="Login i"
							className="w-full h-full object-cover object-center"
						/>
					</div>
				</div>
			</div>
		</>
	);
}
