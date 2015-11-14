/**
 * @overview
 * @author Matthew Caruana Galizia <m@m.cg>
 * @license MIT
 * @copyright Copyright (c) 2013, Matthew Caruana Galizia
 */

'use strict';

/*jshint node:true*/

var tls = require('tls');
var https = require('https');
var inherits = require('util').inherits;

var socksClient = require('socks5-client');

function createConnection(options) {
	var socksSocket, handleSocksConnectToHost;

	socksSocket = socksClient.createConnection(options);

	handleSocksConnectToHost = socksSocket.handleSocksConnectToHost;
	socksSocket.handleSocksConnectToHost = function() {
		options.socket = socksSocket.socket;
		options.servername = options.hostname;

		socksSocket.socket = tls.connect(options, function() {
			// Set negotiated protocols and the 'authorized flag for clients that check it.
			socksSocket.alpnProtocol = socksSocket.socket.alpnProtocol;
			socksSocket.npnProtocol = socksSocket.socket.npnProtocol;
			socksSocket.authorized = socksSocket.socket.authorized;
			handleSocksConnectToHost.call(socksSocket);
			socksSocket.emit('secureConnect');
		});

		socksSocket.socket.on('error', function(err) {
			socksSocket.emit('error', err);
		});
	};

	return socksSocket;
}

function Agent(options) {
	https.Agent.call(this, options);

	this.socksHost = options.socksHost || 'localhost';
	this.socksPort = options.socksPort || 1080;

	this.defaultPort = 443;
	this.protocol = 'https:';

	this.createConnection = createConnection;
}

inherits(Agent, https.Agent);

module.exports = Agent;
