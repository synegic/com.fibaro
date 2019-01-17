'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class FibaroRollerShutterDevice extends ZwaveDevice {

	onMeshInit() {
		this.registerCapability('dim', 'SWITCH_MULTILEVEL');
	}

}

module.exports = FibaroRollerShutterDevice;
