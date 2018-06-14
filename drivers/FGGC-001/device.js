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
			.registerRunListener((args, state, callback) => {
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
			.registerRunListener((args, state, callback) => {
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
			.registerRunListener((args, state, callback) => {
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
			if (newSettings.gesture_down) gestureValue += 2;
			if (newSettings.gesture_left) gestureValue += 4;
			if (newSettings.gesture_right) gestureValue += 8;
			if (newSettings.gesture_cw) gestureValue += 16;
			if (newSettings.gesture_ccw) gestureValue += 32;

			return new Buffer([gestureValue]);
		});
		this.registerSetting('gesture_down', (newValue, newSettings) => {
			let gestureValue = 0;
			if (newSettings.gesture_up) gestureValue += 1;
			if (newValue) gestureValue += 2;
			if (newSettings.gesture_left) gestureValue += 4;
			if (newSettings.gesture_right) gestureValue += 8;
			if (newSettings.gesture_cw) gestureValue += 16;
			if (newSettings.gesture_ccw) gestureValue += 32;

			return new Buffer([gestureValue]);
		});
		this.registerSetting('gesture_left', (newValue, newSettings) => {
			let gestureValue = 0;
			if (newSettings.gesture_up) gestureValue += 1;
			if (newSettings.gesture_down) gestureValue += 2;
			if (newValue) gestureValue += 4;
			if (newSettings.gesture_right) gestureValue += 8;
			if (newSettings.gesture_cw) gestureValue += 16;
			if (newSettings.gesture_ccw) gestureValue += 32;

			return new Buffer([gestureValue]);
		});
		this.registerSetting('gesture_right', (newValue, newSettings) => {
			let gestureValue = 0;
			if (newSettings.gesture_up) gestureValue += 1;
			if (newSettings.gesture_down) gestureValue += 2;
			if (newSettings.gesture_left) gestureValue += 4;
			if (newValue) gestureValue += 8;
			if (newSettings.gesture_cw) gestureValue += 16;
			if (newSettings.gesture_ccw) gestureValue += 32;

			return new Buffer([gestureValue]);
		});

		/*
        ===================================================================
        Registering gesture parsing for circular gestures
        ===================================================================
         */
		this.registerSetting('gesture_cw', (newValue, newSettings) => {
			let gestureValue = 0;
			if (newSettings.gesture_up) gestureValue += 1;
			if (newSettings.gesture_down) gestureValue += 2;
			if (newSettings.gesture_left) gestureValue += 4;
			if (newSettings.gesture_right) gestureValue += 8;
			if (newValue) gestureValue += 16;
			if (newSettings.gesture_ccw) gestureValue += 32;

			return new Buffer([gestureValue]);
		});
		this.registerSetting('gesture_ccw', (newValue, newSettings) => {
			let gestureValue = 0;
			if (newSettings.gesture_up) gestureValue += 1;
			if (newSettings.gesture_down) gestureValue += 2;
			if (newSettings.gesture_left) gestureValue += 4;
			if (newSettings.gesture_right) gestureValue += 8;
			if (newSettings.gesture_cw) gestureValue += 16;
			if (newValue) gestureValue += 32;

			return new Buffer([gestureValue]);
		});

		/*
       ===================================================================
       Interception of scene reports to trigger Flows
       ===================================================================
        */
		this.registerReportListener('CENTRAL_SCENE', 'CENTRAL_SCENE_NOTIFICATION', (report) => {
            const swiped = {
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
        });
	}

	async onSettings(oldSettings, newSettings, changedKeys, callback) {
		if (changedKeys.includes('gesture_up') || changedKeys.includes('gesture_down') ||
			changedKeys.includes('gesture_left') || changedKeys.includes('gesture_right') ||
            changedKeys.includes('gesture_cw') || changedKeys.includes('gesture_ccw')) {
			let parsedValue = 0;
			if (this.getSetting('gesture_up')) parsedValue += 1;
            	if (this.getSetting('gesture_down')) parsedValue += 2;
            	if (this.getSetting('gesture_left')) parsedValue += 4;
            	if (this.getSetting('gesture_right')) parsedValue += 8;
            	if (this.getSetting('gesture_cw')) parsedValue += 16;
            	if (this.getSetting('gesture_ccw')) parsedValue += 32;

            	await this.configurationSet({
				index: 10,
				size: 1,
			}, parsedValue);

            	changedKeys = [...changedKeys.filter(changedKey => changedKey !== ('gesture_up' || 'gesture_down' || 'gesture_left' || 'gesture_right' || 'gesture_cw' || 'gesture_ccw'))];
		}
		if (changedKeys.includes('double_up') || changedKeys.includes('double_down') ||
            changedKeys.includes('double_left') || changedKeys.includes('double_right')) {
			let parsedValue = 0;
			if (this.getSetting('double_up')) parsedValue += 1;
			if (this.getSetting('double_down')) parsedValue += 2;
			if (this.getSetting('double_left')) parsedValue += 4;
			if (this.getSetting('double_right')) parsedValue += 8;

			await this.configurationSet({
				index: 12,
				size: 1,
			}, parsedValue);

            	changedKeys = [...changedKeys.filter(changedKey => changedKey !== ('double_up' || 'double_down' || 'double_left' || 'double_right'))];
		}

		return super.onSettings(oldSettings, newSettings, changedKeys);
	}

	parseSequence(sequence) {
		if (sequence === 0) return new Buffer([0, 0]);

		const gesture = sequence.split(';').map(Number);
		if (gesture.length === 2) gesture.push(0);
		return new Buffer([gesture[0], gesture[1] * 16 + gesture[2]]);
	}
}

module.exports = FibaroSwipeDevice;
