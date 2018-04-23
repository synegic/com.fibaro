'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class FibaroCODetectorDevice extends ZwaveDevice {
	
	onMeshInit() {
        this.registerCapability('alarm_co', 'NOTIFICATION');
        this.registerCapability('alarm_heat', 'NOTIFICATION');

        this.registerCapability('measure_temperature', 'SENSOR_MULTILEVEL');
        this.registerCapability('measure_battery', 'BATTERY');
    }
	
}

module.exports = FibaroCODetectorDevice;