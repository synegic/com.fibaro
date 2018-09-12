'use strict';

const Homey = require('homey');
const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class FibaroUniversalBinarySensor extends ZwaveDevice {

	onMeshInit() {
		/*
        =========================================================================
         Initializing Flow triggers/conditions/actions
        =========================================================================
         */

		this.enableDebug();
		this.printNode();

		this._onTrigger = new Homey.FlowCardTriggerDevice('FGBS-001_i1_on').register();
		this._offTrigger = new Homey.FlowCardTriggerDevice('FGBS-001_i1_off').register();
		this._switchTrigger = new Homey.FlowCardTriggerDevice('FGBS-001_i1_switch').register();

		this._i1Condition = new Homey.FlowCardCondition('FGBS-001_i1');
		this._i1Condition
			.register()
			.registerRunListener((args, state) => {
				if (args.device === this) {
					return state === this.getCapabilityValue('alarm_generic.contact1');
				}
				return false;
			});

		this._onTrigger2 = new Homey.FlowCardTriggerDevice('FGBS-001_i2_on').register();
		this._offTrigger2 = new Homey.FlowCardTriggerDevice('FGBS-001_i2_off').register();
		this._switchTrigger2 = new Homey.FlowCardTriggerDevice('FGBS-001_i2_switch').register();

		this._i2Condition = new Homey.FlowCardCondition('FGBS-001_i2');
		this._i2Condition
			.register()
			.registerRunListener((args, state) => {
				if (args.device === this) {
					return state === this.getCapabilityValue('alarm_generic.contact2');
				}
				return false;
			});

		this._temperatureTrigger = new Homey.FlowCardTriggerDevice('FGBS-001_temp1').register();
		this._temperatureTrigger2 = new Homey.FlowCardTriggerDevice('FGBS-001_temp2').register();
		this._temperatureTrigger3 = new Homey.FlowCardTriggerDevice('FGBS-001_temp3').register();
		this._temperatureTrigger4 = new Homey.FlowCardTriggerDevice('FGBS-001_temp4').register();

		/*
    	=========================================================================
         Multichannel report listeners for binary reports (generic_alarm)
    	=========================================================================
         */

		// Register capability to get value during boot
		this.registerCapability('alarm_generic.contact1', 'BASIC', {
			multiChannelNodeId: 1,
			get: 'BASIC_GET',
			getOpts: {
				getOnStart: true,
			},
			report: 'BASIC_REPORT',
			reportParser: report => {
				if (report && report.hasOwnProperty('Value')) {
					return report['Value'] > 0;
				}
				return null;
			}
		});

		// Listen for input changes
		this.registerMultiChannelReportListener(1, 'BASIC', 'BASIC_SET', (report) => {
			const result = report.Value > 0;

			this._switchTrigger.trigger(this, null, this.device_data);

			if (result)	this._onTrigger.trigger(this, null, this.device_data);
			else this._offTrigger.trigger(this, null, this.device_data);

			this.setCapabilityValue('alarm_generic.contact1', result);
			return result;
		});

		// Register capability to get value during boot
		this.registerCapability('alarm_generic.contact1', 'BASIC', {
			multiChannelNodeId: 2,
			get: 'BASIC_GET',
			getOpts: {
				getOnStart: true,
			},
			report: 'BASIC_REPORT',
			reportParser: report => {
				if (report && report.hasOwnProperty('Value')) {
					return report['Value'] > 0;
				}
				return null;
			}
		});

		// Listen for input changes
		this.registerMultiChannelReportListener(2, 'BASIC', 'BASIC_SET', (report) => {
			const result = report.Value > 0;

			this._switchTrigger2.trigger(this, null, this.device_data);

			if (result)	this._onTrigger2.trigger(this, null, this.device_data);
			else this._offTrigger2.trigger(this, null, this.device_data);

			this.setCapabilityValue('alarm_generic.contact2', result);
			return result;
		});

		/*
    	=========================================================================
         Mapping measure_temperature capabilities to sensor multilevel commands
    	=========================================================================
         */
		this.registerCapability('measure_temperature.sensor1', 'SENSOR_MULTILEVEL', {
			multiChannelNodeId: 3,
			get: 'SENSOR_MULTILEVEL_GET',
			getOpts: {
				getOnStart: true,
			},
			getParser: () => ({
				'Sensor Type': 'Temperature (version 1)',
				Properties1: {
					Scale: 0,
				},
			}),
			reportParser: (report) => this._temperatureReportParser(report, 1),
			reportParserOverride: true,
		});
		this.registerCapability('measure_temperature.sensor2', 'SENSOR_MULTILEVEL', {
			multiChannelNodeId: 4,
			get: 'SENSOR_MULTILEVEL_GET',
			getOpts: {
				getOnStart: true,
			},
			getParser: () => ({
				'Sensor Type': 'Temperature (version 1)',
				Properties1: {
					Scale: 0,
				},
			}),
			reportParser: (report) => this._temperatureReportParser(report, 2),
			reportParserOverride: true,
		});
		this.registerCapability('measure_temperature.sensor3', 'SENSOR_MULTILEVEL', {
			multiChannelNodeId: 5,
			getOpts: {
				getOnStart: true,
			},
			getParser: () => ({
				'Sensor Type': 'Temperature (version 1)',
				Properties1: {
					Scale: 0,
				},
			}),
			get: 'SENSOR_MULTILEVEL_GET',
			reportParser: (report) => this._temperatureReportParser(report, 3),
			reportParserOverride: true,
		});
		this.registerCapability('measure_temperature.sensor4', 'SENSOR_MULTILEVEL', {
			multiChannelNodeId: 6,
			get: 'SENSOR_MULTILEVEL_GET',
			getOpts: {
				getOnStart: true,
			},
			getParser: () => ({
				'Sensor Type': 'Temperature (version 1)',
				Properties1: {
					Scale: 0,
				},
			}),
			reportParser: (report) => this._temperatureReportParser(report, 4),
			reportParserOverride: true,
		});

		this.registerSetting('12', (newValue) => new Buffer([Math.round(newValue / 16 * 255)]));
	}

	_temperatureReportParser(report, sensorNumber) {
		let temperatureTrigger;

		switch (sensorNumber) {
			case 1: temperatureTrigger = this._temperatureTrigger; break;
			case 2: temperatureTrigger = this._temperatureTrigger2; break;
			case 3: temperatureTrigger = this._temperatureTrigger3; break;
			case 4: temperatureTrigger = this._temperatureTrigger4; break;
		}

		if (report['Sensor Type'] === 'Temperature (version 1)') {

			const token = {
				temp: report['Sensor Value (Parsed)'],
			};

			temperatureTrigger.trigger(this, token, this.device_data);

			return report['Sensor Value (Parsed)'];
		}

		return null;
	}
}

module.exports = FibaroUniversalBinarySensor;
