var Log4nodeModule = require("log4node");

var getLogger = function() {
	
	var logger = new Log4nodeModule.Log4Node(
		{
			level: "debug", 
			file: "chatapp.log"
		}
	);
	
	return logger;
	
}

module.exports = {getLogger};