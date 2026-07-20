export const formatDate = (date: string | Date) => {
	return new Date(date).toLocaleDateString("en-GB", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});
};
