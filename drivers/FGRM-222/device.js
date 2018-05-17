'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class FibaroRollerShutter24Device extends ZwaveDevice {
	
	onMeshInit() {
		this.registerCapability('windowcoverings_state', 'SWITCH_BINARY');
		this.registerCapability('dim', 'SWITCH_MULTILEVEL', {
			setParser: this._dimSetParser.bind(this);
		});
		this.registerCapability('measure_power', 'SENSOR_MULTILEVEL');
		this.registerCapability('meter_power', 'METER');

		this.registerSetting('start_calibration', (newValue) => {
			if (newValue) {
				setTimeout(() => {
					this.setSettings({'start_calibration': false});
				}, 5000);
			}

			return new Buffer([newValue ? 1 : 0]);
		});
	}

	_dimSetParser(value) {
		let invert;
		typeof this.getSetting('invert_direction' === 'boolean' ? invert = this.getSetting('invert_direction') : false;

		if (value >= 1) {
            if (invert) value = 0;
            else value = .99;
        }

        if (invert) value = (1-value.toFixed(2)) * 100;

		return {
			'Value': value * 100,
			'Dimming Duration': 'Factory default'
        }
	}
}

module.exports = FibaroRollerShutter24Device;