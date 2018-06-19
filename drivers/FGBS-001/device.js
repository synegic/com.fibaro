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
		this.registerMultiChannelReportListener(1, 'SENSOR_BINARY', 'SENSOR_BINARY_REPORT', (report) => {
			const result = report['Sensor Value'] === 'detected an event';
			this.setCapabilityValue('alarm_generic.contact1', result);
			return result;
		});
		this.registerMultiChannelReportListener(2, 'SENSOR_BINARY', 'SENSOR_BINARY_REPORT', (report) => {
			const result = report['Sensor Value'] === 'detected an event';
			this.setCapabilityValue('alarm_generic.contact2', result);
			return result;
		});

		/*
    	=========================================================================
         Mapping alarm_generic capabilities to scene activation commands
    	=========================================================================
         */
		this.registerCapability('alarm_generic.contact1', 'SCENE_ACTIVATION', {
			report: 'SCENE_ACTIVATION_SET',
			reportParser: (report) => this._alarmGenericReportParser(report, 1),
		});
		this.registerCapability('alarm_generic.contact2', 'SCENE_ACTIVATION', {
			report: 'SCENE_ACTIVATION_SET',
			reportParser: (report) => this._alarmGenericReportParser(report, 2),
		});

		/*
    	=========================================================================
         Mapping measure_temperature capabilities to sensor multilevel commands
    	=========================================================================
         */
		this.registerCapability('measure_temperature.sensor1', 'SENSOR_MULTILEVEL', {
			multiChannelNodeId: 3,
			reportParser: (report) => this._temperatureReportParser(report, 1),
		});
		this.registerCapability('measure_temperature.sensor2', 'SENSOR_MULTILEVEL', {
			multiChannelNodeId: 4,
			reportParser: (report) => this._temperatureReportParser(report, 2),
		});
		this.registerCapability('measure_temperature.sensor3', 'SENSOR_MULTILEVEL', {
			multiChannelNodeId: 5,
			reportParser: (report) => this._temperatureReportParser(report, 3),
		});
		this.registerCapability('measure_temperature.sensor4', 'SENSOR_MULTILEVEL', {
			multiChannelNodeId: 6,
			reportParser: (report) => this._temperatureReportParser(report, 4),
		});

		this.registerSetting('12', (newValue) => new Buffer([Math.round(newValue / 16 * 255)]));
	}

	_alarmGenericReportParser(report, sensorNumber) {
		let sceneIdOn;
		let sceneIdOff;
		let onTrigger;
		let offTrigger;
		let switchTrigger;

		switch (sensorNumber) {
			case 1: sceneIdOn = 10;
				sceneIdOff = 11;
				onTrigger = this._onTrigger;
				offTrigger = this._offTrigger;
				switchTrigger = this._switchTrigger;
				break;
			case 2: sceneIdOn = 20;
				sceneIdOff = 21;
				onTrigger = this._onTrigger2;
				offTrigger = this._offTrigger2;
				switchTrigger = this._switchTrigger2;
				break;
		}

		if (report['Scene ID'] === sceneIdOn) {
			if (node &&
                node.hasOwnProperty('state') &&
                node.state.hasOwnProperty('alarm_generic.contact2') &&
                !node.state['alarm_generic.contact2']) {
				onTrigger.trigger(this, null, node.device_data);
				switchTrigger.trigger(this, null, node.device_data);
			}

			return true;
		} else if (report['Scene ID'] === sceneIdOff) {
			if (node &&
                node.hasOwnProperty('state') &&
                node.state.hasOwnProperty('alarm_generic.contact2') &&
                node.state['alarm_generic.contact2']) {
				offTrigger.trigger(this, null, node.device_data);
				switchTrigger.trigger(this, null, node.device_data);
			}

			return false;
		}

		return null;
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

			if (node &&
                node.hasOwnProperty('state') &&
                node.state.hasOwnProperty('measure_temperature.sensor1') &&
                node.state['measure_temperature.sensor1'] !== report['Sensor Value (Parsed)']) {

				const token = {
					temp: report['Sensor Value (Parsed)'],
				};

				temperatureTrigger.trigger(this, token, node.device_data);
			}

			return report['Sensor Value (Parsed)'];
		}

		return null;
	}
}

module.exports = FibaroUniversalBinarySensor;
