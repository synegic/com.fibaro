'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class FibaroDoubleSwitchDevice extends ZwaveDevice {

	onMeshInit() {
		console.log(this.node.MultiChannelNodes)

		this.registerCapability('onoff', 'SWITCH_BINARY');
		// this.registerCapability('onoff', 'SWITCH_BINARY', {
		// 	multiChannelNodeId: 1
		// });
	}

}

module.exports = FibaroDoubleSwitchDevice;
