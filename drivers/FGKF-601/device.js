'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class MyDevice extends ZwaveDevice {
	
	onMeshInit() {
		this.registerCapability('measure_battery', 'BATTERY');
	}
	
}

module.exports = MyDevice;