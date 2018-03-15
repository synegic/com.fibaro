'use strict';

const Homey = require('homey');

class FibaroApp extends Homey.App {
	onInit() {
		this.log(`${Homey.manifest.id} running...`);
	}
}

module.exports = FibaroApp;
