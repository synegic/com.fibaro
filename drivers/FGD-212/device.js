'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class FibaroDimmerTwoDevice extends ZwaveDevice {
	
	onMeshInit() {
		this.registerCapability('onoff', 'SWITCH_MULTILEVEL');
        this.registerCapability('dim', 'SWITCH_MULTILEVEL');
        this.registerCapability('measure_power', 'SENSOR_MULTILEVEL');
        this.registerCapability('meter_power', 'METER');

        this.registerSetting('force_no_dim', value => new Buffer([value ? 2: 0]));
        this.registerSetting('kwh_report', value => new Buffer([value * 100]));
    }
	
}

module.exports = FibaroDimmerTwoDevice;