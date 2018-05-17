'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class FibaroRollerShutter24Device extends ZwaveDevice {
	
	onMeshInit() {
		this._momentaryTrigger = new Homey.FlowCardTriggerDevice('FGRM-222-momentary').register
			.registerRunListener(this._triggerRunListener.bind(this));
        this._toggleTrigger = new Homey.FlowCardTriggerDevice('FGRM-222-toggle').register
            .registerRunListener(this._triggerRunListener.bind(this));
        this._singleGateTrigger = new Homey.FlowCardTriggerDevice('FGRM-222-momentary_single-gate_switch').register
            .registerRunListener(this._triggerRunListener.bind(this));

        this._resetMeterAction = new Homey.FlowCardAction('FGRM-222_reset_meter').register()
			.registerRunListener(this._resetMeterRunListener.bind(this));

		this.registerCapability('windowcoverings_state', 'SWITCH_BINARY');
		this.registerCapability('dim', 'SWITCH_MULTILEVEL', {
			setParser: this._dimSetParser.bind(this)
		});
		this.registerCapability('measure_power', 'SENSOR_MULTILEVEL');
		this.registerCapability('meter_power', 'METER');

		this.registerReportListener('SCENE_ACTIVATION', 'SCENE_ACTIVATION_SET', (report) => {
			let data = {
				scene: report['Scene ID'].toString()
			};
			let operatingMode = this.getSettings('operating_mode');

			switch (operatingMode) {
				case '0': this._momentaryTrigger.trigger(this, null, data); break;
                case '1': this._toggleTrigger.trigger(this, null, data); break;
                case '2': this._singleGateTrigger.trigger(this, null, data); break;
                case '3':
                case '4': this._singleGateTrigger.trigger(this, null, data); break;
				default: this.error(`Unknown operating mode ${operatingMode} found`); break;
            }
		});

		this.registerSetting('start_calibration', (newValue) => {
			if (newValue) {
				setTimeout(() => {
					this.setSettings({'start_calibration': false});
				}, 5000);
			}

			return new Buffer([newValue ? 1 : 0]);
		});
	}

	_triggerRunListener(args, state) {
		return (args.device === this && args.scene === state.scene)
	}

	_resetMeterRunListener(args, state) {
		if (args.device === this &&
				this.node.CommandClass.COMMAND_CLASS_METER) {
					this.node.CommandClass.COMMAND_CLASS_METER.METER_RESET({}, (err, result) => {
						if (err) return Promise.reject(err);
						if (result === 'TRANSMIT_COMPLETE_OK') return Promise.resolve();
						else return Promise.reject('unknown_response');
					});
		} else return Promise.reject('unknown_error')
	}

	_dimSetParser(value) {
		let invert;
		typeof this.getSetting('invert_direction') === 'boolean' ? invert = this.getSetting('invert_direction') : false;

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