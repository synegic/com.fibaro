'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class FibaroMotionSensor extends ZwaveDevice {
	async onMeshInit() {
		this.registerCapability('alarm_tamper', 'SENSOR_ALARM');
		this.registerCapability('alarm_motion', 'SENSOR_BINARY');
		this.registerCapability('measure_luminance', 'SENSOR_MULTILEVEL');
		this.registerCapability('measure_battery', 'BATTERY');
		this.registerCapability('measure_temperature', 'SENSOR_MULTILEVEL', {
			getOpts: {
				getOnOnline: true,
				getOnStart: false,
			},
		});

		/*
		=====================================================
		Motion sensor group setting registration
		=====================================================
		*/
		this.registerSetting('motion_sensor_sensitivity');
		this.registerSetting('motion_sensor_blindtime');
		this.registerSetting('motion_cancellation_delay');
		this.registerSetting('day_night');
		this.registerSetting('day_night_threshold');
		this.registerSetting('basic_command_config');
		this.registerSetting('basic_on_command');
		this.registerSetting('basic_off_command');

		/*
		=====================================================
		Tamper alarm group setting registration
		=====================================================
		*/
		this.registerSetting('tamper_sensitivity');
		this.registerSetting('tamper_cancellation_delay');
		this.registerSetting('tamper_operating_mode');

		/*
		=====================================================
		Illumination group setting registration
		=====================================================
		*/
		this.registerSetting('illumination_report_threshold');
		this.registerSetting('illumination_report_interval');

		/*
		=====================================================
		Temperature group setting registration
		=====================================================
		*/
		this.registerSetting('temperature_report_threshold');
		this.registerSetting('temperature_measuring_interval');
		this.registerSetting('temperature_report_interval');
		this.registerSetting('temperature_offset');
		this.registerSetting('temperature_blue');
		this.registerSetting('temperature_red');

		/*
		=====================================================
		LED indicator group setting registration
		=====================================================
		*/
		this.registerSetting('led_signaling_mode');
		this.registerSetting('led_brightness');
		this.registerSetting('led_ambient_1');
		this.registerSetting('led_ambient_100');
		this.registerSetting('led_indicating_tamper_alarm');
	}
}

module.exports = FibaroMotionSensor;
