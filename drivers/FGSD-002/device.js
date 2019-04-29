'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class FibaroSmokeDetectorDevice extends ZwaveDevice {

	onMeshInit() {
		this.registerCapability('alarm_smoke', 'SENSOR_ALARM');
        this.registerReportListener('SENSOR_ALARM', 'NOTIFICATION', report => {
            if (report && report['Notification Type'] === 'Smoke') {
                this.setCapabilityValue('alarm_smoke', report['Event'] === 1 || report['Event'] === 2 || report['Event'] === 3);
            }
		});

        this.registerCapability('alarm_heat', 'SENSOR_ALARM');
        this.registerReportListener('SENSOR_ALARM', 'NOTIFICATION', report => {
            if (report && report['Notification Type'] === 'Heat') {
                this.setCapabilityValue('alarm_heat', report['Event'] === 1 || report['Event'] === 2 || report['Event'] === 3 || report['Event'] === 4 || report['Event'] === 7);
            }
		});

		this.registerCapability('measure_temperature', 'SENSOR_MULTILEVEL');
		this.registerCapability('measure_battery', 'BATTERY');
	}

}

module.exports = FibaroSmokeDetectorDevice;
