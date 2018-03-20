'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class FibaroFloodSensor extends ZwaveDevice {
	
	onMeshInit() {
        this.registerCapability('alarm_water', 'SENSOR_ALARM');
        this.registerCapability('alarm_tamper', 'SENSOR_ALARM');
        this.registerCapability('measure_temperature', 'SENSOR_MULTILEVEL');
        this.registerCapability('measure_battery', 'BATTERY');

        this.registerSetting('temperature_measure_hysteresis', value => value * 10);

    }
	
}

module.exports = FibaroFloodSensor;