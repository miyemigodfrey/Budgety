"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { X } from "lucide-react";

type Props = {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	trigger?: React.ReactNode;
	title?: React.ReactNode;
	description?: React.ReactNode;
	children?: React.ReactNode;
	footer?: React.ReactNode;
	/** Extra classes on the dialog panel. */
	className?: string;
	/** Panel width on tablet and up (default 480). Phones always get a bottom sheet. */
	maxWidth?: number;
};

/**
 * The app's one dialog: a centred card on tablet and up, a bottom sheet with a
 * grabber on phones (styles: .scrim / .dialog in budgety.css). Built on Radix
 * so focus trapping, Escape and scroll locking come for free. The overlay
 * carries `.app` so the portal gets the design tokens.
 */
export default function UniversalModal({
	open,
	onOpenChange,
	trigger,
	title,
	description,
	children,
	footer,
	className,
	maxWidth,
}: Props) {
	return (
		<DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
			{trigger && <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>}
			<DialogPrimitive.Portal>
				<DialogPrimitive.Overlay className="app app-layer scrim">
					<DialogPrimitive.Content
						className={`dialog ${className ?? ""}`}
						style={maxWidth ? { maxWidth } : undefined}
						{...(description ? {} : { "aria-describedby": undefined })}>
						<span className="grabber" aria-hidden="true" />
						<div className="dialog-h">
							<div className="stack-sm" style={{ gap: 4 }}>
								{title && (
									<DialogPrimitive.Title className="t-h2">{title}</DialogPrimitive.Title>
								)}
								{description && (
									<DialogPrimitive.Description className="t-sm t-muted">
										{description}
									</DialogPrimitive.Description>
								)}
							</div>
							<DialogPrimitive.Close
								className="btn btn-ghost btn-icon btn-sm dialog-x"
								aria-label="Close">
								<X className="ic" />
							</DialogPrimitive.Close>
						</div>
						<div className="dialog-b">{children}</div>
						{footer && <div className="dialog-f">{footer}</div>}
					</DialogPrimitive.Content>
				</DialogPrimitive.Overlay>
			</DialogPrimitive.Portal>
		</DialogPrimitive.Root>
	);
}
