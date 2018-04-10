'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class FibaroWallPlug extends ZwaveDevice {

	async onMeshInit() {
		this.registerCapability('onoff', 'SWITCH_BINARY', {
			getOpts: {
				getOnStart: true
			}
		});
		this.registerCapability('measure_power', 'SENSOR_MULTILEVEL');
		this.registerCapability('meter_power', 'METER');
	}
}

module.exports = FibaroWallPlug;
