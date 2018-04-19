'use strict';

const Homey = require('homey');
const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class FibaroSwipeDevice extends ZwaveDevice {
	
	onMeshInit() {
		this.registerCapability('measure_battery', 'BATTERY');
        this.registerCapability('alarm_battery', 'BATTERY');

        /*
       ===================================================================
       Registering Flow triggers
       ===================================================================
        */
        this._directionTrigger = new Homey.FlowCardTriggerDevice('fggc-001_swipe_direction')
			.register()
			.registerRunListener( (args, state, callback) => {
                if (state && args &&
                    state.hasOwnProperty('direction') &&
                    state.hasOwnProperty('scene') &&
                    args.hasOwnProperty('direction') &&
                    args.hasOwnProperty('scene') &&
                    state.direction === args.direction &&
                    state.scene === args.scene) {
                    return callback(null, true);
                }
                return callback(null, false);
			});

        this._roundTrigger = new Homey.FlowCardTriggerDevice('fggc-001_swipe_round')
			.register()
			.registerRunListener( (args, state, callback) => {
                if (state && args &&
                    state.hasOwnProperty('direction') &&
                    state.hasOwnProperty('scene') &&
                    args.hasOwnProperty('direction') &&
                    args.hasOwnProperty('scene') &&
                    state.direction === args.direction &&
                    state.scene === args.scene) {
                    return callback(null, true);
                }
                return callback(null, false);
			});

        this._sequenceTrigger = new Homey.FlowCardTriggerDevice('fggc-001_swipe_sequence')
			.register()
			.registerRunListener( (args, state, callback) => {
                if (state && args &&
                    state.hasOwnProperty('direction') &&
                    args.hasOwnProperty('direction') &&
                    state.direction === args.direction) {
                    return callback(null, true);
                }
                return callback(null, false);
			});

        /*
        ===================================================================
        Registering gesture parsing for simple directional gestures
        ===================================================================
         */
		this.registerSetting('gesture_up', (newValue, newSettings) => {
            let gestureValue = 0;
            if (newValue) gestureValue += 1;
            if (newSettings['gesture_down']) gestureValue += 2;
            if (newSettings['gesture_left']) gestureValue += 4;
            if (newSettings['gesture_right']) gestureValue += 8;
            if (newSettings['gesture_cw']) gestureValue += 16;
            if (newSettings['gesture_ccw']) gestureValue += 32;

            return new Buffer([gestureValue]);
		});
        this.registerSetting('gesture_down', (newValue, newSettings) => {
            let gestureValue = 0;
            if (newSettings['gesture_up']) gestureValue += 1;
            if (newValue) gestureValue += 2;
            if (newSettings['gesture_left']) gestureValue += 4;
            if (newSettings['gesture_right']) gestureValue += 8;
            if (newSettings['gesture_cw']) gestureValue += 16;
            if (newSettings['gesture_ccw']) gestureValue += 32;

            return new Buffer([gestureValue]);
        });
        this.registerSetting('gesture_left', (newValue, newSettings) => {
            let gestureValue = 0;
            if (newSettings['gesture_up']) gestureValue += 1;
            if (newSettings['gesture_down']) gestureValue += 2;
            if (newValue) gestureValue += 4;
            if (newSettings['gesture_right']) gestureValue += 8;
            if (newSettings['gesture_cw']) gestureValue += 16;
            if (newSettings['gesture_ccw']) gestureValue += 32;

            return new Buffer([gestureValue]);
        });
        this.registerSetting('gesture_right', (newValue, newSettings) => {
            let gestureValue = 0;
            if (newSettings['gesture_up']) gestureValue += 1;
            if (newSettings['gesture_down']) gestureValue += 2;
            if (newSettings['gesture_left']) gestureValue += 4;
            if (newValue) gestureValue += 8;
            if (newSettings['gesture_cw']) gestureValue += 16;
            if (newSettings['gesture_ccw']) gestureValue += 32;

            return new Buffer([gestureValue]);
        });

        /*
        ===================================================================
        Registering gesture parsing for circular gestures
        ===================================================================
         */
		this.registerSetting('gesture_cw', (newValue, newSettings) => {
            let gestureValue = 0;
            if (newSettings['gesture_up']) gestureValue += 1;
            if (newSettings['gesture_down']) gestureValue += 2;
            if (newSettings['gesture_left']) gestureValue += 4;
            if (newSettings['gesture_right']) gestureValue += 8;
            if (newValue) gestureValue += 16;
            if (newSettings['gesture_ccw']) gestureValue += 32;

            return new Buffer([gestureValue]);
		});
        this.registerSetting('gesture_ccw', (newValue, newSettings) => {
            let gestureValue = 0;
            if (newSettings['gesture_up']) gestureValue += 1;
            if (newSettings['gesture_down']) gestureValue += 2;
            if (newSettings['gesture_left']) gestureValue += 4;
            if (newSettings['gesture_right']) gestureValue += 8;
            if (newSettings['gesture_cw']) gestureValue += 16;
            if (newValue) gestureValue += 32;

            return new Buffer([gestureValue]);
        });

        /*
        ===================================================================
        Registering gesture parsing for double directional gestures
        ===================================================================
         */
        this.registerSetting('double_up', (newValue, newSettings) => {
            let doubleValue = 0;
            if (!newValue) doubleValue += 1;
            if (!newSettings['double_down']) doubleValue += 2;
            if (!newSettings['double_left']) doubleValue += 4;
            if (!newSettings['double_right']) doubleValue += 8;

            return new Buffer([doubleValue]);
		});
        this.registerSetting('double_down', (newValue, newSettings) => {
            let doubleValue = 0;
            if (!newSettings['double_up']) doubleValue += 1;
            if (!newValue) doubleValue += 2;
            if (!newSettings['double_left']) doubleValue += 4;
            if (!newSettings['double_right']) doubleValue += 8;

            return new Buffer([doubleValue]);
        });
        this.registerSetting('double_left', (newValue, newSettings) => {
            let doubleValue = 0;
            if (!newSettings['double_up']) doubleValue += 1;
            if (!newSettings['double_down']) doubleValue += 2;
            if (!newValue) doubleValue += 4;
            if (!newSettings['double_right']) doubleValue += 8;

            return new Buffer([doubleValue]);
        });
        this.registerSetting('double_right', (newValue, newSettings) => {
            let doubleValue = 0;
            if (!newSettings['double_up']) doubleValue += 1;
            if (!newSettings['double_down']) doubleValue += 2;
            if (!newSettings['double_left']) doubleValue += 4;
            if (!newValue) doubleValue += 8;

            return new Buffer([doubleValue]);
        });

        /*
        ===================================================================
        Registering sequence parsing
        ===================================================================
         */
        this.registerSetting('sequence_1', (newValue) => {
        	return this.parseSequence(newValue);
		});
        this.registerSetting('sequence_2', (newValue) => {
            return this.parseSequence(newValue);
        });
        this.registerSetting('sequence_3', (newValue) => {
            return this.parseSequence(newValue);
        });
        this.registerSetting('sequence_4', (newValue) => {
            return this.parseSequence(newValue);
        });
        this.registerSetting('sequence_5', (newValue) => {
            return this.parseSequence(newValue);
        });
        this.registerSetting('sequence_6', (newValue) => {
            return this.parseSequence(newValue);
        });

        /*
       ===================================================================
       Interception of scene reports to trigger Flows
       ===================================================================
        */
        if (this.node && this.node.CommandClass.COMMAND_CLASS_CENTRAL_SCENE !== 'undefined') {
        	this.node.CommandClass.COMMAND_CLASS_CENTRAL_SCENE.on('report', (command, report) => {
        		if (command.hasOwnProperty('name') && command.name === 'CENTRAL_SCENE_NOTIFICATION') {
        			let swiped = {
        				direction: report['Scene Number'].toString(),
						scene: report.Properties1['Key Attributes'],
					};

					if (report['Scene Number'] >= 1 && report['Scene Number'] <= 4) {
        				this._directionTrigger.trigger(this, null, swiped);
					} else if (report['Scene Number'] >= 5 && report['Scene Number'] <= 6) {
						this._roundTrigger.trigger(this, null, swiped);
					} else {
						this._sequenceTrigger.trigger(this, null, swiped);
                    }
				}
			});
		}
    }

    parseSequence(sequence) {
        if (sequence === 0) return new Buffer([0, 0]);

        const gesture = sequence.split(';').map(Number);
        if (gesture.length === 2) gesture.push(0);
        return new Buffer([gesture[0], gesture[1] * 16 + gesture[2]]);
	}
}

module.exports = FibaroSwipeDevice;