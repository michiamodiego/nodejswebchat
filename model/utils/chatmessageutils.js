var createUserListMessage = function(userList) {
	
	var chatMessageList = [ ];
	
	chatMessageList.push("/userlist");
	chatMessageList.push(userList.join(", "));
	
	return chatMessageList.join(" ");
	
};

var createUsernameMessage = function(username) {
	
	var chatMessageList = [];
	
	chatMessageList.push("/username");
	chatMessageList.push(username);
	
	return chatMessageList.join(" ");
	
};

var createErrorMessage = function(message) {
	
	var chatMessageList = [ ];
	
	chatMessageList.push("/error");
	chatMessageList.push(message);
	
	return chatMessageList.join(" ");
	
};

var createChatMessage = function(sender, message) {
	
	var chatMessageList = [ ];
	
	chatMessageList.push("/message");
	chatMessageList.push(message);
	chatMessageList.push("/sender");
	chatMessageList.push(sender);
	
	return chatMessageList.join(" ");
	
};

var createPrivateChatMessage = function(message, sender, recipient) {
	
	var chatMessageList = [ ];
	
	chatMessageList.push("/pvt");
	chatMessageList.push(message);
	chatMessageList.push("/sender");
	chatMessageList.push(sender);
	chatMessageList.push("/recipient");
	chatMessageList.push(recipient);
	
	return chatMessageList.join(" ");
	
};

var createWhoIAmMessage = function(username) {
	
	var chatMessageList = [ ];
	
	chatMessageList.push("/whoiam");
	chatMessageList.push(username);
	
	return chatMessageList.join(" ");
	
};

var createJoinMessage = function(username) {
	
	var chatMessageList = [ ];
	
	chatMessageList.push("/join");
	chatMessageList.push(username);
	
	return chatMessageList.join(" ");
	
};

var createQuitMessage = function(username) {
	
	var chatMessageList = [ ];
	
	chatMessageList.push("/quit");
	chatMessageList.push(username);
	
	return chatMessageList.join(" ");
	
};

var createCloseMessage = function() {
	
	return "/close";
	
};

module.exports = {
	createUserListMessage, 
	createUsernameMessage, 
	createErrorMessage, 
	createChatMessage, 
	createPrivateChatMessage, 
	createWhoIAmMessage, 
	createJoinMessage, 
	createQuitMessage, 
	createCloseMessage
};