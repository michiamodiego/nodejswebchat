"use strict";

var UuidModule = require("uuid/v1");
var ChatMessageUtilsModule = require("./utils/chatmessageutils.js");
var LoggerModule = require("./utils/logger.js");

var logger = LoggerModule.getLogger();

/*
	Even though the client and server side models could be shared, 
	expecially in this case where nodejs easies this job, 
	the two models turn out to be completely different ane I prefer to keep them separeted. 
	Something could be done as regards as the prototype of the Array object 
	but I prefer to leave it for a later code refactoring.
	I want to remind you that the code you are reading is just for an example purpose. 
	Furthermore, I am doing it just in the after-work time withouth particular expectations. 
	I have very limited time to do the development of this project but the job-market demands it. 
*/

Array.prototype.indexes = function() {

	var indexList = [ ];

	this.forEach(function(e, i, a) {

		indexList.push(i);

	});

	return indexList;

};

var ChatMessageHandlerChainBuilder = function() {

	var _chatMessageHandlerList = [ ];

	return {
		"addChatMessageHandler": function(chatMessageHandler) {

			_chatMessageHandlerList.push(chatMessageHandler);

			return this;

		}, 
		"build": function() {

			if(_chatMessageHandlerList.length > 0) {

				_chatMessageHandlerList
					.indexes()
					.slice(1)
					.reverse()
					.forEach(function(i) {
						
						_chatMessageHandlerList[i-1]
							.setSuccessor(_chatMessageHandlerList[i]);
						
					});

				return _chatMessageHandlerList[0];

			}

			throw "There is nothing to be built.";

		}

	};

};

var RegExBasedChatMessageProcessor = function(regex, delegate) {

	var _result = null;

	return {
		"supports": function(message) {

			regex.lastIndex = 0;

			_result = regex.exec(message);

			return _result != null && _result.length > 0;

		}, 
		"processMessage": function(message, chatUserSession, chatContext) {

			delegate(
				_result.slice(1), 
				chatUserSession, 
				chatContext
			);

		}
	};

};

var UnknownRequestChatMessageProcessor = function() {
	
	return {
		"supports": function(message) {
			
			return true;
			
		}, 
		"processMessage": function(message, chatUserSession, chatContext) {

			var message = "Unknown command";
			
			chatUserSession.send(
				ChatMessageUtilsModule
					.createErrorMessage(message)
			);
			
		}
	};
	
};

/*
	I am not using inheritance but delegation with duck type.
	Inheritance is BAD, it makes the code more coupled. 
	You should always prefer delegation over inheritance! :)
	Avoid inheritance when possible!
 */
var ChatMessageHandler = function(chatMessageParser) {

	var _successor = null;

	return {
		"setSuccessor": function(chatMessageHandler) {

			_successor = chatMessageHandler;

		}, 
		"handleMessage": function(message, chatUserSession, chatContext) {
			
			if(chatMessageParser.supports(message)) {

				chatMessageParser
					.processMessage(message, chatUserSession, chatContext);

			} else {

				_successor
					.handleMessage(message, chatUserSession, chatContext);

			}

		}

	};

};

function ChangeUsernameMessageProcessorDelegate(data, chatUserSession, chatContext) {
	
	var newUsername = data[0];
	
	logger.debug(newUsername);
	
	if(
		!(
			chatContext
				.getChatUserSessionList()
				.filter(c => newUsername == c.getUsername())
				.length > 0
		)
	) {
		
		chatUserSession.setUsername(newUsername);
		
		var chatMessage = ChatMessageUtilsModule
							.createUserListMessage(
								chatContext
									.getChatUserSessionList()
									.map(c => c.getUsername()
								)
							);
		
		chatContext
			.getChatUserSessionList()
			.forEach(
				c => c.send(chatMessage)
			);
		
		chatUserSession.send(
			ChatMessageUtilsModule
				.createUsernameMessage(newUsername)
		);
		
	} else {
		
		var message = "That username is already in use."; // This variable assignment will be subject to a later code refactoring
		
		chatUserSession.send(
			ChatMessageUtilsModule
				.createErrorMessage(message)
			);
		
	}
	
}

function ChatMessageProcessorDelegate(data, chatUserSession, chatContext) {
	
	var message = data[0];
	var chatMessage = ChatMessageUtilsModule
						.createChatMessage(
							chatUserSession.getUsername(), 
							message
						);
	
	chatContext
		.getChatUserSessionList()
		.forEach(
			c => c.send(
				chatMessage
			)
		);
	
}

function PrivateChatMessageProcessorDelegate(data, chatUserSession, chatContext) {
	
	var message = data[0];
	var sender = data[1];
	var recipient = data[2];
	
	var recipientChatUserSessionList = chatContext
											.getChatUserSessionList()
											.filter(c => recipient == c.getUsername());
	
	if(recipientChatUserSessionList.length > 0) {
		
		var recipientChatUserSession = recipientChatUserSessionList[0];
		
		var chatMessage = ChatMessageUtilsModule
							.createPrivateChatMessage(
								message, 
								sender, 
								recipient
							);
		
		chatUserSession.send(chatMessage);
		recipientChatUserSession.send(chatMessage);
		
	} else {
		
		var message = "TBD";
		
		chatUserSession.send(
			ChatMessageUtilsModule
				.createErrorMessage(message)
		);
		
	}
	
}

function UserListMessageProcessorDelegate(data, chatUserSession, chatContext) {
	
	var chatMessage = ChatMessageUtilsModule
						.createUserListMessage(
							chatContext
							.getChatUserSessionList()
							.map(c => c.getUsername())
						);
	
	chatContext
		.getChatUserSessionList()
		.forEach(
			c => c.send(chatMessage)
		);
	
}

function WhoIAmMessageProcessorDelegate(data, chatUserSession, chatContext) {
	
	var chatMessage = ChatMessageUtilsModule
						.createWhoIAmMessage(
							chatUserSession.getUsername()
						);
	
	chatUserSession.send(chatMessage);
	
}

var SimpleChatMessageHandlerChainBuilder = function(chatMessageHandlerChainBuilder) {
	
	chatMessageHandlerChainBuilder
	.addChatMessageHandler(
			ChatMessageHandler(
					RegExBasedChatMessageProcessor(
							/\/username ([a-z0-9]+)/ig, 
							ChangeUsernameMessageProcessorDelegate
					)
			)
	)
	.addChatMessageHandler(
			ChatMessageHandler(
					RegExBasedChatMessageProcessor(
							/\/message (.+)/ig, 
							ChatMessageProcessorDelegate
					)
			)
	)
	.addChatMessageHandler(
			ChatMessageHandler(
					RegExBasedChatMessageProcessor(
							/\/pvt (.+) \/sender ([a-z0-9]+) \/recipient ([a-z0-9]+)/ig, 
							PrivateChatMessageProcessorDelegate
					)
			)
	)
	.addChatMessageHandler(
			ChatMessageHandler(
					RegExBasedChatMessageProcessor(
							/\/userlist/ig, 
							UserListMessageProcessorDelegate
					)
			)
	)
	.addChatMessageHandler(
			ChatMessageHandler(
					RegExBasedChatMessageProcessor(
							/\/whoiam/ig, 
							WhoIAmMessageProcessorDelegate
					)
			)
	)
	.addChatMessageHandler(
		ChatMessageHandler(
			UnknownRequestChatMessageProcessor()
		)
	)
	;
	
	return {
		"addChatMessageHandler": function(chatMessageHandler) {

			chatMessageHandlerChainBuilder
				.addChatMessageHandler(chatMessageHandler);

			return this;

		}, 
		"build": function() {

			return chatMessageHandlerChainBuilder
						.build();

		}
	};

};

var ChatUserSession = function(connection, chatMessageHandler) {
	
	var _id = UuidModule();
	var _chatContext = null;
	var _username = "Guest" +  Math.round(Math.random() * 1000000);
	
	var chatUserSession = {
		"getId": function() {
			
			return _id;
			
		}, 
		"setChatContext": function(chatContext) {
			
			_chatContext = chatContext;
			
		}, 
		"send": function(message) {
			
			connection.sendUTF(message);
			
		}, 
		"getUsername": function() {
			
			return _username;
			
		}, 
		"setUsername": function(username) {
			
			_username = username;
			
		}, 
		"close": function() {
			
			logger.debug("closing...");
			
			connection.close();
			
		}
	};
	
	connection.on("message", function(message) {
		
		if(message.type != "utf8") {
			
			logger.debug("The message is a binary message. Not handled!");
			
			connection.close();
			
		}
		
		chatMessageHandler
			.handleMessage(
				message.utf8Data, 
				chatUserSession, 
				_chatContext
			);
		
	});
	
	connection.on("close", function(connection) {
		
		_chatContext
			.removeChatUserSession(
				chatUserSession
			);
		
	});
	
	return chatUserSession;
	
};

var ChatContext = function() {
	
	var _chatUserSessionList = [ ];
	var _observer = null;
	
	var updateObserver = function(event) {
		
		if(_observer != null) {
			
			_observer(event);	
			
		}
		
	};
	
	var chatContext = {
		"addChatUserSession": function(chatUserSession) {
			
			chatUserSession.setChatContext(this);
			
			_chatUserSessionList.push(chatUserSession);
		
			// An improvised Observer pattern implementation ;) : This is the most beatiful thing of ECMAScript (aka JavaScript)
			var event = {
				"type": "UserAdded", 
				data: chatUserSession
			};
			
			updateObserver(event);
			
		}, 
		"removeChatUserSession": function(chatUserSession) {
			
			_chatUserSessionList
				.splice(
					_chatUserSessionList.indexOf(chatUserSession), 
					1
				);
			
			chatUserSession.setChatContext(null);
			
			var event = {
				"type": "UserRemoved", 
				data: chatUserSession
			};
			
			updateObserver(event);
			
		}, 
		"getChatUserSessionList": function() {
			
			return _chatUserSessionList.slice();
			
		}, 
		"setObserver": function(observer) {
			
			_observer = observer;
			
		}
	};
	
	return chatContext;
	
};

var WebSocketChatHandler = function(webSocketServer, chatMessageHandler, chatContext) {
	
	chatContext.setObserver(function(event) {
		
		var username = event.data.getUsername();
		
		var chatMessage = event.type == "UserAdded" ? 
			ChatMessageUtilsModule
				.createJoinMessage(username) 
			: ChatMessageUtilsModule
				.createQuitMessage(username);
		
		chatContext
			.getChatUserSessionList()
			.filter(c => username != c.getUsername)
			.forEach(c => c.send(chatMessage));
		
	});

	webSocketServer.on("request", function(request) {
		
		chatContext.addChatUserSession(
			ChatUserSession(
				request.accept(null, request.origin), 
				chatMessageHandler
			)
		);
		
	});
	
	var webSocketChatHandler = {
		"stop": function() {
			
			webSocketServer.on("request", function(request) {
				
				request.reject();
				
			});
			
			var chatMessage = ChatMessageUtilsModule
								.createCloseMessage();
			
			chatContext
				.getChatUserSessionList()
				.forEach(c => c.send(chatMessage));
			
			chatContext
				.getChatUserSessionList()
				.forEach(c => c.close());
			
		}
	};
	
	return webSocketChatHandler;
	
};

module.exports = {
	WebSocketChatHandler, 
	ChatContext, 
	ChatMessageHandlerChainBuilder, 
	SimpleChatMessageHandlerChainBuilder
};