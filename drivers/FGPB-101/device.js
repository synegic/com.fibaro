'use strict';

const Homey = require('homey');
const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class Button extends ZwaveDevice {

	onMeshInit() {
		this.registerCapability('measure_battery', 'BATTERY');
		this._onButtonTrigger = this.getDriver().onButtonTrigger;

		this.node.CommandClass.COMMAND_CLASS_CENTRAL_SCENE.on('report', (command, report) => {
			let debouncer = 0;

			if (command.name === 'CENTRAL_SCENE_NOTIFICATION') {
				if (report &&
					report.Properties1.hasOwnProperty('Key Attributes')) {
					const buttonValue = { scene: report.Properties1['Key Attributes'] };
					if (buttonValue.scene === 'Key Released') {
						if (debouncer === 0) {
							this._onButtonTrigger.trigger(this, null, buttonValue);

							debouncer++;
							setTimeout(() => debouncer = 0, 2000);
						}
					} else {
						this._onButtonTrigger.trigger(this, null, buttonValue);
					}
				}
			}
		});
	}

	buttonRunListener(args, state) {
        if (state && args &&
            state.hasOwnProperty('scene') &&
            args.hasOwnProperty('scene')) {
            return Promise.resolve();
        }

        return Promise.reject();
	}

}

module.exports = Button;
