'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class FibaroMotionSensorPlus extends ZwaveDevice {
	async onMeshInit() {
		this.registerCapability('alarm_tamper', 'NOTIFICATION', {
			getOpts: {
				getOnOnline: true,
			},
		});
		this.registerCapability('alarm_motion', 'NOTIFICATION', {
			getOpts: {
				getOnOnline: true,
			},
		});
		this.registerCapability('measure_luminance', 'SENSOR_MULTILEVEL', {
			getOpts: {
				getOnOnline: true,
			},
		});
		this.registerCapability('measure_temperature', 'SENSOR_MULTILEVEL', {
			getOpts: {
				getOnOnline: true,
				getOnStart: false,
			},
		});
		this.registerCapability('measure_battery', 'BATTERY');

		/*
		=====================================================
		Motion sensor group setting registration
		=====================================================
		*/
		this.registerSetting('motion_sensor_sensitivity');
		this.registerSetting('motion_sensor_blindtime');
		this.registerSetting('motion_pulse_counter');
		this.registerSetting('motion_detection_time_window');
		this.registerSetting('motion_cancellation_delay');
		this.registerSetting('motion_pulse_counter');
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
		this.registerSetting('tamper_operating mode');
		this.registerSetting('tamper_cancellation');
		this.registerSetting('tamper_broadcast_mode');
		this.registerSetting('tamper_broadcast_mode_backward_compatible');

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
		this.registerSetting('temperature_measuring_threshold');
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
		this.registerSetting('let_indicating_tamper_alarm');

		/*
		=====================================================
		Z-Wave association group setting registration
		=====================================================
		*/
		this.registerSetting('secure_mode_associations');
	}
}

module.exports = FibaroMotionSensorPlus;
