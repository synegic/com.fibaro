'use strict';

// Athom includes
const Homey = require('homey');
const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

// Third party includes
const tinyColor = require('tinycolor2');
const tinyGradient = require('tinygradient');

class FibaroRGBWControllerDevice extends ZwaveDevice {
	
	onMeshInit() {

		this.realInputConfigs = [
		    parseInt(this.getSetting('input_config_1') || 1),
            parseInt(this.getSetting('input_config_2') || 1),
            parseInt(this.getSetting('input_config_3') || 1),
            parseInt(this.getSetting('input_config_4') || 1)
        ];
        this.temperatureGradient = tinyGradient([
            '#80c5fc',
            '#ffffff',
            '#ffe68b'
        ]);

        if (this.getSetting('strip_type') === 'cct' && this.getCapabilityValue('light_mode') !== 'temperature') {
            this.setCapabilityValue('light_mode', 'temperature');
        } else if (this.getCapabilityValue('light_mode') !== 'color') {
            this.setCapabilityValue('light_mode', 'color');
        }

        if (this.getSetting('strip_type').indexOf('rgb') < 0 && this.getSetting('strip_type') !== 'cct') {
		    this.realInputConfigs[1] += 8;
            this.realInputConfigs[2] += 8;
            this.realInputConfigs[3] += 8;
            this.realInputConfigs[4] += 8;
        }

        /*
		================================================================
		Registering Flows
		================================================================
		 */
        this._onFlowTrigger = new Homey.FlowCardTriggerDevice('RGBW_input_on').register()
            .registerRunListener(this._onOffFlowRunListener);
        this._offFlowTrigger = new Homey.FlowCardTriggerDevice('RGBW_input_off').register()
            .registerRunListener(this._onOffFlowRunListener);

        this._input1FlowTrigger = new Homey.FlowCardTriggerDevice('RGBW_volt_input1').register();
        this._input2FlowTrigger = new Homey.FlowCardTriggerDevice('RGBW_volt_input2').register();
        this._input3FlowTrigger = new Homey.FlowCardTriggerDevice('RGBW_volt_input3').register();
        this._input4FlowTrigger = new Homey.FlowCardTriggerDevice('RGBW_volt_input4').register();

        this._resetMeterAction = new Homey.FlowCardAction('FGRGBWM-441_reset_meter').register()
            .registerRunListener(this._resetMeterRunListener);

		/*
		================================================================
		Registering on/off and dim
		================================================================
		 */
		this.registerCapability('onoff', 'SWITCH_MULTILEVEL', {
			multiChannelNodeId: 1
		});

		// New parser for light_saturation, hue and dim
        this.registerMultipleCapabilityListener(['light_saturation', 'light_hue', 'dim'], (value, opts) => {
            let red, green, blue, white;
            let hue, saturation, dim;

            // Dim value changed for temperature mode
            if (this.getCapabilityValue('light_mode') === 'temperature' && !value['light_hue'] && !value['light_saturation']) {
                let originalHSV = this._tempToHSV(this.getCapabilityValue('light_temperature'));
                let rgb = tinyColor({
                    h: originalHSV.h,
                    s: originalHSV.s,
                    v: (value.dim * 100)
                }).toRgb();

                red = (rgb.r / 255) * 99;
                green = (rgb.g / 255) * 99;
                blue = (rgb.b / 255) * 99;
                white = (rgb.a / 255) * 99;
            }
            // Light mode color or saturation/hue changed
            else if (this.getCapabilityValue('light_mode') === 'color' || value['light_hue'] || value['light_saturation']) {
                value['light_hue'] ? hue = value['light_hue'] : hue = false;
                value['light_saturation'] ? saturation = value['light_saturation'] : saturation = false;
                value['dim'] ? dim = value['dim'] : dim = false;

                let rgb = this._valuesToRGB(hue, saturation, dim);

                red = (rgb.r / 255) * 99;
                green = (rgb.g / 255) * 99;
                blue = (rgb.b / 255) * 99;
                white = (rgb.a / 255) * 99;

                this.setCapabilityValue('light_mode', 'color');
            }

            // Set red channel
            this.node.MultiChannelNodes['2'].CommandClass.COMMAND_CLASS_SWITCH_MULTILEVEL.SWITCH_MULTILEVEL_SET({Value: red}, (err, result) => {
                if (err) return Promise.reject(`Error whilst setting red channel: ${err}`);
                if (result === 'TRANSMIT_COMPLETE_OK') {
                    this.log(`Successfully set channel red`);
                }
            });

            // Set green channel
            this.node.MultiChannelNodes['3'].CommandClass.COMMAND_CLASS_SWITCH_MULTILEVEL.SWITCH_MULTILEVEL_SET({Value: green}, (err, result) => {
                if (err) return Promise.reject(`Error whilst setting green channel: ${err}`);
                if (result === 'TRANSMIT_COMPLETE_OK') {
                    this.log(`Successfully set channel green`);
                }
            });

            // Set blue channel
            this.node.MultiChannelNodes['4'].CommandClass.COMMAND_CLASS_SWITCH_MULTILEVEL.SWITCH_MULTILEVEL_SET({Value: blue}, (err, result) => {
                if (err) return Promise.reject(`Error whilst setting blue channel: ${err}`);
                if (result === 'TRANSMIT_COMPLETE_OK') {
                    this.log(`Successfully set channel blue`);
                }
            });

            // Set white channel
            this.node.MultiChannelNodes['5'].CommandClass.COMMAND_CLASS_SWITCH_MULTILEVEL.SWITCH_MULTILEVEL_SET({Value: white}, (err, result) => {
                if (err) return Promise.reject(`Error whilst setting white channel: ${err}`);
                if (result === 'TRANSMIT_COMPLETE_OK') {
                    this.log(`Successfully set channel white`);
                }
            });

            return Promise.resolve();
        });

        /*
        ================================================================
        Registering temperature in order: Red, Green, Blue, White
        ================================================================
         */
        this.registerCapabilityListener('light_temperature', (value, opts) => {
            this.setCapabilityValue('light_mode', 'temperature');
            let rgb = this._tempToRGB(value);

            let red = (rgb.r / 255) * 99;
            let green = (rgb.g / 255) * 99;
            let blue = (rgb.b / 255) * 99;
            let white = (rgb.a / 255) * 99;

            // Set red channel
            this.node.MultiChannelNodes['2'].CommandClass.COMMAND_CLASS_SWITCH_MULTILEVEL.SWITCH_MULTILEVEL_SET({Value: red}, (err, result) => {
                if (err) return Promise.reject(`Error whilst setting red channel: ${err}`);
                if (result === 'TRANSMIT_COMPLETE_OK') {
                    this.log(`Successfully set channel red`);
                }
            });

            // Set green channel
            this.node.MultiChannelNodes['3'].CommandClass.COMMAND_CLASS_SWITCH_MULTILEVEL.SWITCH_MULTILEVEL_SET({Value: green}, (err, result) => {
                if (err) return Promise.reject(`Error whilst setting green channel: ${err}`);
                if (result === 'TRANSMIT_COMPLETE_OK') {
                    this.log(`Successfully set channel green`);
                }
            });

            // Set blue channel
            this.node.MultiChannelNodes['4'].CommandClass.COMMAND_CLASS_SWITCH_MULTILEVEL.SWITCH_MULTILEVEL_SET({Value: blue}, (err, result) => {
                if (err) return Promise.reject(`Error whilst setting blue channel: ${err}`);
                if (result === 'TRANSMIT_COMPLETE_OK') {
                    this.log(`Successfully set channel blue`);
                }
            });

            this.node.MultiChannelNodes['5'].CommandClass.COMMAND_CLASS_SWITCH_MULTILEVEL.SWITCH_MULTILEVEL_SET({Value: white}, (err, result) => {
                if (err) return Promise.reject(`Error whilst setting white channel: ${err}`);
                if (result === 'TRANSMIT_COMPLETE_OK') {
                    this.log(`Successfully set channel white`);
                }
            });

            return Promise.resolve();
        });

        /*
        ================================================================
        Registering meter and measure power
        ================================================================
         */
        this.registerCapability('meter_power', 'METER');
        this.registerCapability('measure_power', 'SENSOR_MULTILEVEL');

        /*
        ================================================================
        Registering light mode and input voltages
        ================================================================
         */
        this.registerCapability('light_mode', 'BASIC');
        this.registerCapability('measure_voltage.input1', 'SWITCH_MULTILEVEL');
        this.registerCapability('measure_voltage.input2', 'SWITCH_MULTILEVEL');
        this.registerCapability('measure_voltage.input3', 'SWITCH_MULTILEVEL');
        this.registerCapability('measure_voltage.input4', 'SWITCH_MULTILEVEL');
    }

    /*
    ================================================================
    Colour parsing
    ================================================================
     */

	_valuesToRGB(hue, saturation, dim) {
		if (!hue) hue = this.getCapabilityValue('light_hue');
        if (!saturation) saturation = this.getCapabilityValue('light_saturation');
        if (!dim) dim = this.getCapabilityValue('dim');

        return tinyColor({
            h: (hue * 360),
            s: (saturation * 100),
            v: (dim * 100),
        }).toRgb();
    }

    /*
    ================================================================
    Temperature parsing
    ================================================================
     */
    _tempToRGB(value) {
        let hsv = this.temperatureGradient.hsvAt(value)._originalInput;
        return tinyColor({
            h: hsv.h,
            s: hsv.s,
            v: this.getCapabilityValue('dim') * 100
        }).toRgb();
    }

    _tempToHSV(value) {
        let hsv = this.temperatureGradient.hsvAt(value)._originalInput;
        return tinyColor({
            h: hsv.h,
            s: hsv.s,
            v: this.getCapabilityValue('dim') * 100
        }).toHsv();
    }

    /*
    ================================================================
    Flow related methods
    ================================================================
     */
    _onOffFlowRunListener(args, state) {
        if (args && args.hasOwnProperty('input') &&
            state && state.hasOwnProperty('input') &&
            args.input === state.input) {
            return true
        }
        return false;
    }

    _resetMeterRunListener(args, state) {
        if (args.device === this && this.node && typeof this.node.CommandClass.COMMAND_CLASS_METER !== 'undefined') {
            this.node.CommandClass.COMMAND_CLASS_METER.METER_RESET({}, (err, result) => {
                if (err) throw new Error(err); return false;
                if (result === 'TRANSMIT_COMPLETE_OK') return true;
                return false;
            });
        }
    }

    /*
    ================================================================
    Helper methods
    ================================================================
     */
    _valueToVolt(value) {
        return Math.round(value / 99 * 100) / 10;
    }

    _updateValues() {
        const hsv = tinyColor({
           r: this.colorCache.r || 0,
           g: this.colorCache.g || 0,
           b: this.colorCache.b || 0
        }).toHsv();

        // Update dim
        if (this.hasCapability('dim') || this.getCapabilityValue('dim') === 0) {
            const dim = Math.max(this.colorCache.r, this.colorCache.g, this.colorCache.b);
            this.setCapabilityValue('dim', dim/99);
        }

        // Update hue
        const hue = this._hueParser( (hsv.h || 0), 'get');
        this.setCapabilityValue('light_hue', hue);

        // Update Saturation
        this.setCapabilityValue('light_saturation', Math.round(hsv.s * 100) / 100);

        // Update temperature in CCT mode
        if (this.getSetting('strip_type') === 'cct') {
            const value = (((this.getCapabilityValue('dim' || 99) - this.colorCache.b) + this.colorCache.w) / (this.getCapabilityValue('dim') * 2) || 198);
            this.setCapabilityValue('light_temperature', Math.round(value * 100) / 100);
        }
    }

    _sendColor(values, multichannels, callback) {
        if (!this.getCapabilityValue('onoff')) {
            this.setCapabilityValue('onoff', true);
        }

        if (typeof values === 'object' && typeof multichannels === 'object') {
            for (let i = 0; i < values.length; i++) {
                if (multichannels[i] && values[i] >= 0) {
                    this.node.MultiChannelNodes[multichannels[i]].CommandClass.COMMAND_CLASS_SWITCH_MULTILEVEL.SWITCH_MULTILEVEL_SET({
                        Value: values[i]
                    }, (err, result) => {
                        if (err) {
                            Homey.error(err);
                            if (typeof callback === 'function') return callback(err, false);
                        }

                        if (result === 'TRANSMIT_COMPLETE_OK') {
                            if (typeof callback === 'function') return callback(null, true);
                        } else if (typeof callback === 'function') return callback('transmition_failed', false);
                    });
                }
            }
        } else if (typeof callback === 'function') return callback('unknown_error', false);
    }

    _reportParser(command, report, color) {
        let inputNumber;
        let cachedColor;

        if (color === 'r') {
            inputNumber = 1;
            cachedColor = this.colorCache.r
        } else if (color === 'g') {
            inputNumber = 2;
            cachedColor = this.colorCache.g
        } else if (color === 'b') {
            inputNumber = 3;
            cachedColor = this.colorCache.b
        } else if (color === 'w') {
            inputNumber = 4;
            cachedColor = this.colorCache.w
        } else {
            throw new Error('Colour not supported');
        }

        if (command.name && command.name === 'SWITCH_MULTILEVEL_REPORT') {
            // Trigger on/off flows
            if (report['Value (Raw)'][0] > 0 && cachedColor === 0) {
                this._onFlowTrigger.trigger(this, null, {input: inputNumber});
            }

            if (report['Value (Raw)'][0] === 0) {
                this._offFlowTrigger.trigger(this, null, {input: inputNumber});
            }

            // Update cache
            this.colorCache['color'] = (report['Value (Raw)'][0] || 0);

            // If analog input(s) are attached
            if (this.realInputConfigs[inputNumber] === 8) {
                // Update the value of this input
                this.setCapabilityValue(`measure_voltage.input${inputNumber}`, this._valueToVolt(report['Value (Raw)'][0]));

                // Trigger any flows that are used
                this[`_input${inputNumber}FlowTrigger`].trigger(this, {volt: this._valueToVolt(report['Value (Raw)'][0])}, null);
            }

            // If not analog input(s), update values in homey
            else this._updateValues();
        }
    }
}

module.exports = FibaroRGBWControllerDevice;