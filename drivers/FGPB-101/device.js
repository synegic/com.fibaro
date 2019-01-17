'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class Button extends ZwaveDevice {

	onMeshInit() {
		this.registerCapability('measure_battery', 'BATTERY');
		this._onButtonTrigger = this.getDriver().onButtonTrigger;

		this.registerReportListener('CENTRAL_SCENE', 'CENTRAL_SCENE_NOTIFICATION', (report) => {
            let debouncer = 0;

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
		});
	}

	buttonRunListener(args, state) {
        return (state && args &&
            state.hasOwnProperty('scene') &&
            args.hasOwnProperty('scene'))
	}

}

module.exports = Button;
