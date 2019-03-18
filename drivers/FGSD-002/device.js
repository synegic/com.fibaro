'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class FibaroSmokeDetectorDevice extends ZwaveDevice {

	onMeshInit() {
		this.registerCapability('alarm_smoke', 'SENSOR_ALARM', {
			getOnOnline: true
		});
		this.registerCapability('alarm_heat', 'SENSOR_ALARM', {
			getOnOnline: true
		});
		this.registerCapability('measure_temperature', 'SENSOR_MULTILEVEL');
		this.registerCapability('measure_battery', 'BATTERY');
	}

}

module.exports = FibaroSmokeDetectorDevice;
