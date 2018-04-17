'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class FibaroWallPlugPlus extends ZwaveDevice {
	
	onMeshInit() {
        this.registerCapability('onoff', 'SWITCH_BINARY');
        this.registerCapability('measure_power', 'SENSOR_MULTILEVEL');
        this.registerCapability('meter_power', 'METER');

        this.registerSetting('kwh_threshold_report', (value) => {
        	return new Buffer([value * 100]);
		});
	}
	
}

module.exports = FibaroWallPlugPlus;