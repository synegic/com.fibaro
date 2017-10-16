'use strict';

const ZwaveSensorDevice = require('homey-meshdriver').ZwaveSensorDevice;

class FibaroDoorSensor extends ZwaveSensorDevice {

	onMeshInit() {
		super.onMeshInit({
			autoRegisterSystemCapabilities: true,
		})
	}
}

module.exports = FibaroDoorSensor;