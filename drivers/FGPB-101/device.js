'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class Button extends ZwaveDevice {
	
	onMeshInit() {
		this.registerCapability('measure_battery', 'BATTERY');
		this._onButtonTrigger = new Homey.FlowCardTriggerDevice("FGPB-101").register().registerRunListener((args, state) => {
			if(state && args &&
				state.hasOwnProperty('scene') &&
				args.hasOwnProperty('scene')) {
					return callback(null, state.scene === args.scene);
            }
		});

		this.node.CommandClass.COMMAND_CLASS_CENTRAL_SCENE.on('report', (command, report) => {
			let debouncer = 0;

			if (command.name === 'CENTRAL_SCENE_NOTIFICATION') {
				if (report &&
					report.Properties1.hasOwnProperty('Key Attributes')) {
					const buttonValue = {scene: report.Properties1['Key Attributes']};
					if (buttonValue.scene === 'Key Released') {
						if (retryCounter === 0) {
							this._onButtonTrigger.trigger(this, null, buttonValue);

							debouncer++;
							setTimeout(() => debouncer = 0, 2000);
						} else {
                            this._onButtonTrigger.trigger(this, null, buttonValue);
                        }
					}
				}
			}
		});
	}
	
}

module.exports = Button;