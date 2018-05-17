'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class FibaroRollerShutter24Device extends ZwaveDevice {
	
	onMeshInit() {
		this.registerCapability('windowcoverings_state', 'SWITCH_BINARY');
		this.registerCapability('dim', 'SWITCH_MULTILEVEL');
		this.registerCapability('measure_power', 'SENSOR_MULTILEVEL');
		this.registerCapability('meter_power', 'METER');
	}
	
}

module.exports = FibaroRollerShutter24Device;