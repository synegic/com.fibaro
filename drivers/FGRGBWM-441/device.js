'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;
const Util = require('homey-meshdriver').Util;

class FibaroRGB extends ZwaveDevice {

	async onMeshInit() {
		this.registerCapability('onoff', 'SWITCH_MULTILEVEL');
		this.registerCapability('dim', 'SWITCH_MULTILEVEL');
		
		this.registerMultipleCapabilityListener(['light_hue', 'light_saturation', 'light_mode'], this._onColor.bind(this), 500);
		this.registerMultipleCapabilityListener(['light_temperature', 'light_mode'], this._onTemperature.bind(this), 500);
	}
	
	_onColor( valueObj, optsObj ) {
		if( valueObj['light_mode'] !== 'color' 
		&& this.getCapabilityValue('light_mode') !== 'color' ) return;
		
		let hue = valueObj['light_hue'];
		if( typeof hue !== 'number' ) {
			hue = this.getCapabilityValue('light_hue');
		}
		
		let sat = valueObj['light_saturation'];
		if( typeof sat !== 'number' ) {
			sat = this.getCapabilityValue('light_saturation');
		}
		
		let dim = this.getCapabilityValue('dim');
		let duration = 1000;
		
		let rgb = Util.convertHSVToRGB({
			hue: hue,
			saturation: sat,
			value: dim
		});
		
		return this._setColor(rgb, duration);
				
	}
	
	_onTemperature( valueObj, optsObj ) {
		if( valueObj['light_mode'] !== 'temperature' 
		&& this.getCapabilityValue('light_mode') !== 'temperature' ) return;
		
		let temperature = valueObj['light_temperature'];
		if( typeof temperature !== 'number' ) {
			temperature = this.getCapabilityValue('lighttemperature');
		}
				
		let duration = 1000;
		let rgb = FibaroRGB.getTemperatureColor(temperature);
		
		return this._setColor(rgb, duration);
	}
	
	_setColor( rgb, duration ) {
		let promises = [];
				
		[ 'red', 'green', 'blue' ].forEach(( channel, index ) => {
			let value = rgb[channel];
			let node = this.node.MultiChannelNodes[ index + 2 ];
			if( node && node.CommandClass['COMMAND_CLASS_SWITCH_MULTILEVEL'] ) {
				let promise = node.CommandClass['COMMAND_CLASS_SWITCH_MULTILEVEL'].SWITCH_MULTILEVEL_SET({
					'Value': value/255 * 99,
					'Dimming Duration': Util.calculateZwaveDimDuration(duration)
				});
				promises.push(promise);
			}
		});
		
		return Promise.all( promises );
	}
	
	static getTemperatureColor(tmp) {
		const cool = { r: 216, g: 239, b: 240 };
		const warm = { r: 249, g: 230, b: 173 };
		const white = { r: 255, g: 255, b: 255 };

		let r, g, b;

		if (tmp < 0.5) { // mix cool with white
			const delta = tmp * 2;
			r = Math.round(cool.r * (1 - delta) + white.r * delta);
			g = Math.round(cool.g * (1 - delta) + white.g * delta);
			b = Math.round(cool.b * (1 - delta) + white.b * delta);
			return { red: r, green: g, blue: b };
		}
		else { // mix warm with white
			const delta = (tmp - 0.5) * 2;
			r = Math.round(white.r * (1 - delta) + warm.r * delta);
			g = Math.round(white.g * (1 - delta) + warm.g * delta);
			b = Math.round(white.b * (1 - delta) + warm.b * delta);
			return { red: r, green: g, blue: b };
		}
	}
}

module.exports = FibaroRGB;