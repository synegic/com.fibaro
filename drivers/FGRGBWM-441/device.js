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
            a: 0,
        };
        this.realInputConfigs = {
            input1: null,
            input2: null,
            input3: null,
            input4: null,
        };
        this.temperatureGradient = tinyGradient([
            '#80c5fc',
            '#ffffff',
            '#ffe68b',
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
        this._onFlowTrigger = this.getDriver().onFlowTrigger;
        this._offFlowTrigger = this.getDriver().offFlowTrigger;

        this._input1FlowTrigger = this.getDriver().input1FlowTrigger;
        this._input2FlowTrigger = this.getDriver().input2FlowTrigger;
        this._input3FlowTrigger = this.getDriver().input3FlowTrigger;
        this._input4FlowTrigger = this.getDriver().input4FlowTrigger;

        this._resetMeterAction = this.getDriver().resetMeterAction;

        this._randomColorAction = this.getDriver().randomColorAction;
        this._specificColorAction = this.getDriver().specificColorAction;
        this._animationAction = this.getDriver().animationAction;

        /*
        ================================================================
        Registering on/off
        ================================================================
        */
        this.registerCapability('onoff', 'SWITCH_MULTILEVEL', {
            multiChannelNodeId: 1,
        });

        /*
        ================================================================
        Registering light_hue, light_saturation and dim
        ================================================================
        */
        this.registerMultipleCapabilityListener(['light_saturation', 'light_hue', 'dim'], async (newValues, opts) => {
            let red,
               green,
               blue,
               white;

            let hue = (this.getCapabilityValue('light_hue') * 360);
            let saturation = (this.getCapabilityValue('light_saturation') * 100);
            let value = (this.getCapabilityValue('dim') * 100);

           if (this.getCapabilityValue('light_mode') === 'temperature' && typeof newValues.light_hue !== 'number' && typeof newValues.light_saturation !== 'number') {
               let currentHSV = this.temperatureGradient.hsvAt(this.getCapabilityValue('light_temperature')).toHsv();
               currentHSV.s *= 100;
               currentHSV.v = newValues.dim * 100;

               let rgb = this._convertHSVToRGB(currentHSV);
               let rgbw = this._convertRGBtoRGBW(rgb);

               if (this.getSetting('strip_type') === 'rgbw') {
                   red = (rgbw.r / 255) * 99;
                   green = (rgbw.g / 255) * 99;
                   blue = (rgbw.b / 255) * 99;
                   white = (rgbw.w / 255) * 99;
               } else {
                   red = (rgb.r / 255) * 99;
                   green = (rgb.g / 255) * 99;
                   blue = (rgb.b / 255) * 99;
               }
           } else if (this.getCapabilityValue('light_mode') === 'color' || typeof newValues.light_hue === 'number' || typeof newValues.light_saturation === 'number') {

               if (typeof newValues.light_hue === 'number') hue = (newValues.light_hue * 360);
               if (typeof newValues.light_saturation === 'number') saturation = (newValues.light_saturation * 100);
               if (typeof newValues.dim === 'number') value = (newValues.dim * 100);

               const hsv = {h: hue, s: saturation, v: value};
               const rgb = this._convertHSVToRGB(hsv);

               red = (rgb.r / 255) * 99;
               green = (rgb.g / 255) * 99;
               blue = (rgb.b / 255) * 99;
               white = 0;
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
            let red,
                green,
                blue,
                white;

            let HSV = this.temperatureGradient.hsvAt(value).toHsv();
            HSV.s *= 100;
            HSV.v = this.getCapabilityValue('dim') * 100;

            let rgb = this._convertHSVToRGB(HSV);
            let rgbw = this._convertRGBtoRGBW(rgb);

            if (this.getSetting('strip_type') === 'rgbw') {
                red = (rgbw.r / 255) * 99;
                green = (rgbw.g / 255) * 99;
                blue = (rgbw.b / 255) * 99;
                white = (rgbw.w / 255) * 99;
            } else {
                red = (rgb.r / 255) * 99;
                green = (rgb.g / 255) * 99;
                blue = (rgb.b / 255) * 99;
            }

            try {
                await this._sendColor(red, 2);
                await this._sendColor(green, 3);
                await this._sendColor(blue, 4);

                if (typeof white === 'number') {
                    await this._sendColor(white, 5);
                }

                return Promise.resolve();
            } catch (err) {
                return Promise.reject(err);
            }
        });

        this.registerCapabilityListener('light_mode', async (value, opts) => {
            if (value === 'color') {
                await this._sendColor(this.currentRGB.r, 2);
                await this._sendColor(this.currentRGB.g, 3);
                await this._sendColor(this.currentRGB.b, 4);
                await this._sendColor(this.currentRGB.a, 5);
            } else if (value === 'temperature') {
                let red,
                    green,
                    blue,
                    white;

                let HSV = this.temperatureGradient.hsvAt(value).toHsv();
                HSV.s *= 100;
                HSV.v = this.getCapabilityValue('dim') * 100;

                let rgb = this._convertHSVToRGB(HSV);
                let rgbw = this._convertRGBtoRGBW(rgb);

                if (this.getSetting('strip_type') === 'rgbw') {
                    red = (rgbw.r / 255) * 99;
                    green = (rgbw.g / 255) * 99;
                    blue = (rgbw.b / 255) * 99;
                    white = (rgbw.w / 255) * 99;
                } else {
                    red = (rgb.r / 255) * 99;
                    green = (rgb.g / 255) * 99;
                    blue = (rgb.b / 255) * 99;
                }

                try {
                    await this._sendColor(red, 2);
                    await this._sendColor(green, 3);
                    await this._sendColor(blue, 4);

                    if (typeof white === 'number') {
                        await this._sendColor(white, 5);
                    }

                    return Promise.resolve();
                } catch (err) {
                    return Promise.reject(err);
                }
            }
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
        });
        this.registerCapability('measure_voltage.input2', 'SWITCH_MULTILEVEL', {
            multiChannelNodeId: 2,
            reportParser: (report) => this._reportParser(report, 3),
        });
        this.registerCapability('measure_voltage.input3', 'SWITCH_MULTILEVEL', {
            multiChannelNodeId: 2,
            reportParser: (report) => this._reportParser(report, 4),
        });
        this.registerCapability('measure_voltage.input4', 'SWITCH_MULTILEVEL', {
            multiChannelNodeId: 2,
            reportParser: (report) => this._reportParser(report, 5),
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
                    this.realInputConfigs.input3 * 16 + this.realInputConfigs.input4,
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
    Conversion methods
     */
    _convertHSVToRGB({h, s, v}) {
        // Normalise hue, saturation and value
        let workingHue = h / 60;
        let workingSat = s / 100;
        let workingVal = v / 100;

        // Calculate the in between products needed for RGB conversion
        let chroma = workingVal * workingSat;
        let X = chroma * (1 - Math.abs(workingHue % 2 - 1));
        let m = workingVal - chroma;

        let tempRGB;

        // Depending on the hue assign RGB values
        if (workingHue >= 0 && workingHue < 1) tempRGB = {r: chroma, g: X, b: 0};
        if (workingHue >= 1 && workingHue < 2) tempRGB = {r: X, g: chroma, b: 0};
        if (workingHue >= 2 && workingHue < 3) tempRGB = {r: 0, g: chroma, b: X};
        if (workingHue >= 3 && workingHue < 4) tempRGB = {r: 0, g: X, b: chroma};
        if (workingHue >= 4 && workingHue < 5) tempRGB = {r: X, g: 0, b: chroma};
        if (workingHue >= 5 && workingHue < 6) tempRGB = {r: chroma, g: 0, b: X};

        // Return values to 0 - 255 value space
        let rgb = {};
        rgb.r = Math.round((tempRGB.r + m) * 255);
        rgb.g = Math.round((tempRGB.g + m) * 255);
        rgb.b = Math.round((tempRGB.b + m) * 255);

        return rgb;
    }

    _convertRGBToHSV({r, g, b}) {
        let tempRGB = {r: r/255, g: g/255, b: b/255};

        // Determine the minimum and maximum value between R, G, B
        let colorMin = Math.min(tempRGB.r, tempRGB.g, tempRGB.b);
        let colorMax = Math.max(tempRGB.r, tempRGB.g, tempRGB.b);

        let colorDelta = colorMax - colorMin;
        let HSV = {};

        // Calculate the hue based on which colour has the highest intensity
        if (colorDelta === 0) HSV.h = 0;
        else if (colorMax === tempRGB.r) HSV.h = 60 * (tempRGB.g - tempRGB.b / colorDelta) % 6;
        else if (colorMax === tempRGB.g) HSV.h = 60 * (tempRGB.b - tempRGB.r / colorDelta) + 2;
        else if (colorMax === tempRGB.b) HSV.h = 60 * (tempRGB.r - tempRGB.g / colorDelta) + 4;

        colorMax === 0 ? HSV.s = 0 : HSV.s = (colorDelta / colorMax);

        HSV.v = colorMax;

        return HSV;
    }

    _convertRGBtoRGBW({r, g, b}) {
        // Normalize RGB values
        let normalizedR = r / 255;
        let normalizedG = g / 255;
        let normalizedB = b / 255;

        // Determine the minimum and maximum value between R, G, B
        const colorMin = Math.min(normalizedR, normalizedG, normalizedB);
        const colorMax = Math.max(normalizedR, normalizedG, normalizedB);

        // Full saturation has no white, return
        if (colorMax === this.getCapabilityValue('dim')) {
            return {r, g, b, w: 0};
        }

        // Calculate the white intensity
        let whiteIntensity;
        if (colorMin / colorMax < 0.5) {
            whiteIntensity = (colorMin * colorMax) / (colorMax - colorMin);
        } else {
            whiteIntensity = colorMax;
        }

        // Calculate pixel offset to remain colour hue and saturation
        let pixelGain = (whiteIntensity + colorMax) / colorMin;

        let RGBW = {};

        RGBW.r = pixelGain * (r - whiteIntensity);
        RGBW.g = pixelGain * (g - whiteIntensity);
        RGBW.b = pixelGain * (b - whiteIntensity);
        RGBW.w = whiteIntensity * 255;

        return RGBW;
    }

    /*
    ================================================================
    Flow related methods
    ================================================================
     */
    onOffFlowRunListener(args, state) {
        if (args && args.hasOwnProperty('input') &&
            state && state.hasOwnProperty('input') &&
            args.input === state.input) {
            return true;
        }
        return false;
    }

    resetMeterRunListener(args, state) {
        if (this.node && typeof this.node.CommandClass.COMMAND_CLASS_METER !== 'undefined') {
            this.node.CommandClass.COMMAND_CLASS_METER.METER_RESET({}, (err, result) => {
                if (err) throw new Error(err);
                return false;
                if (result === 'TRANSMIT_COMPLETE_OK') return true;
                return false;
            });
        }
    }

    async randomColorRunListener(args, state) {
        if (this.getSetting('strip_type').indexOf('rgb') < 0) return Promise.reject('Random colors only available in RGB(W) mode');
        if (args.hasOwnProperty('range')) {
            let rgb = this._convertHSVToRGB({
                hue: (Math.random() * (360 - 1) + 1),
                saturation: 1,
                value: this.getCapabilityValue('dim'),
            });
            let rgbw = this._convertRGBtoRGBW({r: rgb.r, g: rgb.g, b: rgb.b});

            // Adjust color values to 0 - 100 scale
            rgbw.red = (rgbw.r / 255) * 99;
            rgbw.green = (rgbw.g / 255) * 99;
            rgbw.blue = (rgbw.b / 255) * 99;
            rgbw.white = (rgbw.w / 255) * 99;

            rgb.red = (rgb.r / 255) * 99;
            rgb.green = (rgb.g / 255) * 99;
            rgb.blue = (rgb.b / 255) * 99;

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
                    const randomDecision = Math.round(Math.random());

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
                    let option,
                        hue;

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
                            hue = 0.125;
                            break;
                        case 2:
                            rgb.green = 99 * (this.getCapabilityValue('dim') || 1);
                            await this._sendColor(0, 2);
                            await this._sendColor(rgb.green, 3);
                            await this._sendColor(0, 4);
                            await this._sendColor(0, 5);
                            break;
                        case 3:
                            hue = 0.5;
                            break;
                        case 4:
                            rgb.blue = 99 * (this.getCapabilityValue('dim') || 1);
                            await this._sendColor(0, 2);
                            await this._sendColor(0, 3);
                            await this._sendColor(rgb.blue, 4);
                            await this._sendColor(0, 5);
                            break;
                        case 5:
                            hue = 0.875;
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
                        rgb = this._convertHSVToRGB({h: hue, s: 1, v: this.getCapabilityValue('dim')});
                        rgbw = this._convertRGBtoRGBW({r: rgb.r, g: rgb.g, b: rgb.b});

                        await this._sendColor((rgbw.r / 255) * 99, 2);
                        await this._sendColor((rgbw.g / 255) * 99, 3);
                        await this._sendColor((rgbw.b / 255) * 99, 4);
                        await this._sendColor((rgbw.w / 255) * 99, 5);
                    }
                }
            } catch (err) {
                return Promise.reject(err);
            }
        }
    }

    async specificColorRunListener(args, state) {
        if (args && args.hasOwnProperty('color') && args.hasOwnProperty('brightness')) {
            let multiChannel;
            const stripType = this.getSetting('strip_type');

            switch (args.color) {
                case 'r':
                    multiChannel = 2;
                    break;
                case 'g':
                    multiChannel = 3;
                    break;
                case 'b':
                    multiChannel = 4;
                    break;
                case 'w':
                    multiChannel = 5;
                    break;
            }

            if (stripType.indexOf('sc') >= 0 && args.color !== stripType.slice(2)) return Promise.reject('Color not in use');
            if (stripType.indexOf('cct') >= 0 && (args.color === 'r' || args.color === 'g')) return Promise.reject('Color not in use');
            if (stripType === 'rgb' && args.color === 'w') return Promise.reject('Color not in use');

            return await this._sendColor(Math.round(args.brightness * 99), multiChannel);
        }
    }

    async animationRunListener(args, state) {
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
                args.animation = Math.round(Math.random() * (10 - 6) + 6);
            }

            try {
                return await this.configurationSet({
                    index: 72,
                    size: 1,
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
    _valueToVolt(value) {
        return Math.round(value / 99 * 100) / 10;
    }

    _reloadRealInputConfig() {
        const newInputConfig = {};

        newInputConfig.input1 = parseInt(this.getSetting('input_config_1') || 1);
        newInputConfig.input2 = parseInt(this.getSetting('input_config_2') || 1);
        newInputConfig.input3 = parseInt(this.getSetting('input_config_3') || 1);
        newInputConfig.input4 = parseInt(this.getSetting('input_config_4') || 1);

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

    _inputSettingParser(inputNumber, value, newSettings) {
        this.realInputConfigs[`input${inputNumber}`] = parseInt(value) || 1;

        if (newSettings.strip_type.indexOf('rgb') < 0 && newSettings.strip_type !== 'cct') {
            this.realInputConfigs[`input${inputNumber}`] += 8;
        }

        const zwaveValue = new Buffer([
            (this.realInputConfigs.input1 * 16 +
                this.realInputConfigs.input2),
            (this.realInputConfigs.input3 * 16 +
                this.realInputConfigs.input4),
        ]);

        try {
            this.configurationSet({
                index: 14,
                size: 2,
            }, zwaveValue);
        } catch (err) {
            this.log(err);
        }
    }

    _reportParser(report, channel) {
        let red,
            green,
            blue,
            white;
        const inputNumber = channel - 1;

        switch (channel) {
            case 2:
                red = report['Value (Raw)'][0];
                break;
            case 3:
                green = report['Value (Raw)'][0];
                break;
            case 4:
                blue = report['Value (Raw)'][0];
                break;
            case 5:
                white = report['Value (Raw)'][0];
                break;
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
        const newColour = this._convertRGBToHSV({
            r: this.currentRGB.r,
            g: this.currentRGB.g,
            b: this.currentRGB.b
        });

        this.setCapabilityValue('light_hue', newColour.h);
        this.setCapabilityValue('light_saturation', newColour.s);

        if (this.getCapabilityValue('dim') === 0) {
            this.setCapabilityValue('onoff', true);
            this.setCapabilityValue('dim', newColour.v);
        }

        if (this.realInputConfigs[`input${inputNumber}`] === 8) {
            this.setCapabilityValue('measure_voltage.input1', this._valueToVolt(report['Value (Raw)'][0]));
            this[`input${inputNumber}FlowTrigger`].trigger(this, {volt: this._valueToVolt(report['Value (Raw)'][0])}, null);
        }
    }
}

module.exports = FibaroRGBWControllerDevice;
