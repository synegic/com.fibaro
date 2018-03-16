'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class FibaroDoorSensorTwo extends ZwaveDevice {

	onMeshInit() {
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
		this.registerCapability('measure_battery', 'BATTERY');
		this.registerCapability('measure_temperature', 'SENSOR_MULTILEVEL');

		/*
		=====================================================
		General setting registration
		=====================================================
		*/
		this.registerSetting('door_window_state');
		this.registerSetting('association_group_2_triggers');
		this.registerSetting('command_open');
		this.registerSetting('command_close');
		this.registerSetting('command_open_delay');
		this.registerSetting('command_close_delay');

		/*
		=====================================================
		LED indication setting registration
		=====================================================
		*/
		this.registerSetting('led_indications');

		/*
		=====================================================
		Tamper group setting registration
		=====================================================
		*/
		this.registerSetting('tamper_cancellation_delay');
		this.registerSetting('tamper_cancellation');

		/*
		=====================================================
		Temperature group setting registration
		=====================================================
		*/
		this.registerSetting('temperature_report_threshold');
		this.registerSetting('temperature_measuring_interval');
		this.registerSetting('temperature_report_interval');
		this.registerSetting('temperature_offset');
		this.registerSetting('temperature_alarm_reports');
		this.registerSetting('temperature_alarm_high');
		this.registerSetting('temperature_alarm_low');

		/*
		=====================================================
		Z-Wave association group setting registration
		=====================================================
		*/
		this.registerSetting('secure_mode_associations');
	}

}

module.exports = FibaroDoorSensorTwo;
