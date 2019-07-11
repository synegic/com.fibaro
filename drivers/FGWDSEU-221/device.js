'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class FibaroWalliSwitchDevice extends ZwaveDevice {

	onMeshInit() {
        this.enableDebug();
        
		this.registerCapability('onoff', 'SWITCH_BINARY');
        this.registerCapability('measure_power', 'METER');
        this.registerCapability('meter_power', 'METER');
	}

	async ledOnRunListener(args, state) {
        if (args.hasOwnProperty('color')) {

            return this.configurationSet({
                index: 11,
                size: 1,
                id: "led_ring_color_on"
            }, new Buffer([args.color]));
        }
    }

    async ledOffRunListener(args, state) {
        if (args.hasOwnProperty('color')) {

            return this.configurationSet({
                index: 12,
                size: 1,
                id: "led_ring_color_off"
            }, new Buffer([args.color]));
        }
    }
}

module.exports = FibaroWalliSwitchDevice;
