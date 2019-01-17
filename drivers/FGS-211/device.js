'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class FibaroRelaySwitchDevice extends ZwaveDevice {

	onMeshInit() {
		this.registerCapability('onoff', 'SWITCH_BINARY');
	}

}

module.exports = FibaroRelaySwitchDevice;
