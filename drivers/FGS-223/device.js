'use strict';

const Homey = require('homey');
const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class FibaroDoubleSwitchTwoDevice extends ZwaveDevice {

    onMeshInit() {
        if( !this.node.isMultiChannelNode ) {
            this.registerCapability('onoff', 'SWITCH_BINARY');
            this._input1FlowTrigger = this.getDriver().input1FlowTrigger;
            this._input2FlowTrigger = this.getDriver().input2FlowTrigger;

            if (this.hasCommandClass('CENTRAL_SCENE')) {
                this.registerReportListener('CENTRAL_SCENE', 'CENTRAL_SCENE_NOTIFICATION', (report) => {
                    if (report.hasOwnProperty('Properties1') &&
                        report.Properties1.hasOwnProperty('Key Attributes') &&
                        report.hasOwnProperty('Scene Number')) {

                        const state = {
                            scene: report.Properties1['Key Attributes'],
                        };

                        if (report['Scene Number'] === 1) {
                            this._input1FlowTrigger.trigger(this, null, state);
                        } else if (report['Scene Number'] === 2) {
                            this._input2FlowTrigger.trigger(this, null, state);
                        }
                    }
                });
            }
        } else {
        	// S2 works with BASIC
            this.registerCapability('onoff', 'BASIC', {
                report: 'BASIC_SET',
            });
        }

        this.registerCapability('measure_power', 'METER');
        this.registerCapability('meter_power', 'METER');

        this._resetMeterFlowAction = this.getDriver().resetMeterFlowAction;

        this.registerSetting('s1_kwh_report', this._kwhReportParser);
        this.registerSetting('s2_kwh_report', this._kwhReportParser);
    }

    inputFlowListener(args, state) {
        return (state && args &&
            state.hasOwnProperty('scene') && args.hasOwnProperty('scene') &&
            state.scene === args.scene);
    }

    async resetMeterFlowListener(args) {
        if (this.node &&
            this.node.CommandClass.COMMAND_CLASS_METER) {
            return await this.node.CommandClass.COMMAND_CLASS_METER.METER_RESET({});
        }
        return Promise.reject('This device does not support meter resets');
    }

    _kwhReportParser(newValue) {
        const kwh = new Buffer(2);
        kwh.writeUIntBE([Math.round(newValue * 100)], 0, 2);
        return kwh;
    }
}

module.exports = FibaroDoubleSwitchTwoDevice;
