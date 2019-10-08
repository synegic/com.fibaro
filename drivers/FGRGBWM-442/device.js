'use strict'

const ZwaveLightDevice = require('homey-meshdriver').ZwaveLightDevice;
const ZwaveUtils = require('homey-meshdriver').Util;

const tinyGradient = require('tinygradient');

class FibaroRGBW2Device extends ZwaveLightDevice {
    onMeshInit() {
        super.onMeshInit();
        this.enableDebug();
    }
}

module.exports = FibaroRGBW2Device;