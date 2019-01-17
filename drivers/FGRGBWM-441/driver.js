'use strict';

const Homey = require('homey');

class FibaroRGBWControllerDeviceDriver extends Homey.Driver {
    onInit() {
        super.onInit();

        this.onFlowTrigger = new Homey.FlowCardTriggerDevice('RGBW_input_on').register()
            .registerRunListener((args, state) => {
                return args.device.onOffFlowRunListener(args, state);
            });
        this.offFlowTrigger = new Homey.FlowCardTriggerDevice('RGBW_input_off').register()
            .registerRunListener((args, state) => {
                return args.device.onOffFlowRunListener(args, state);
            });

        this.input1FlowTrigger = new Homey.FlowCardTriggerDevice('RGBW_volt_input1').register();
        this.input2FlowTrigger = new Homey.FlowCardTriggerDevice('RGBW_volt_input2').register();
        this.input3FlowTrigger = new Homey.FlowCardTriggerDevice('RGBW_volt_input3').register();
        this.input4FlowTrigger = new Homey.FlowCardTriggerDevice('RGBW_volt_input4').register();

        this.resetMeterAction = new Homey.FlowCardAction('FGRGBWM-441_reset_meter').register()
            .registerRunListener((args, state) => {
                return args.device.resetMeterRunListener(args, state);
            });

        this.randomColorAction = new Homey.FlowCardAction('RGBW_random').register()
            .registerRunListener((args, state) => {
                return args.device.randomColorRunListener(args, state);
            });
        this.specificColorAction = new Homey.FlowCardAction('RGBW_specific').register()
            .registerRunListener((args, state) => {
                return args.device.specificColorRunListener(args, state);
            });
        this.animationAction = new Homey.FlowCardAction('RGBW_animation').register()
            .registerRunListener((args, state) => {
                return args.device.animationRunListener(args, state);
            });
    }
}

module.exports = FibaroRGBWControllerDeviceDriver;
