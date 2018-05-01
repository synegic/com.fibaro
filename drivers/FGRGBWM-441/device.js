'use strict';

// Athom includes
const Homey = require('homey');
const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

// Third party includes
const tinyColor = require('tinycolor');

class FibaroRGBWControllerDevice extends ZwaveDevice {
	
	onMeshInit() {
		this.hueCache = 0;
		this.colorCache = {
            r: 0,
            g: 0,
            b: 0,
            w: 0
        };
		this.realInputConfigs = [
		    parseInt(this.getSetting('input_config_1') || 1),
            parseInt(this.getSetting('input_config_2') || 1),
            parseInt(this.getSetting('input_config_3') || 1),
            parseInt(this.getSetting('input_config_4') || 1)
        ];

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
		Registering on/off and dim
		================================================================
		 */
		this.registerCapability('onoff', 'SWITCH_MULTILEVEL', {
			multiChannelNodeId: 1
		});
		this.registerCapability('dim', 'SWITCH_MULTILEVEL');

        /*
        ================================================================
        Registering saturation in order: Red, Green, Blue, White
        ================================================================
         */
		this.registerCapability('light_saturation', 'SWITCH_MULTILEVEL', {
            multiChannelNodeId: 2,
            reportParser: (command, report) => {
                this._reportParser(command, report, 'r')
            },
            setParser: (value) => {
                return this._colorSetParser('r', value, 'saturation');
            }
        });
        this.registerCapability('light_saturation', 'SWITCH_MULTILEVEL', {
            multiChannelNodeId: 3,
            reportParser: (command, report) => {
                this._reportParser(command, report, 'g')
            },
            setParser: (value) => {
                return this._colorSetParser('g', value, 'saturation');
            }
        });
        this.registerCapability('light_saturation', 'SWITCH_MULTILEVEL', {
            multiChannelNodeId: 4,
            reportParser: (command, report) => {
                this._reportParser(command, report, 'b')
            },
            setParser: (value) => {
                return this._colorSetParser('b', value, 'saturation');
            }
        });
        this.registerCapability('light_saturation', 'SWITCH_MULTILEVEL', {
            multiChannelNodeId: 5,
            reportParser: (command, report) => {
                this._reportParser(command, report, 'w')
            },
            setParser: (value) => {
                return this._colorSetParser('a', value, 'saturation');
            }
        });

        /*
        ================================================================
        Registering hue in order: Red, Green, Blue
        ================================================================
         */
        this.registerCapability('light_hue', 'SWITCH_MULTILEVEL', {
            multiChannelNodeId: 2,
            setParser: (value) => {
                return this._colorSetParser('r', value, 'hue');
            }
        });
        this.registerCapability('light_hue', 'SWITCH_MULTILEVEL', {
            multiChannelNodeId: 3,
            setParser: (value) => {
                return this._colorSetParser('g', value, 'hue');
            }
        });
        this.registerCapability('light_hue', 'SWITCH_MULTILEVEL', {
            multiChannelNodeId: 4,
            setParser: (value) => {
                return this._colorSetParser('b', value, 'hue');
            }
        });

        /*
        ================================================================
        Registering temperature in order: Red, Green, Blue, White
        ================================================================
         */
        this.registerCapability('light_temperature', 'SWITCH_MULTILEVEL', {
            multiChannelNodeId: 2,
            setParser: (value) => {
                return this._temperatureSetParser('r', value);
            }
        });
        this.registerCapability('light_temperature', 'SWITCH_MULTILEVEL', {
            multiChannelNodeId: 3,
            setParser: (value) => {
                return this._temperatureSetParser('g', value);
            }
        });
        this.registerCapability('light_temperature', 'SWITCH_MULTILEVEL', {
            multiChannelNodeId: 4,
            setParser: (value) => {
                return this._temperatureSetParser('b', value);
            }
        });
        this.registerCapability('light_temperature', 'SWITCH_MULTILEVEL', {
            multiChannelNodeId: 5,
            setParser: (value) => {
                return this._temperatureSetParser('w', value);
            }
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
	_hueCalibration = {
        //'id': [red, orange, yellow, lime, green, turquoise, cyan, teal, blue, purple, pink, hotpink],
        accurate: [0, 4.17, 2.38, 1.32, 1.01, 1.23, 1.06, 0.99, 1.01, 0.95, 0.95, 0.94],
        huestrip: [0, 4.17, 2.78, 1.56, 1.19, 1.23, 1.43, 1.54, 1.17, 0.86, 0.86, 0.93],
        huee27v3: [0, 2.78, 2.08, 1.32, 1.15, 1.23, 1.39, 1.46, 1.06, 0.90, 0.86, 0.93],
	};

	_hueParser(value, type) {
        value = Math.round(value * 100)/100;
        let amount = Math.round(value);
        if (type === 'get') value = value/360;
        else if (type === 'set') amount = Math.round(value * 360);

        if (!this.getSettings().hasOwnProperty('color_pallet') ||
			!this._hueCalibration.hasOwnProperty(this.getSetting('color_pallet')) ||
			this.getSetting('color_pallet') === 'none') {
        	if (type === 'get') return value;
            else if (type === 'set') return value * 360;
		}

		let colorConstants = this._hueCalibration(this.getSetting('color_pallet'));

        let startValue;
        let toRound;
        let deductFromAmount;

        if (amount >= 0 && amount <= 30) {
        	startValue = colorConstants[0];
        	toRound = colorConstants[0] - colorConstants[1];
        	deductFromAmount = 0;
        }
        // Orange to Yellow
        else if (amount >= 31 && amount <= 60) {
            startValue = colorConstants[1];
            toRound = colorConstants[1] - colorConstants[2];
            deductFromAmount = 30;
        }
        // Yellow to Lime
        else if (amount >= 61 && amount <= 90) {
            startValue = colorConstants[2];
            toRound = colorConstants[2] - colorConstants[3];
            deductFromAmount = 30 * 2;
        }
        // Lime to Green
        else if (amount >= 91 && amount <= 120) {
            startValue = colorConstants[3];
            toRound = colorConstants[3] - colorConstants[4];
            deductFromAmount = 30 * 3;
        }
        // Green to Green/Blue
        else if (amount >= 121 && amount <= 150) {
            startValue = colorConstants[4];
            toRound = colorConstants[4] - colorConstants[5];
            deductFromAmount = 30 * 4;
        }
        // Green/Blue to Cyan
        else if (amount >= 151 && amount <= 180) {
            startValue = colorConstants[5];
            toRound = colorConstants[5] - colorConstants[6];
            deductFromAmount = 30 * 5;
        }
        // Cyan to Teal
        else if (amount >= 181 && amount <= 210) {
            startValue = colorConstants[6];
            toRound = colorConstants[6] - colorConstants[7];
            deductFromAmount = 30 * 6;
        }
        // Teal to Blue
        else if (amount >= 211 && amount <= 240) {
            startValue = colorConstants[7];
            toRound = colorConstants[7] - colorConstants[8];
            deductFromAmount = 30 * 7;
        }
        // Blue to Purple
        else if (amount >= 241 && amount <= 270) {
            startValue = colorConstants[8];
            toRound = colorConstants[8] - colorConstants[9];
            deductFromAmount = 30 * 8;
        }
        // Purple to Pink
        else if (amount >= 271 && amount <= 300) {
            startValue = colorConstants[9];
            toRound = colorConstants[9] - colorConstants[10];
            deductFromAmount = 30 * 9;
        }
        // Pink to Hotpink
        else if (amount >= 301 && amount <= 330) {
            startValue = colorConstants[10];
            toRound = colorConstants[10] - colorConstants[11];
            deductFromAmount = 30 * 10;
        }
        // Hotpink to Red
        else if (amount >= 331 && amount <= 360) {
            startValue = colorConstants[11];
            toRound = colorConstants[11] - colorConstants[0];
            deductFromAmount = 30 * 11;
        }

        if (type === 'get') return value * (startValue - (Math.round((toRound) / 30 * 1000) / 1000) * (amount - deductFromAmount));
        else if (type === 'set') return value / (startValue - (Math.round((toRound) / 30 * 1000) / 1000) * (amount - deductFromAmount)) * 360;
	}

	_colorSetParser(color, value, type) {
		let rgb;

		if (type === 'hue') {
            this.hueCache = value;
            setTimeout(() => {
                this.hueCache = 0;
            }, 200);
            rgb = tinyColor({
                h: this._hueParser(value, 'set') || 0,
                s: (this.getCapabilityValue('light_saturation') || 1) * 100,
                v: (this.getCapabilityValue('dim') || 1) * 100
            }).toRgb();
            if (this.colorCache.w > 0) this._sendColor([0], [5]);
        }
        else if (type === 'saturation') {
		    // If set type is saturation and there's a hue command
		    if (this.hueCache > 0) {
		        rgb = tinyColor({
                   h: this._hueParser(this.hueCache, 'set') || 0,
                   s: value * 100,
                   v: (this.getCapabilityValue('dim') || 1) * 100
                }).toRgb();
                if (this.colorCache.w > 0) this._sendColor([0], [5]);
            }
            // Otherwise
            else {
                rgb = tinyColor({
                    h: this._hueParser(this.getCapabilityValue('light_hue'), 'set') || 0,
                    s: value * 100,
                    v: (this.getCapabilityValue(dim) || 1) * 100
                }).toRgb();
                rgb.a = 0;
            }

            // If it's an RGB + White strip
            if (this.getSetting('strip_type').indexOf('w') >= 0 &&
                value < (parseInt(this.getSetting('white_saturation')) / 99 || 10) &&
                this.hueCache === 0) {
                    // Alpha is the white channel in this case
                    rgb.r = rgb.r * value;
                    rgb.g = rgb.g * value;
                    rgb.b = rgb.b * value;
                    rgb.a = Math.round((1 - value) * 99);
            }
        }

        // Set light mode to correct value
        if (this.getCapabilityValue('light_mode') !== 'color') {
            this.setCapabilityValue('light_mode', 'color');
        }

        // Return the colour value
        return {
            Value: Math.round((rgb[color] / 255) * 99)
        };
	}

    /*
    ================================================================
    Temperature parsing
    ================================================================
     */
    _temperatureParser(value, dim) {
        const amount = Math.round(value * 100);

        let gBaseValue;
        let gToDeduct;
        let bBaseValue;
        let bToDeduct;
        let bgToDeduct;

        if (value >= 0 && value <= .1) {
            gBaseValue = 53;
            gToDeduct = .3;
            bBaseValue = 21;
            bToDeduct = .5;
            bgToDeduct = 0;
        } else if (value >= .1 && value <= .2) {
            gBaseValue = 50;
            gToDeduct = .1;
            bBaseValue = 16;
            bToDeduct = .3;
            bgToDeduct = 10;
        } else if (value >= .2 && value <= .3) {
            gBaseValue = 49;
            gToDeduct = .5;
            bBaseValue = 13;
            bToDeduct = .4;
            bgToDeduct = 20;
        } else if (value >= .3 && value <= .4) {
            gBaseValue = 44;
            gToDeduct = .2;
            bBaseValue = 9;
            bToDeduct = .2;
            bgToDeduct = 30;
        } else if (value >= .4 && value <= .5) {
            gBaseValue = 42;
            gToDeduct = .3;
            bBaseValue = 7;
            bToDeduct = .2;
            bgToDeduct = 40;
        } else if (value >= .5 && value <= .6) {
            gBaseValue = 39;
            gToDeduct = .4;
            bBaseValue = 5;
            bToDeduct = .1;
            bgToDeduct = 50;
        } else if (value >= .6 && value <= .7) {
            gBaseValue = 35;
            gToDeduct = .2;
            bBaseValue = 4;
            bToDeduct = .1;
            bgToDeduct = 60;
        } else if (value >= .7 && value <= .8) {
            gBaseValue = 33;
            gToDeduct = .6;
            bBaseValue = 3;
            bToDeduct = .1;
            bgToDeduct = 70;
        } else if (value >= .8 && value <= .9) {
            gBaseValue = 27;
            gToDeduct = .2;
            bBaseValue = 2;
            bToDeduct = .1;
            bgToDeduct = 80;
        } else if (value >= .9 && value <= 1) {
            gBaseValue = 25;
            gToDeduct = .3;
            bBaseValue = 1;
            bToDeduct = .1;
            bgToDeduct = 90;
        }

        return {
            r: 99 * this.getCapabilityValue('dim'),
            g: (gBaseValue - gToDeduct * (amount - bgToDeduct) * this.getCapabilityValue('dim')),
            b: (bBaseValue - bToDeduct * (amount - bgToDeduct) * this.getCapabilityValue('dim'))
        };
    }

    _temperatureSetParser(color, value) {
        // If it's a single color strip attached
        if (this.getSetting('strip_type') === ('scr' || 'scg' || 'scb' || 'scw')) {
            // Set colour temperature to 50% as it's not used
            this.setCapabilityValue('light_temperature', .5);
            // Set dim value to the value it was put at
            this.setCapabilityValue('dim', 1 - value);
            // Set light mode to color
            this.setCapabilityValue('light_mode', 'color');

            // If this light strip is of the correct colour proceed
            if (color === this.getSetting('strip_type').slice(2)) {
                return {
                    Value: Math.round((this.getCapabilityValue('dim') || 1) * (1 - value) * 99)
            }
            } else {
                return {
                    Value: 'off/disable'
                }
            }
        }

        // If it's a correlated color temperature strip attached
        if (this.getSetting('strip_type') === 'cct') {
            // Set light mode to temperature
            this.setCapabilityValue('light_mode', 'temperature');

            if (color === ('r' || 'g')) return {
                Value: 'off/disable'
            };
            else if (color === 'b') return {
                Value: Math.round((this.getCapabilityValue('dim') || 1) * (1 - value) * 99)
            };
            else if (color === 'w') return {
                Value: Math.round((this.getCapabilityValue('dim') || 1) * value * 99)
            };
        }

        // If it's an RGB(W) strip attached
        if (this.getSetting('strip_type') === ('rgb' || 'rgbw')) {
            let whiteValue = value;

            const whiteTemperature = this.getSetting('white_temperature') || 'ww';
            if (this.getSetting('rgbw_white_temperature') === true && this.getSetting('strip_type').indexOf('w') >= 0) {
                let transitionValue;

                // Set initial temperature levels
                if (whiteTemperature === 'eww') transitionValue = .96;
                else if (whiteTemperature === 'ww') transitionValue = .9;
                else if (whiteTemperature === 'nw') transitionValue = .5;
                else if (whiteTemperature === 'cw') transitionValue = .1;

                // Caps the calibration between 0 and 1
                transitionValue += Math.min(Math.max(parseInt(this.getSetting('calibrate_white')) / 100 || 0, 0), 1);

                if (value > transitionValue) whiteValue = 1 - value;
            }

            // Set light mode to temperature
            this.setCapabilityValue('light_mode', 'temperature');

            const rgb = this._temperatureParser(value, (this.getCapabilityValue('dim') || 1));
            if (color === 'r') {
                return {
                    Value: rgb.r
                }
            } else if (color === 'g') {
                return {
                    Value: rgb.g
                }
            } else if (color === 'b') {
                return {
                    Value: rgb.b
                }
            } else if (color === 'w') {
                if (this.getSetting('rgbw_white_temperature') &&
                    this.getSetting('strip_type').indexOf('w') >= 0) {
                        return {
                            Value: Math.min(Math.round((this.getCapabilityValue('dim') || 1) * (99 * whiteValue)), 99)
                        };
                }
            }

            return {
                Value: 'off/disable'
            };
        }
    }

    /*
    ================================================================
    Flow related methods
    ================================================================
     */
    //TODO add Flows for this driver

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
                this[`_input${inputNumber}FlowTrigger`].trigger(this, null, {volt: this._valueToVolt(report['Value (Raw)'][0])});
            }

            // If not analog input(s), update values in homey
            else this._updateValues();
        }
    }
}

module.exports = FibaroRGBWControllerDevice;