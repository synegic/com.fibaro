'use strict';

const Homey = require('homey');
const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class FibaroRollerShutter24Device extends ZwaveDevice {

	onMeshInit() {
		this._momentaryTrigger = this.getDriver().momentaryTrigger;
		this._toggleTrigger = this.getDriver().toggleTrigger;
		this._singleGateTrigger = this.getDriver().singleGateTrigger;

		this._resetMeterAction = this.getDriver().resetMeterAction;

		this.registerCapability('windowcoverings_state', 'SWITCH_BINARY');
		this.registerCapability('dim', 'SWITCH_MULTILEVEL', {
			setParser: this._dimSetParser.bind(this),
		});
		this.registerCapability('measure_power', 'SENSOR_MULTILEVEL');
		this.registerCapability('meter_power', 'METER');

		this.registerReportListener('SCENE_ACTIVATION', 'SCENE_ACTIVATION_SET', (report) => {
			const data = {
				scene: report['Scene ID'].toString(),
			};
			const operatingMode = this.getSettings('operating_mode');

			switch (operatingMode) {
				case '0': this._momentaryTrigger.trigger(this, null, data); break;
				case '1': this._toggleTrigger.trigger(this, null, data); break;
				case '2':
				case '3':
				case '4': this._singleGateTrigger.trigger(this, null, data); break;
				default: this.error(`Unknown operating mode ${operatingMode} found`); break;
			}
		});

		this.registerSetting('start_calibration', (newValue) => {
			if (newValue) {
				setTimeout(() => {
					this.setSettings({ start_calibration: false });
				}, 5000);
			}

			return new Buffer([newValue ? 1 : 0]);
		});
	}

	triggerRunListener(args, state) {
		return (args.scene === state.scene);
	}

	async resetMeterRunListener(args, state) {
		if (this.node.CommandClass.COMMAND_CLASS_METER) {
			return await this.node.CommandClass.COMMAND_CLASS_METER.METER_RESET({});
		} return Promise.reject('unknown_error');
	}

	_dimSetParser(value) {
		let invert;
		typeof this.getSetting('invert_direction') === 'boolean' ? invert = this.getSetting('invert_direction') : false;

		if (value >= 1) {
			if (invert) value = 0;
			else value = 0.99;
		}

		if (invert) value = (1 - value.toFixed(2)) * 100;

		return {
			Value: value * 100,
			'Dimming Duration': 'Factory default',
		};
	}
}

module.exports = FibaroRollerShutter24Device;
