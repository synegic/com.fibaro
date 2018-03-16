'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class FibaroDoorSensor extends ZwaveDevice {

	async onMeshInit() {

		this.enableDebug();

		this.registerCapability('alarm_contact', 'BASIC', {
			getOpts: {
				getOnOnline: true,
			},
		});
		this.registerCapability('alarm_tamper', 'SENSOR_ALARM', {
			getOpts: {
				getOnOnline: true,
			},
		});
		this.registerCapability('measure_temperature', 'SENSOR_MULTILEVEL');
		this.registerCapability('measure_battery', 'BATTERY');

		this.registerSetting('input_alarm_cancellation_delay');
		this.registerSetting('led_status');
		this.registerSetting('type_input');
		this.registerSetting('temperature_measure_hystersis');
	}

}

module.exports = FibaroDoorSensor;
