import { useState } from "react";
import { updateSource, type SourceId } from "@/api/sources";

// EditSourceModal.tsx
type Props = {
	source: SourceId;
	onClose: () => void;
	onUpdated: (data: SourceId) => void;
};

export default function EditSourceModal({ source, onClose, onUpdated }: Props) {
	const [name, setName] = useState(source.name);
	const [balance, setBalance] = useState(source.balance);

	const handleUpdate = async () => {
		const updated = await updateSource(source.id, {
			name,
			balance,
		});

		onUpdated(updated);
		onClose();
	};

	return (
		<div className="bg-white p-4 rounded shadow">
			<input value={name} onChange={(e) => setName(e.target.value)} />
			<input
				type="number"
				value={balance}
				onChange={(e) => setBalance(Number(e.target.value))}
			/>

			<button onClick={handleUpdate}>Save</button>
			<button onClick={onClose}>Cancel</button>
		</div>
	);
}
