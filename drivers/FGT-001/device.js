'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

// TODO: Make the MultiChannel node 2 (optional bluetooth temperature sensor) report the temperature, currently not possible since the device doesn't report the MultiChannel node unless you change a setting.
// TODO: set battery type in driver.compose.json
class RadiatorThermostat extends ZwaveDevice {

	onMeshInit() {

        this.registerCapability('thermostat_mode', 'THERMOSTAT_MODE', {
            get: 'THERMOSTAT_MODE_GET',
            getOpts: {
                pollInterval: 'poll_interval_thermostat_mode',
                pollMultiplication: 1000,
                getOnOnline: true
            },
			report: 'THERMOSTAT_MODE_REPORT',
            reportParserV2: report => {
                if (!report) return null;
                if (report.hasOwnProperty('Level') && report.Level.hasOwnProperty('Mode')) {
                    return this.heatModeMap(report.Level.Mode);
                }
                return null;
            },
            set: 'THERMOSTAT_MODE_SET',
            setParserV2: value => {
                let mode = this.heatModeMap(value, true);
                return {
                    Level: {
                        'No of Manufacturer Data fields': 0,
                        Mode: mode,
                    },
                    'Manufacturer Data': new Buffer([0])
                };
            }
        });

		this.registerCapability('measure_battery', 'BATTERY', {
			getOpts: {
				pollInterval: 'poll_interval_battery',
				pollMultiplication: 1000,
			},
		});
		this.registerCapability('measure_temperature', 'SENSOR_MULTILEVEL', {
        	getOpts: {
        		pollInterval: 'poll_interval_measure_temperature',
				pollMultiplication: 1000,
			},
			reportParser: (report) => {
                if (report['Sensor Type'] !== 'Temperature (version 1)') return null;
                return report['Sensor Value (Parsed)'];
			},
			reportParserOverride: true
		});

        this.registerCapability('measure_temperature', 'SENSOR_MULTILEVEL', {
            getOpts: {
                pollInterval: 'poll_interval_measure_temperature',
                pollMultiplication: 1000,
            },
        });

		this.registerCapability('target_temperature', 'THERMOSTAT_SETPOINT', {
			getOpts: {
				pollInterval: 'poll_interval_target_temperature',
				pollMultiplication: 1000,
                getOnOnline: true
			},
            report: 'THERMOSTAT_SETPOINT_REPORT',
            set: 'THERMOSTAT_SETPOINT_SET'
		});
	}

    heatModeMap (value, set) {
	    let mode = null;

	    if (set) {
            if (value === 'heat') {
                // Heat best matches fully open valve
                mode = 'MANUFACTURER SPECIFC';
            } else if (value === 'cool' || value === 'off') {
                // Cool and off best matches 'off'
                mode = 'Off';
            } else {
                // Follow setpoint temperature
                mode = 'Heat';
            }
        } else {
            if (value === 'MANUFACTURER SPECIFC') {
                // Valve fully opened
                mode = 'heat';
            } else if (value === 'Heat') {
                // Following setpoint temperature
                mode = 'auto';
            } else if (value === 'Off') {
                // Valve fully closed
                mode = 'off';
            }
        }

        return mode;
    }
}

module.exports = RadiatorThermostat;
