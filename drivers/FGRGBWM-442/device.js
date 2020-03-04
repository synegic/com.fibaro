'use strict'

const ZwaveLightDevice = require('homey-meshdriver').ZwaveLightDevice;
const ZwaveUtils = require('homey-meshdriver').Util;

class FibaroRGBW2Device extends ZwaveLightDevice {
    async onMeshInit() {
        this.enableDebug();

        await super.onMeshInit();

        // Power capabilities
        this.registerCapability('meter_power', 'METER');
        this.registerCapability('measure_power', 'SENSOR_MULTILEVEL');
    }

    // Overrride _sendColor from base class to work with 4 colors rather then 5
    async _sendColors({ warm, cold, red, green, blue, duration }) {
        const SwitchColorVersion = this.getCommandClass('SWITCH_COLOR').version || 1;

        // Work arround the missing cold functionality by mixing blue as cold.
        if (cold > 125) {
            blue = cold;
            warm = cold /2;
        } else {
            blue = cold;
        }

		let setCommand = {
			Properties1: {
				'Color Component Count': 4,
			},
			vg1: [
				{
					'Color Component ID': 0,
					Value: Math.round(warm),
				},
				{
					'Color Component ID': 2,
					Value: Math.round(red),
				},
				{
					'Color Component ID': 3,
					Value: Math.round(green),
				},
				{
					'Color Component ID': 4,
					Value: Math.round(blue),
				},
			],
        };
        
		if (SwitchColorVersion === 3) {
			setCommand = new Buffer([setCommand.Properties1['Color Component Count'], 0, setCommand.vg1[0].Value, 2, setCommand.vg1[1].Value, 3, setCommand.vg1[2].Value, 4, setCommand.vg1[3].Value], 255);
		} else if (SwitchColorVersion > 1) {
			setCommand.Duration = typeof duration !== 'number' ? FACTORY_DEFAULT_COLOR_DURATION : Utils.calculateZwaveDimDuration(duration);
		}

		this.log(setCommand);

		return this.node.CommandClass.COMMAND_CLASS_SWITCH_COLOR.SWITCH_COLOR_SET(setCommand);
	}

    async animationRunListener(args, state) {
        if (args && args.hasOwnProperty('animation')) {
            this.log('Setting animation to', args.animation);
            if (args.animation === '11') args.animation = Math.round(Math.random() * (10 - 6) + 6);

            try {
                return await this.configurationSet({
                    index: 157,
                    size: 1,
                }, new Buffer([parseInt(args.animation)]));
            } catch (err) {
                return Promise.reject(err);
            }
        }
    }
}

module.exports = FibaroRGBW2Device;