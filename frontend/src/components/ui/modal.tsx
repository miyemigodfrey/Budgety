import * as React from "react";
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";

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
				className={`
					w-full
					h-full
					sm:h-auto
					sm:max-w-lg
					sm:rounded-3xl
					sm:mx-auto
					sm:my-16
					p-6
					border
					border-gray-100
					flex
					flex-col
					bg-gray-200
					${className}
				`}>
				<DialogHeader>
					{title && <DialogTitle>{title}</DialogTitle>}
					{description && <DialogDescription>{description}</DialogDescription>}
				</DialogHeader>

				<div className="flex-1 overflow-auto mt-6">{children}</div>

				{footer && <DialogFooter>{footer}</DialogFooter>}
			</DialogContent>
		</Dialog>
	);
}
