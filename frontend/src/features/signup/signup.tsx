import { Button } from "@/components/ui/button";
import { Link, Navigate, useNavigate } from "react-router-dom";
import ClownTwo from "@/assets/Clown2.jpg";
import { ArrowLeftCircle } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/lib/apiError";

export default function SignupPage() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [passwordError, setPasswordError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { isAuthenticated, signup } = useAuth();

	const navigate = useNavigate();

	// Redirect declaratively — calling navigate() during render triggers a
	// "setState while rendering" warning and can loop.
	if (isAuthenticated) {
		return <Navigate to="/dashboard" replace />;
	}

	const handleSignup = async (e: React.FormEvent) => {
		e.preventDefault();
		setPasswordError(null);

		if (!name.trim() || !email.trim() || !password) {
			toast.error("Please fill in all fields.");
			return;
		}

		if (password !== confirmPassword) {
			setPasswordError("Passwords do not match.");
			return;
		}

		try {
			setIsSubmitting(true);
			await signup({
				name,
				email,
				password,
			});
			toast.success("Account created. Please log in.");
			navigate("/login", { replace: true });
		} catch (error) {
			console.error("Failed to signup:", error);
			toast.error(
				getErrorMessage(error, "Sign up failed. Please try again."),
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<>
			<div className="grid grid-cols-12 h-screen relative bg-background text-foreground">
				<Link to="/" className="absolute z-50 top-3 left-3">
					<ArrowLeftCircle className="text-danger" />
				</Link>

				<div className="col-span-12 md:col-span-6">
					<div className="flex flex-col justify-center items-center space-y-5 md:p-20 h-screen">
						<h1 className="font-semibold text-3xl">SIGNUP</h1>

						<form
							onSubmit={handleSignup}
							className="w-full flex flex-col gap-6 flex-[0.5]">
							<div className="flex flex-col gap-1.5">
								<Label htmlFor="name">Username</Label>
								<input
									type="text"
									id="name"
									autoComplete="name"
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="Enter Username"
									className="p-3 w-full lg:min-w-100 rounded-lg border"
								/>
							</div>

							<div className="flex flex-col gap-1.5">
								<Label htmlFor="email">Email</Label>
								<input
									type="email"
									id="email"
									autoComplete="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="Enter Email"
									className="p-3 w-full lg:min-w-100 rounded-lg border"
								/>
							</div>
							<div className="flex flex-col gap-1.5">
								<Label htmlFor="password">Password</Label>
								<input
									type="password"
									id="password"
									autoComplete="new-password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="Set Password"
									className="p-3 w-full lg:min-w-100 rounded-lg border"
								/>
							</div>
							<div className="flex flex-col gap-1.5">
								<Label htmlFor="confirmPassword">Confirm Password</Label>
								<input
									type="password"
									id="confirmPassword"
									autoComplete="new-password"
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									placeholder="Confirm Password"
									aria-invalid={!!passwordError}
									aria-describedby={
										passwordError ? "confirmPassword-error" : undefined
									}
									className="p-3 w-full lg:min-w-100 rounded-lg border"
								/>
								{passwordError && (
									<p
										id="confirmPassword-error"
										role="alert"
										className="text-sm text-danger">
										{passwordError}
									</p>
								)}
							</div>
							<Button
								disabled={isSubmitting}
								variant={"destructive"}
								className="w-full lg:min-w-100 rounded-lg"
								type="submit">
								{isSubmitting ? "SIGNING UP..." : "SIGN UP"}
							</Button>

							<p className="text-center mt-4 text-sm text-muted-foreground">
								Already have an account?
								<Link to="/login" className="text-brand hover:underline">
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
