'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class FibaroDoorSensor extends ZwaveDevice {

	async onMeshInit() {

		this.enableDebug();

		this.registerCapability('alarm_contact', 'NOTIFICATION', {
			getOpts: {
				getOnOnline: true,
			},
		});
		this.registerCapability('alarm_tamper', 'NOTIFICATION', {
			getOpts: {
				getOnOnline: true,
			},
		});
		this.registerCapability('measure_temperature', 'SENSOR_MULTILEVEL');
		this.registerCapability('measure_battery', 'BATTERY');

		this.registerSetting('operation_mode');
		this.registerSetting('default_alarm_status');
		this.registerSetting('led_indication');
		this.registerSetting('tamper_alarm_cancellation');
		this.registerSetting('tamper_cancellation');
		this.registerSetting('temperature_measure_interval');
		this.registerSetting('temperature_report_treshold');
		this.registerSetting('temperature_report_interval');
		this.registerSetting('temperature_offset');
	}

}

module.exports = FibaroDoorSensor;
