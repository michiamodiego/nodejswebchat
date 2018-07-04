"use strict";

// config
var httpServerPort = 8080;

const HttpModule = require("http");
const ExpressModule = require("express");
const WebSocketModule = require("websocket");
const PathModule = require("path");
const ChatAppModule = require("./model/ChatAppModule.js");

var expressApp = ExpressModule();
expressApp.use(
	"/static", 
	ExpressModule.static(
		PathModule.join(__dirname, "static")
	)
);

expressApp.get("/", function(request, response) {
	
	response.redirect("/static/chat.html");
	
});

var httpServer = HttpModule.createServer(expressApp);
httpServer.listen(httpServerPort);

var webSocketChatHandler = new ChatAppModule.WebSocketChatHandler(
	new WebSocketModule.server(
		{"httpServer": httpServer}
	), 
	ChatAppModule.SimpleChatMessageHandlerChainBuilder( // SimpleChatMessageHandlerChainBuilder is a facade class
		ChatAppModule.ChatMessageHandlerChainBuilder()
	).build(), 
	ChatAppModule.ChatContext()
);

// on cmd close then webSocketChatHandler.stop()
process.on("SIGINT", function () {
	
	webSocketChatHandler.stop();
	
	process.exit(2);
	
});