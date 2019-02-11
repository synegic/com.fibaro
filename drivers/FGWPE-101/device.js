'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class FibaroWallPlug extends ZwaveDevice {

	onMeshInit() {
		this.registerCapability('onoff', 'SWITCH_BINARY');
		this.registerCapability('measure_power', 'SENSOR_MULTILEVEL');
		this.registerCapability('meter_power', 'METER');
	}

    async ledOnRunListener(args, state) {
        if (args.hasOwnProperty('color')) {

            return this.configurationSet({
                index: 61,
                size: 1,
                id: "led_ring_color_on"
            }, new Buffer([args.color]));
        }
    }

    async ledOffRunListener(args, state) {
        if (args.hasOwnProperty('color')) {

            return this.configurationSet({
                index: 62,
                size: 1,
                id: "led_ring_color_off"
            }, new Buffer([args.color]));
        }
    }
}

module.exports = FibaroWallPlug;
