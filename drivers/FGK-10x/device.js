'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class FibaroDoorSensorPlus extends ZwaveDevice {

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

		/*
		=====================================================
		General setting registration
		=====================================================
		*/
		this.registerSetting('operation_mode');
		this.registerSetting('default_alarm_status');
		this.registerSetting('led_indication');

		/*
		=====================================================
		Ta,per group setting registration
		=====================================================
		*/
		this.registerSetting('tamper_alarm_cancellation');
		this.registerSetting('tamper_cancellation');

		/*
		=====================================================
		Temperature group setting registration
		=====================================================
		*/
		this.registerSetting('temperature_measure_interval');
		this.registerSetting('temperature_report_treshold');
		this.registerSetting('temperature_report_interval');
		this.registerSetting('temperature_offset');
	}

}

module.exports = FibaroDoorSensorPlus;
