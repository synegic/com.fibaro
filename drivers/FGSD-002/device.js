'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class FibaroSmokeDetectorDevice extends ZwaveDevice {
	
	onMeshInit() {
		this.registerCapability('alarm_smoke', 'NOTIFICATION');
        this.registerCapability('alarm_heat', 'NOTIFICATION');
        this.registerCapability('measure_temperature', 'SENSOR_MULTILEVEL');
        this.registerCapability('measure_battery', 'BATTERY');
    }
	
}

module.exports = FibaroSmokeDetectorDevice;