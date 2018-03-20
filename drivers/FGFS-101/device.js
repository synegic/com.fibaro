'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class FibaroFloodSensor extends ZwaveDevice {
	
	onMeshInit() {
        this.registerCapability('alarm_water', 'SENSOR_ALARM');
        this.registerCapability('alarm_tamper', 'SENSOR_ALARM');
        this.registerCapability('measure_temperature', 'SENSOR_MULTILEVEL', {
            getOpts: {
                getOnOnline: true,
            }
        });
        this.registerCapability('measure_battery', 'BATTERY');

        this.setCapabilityValue('alarm_water', false);
        this.setCapabilityValue('alarm_tamper', false);

        /*
		=====================================================
		General setting registration
		=====================================================
		*/
        this.registerSetting('flood_sensor');
        this.registerSetting('alarm_cancel_status');
        this.registerSetting('flood_signal');
        this.registerSetting('alarm_duration');
        this.registerSetting('alarm_cancellation');
        this.registerSetting('tamper_alarm');

        /*
		=====================================================
		Temperature setting registration
		=====================================================
		*/
        this.registerSetting('temperature_measure_interval');
        this.registerSetting('temperature_measure_hysteresis');
        this.registerSetting('temperature_measure_offset');
        this.registerSetting('low_temperature_threshold');
        this.registerSetting('high_temperature_threshold');
        this.registerSetting('low_temperature_led');
        this.registerSetting('high_temperature_led');
        this.registerSetting('led_indication');
    }
	
}

module.exports = FibaroFloodSensor;