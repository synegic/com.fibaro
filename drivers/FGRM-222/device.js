'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class FibaroRollerShutter24Device extends ZwaveDevice {

	onMeshInit() {
        if (!this.getStoreValue('invertMigrated')) {
            this.setUnavailable('Migrating inversion setting');

            let invert = this.getSetting('invert_direction');
            this.setSettings({invertWindowCoveringsDirection: invert});

            this.setStoreValue('invertMigrated', true, () => {
                this.setAvailable();
            });
        }

        this.registerCapability('windowcoverings_state', 'SWITCH_BINARY');

        this.registerCapability('dim', 'SWITCH_MULTILEVEL', {
            setParserV3: this._dimSetParser.bind(this),
            reportParser: this._dimReportParser.bind(this),
            reportParserOverride: true,
        });

        this.registerCapability('measure_power', 'SENSOR_MULTILEVEL');
        this.registerCapability('meter_power', 'METER');

		this._momentaryTrigger = this.getDriver().momentaryTrigger;
		this._toggleTrigger = this.getDriver().toggleTrigger;
		this._singleGateTrigger = this.getDriver().singleGateTrigger;
		this._resetMeterAction = this.getDriver().resetMeterAction;

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
        typeof this.getSetting('invertWindowCoveringsDirection') === 'boolean' ? invert = this.getSetting('invertWindowCoveringsDirection') : false;

        if (value > 1) {
            if (invert) value = 0;
            else value = .99;
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
        typeof this.getSetting('invertWindowCoveringsDirection') === 'boolean' ? invert = this.getSetting('invertWindowCoveringsDirection') : false;

        if (typeof report['Value (Raw)'] === 'undefined') return null;
        if (invert) return (100 - report['Value (Raw)'][0]) / 100;
        return report['Value (Raw)'][0] / 100;
    }
}

module.exports = FibaroRollerShutter24Device;
