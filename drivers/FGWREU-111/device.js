'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class FibaroRollerShutterDevice extends ZwaveDevice {
	onMeshInit() {
		this.registerCapability('dim', 'SWITCH_MULTILEVEL');

		this.registerSetting('start_calibration', (newValue) => {
			if (newValue) {
				setTimeout(() => {
					this.setSettings({ start_calibration: false });
				}, 5000);
			}

			return new Buffer([newValue ? 2 : 0]);
		});
	}
}

module.exports = FibaroRollerShutterDevice;
