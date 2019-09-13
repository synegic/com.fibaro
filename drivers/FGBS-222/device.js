'use strict';

const Homey = require('homey');
const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class FibaroSmartImplant extends ZwaveDevice {

	onMeshInit() {
		// this.printNode();
		this.enableDebug();

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
			this.log(id, Object.keys(this.node.MultiChannelNodes[id].CommandClass))
		});

		// TODO: Check confog to determine which capability is being used, or use only generic input stuff
		this.registerCapability('alarm_generic.input1', 'ALARM_GENERIC', { multiChannelNodeId: 1 });
		this.registerCapability('alarm_generic.input2', 'ALARM_GENERIC', { multiChannelNodeId: 2 });

		this.registerCapability('measure_voltage.input1', 'SENSOR_MULTILEVEL', { multiChannelNodeId: 3 });
		this.registerCapability('measure_voltage.input2', 'SENSOR_MULTILEVEL', { multiChannelNodeId: 4 });

		this.registerCapability('onoff.output1', 'SWITCH_BINARY', { multiChannelNodeId: 5 });
		this.registerCapability('onoff.output2', 'SWITCH_BINARY', { multiChannelNodeId: 6 });

		this.registerCapability('measure_temperature.internal', 'SENSOR_MULTILEVEL', { multiChannelNodeId: 7});
		if (this.node.MultiChannelNodes.hasOwnProperty('8')) this.registerCapability('measure_temperature.external1', 'SENSOR_MULTILEVEL', { multiChannelNodeId: 8 });
		if (this.node.MultiChannelNodes.hasOwnProperty('9')) this.registerCapability('measure_temperature.external2', 'SENSOR_MULTILEVEL', { multiChannelNodeId: 9 });
		if (this.node.MultiChannelNodes.hasOwnProperty('10')) this.registerCapability('measure_temperature.external3', 'SENSOR_MULTILEVEL', { multiChannelNodeId: 10 });
		if (this.node.MultiChannelNodes.hasOwnProperty('11')) this.registerCapability('measure_temperature.external4', 'SENSOR_MULTILEVEL', { multiChannelNodeId: 11 });
		if (this.node.MultiChannelNodes.hasOwnProperty('12')) this.registerCapability('measure_temperature.external5', 'SENSOR_MULTILEVEL', { multiChannelNodeId: 12 });
		if (this.node.MultiChannelNodes.hasOwnProperty('13')) this.registerCapability('measure_temperature.external6', 'SENSOR_MULTILEVEL', { multiChannelNodeId: 13 });

	}
}

module.exports = FibaroSmartImplant;
