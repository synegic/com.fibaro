'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class FibaroDoubleSwitchDevice extends ZwaveDevice {

	onMeshInit() {
		if (!this.node.isMultiChannelNode) {
			this.registerCapability('onoff', 'SWITCH_BINARY');
		} else {
			this.registerCapability('onoff', 'SWITCH_BINARY', {
            	multiChannelNodeId: 2,
			});
		}
	}

}

module.exports = FibaroDoubleSwitchDevice;
