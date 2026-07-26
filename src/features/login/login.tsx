"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import ClownOne from "@/assets/Clown1.jpg";
import { ArrowLeftCircle } from "lucide-react";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const router = useRouter();
	const searchParams = useSearchParams();

	const from = searchParams.get("from") || "/dashboard";

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!email.trim() || !password) {
			toast.error("Please enter your email and password.");
			return;
		}

		try {
			setIsSubmitting(true);
			const result = await signIn("credentials", {
				email,
				password,
				redirect: false,
			});
			if (result?.error) {
				toast.error("Login failed. Check your email and password.");
				return;
			}
			router.replace(from);
			router.refresh();
		} catch (error) {
			console.error("Login failed:", error);
			toast.error("Login failed. Check your email and password.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<>
			<div className="grid grid-cols-12 h-screen relative bg-background text-foreground">
				<Link href="/" className="absolute z-50 top-3 right-3 ">
					<ArrowLeftCircle className="text-danger" />
				</Link>

				<div className="col-span-6 hidden md:block">
					<div className="h-screen relative overflow-hidden">
						<img
							src={ClownOne.src}
							alt="Login i"
							className="w-full h-full object-cover object-center"
						/>
					</div>
				</div>

				<div className="col-span-12 md:col-span-6">
					<div className="flex flex-col justify-center items-center space-y-5 md:p-20 h-screen">
						<h1 className="font-semibold text-3xl">LOGIN</h1>

						<form
							onSubmit={handleLogin}
							className="w-full flex flex-col gap-6 flex-[0.5]">
							<div className="flex flex-col gap-1.5">
								<Label htmlFor="email">Email</Label>
								<input
									id="email"
									type="email"
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
									id="password"
									type="password"
									autoComplete="current-password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="Enter Password"
									className="p-3 w-full lg:min-w-100 rounded-lg border"
								/>
							</div>
							<Button
								type="submit"
								disabled={isSubmitting}
								variant={"destructive"}
								className="w-full lg:min-w-100 rounded-lg">
								{isSubmitting ? "LOGGING IN..." : "LOGIN"}
							</Button>
						</form>

						<p className="text-center mt-4 text-sm">
							Don't have an account?
							<Link
								href="/signup"
								className=" text-muted-foreground px-0.5 hover:underline">
								Register
							</Link>
						</p>
					</div>
				</div>
			</div>
		</>
	);
}