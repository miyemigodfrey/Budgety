import * as React from "react";
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
	DialogClose,
} from "@/components/ui/dialog";
import { ArrowLeft } from "lucide-react";

type Props = {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	trigger?: React.ReactNode;
	title?: React.ReactNode;
	description?: React.ReactNode;
	children?: React.ReactNode;
	footer?: React.ReactNode;
	className?: string;
};

export default function UniversalModal({
	open,
	onOpenChange,
	trigger,
	title,
	description,
	children,
	footer,
	className,
}: Props) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			{trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

			<DialogContent
				// The default close button is absolutely positioned and collides
				// with the title, so we render our own inline in the header row.
				showCloseButton={false}
				className={`
					w-full
					h-full
					sm:h-fit
					sm:max-w-lg
					sm:rounded-3xl
					sm:mx-auto
					sm:my-16
					p-6
					border
					border-border
					flex
					flex-col
					bg-surface-sunken
					${className}
				`}>
				<DialogHeader className="space-y-0">
					<div className="flex items-start gap-3">
						<DialogClose
							aria-label="Close"
							className="mt-0.5 shrink-0 rounded-md text-muted-foreground opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
							<ArrowLeft className="size-5" />
						</DialogClose>

						<div className="min-w-0 flex-1 text-left">
							{title && <DialogTitle>{title}</DialogTitle>}
							{description && (
								<DialogDescription className="mt-1">
									{description}
								</DialogDescription>
							)}
						</div>
					</div>
				</DialogHeader>

				<div className="flex-1 overflow-auto mt-6">{children}</div>

				{footer && <DialogFooter>{footer}</DialogFooter>}
			</DialogContent>
		</Dialog>
	);
}
