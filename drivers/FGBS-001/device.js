'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class FibaroUniversalBinarySensor extends ZwaveDevice {
	
	onMeshInit() {
		this.registerCapability('alarm_generic.contact1', 'SENSOR_BINARY', {
			multiChannelNodeId: 1,
			get: 'SENSOR_BINARY_GET',
			report: 'SENSOR_BINARY_REPORT',
			reportParser: report => report['Sensor Value'] === 'detected an event',
		});
		this.registerCapability('alarm_generic.contact1', 'SCENE_ACTIVATION', {
			report: 'SCENE_ACTIVATION_SET',
			reportParser: (report, node) => {
				if (report['Scene ID'] === 10) {
					if (node &&
						node.state.hasOwnProperty('alarm_generic.contact1') &&
						!node.state['alarm_generic.contact1']) {

					}
				}
			}
		});

        this.registerCapability('alarm_generic.contact2', '');

        this.registerCapability('measure_temperature.sensor1', '');
        this.registerCapability('measure_temperature.sensor2', '');
        this.registerCapability('measure_temperature.sensor3', '');
        this.registerCapability('measure_temperature.sensor4', '');

        this.registerSetting('12', (newValue) => {
        	return new Buffer([Math.round(newValue/16 * 255)]);
		});
    }
	
}

module.exports = FibaroUniversalBinarySensor;