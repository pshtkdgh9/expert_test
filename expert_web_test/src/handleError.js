export default error => {
	const {
		status,
		message
	} = error;
	switch (status) {
		case 401:
			break;
		case 403:
			break;
		case 404:
			console.log("Error Code : 404", message);
			break;
		case 500:
			break;
		default:
			break;

	}
	return message;
}
