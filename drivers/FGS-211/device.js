'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class FibaroRelaySwitchDevice extends ZwaveDevice {
	
	onMeshInit() {
		this.registerCapability('onoff', 'SWITCH_BINARY', {
			setParser: (value) => {
				return {
					'Switch Value': (value > 0) ? 255 : 0
				}
			}
		});
	}
	
}

module.exports = FibaroRelaySwitchDevice;