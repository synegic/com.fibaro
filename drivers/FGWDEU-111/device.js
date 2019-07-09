'use strict';

const Homey = require('homey');
const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class FibaroWalliDimmerDevice extends ZwaveDevice {

	onMeshInit() {
		// this.enableDebug();

		console.log(this.node);

        this._momentaryTrigger = this.getDriver().momentaryTrigger;
        this._toggleTrigger = this.getDriver().toggleTrigger;
        this._rollerTrigger = this.getDriver().rollerTrigger;

		this.registerCapability('onoff', 'SWITCH_MULTILEVEL', {
			reportParser: report => { console.log('AFVANGEN', report); }
		});

		this.registerCapability('measure_power', 'METER');
		
		this.registerCapability('dim', 'SWITCH_MULTILEVEL');
	}

	switchTriggersRunListener(args, state) {
		return state && args && state.scene === args.scene;
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

module.exports = FibaroWalliDimmerDevice;
