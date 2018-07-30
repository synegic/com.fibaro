'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class FibaroRelaySwitchTwoDevice extends ZwaveDevice {

	onMeshInit() {
		this.registerCapability('onoff', 'SWITCH_BINARY');
	}

}

module.exports = FibaroRelaySwitchTwoDevice;
