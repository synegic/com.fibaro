'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class FibaroRollerShutter2Device extends ZwaveDevice {

	onMeshInit() {
		this.registerCapability('windowcoverings_state', 'SWITCH_BINARY', {
			setParser: this._windowCoveringsSetParser.bind(this)
		});

		this.registerCapability('dim', 'SWITCH_MULTILEVEL', {
			setParser: this._dimSetParser.bind(this),
			reportParser: this._dimReportParser.bind(this),
			reportParserOverride: true,
		});
		this.registerCapability('measure_power', 'SENSOR_MULTILEVEL');

		this.registerSetting('start_calibration', (newValue) => {
			if (newValue) {
				setTimeout(() => {
					this.setSettings({ start_calibration: false });
				}, 5000);
			}

			return new Buffer([newValue ? 1 : 0]);
		});
	}

	_windowCoveringsSetParser(value) {
		let invert;
        typeof this.getSetting('invert_direction') === 'boolean' ? invert = this.getSetting('invert_direction') : false;

        let result = 'off/disable';
        if (!this.windowCoveringsPosition) this.windowCoveringsPosition = this.getCapabilityValue('windowcoverings_state');

        // Check correct counter value in case of idle
        if (value === 'idle') {
            if (this.windowCoveringsPosition === 'on/enable') result = 'off/disable';
            else if (this.windowCoveringsPosition === 'off/disable') result = 'on/enable';
        }
        if (value === 'up') {
            if (invert) result = 'off/disable';
            else result = 'on/enable';
        }
        if (value === 'down') {
            if (invert) result = 'on/enable';
            else result = 'off/disable';
        }

        // Save latest known position state
		this.windowCoveringsPosition = result;

        return {
            'Switch Value': result,
        };
    }

	_dimSetParser(value) {
		let invert;
		typeof this.getSetting('invert_direction') === 'boolean' ? invert = this.getSetting('invert_direction') : false;

		if (value > 1) {
			if (invert) value = 0;
			else value = 1;
		}

		if (invert) value = (1 - value.toFixed(2)) * 100;
		else value *= 100;

		return {
			Value: value,
			'Dimming Duration': 'Factory default',
		};
	}

	_dimReportParser(report) {
		let invert;
		typeof this.getSetting('invert_direction') === 'boolean' ? invert = this.getSetting('invert_direction') : false;

		if (typeof report['Value (Raw)'] === 'undefined') return null;
		if (invert) return (100 - report['Value (Raw)'][0]) / 100;
		return report['Value (Raw)'][0] / 100;
	}
}

module.exports = FibaroRollerShutter2Device;
