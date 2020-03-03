'use strict'

const ZwaveLightDevice = require('homey-meshdriver').ZwaveLightDevice;

class FibaroRGBW2Device extends ZwaveLightDevice {
    async onMeshInit() {
        await super.onMeshInit();

        // this.printNode();
    }
}

module.exports = FibaroRGBW2Device;