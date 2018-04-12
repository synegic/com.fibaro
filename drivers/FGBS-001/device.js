'use strict';

const Homey = require('homey');
const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class FibaroUniversalBinarySensor extends ZwaveDevice {
	
	onMeshInit() {
		this._onTrigger = new Homey.FlowCardTriggerDevice('FGBS-001_i1_on');
        this._offTrigger = new Homey.FlowCardTriggerDevice('FGBS-001_i1_off');
        this._switchTrigger = new Homey.FlowCardTriggerDevice('FGBS-001_i1_switch');

        this._i1Condition = new Homey.FlowCardCondition('FGBS-001_i1');
        this._i1Condition
			.register()
			.registerRunListener((args, state) => {
				if (args.device === this) {
					return state === this.getCapabilityValue('alarm_generic.contact1');
				}
				return false;
			});

        this._i2Condition = new Homey.FlowCardCondition('FGBS-001_i2');
        this._i2Condition
            .register()
            .registerRunListener((args, state) => {
                if (args.device === this) {
                    return state === this.getCapabilityValue('alarm_generic.contact2');
                }
                return false;
            });

        /*
    	=========================================================================
         Multichannel report listeners for binary reports (generic_alarm)
    	=========================================================================
         */
        this.registerMultiChannelReportListener(1, 'SENSOR_BINARY', 'SENSOR_BINARY_REPORT', (report) => {
        	let result = report['Sensor Value'] === 'detected an event';
        	this.setCapabilityValue('alarm_generic.contact1', result);
        	return result;
		});
        this.registerMultiChannelReportListener(2, 'SENSOR_BINARY', 'SENSOR_BINARY_REPORT', (report) => {
            let result = report['Sensor Value'] === 'detected an event';
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
			reportParser: (report, node) => {
				if (report['Scene ID'] === 10) {
					if (node &&
                        node.hasOwnProperty('state') &&
                        node.state.hasOwnProperty('alarm_generic.contact1') &&
						!node.state['alarm_generic.contact1']) {
						this._onTrigger.trigger(null, null, node.device_data);
                        this._switchTrigger.trigger(null, null, node.device_data);
                    }

                    return true;
				} else if (report['Scene ID'] === 11) {
                    if (node &&
						node.hasOwnProperty('state') &&
                        node.state.hasOwnProperty('alarm_generic.contact1') &&
                        node.state['alarm_generic.contact1']) {
                        this._offTrigger.trigger(null, null, node.device_data);
                        this._switchTrigger.trigger(null, null, node.device_data);
                    }

                    return false;
                }

                return null;
			}
		});
        this.registerCapability('alarm_generic.contact2', 'SCENE_ACTIVATION', {
            report: 'SCENE_ACTIVATION_SET',
            reportParser: (report, node) => {
                if (report['Scene ID'] === 20) {
                    if (node &&
                        node.hasOwnProperty('state') &&
                        node.state.hasOwnProperty('alarm_generic.contact2') &&
                        !node.state['alarm_generic.contact2']) {
                        this._onTrigger.trigger(null, null, node.device_data);
                        this._switchTrigger.trigger(null, null, node.device_data);
                    }

                    return true;
                } else if (report['Scene ID'] === 21) {
                    if (node &&
                        node.hasOwnProperty('state') &&
                        node.state.hasOwnProperty('alarm_generic.contact2') &&
                        node.state['alarm_generic.contact2']) {
                        this._offTrigger.trigger(null, null, node.device_data);
                        this._switchTrigger.trigger(null, null, node.device_data);
                    }

                    return false;
                }

                return null;
            }
        });

        this.registerCapability('measure_temperature.sensor1', 'SENSOR_MULTILEVEL', {
        	multiChannelNodeId: 3
		});
        this.registerCapability('measure_temperature.sensor2', 'SENSOR_MULTILEVEL', {
            multiChannelNodeId: 4
        });
        this.registerCapability('measure_temperature.sensor3', 'SENSOR_MULTILEVEL', {
            multiChannelNodeId: 5
        });
        this.registerCapability('measure_temperature.sensor4', 'SENSOR_MULTILEVEL', {
            multiChannelNodeId: 6
        });

        this.registerSetting('12', (newValue) => {
        	return new Buffer([Math.round(newValue/16 * 255)]);
		});
    }
	
}

module.exports = FibaroUniversalBinarySensor;