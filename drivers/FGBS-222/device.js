'use strict';

const Homey = require('homey');
const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class FibaroSmartImplant extends ZwaveDevice {

	onMeshInit() {
		// this.printNode();

		// Settings:
		// Input 1 mode
		// Input 2 mode
		// Input 1 Button mode
		// Input 2 Button mode

		// alarm_generic.input1 OR measure_voltage.input1 OR button.input1
		// alarm_generic.input2 OR measure_voltage.input2 OR button.input2
		// onoff.output1
		// onoff.output2
		// measure_temperature.internal
		// measure_temperature.external1
		// measure_temperature.external2
		// measure_temperature.external3
		// measure_temperature.external4
		// measure_temperature.external5
		// measure_temperature.external6
		// measure_humidty

		//console.log('ROOT NODE', this.node.CommandClass);

		Object.keys(this.node.MultiChannelNodes).forEach(id => {
			console.log(id, Object.keys(this.node.MultiChannelNodes[id].CommandClass))
		})

		this.registerCapabilityListener('onoff.output1', (value, opts) => {
			console.log('onoff1', value);
			// return this.node.MultiChannelNodes['5'].CommandClass.COMMAND_CLASS_BASIC.BASIC_SET(value ? 0 : 255); //set true or false
			return this.node.CommandClass.COMMAND_CLASS_BASIC.BASIC_SET(value ? 0 : 255); //set true or false
		})

		this.node.CommandClass.COMMAND_CLASS_NOTIFICATION.on('report', (command, report) => {
			console.log('root notification report', report);
			if (report.Event === 0) { this.setCapabilityValue('alarm_generic.input1', false); }
			else if (report.Event === 2) { this.setCapabilityValue('alarm_generic.input1', true); }
		});

		// This handles both scenes from input 1 and 2
		this.node.CommandClass.COMMAND_CLASS_CENTRAL_SCENE.on('report', (command, report) => {
			console.log('root scene report', report);
			// trigger een flow scene
		});

		// this.node.MultiChannelNodes['2'].CommandClass.COMMAND_CLASS_NOTIFICATION.on('report', () => {
		// 	console.log('CHANNEL 2 notification report', report);
		// });
	}
}

module.exports = FibaroSmartImplant;
