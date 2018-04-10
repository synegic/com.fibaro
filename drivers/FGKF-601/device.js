'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class FibaroKeyfob extends ZwaveDevice {
	
	onMeshInit() {
		this.registerCapability('measure_battery', 'BATTERY');

		// Parsing of sequences before sending to Keyfob
		this.registerSetting('sequence_1', (newValue) => {
			return this.sequenceParser(newValue);
		});
        this.registerSetting('sequence_2', (newValue) => {
            return this.sequenceParser(newValue);
        });
        this.registerSetting('sequence_3', (newValue) => {
            return this.sequenceParser(newValue);
        });
        this.registerSetting('sequence_4', (newValue) => {
            return this.sequenceParser(newValue);
        });
        this.registerSetting('sequence_5', (newValue) => {
            return this.sequenceParser(newValue);
        });
        this.registerSetting('sequence_6', (newValue) => {
            return this.sequenceParser(newValue);
        });
	}

	sequenceParser(sequence) {
        // if gesture is disabled return 0 as value
        if (sequence === 0) return new Buffer([0, 0]);

        // split sequence into individual buttons
        const buttons = sequence.split(';').map(Number);

        // Parse the buttons to their corresponding value
        let parsing = buttons[0] + 8 * buttons[1];
        if (buttons[2]) parsing += 64 * buttons[2];
        if (buttons[3]) parsing += 512 * buttons[3];
        if (buttons[4]) parsing += 4096 * buttons[4];

        // return parsed buffer value
        const parsedSequence = new Buffer(2);
        parsedSequence.writeUIntBE(parsing, 0, 2);
        return parsedSequence;
	}
}

module.exports = FibaroKeyfob;