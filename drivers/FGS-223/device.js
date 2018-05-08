'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class FibaroDoubleSwitchTwoDevice extends ZwaveDevice {
	
	onMeshInit() {
		this.registerCapability('onoff', 'SWITCH_BINARY');
		this.registerCapability('measure_power', 'METER');
		this.registerCapability('meter_power', 'METER');

		this._input1FlowTrigger = new Homey.FlowCardTriggerDevice('FGS-223_S1').register()
			.registerRunListener(this._inputFlowListener.bind(this));
        this._input2FlowTrigger = new Homey.FlowCardTriggerDevice('FGS-223_S2').register()
			.registerRunListener(this._inputFlowListener.bind(this));
        this._resetMeterFlowAction = new Homey.FlowCardAction('FGS-223_reset_meter').register()
			.registerRunListener(this._resetMeterFlowListener.bind(this));

        this.registerReportListener('CENTRAL_SCENE', 'CENTRAL_SCENE_REPORT', (report) => {
            if (report.hasOwnProperty('Properties1') &&
                report.Properties1.hasOwnProperty('Key Attributes') &&
                report.hasOwnProperty('Scene Number')) {

            	const state = {
            		scene: report.Properties1['Key Attributes']
				};

            	if (report['Scene Number'] === 1) {
            		this._input1FlowTrigger.trigger(this, null, state);
				} else if (report['Scene Number'] === 2) {
                    this._input2FlowTrigger.trigger(this, null, state);
                    this.refreshCapabilityValue('onoff', 'SWITCH_BINARY');
                }
            }
		});

        this.registerSetting('s1_kwh_report', this._kwhReportParser);
        this.registerSetting('s2_kwh_report', this._kwhReportParser);
	}

	_inputFlowListener(args, state) {
		return (state.scene === args.scene && args.device === this);
	}

	_resetMeterFlowListener(args) {
		if (args.device === this &&
			this.node &&
			this.node.CommandClass.COMMAND_CLASS_METER) {
				this.node.CommandClass.COMMAND_CLASS_METER.METER_RESET({}, (err, result) => {
					if (err) return false;
					if (result === 'TRANSMIT_COMPLETE_OK') return true;
				});
		}
		return false;
	}

	_kwhReportParser(newValue) {
		let kwh = new Buffer(2);
		kwh.writeUIntBE([Math.round(newValue * 100)], 0, 2);
		return kwh;
	}
}

module.exports = FibaroDoubleSwitchTwoDevice;