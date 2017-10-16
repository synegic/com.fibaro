'use strict';

const Homey = require('homey');
const Log = require('homey-log').Log;


class FibaroApp extends Homey.App {
	onInit() {
		this.log(`${Homey.manifest.id} running...`);
	}
}

module.exports = FibaroApp;