'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class FibaroDimmerDevice extends ZwaveDevice {

	onMeshInit() {
		this._momentaryTrigger = new Homey.FlowCardTriggerDevice('FGD-211_momentary', this._switchTriggersRunListener.bind(this));
		this._toggleTrigger = new Homey.FlowCardTriggerDevice('FGD-211_toggle', this._switchTriggersRunListener.bind(this));
		this._rollerTrigger = new Homey.FlowCardTriggerDevice('FGD-211_roller', this._switchTriggersRunListener.bind(this));

		this.registerCapability('onoff', 'SWITCH_MULTILEVEL');
		this.registerCapability('dim', 'SWITCH_MULTILEVEL');

		this.registerReportListener('SCENE_ACTIVATION', 'SCENE_ACTIVATION_SET', (report) => {
			if (report.hasOwnProperty('Scene ID')) {
				const data = {
					scene: report['Scene ID'].toString(),
				};

				switch (this.getSetting('switch_type')) {
					case '0': this._momentaryTrigger.trigger(this, null, data); break;
					case '1': this._toggleTrigger.trigger(this, null, data); break;
					case '2': this._rollerTrigger.trigger(this, null, data); break;
				}
			}
		});
	}

	_switchTriggersRunListener(args, state) {
		return state && args && state.scene === args.scene;
	}
}

module.exports = FibaroDimmerDevice;
