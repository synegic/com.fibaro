'use strict';

// Athom includes
const Homey = require('homey');
const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;
const utils = require('homey-meshdriver').Util;

// Third party includes
const tinyGradient = require('tinygradient');

class FibaroRGBWControllerDevice extends ZwaveDevice {
	
    onMeshInit() {
	    this.currentRGB = {
	        r: 0,
            g: 0,
            b: 0,
            a: 0
        };
		this.realInputConfigs = {
            "input1": null,
            "input2": null,
            "input3": null,
            "input4": null
        };
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

        this._reloadRealInputConfig();

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
            .registerRunListener(this._resetMeterRunListener.bind(this));

        this._randomColorAction =  new Homey.FlowCardAction('RGBW_random').register()
            .registerRunListener(this._randomColorRunListener.bind(this));
        this._specificColorAction =  new Homey.FlowCardAction('RGBW_specific').register()
            .registerRunListener(this._specificColorRunListener.bind(this));
        this._animationAction =  new Homey.FlowCardAction('RGBW_animation').register()
            .registerRunListener(this._animationRunListener.bind(this));

        /*
        ================================================================
        Registering on/off
        ================================================================
        */
		this.registerCapability('onoff', 'SWITCH_MULTILEVEL', {
			multiChannelNodeId: 1
		});

        /*
        ================================================================
        Registering light_hue, light_saturation and dim
        ================================================================
        */
        this.registerMultipleCapabilityListener(['light_saturation', 'light_hue', 'dim'], async (newValue, opts) => {
            let red, green, blue, white;
            let hue, saturation, value;

            // Dim value changed for temperature mode
            if (this.getCapabilityValue('light_mode') === 'temperature' && typeof newValue['light_hue'] !== 'number' && typeof newValue['light_saturation'] !== 'number') {
                let originalHSV = this._tempToHSV(this.getCapabilityValue('light_temperature'));
                let rgb = utils.convertHSVToRGB({hue: originalHSV.h / 360, saturation: originalHSV.s, value: newValue.dim});
                let rgbw = this._convertRGBtoRGBW({red: rgb.red, green: rgb.green, blue: rgb.blue});

                if (this.getSetting('strip_type') === 'rgbw') {
                    red = (rgbw.red / 255) * 99;
                    green = (rgbw.green / 255) * 99;
                    blue = (rgbw.blue / 255) * 99;
                    white = (rgbw.white / 255) * 99;
                } else {
                    red = (rgb.red / 255) * 99;
                    green = (rgb.green / 255) * 99;
                    blue = (rgb.blue / 255) * 99;
                }
            }

            // Light mode color or saturation/hue changed
            else if (this.getCapabilityValue('light_mode') === 'color' || typeof newValue['light_hue'] === 'number' || typeof newValue['light_saturation'] === 'number') {
                typeof newValue['light_hue'] === 'number' ? hue = newValue['light_hue'] : hue = this.getCapabilityValue('light_hue');
                typeof newValue['light_saturation'] === 'number' ? saturation = newValue['light_saturation'] : saturation = this.getCapabilityValue('light_saturation');
                typeof newValue['dim'] === 'number' ? value = newValue['dim'] : value = this.getCapabilityValue('dim');

                let rgb = utils.convertHSVToRGB({hue, saturation, value});
                let rgbw = this._convertRGBtoRGBW({red: rgb.red, green: rgb.green, blue: rgb.blue});

                if (this.getSetting('strip_type') === 'rgbw') {
                    red = (rgbw.red / 255) * 99;
                    green = (rgbw.green / 255) * 99;
                    blue = (rgbw.blue / 255) * 99;
                    white = (rgbw.white / 255) * 99;
                } else {
                    red = (rgb.red / 255) * 99;
                    green = (rgb.green / 255) * 99;
                    blue = (rgb.blue / 255) * 99;
                }
            }

            try {
                await this._sendColor(red, 2);
                this.currentRGB.r = red;
                await this._sendColor(green, 3);
                this.currentRGB.g = green;
                await this._sendColor(blue, 4);
                this.currentRGB.b = blue;

                if (typeof white === 'number') {
                    await this._sendColor(white, 5);
                    this.currentRGB.a = white;
                }
            } catch (err) {
                return Promise.reject(err);
            }

            return Promise.resolve();
        });

        /*
        ================================================================
        Registering light_temperature
        ================================================================
         */
        this.registerCapabilityListener('light_temperature', async (value, opts) => {
            let red, green, blue, white;
            let rgb = this._tempToRGB(value);
            let rgbw = this._convertRGBtoRGBW({red: rgb.red, green: rgb.green, blue: rgb.blue});

            if (this.getSetting('strip_type') === 'rgbw') {
                red = (rgbw.red / 255) * 99;
                green = (rgbw.green / 255) * 99;
                blue = (rgbw.blue / 255) * 99;
                white = (rgbw.white / 255) * 99;
            } else {
                red = (rgb.red / 255) * 99;
                green = (rgb.green / 255) * 99;
                blue = (rgb.blue / 255) * 99;
            }

            try {
                await this._sendColor(red, 2);
                await this._sendColor(green, 3);
                await this._sendColor(blue, 4);

                if (typeof white === 'number') {
                    await this._sendColor(white, 5);
                }
            } catch (err) {
                return Promise.reject(err);
            }

            return Promise.resolve();
        });

        this.registerCapabilityListener('light_mode', async (value, opts) => {
            if (value === 'color') {
                await this._sendColor(this.currentRGB.r, 2);
                await this._sendColor(this.currentRGB.g, 3);
                await this._sendColor(this.currentRGB.b, 4);
                await this._sendColor(this.currentRGB.a, 5);
            } else if (value === 'temperature') {
                let red, green, blue, white;
                let rgb = this._tempToRGB(this.getCapabilityValue('light_temperature'));
                let rgbw = this._convertRGBtoRGBW({red: rgb.red, green: rgb.green, blue: rgb.blue});

                if (this.getSetting('strip_type') === 'rgbw') {
                    red = (rgbw.red / 255) * 99;
                    green = (rgbw.green / 255) * 99;
                    blue = (rgbw.blue / 255) * 99;
                    white = (rgbw.white / 255) * 99;
                } else {
                    red = (rgb.red / 255) * 99;
                    green = (rgb.green / 255) * 99;
                    blue = (rgb.blue / 255) * 99;
                }

                try {
                    await this._sendColor(red, 2);
                    await this._sendColor(green, 3);
                    await this._sendColor(blue, 4);

                    if (typeof white === 'number') {
                        await this._sendColor(white, 5);
                    }
                } catch (err) {
                    return Promise.reject(err);
                }
            }

            return Promise.resolve();
        });

        /*
        ================================================================
        Registering meter_power and measure_power
        ================================================================
         */
        this.registerCapability('meter_power', 'METER');
        this.registerCapability('measure_power', 'SENSOR_MULTILEVEL');

        /*
        ================================================================
        Registering light_mode and measure_voltage.input
        ================================================================
         */
        this.registerCapability('light_mode', 'BASIC');
        this.registerCapability('measure_voltage.input1', 'SWITCH_MULTILEVEL', {
            multiChannelNodeId: 2,
            reportParser: (report) => this._reportParser(report, 2),
            reportParserV2: (report) => this._reportParser(report, 2),
            reportParserV3: (report) => this._reportParser(report, 2),
            reportParserV4: (report) => this._reportParser(report, 2),
        });
        this.registerCapability('measure_voltage.input2', 'SWITCH_MULTILEVEL', {
            multiChannelNodeId: 2,
            reportParser: (report) => this._reportParser(report, 3),
            reportParserV2: (report) => this._reportParser(report, 3),
            reportParserV3: (report) => this._reportParser(report, 3),
            reportParserV4: (report) => this._reportParser(report, 3),
        });
        this.registerCapability('measure_voltage.input3', 'SWITCH_MULTILEVEL', {
            multiChannelNodeId: 2,
            reportParser: (report) => this._reportParser(report, 4),
            reportParserV2: (report) => this._reportParser(report, 4),
            reportParserV3: (report) => this._reportParser(report, 4),
            reportParserV4: (report) => this._reportParser(report, 4),
        });
        this.registerCapability('measure_voltage.input4', 'SWITCH_MULTILEVEL', {
            multiChannelNodeId: 2,
            reportParser: (report) => this._reportParser(report, 5),
            reportParserV2: (report) => this._reportParser(report, 5),
            reportParserV3: (report) => this._reportParser(report, 5),
            reportParserV4: (report) => this._reportParser(report, 5),
        });

        /*
        ================================================================
        Registering settings with custom parsers
        ================================================================
         */
        this.registerSetting('strip_type', (value, settings) => {
            if (value === 'cct' && this.getCapabilityValue('light_mode') !== 'temperature') {
                this.setCapabilityValue('light_mode', 'temperature');
            } else if (this.getCapabilityValue('light_mode') !== 'color') {
                this.setCapabilityValue('light_mode', 'color');
            }

            if (this._reloadRealInputConfig()) {
                return new Buffer([
                    this.realInputConfigs.input1 * 16 + this.realInputConfigs.input2,
                    this.realInputConfigs.input3 * 16 + this.realInputConfigs.input4
                ]);
            }
        });
        // Both connected to the same index
        this.registerSetting('mode2_range', (value, settings) => {
           if (zwaveObj.mode2_transition_time === '0') return 0;
           return new Buffer([value + zwaveObj.mode2_transition_time]);
        });
        this.registerSetting('mode2_transition_time', (value, settings) => {
            if (value === '0') return 0;
            return new Buffer([value + zwaveObj.mode2_transition_time]);
        });
        // Handles Z-Wave sending in parser method as multiple inputs end up at the same index
        this.registerSetting('input_config_1', (value, settings) => this._inputSettingParser(1, value, settings));
        this.registerSetting('input_config_2', (value, settings) => this._inputSettingParser(2, value, settings));
        this.registerSetting('input_config_3', (value, settings) => this._inputSettingParser(3, value, settings));
        this.registerSetting('input_config_4', (value, settings) => this._inputSettingParser(4, value, settings));
        this.registerSetting('input_threshold', value => new Buffer([value * 10]));
        this.registerSetting('kwh_threshold', value => new Buffer([value * 100]));
    }

    /*
    ================================================================
    Temperature parsing
    ================================================================
     */
    _tempToRGB(value) {
        let hsv = this.temperatureGradient.hsvAt(value)._originalInput;
        return utils.convertHSVToRGB({hue: hsv.h/360, saturation: hsv.s, value: this.getCapabilityValue('dim')});
    }

    _tempToHSV(value) {
        return this.temperatureGradient.hsvAt(value)._originalInput;
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

    async _randomColorRunListener(args, state) {
        if (args.device !== this) return Promise.reject('Not the right device');
        if (this.getSetting('strip_type').indexOf('rgb') < 0) return Promise.reject('Random colors only available in RGB(W) mode');
        if (args.hasOwnProperty('range')) {
            let rgb = utils.convertHSVToRGB({hue: (Math.random() * 100) / 100, saturation: 1, value: this.getCapabilityValue('dim')});
            let rgbw = this._convertRGBtoRGBW({red: rgb.red, green: rgb.green, blue: rgb.blue});

            // Adjust color values to 0 - 100 scale
            rgbw.red = (rgbw.red / 255) * 99;
            rgbw.green = (rgbw.green / 255) * 99;
            rgbw.blue = (rgbw.blue / 255) * 99;
            rgbw.white = (rgbw.white / 255) * 99;

            rgb.red = (rgb.red / 255) * 99;
            rgb.green = (rgb.green / 255) * 99;
            rgb.blue = (rgb.blue / 255) * 99;

            try {
                if (args.range === 'rgb') {
                    await this._sendColor(rgb.red, 2);
                    await this._sendColor(rgb.green, 3);
                    await this._sendColor(rgb.blue, 4);
                } else if (args.range === 'rgbw' && this.getSetting('strip_type') === 'rgbw') {
                    await this._sendColor(rgbw.red, 2);
                    await this._sendColor(rgbw.green, 3);
                    await this._sendColor(rgbw.blue, 4);
                    await this._sendColor(rgbw.white, 5);
                } else if (args.range === 'rgb-w' && this.getSetting('strip_type') === 'rgbw') {
                    let randomDecision = Math.round(Math.random());

                    if (randomDecision !== 0) {
                        await this._sendColor(0, 2);
                        await this._sendColor(0, 3);
                        await this._sendColor(0, 4);
                        await this._sendColor(rgbw.white, 5);
                    } else {
                        await this._sendColor(rgb.red, 2);
                        await this._sendColor(rgb.green, 3);
                        await this._sendColor(rgb.blue, 4);
                    }

                } else if (args.range.indexOf('r-g-b') >= 0) {
                    let option;

                    args.range.indexOf('w') >= 0 ? option = Math.round(Math.random() * 4) : option = Math.round(Math.random() * 3);

                    switch (option) {
                        case 0:
                            rgb.red = 99 * (this.getCapabilityValue('dim') || 1);
                            await this._sendColor(rgb.red, 2);
                            await this._sendColor(0, 3);
                            await this._sendColor(0, 4);
                            await this._sendColor(0, 5);
                            break;
                        case 1:
                            rgb.green = 99 * (this.getCapabilityValue('dim') || 1);
                            await this._sendColor(0, 2);
                            await this._sendColor(rgb.green, 3);
                            await this._sendColor(0, 4);
                            await this._sendColor(0, 5);
                            break;
                        case 2:
                            rgb.blue = 99 * (this.getCapabilityValue('dim') || 1);
                            await this._sendColor(0, 2);
                            await this._sendColor(0, 3);
                            await this._sendColor(rgb.blue, 4);
                            await this._sendColor(0, 5);
                            break;
                        case 3:
                            rgbw.white = 99 * (this.getCapabilityValue('dim') || 1);
                            await this._sendColor(0, 2);
                            await this._sendColor(0, 3);
                            await this._sendColor(0, 4);
                            await this._sendColor(rgbw.white, 5);
                            break;
                    }
                } else if (args.range.indexOf('r-y-g-c-b-m') >= 0) {
                    let option, hue;

                    args.range.indexOf('w') >= 0 ? option = Math.round(Math.random() * 7) : option = Math.round(Math.random() * 6);

                    switch (option) {
                        case 0:
                            rgb.red = 99 * (this.getCapabilityValue('dim') || 1);
                            await this._sendColor(rgb.red, 2);
                            await this._sendColor(0, 3);
                            await this._sendColor(0, 4);
                            await this._sendColor(0, 5);
                            break;
                        case 1:
                            hue = .125;
                            break;
                        case 2:
                            rgb.green = 99 * (this.getCapabilityValue('dim') || 1);
                            await this._sendColor(0, 2);
                            await this._sendColor(rgb.green, 3);
                            await this._sendColor(0, 4);
                            await this._sendColor(0, 5);
                            break;
                        case 3:
                            hue = .5;
                            break;
                        case 4:
                            rgb.blue = 99 * (this.getCapabilityValue('dim') || 1);
                            await this._sendColor(0, 2);
                            await this._sendColor(0, 3);
                            await this._sendColor(rgb.blue, 4);
                            await this._sendColor(0, 5);
                            break;
                        case 5:
                            hue = .875;
                            break;
                        case 6:
                            rgbw.white = 99 * (this.getCapabilityValue('dim') || 1);
                            await this._sendColor(0, 2);
                            await this._sendColor(0, 3);
                            await this._sendColor(0, 4);
                            await this._sendColor(rgbw.white, 5);
                            break;
                    }

                    if (hue) {
                        rgb = utils.convertHSVToRGB({hue: hue, saturation: 1, value: this.getCapabilityValue('dim')});
                        rgbw = this._convertRGBtoRGBW({red: rgb.red, green: rgb.green, blue: rgb.blue});

                        await this._sendColor((rgbw.red / 255) * 99, 2);
                        await this._sendColor((rgbw.green / 255) * 99, 3);
                        await this._sendColor((rgbw.blue / 255) * 99, 4);
                        await this._sendColor((rgbw.white / 255) * 99, 5);
                    }
                }
            } catch (err) {
                return Promise.reject(err);
            }
        }
    }

    async _specificColorRunListener(args, state) {
        if (args.device !== this) return Promise.reject('Not the right device');
        if (args && args.hasOwnProperty('color') && args.hasOwnProperty('brightness')) {
            let multiChannel;
            let stripType = this.getSetting('strip_type');

            switch(args.color) {
                case 'r': multiChannel = 2; break;
                case 'g': multiChannel = 3; break;
                case 'b': multiChannel = 4; break;
                case 'w': multiChannel = 5; break;
            }

            if (stripType.indexOf('sc') >= 0 && args.color !== stripType.slice(2)) return Promise.reject('Color not in use');
            if (stripType.indexOf('cct') >= 0 && (args.color === 'r' || args.color === 'g')) return Promise.reject('Color not in use');
            if (stripType === 'rgb' && args.color === 'w') return Promise.reject('Color not in use');

            return await this._sendColor(Math.round(args.brightness * 99), multiChannel);
        }
    }

    async _animationRunListener(args, state) {
        if (args.device !== this) return Promise.reject('Not the right device');
        if (this.getSetting('strip_type').indexOf('rgb') < 0) return Promise.reject('Animations only available in RGB(W) mode');
        if ((this.realInputConfigs.input1 || this.realInputConfigs.input2 || this.realInputConfigs.input3 || this.realInputConfigs.input4) > 8) {
            return Promise.reject('Animations only available without analog input');
        }

        if (args && args.hasOwnProperty('animation')) {
            if (args.animation === '0') {
                try {
                    await this._sendColor(this.currentRGB.r, 2);
                    await this._sendColor(this.currentRGB.g, 3);
                    await this._sendColor(this.currentRGB.b, 4);
                    await this._sendColor(this.currentRGB.a, 5);
                    return Promise.resolve();
                } catch (err) {
                    return Promise.reject(err);
                }
            }
            if (args.animation === '11') {
                args.animation = Math.round(Math.random() * (10-6) + 6);
            }

            try {
                return await this.configurationSet({
                    index: 72,
                    size: 1
                }, new Buffer([parseInt(args.animation)]));
            } catch (err) {
                return Promise.reject(err);
            }
        }
    }


    /*
    ================================================================
    Helper methods
    ================================================================
     */
    _convertRGBtoRGBW({red, green, blue}) {
        // Determine the maximum value between R, G, B
        let colorMax = Math.max(red, Math.max(green,  blue));

        // If the max is 0 immediately return true black
        if (colorMax === 0) return {red: 0, green: 0, blue: 0, white: 0};

        // Calculate colour hues
        let multiplier = 255 / colorMax;
        let redHue = red * multiplier;
        let greenHue = green * multiplier;
        let blueHue = blue * multiplier;

        // Calculate the luminance
        let trueMax = Math.max(redHue, Math.max(greenHue, blueHue));
        let trueMin = Math.min(redHue, Math.min(greenHue, blueHue));
        let luminance = ((trueMax + trueMin) / 2) - 127.5 * (2 / multiplier);

        // Calculate output values
        let redOutput = red - luminance;
        let greenOutput = green - luminance;
        let blueOutput = blue - luminance;
        let whiteOutput = luminance;

        // Limit output values to 0 - 255
        if (redOutput < 0) redOutput = 0;
        if (greenOutput < 0) greenOutput = 0;
        if (blueOutput < 0) blueOutput = 0;
        if (whiteOutput < 0) whiteOutput = 0;

        if (redOutput > 255) redOutput = 255;
        if (greenOutput > 255) greenOutput = 255;
        if (blueOutput > 255) blueOutput = 255;
        if (whiteOutput > 255) whiteOutput = 255;

        // Return RGBW value
        return {red: redOutput, green: greenOutput, blue: blueOutput, white: whiteOutput};
    }

    _valueToVolt(value) {
        return Math.round(value / 99 * 100) / 10;
    }

    _reloadRealInputConfig() {
        let newInputConfig = {};

        newInputConfig.input1= parseInt(this.getSetting('input_config_1') || 1);
        newInputConfig.input2= parseInt(this.getSetting('input_config_2') || 1);
        newInputConfig.input3= parseInt(this.getSetting('input_config_3') || 1);
        newInputConfig.input4= parseInt(this.getSetting('input_config_4') || 1);

        if (this.getSetting('strip_type') !== 'cct' && this.getSetting('strip_type').indexOf('rgb') < 0) {
            newInputConfig.input1 += 8;
            newInputConfig.input2 += 8;
            newInputConfig.input3 += 8;
            newInputConfig.input4 += 8;
        }

        if (newInputConfig.input1 !== this.realInputConfigs.input1 ||
                newInputConfig.input2 !== this.realInputConfigs.input2 ||
                newInputConfig.input3 !== this.realInputConfigs.input3 ||
                newInputConfig.input4 !== this.realInputConfigs.input4) {
                    this.realInputConfigs = newInputConfig;
                    return true;
        }
        return false;
    }

    async _sendColor(value, multiChannel) {
        return await this.node.MultiChannelNodes[multiChannel].CommandClass.COMMAND_CLASS_SWITCH_MULTILEVEL.SWITCH_MULTILEVEL_SET({Value: value});
    }

    _inputSettingParser(inputNumber, value, settings) {
        this.realInputConfigs[`input${inputNumber}`] = parseInt(value) || 1;

        if (newSettings.strip_type.indexOf('rgb') < 0 && newSettings.strip_type !== 'cct') {
            this.realInputConfigs[`input${inputNumber}`] += 8;
        }

        let zwaveValue = new Buffer([
            (this.realInputConfigs.input1 * 16 +
                this.realInputConfigs.input2),
            (this.realInputConfigs.input3 * 16 +
                this.realInputConfigs.input4)
        ]);

        try {
            this.configurationSet({
                index: 14,
                size: 2
            }, zwaveValue);
        } catch (err) {
            this.log(err);
        }
    }

    _reportParser(report, channel) {
        let red, green, blue, white;
        let inputNumber = channel - 1;

        switch (channel) {
            case 2: red = report['Value (Raw)'][0]; break;
            case 3: green = report['Value (Raw)'][0]; break;
            case 4: blue = report['Value (Raw)'][0]; break;
            case 5: white = report['Value (Raw)'][0]; break;
        }

        // Check if we should trigger an on/off flow for inputs
        if (this.currentRGB.r === 0 && red > 0 ||
            this.currentRGB.g === 0 && green > 0 ||
            this.currentRGB.b === 0 && blue > 0 ||
            this.currentRGB.a === 0 && white > 0) {
                this._onFlowTrigger.trigger(this, null, {input: inputNumber});
        } else if (this.currentRGB.r > 0 && red === 0 ||
            this.currentRGB.g > 0 && green === 0 ||
            this.currentRGB.b > 0 && blue === 0 ||
            this.currentRGB.a > 0 && white === 0) {
                this._offFlowTrigger.trigger(this, null, {input: inputNumber});
        }

        if (typeof red === 'number') this.currentRGB.r = red;
        if (typeof green === 'number') this.currentRGB.g = green;
        if (typeof blue === 'number') this.currentRGB.b = blue;
        if (typeof white === 'number') this.currentRGB.a = white;

        // Calculate the new HSV value
        let newColour = utils.convertRGBToHSV({red: this.currentRGB.r, green: this.currentRGB.g, blue: this.currentRGB.b});

        this.setCapabilityValue('light_hue', newColour.hue);
        this.setCapabilityValue('light_saturation', newColour.saturation);

        if (this.getCapabilityValue('dim') === 0) {
            this.setCapabilityValue('onoff', true);
            this.setCapabilityValue('dim', newColour.value);
        }

        if (this.realInputConfigs[`input${inputNumber}`] === 8) {
            this.setCapabilityValue('measure_voltage.input1', this._valueToVolt(report['Value (Raw)'][0]));
            this[`input${inputNumber}FlowTrigger`].trigger(this, {volt: this._valueToVolt(report['Value (Raw)'][0])}, null);
        }
    }
}

module.exports = FibaroRGBWControllerDevice;