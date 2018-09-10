# Fibaro
This app adds support for Fibaro devices in Homey.

## The Fibaro Universal Binary Sensor is temporarily unavailable in the 2.1.x release
The FGBS-001 device will be temporarily unavailable until further notice in the beta 2.1.x release cycle, we'll keep you posted!

## Supported devices with most common parameters:
* FGD-211, Dimmer
* FGD-212, Dimmer 2
* FGFS-101, Flood Sensor
* FGFS-101-PLUS, Flood Sensor (Z-Wave Plus)
* FGGC-001, Swipe
* FGK-101, Door/Window Sensor
* FGK-10x, Door/Window Sensor (Z-Wave Plus)
* FGMS-001, Motion Sensor
* FGMS-001-PLUS, Motion Sensor (Z-Wave Plus)
* FGPB-101, Push Button
* FGS-211, Relay Switch
* FGS-212, Relay Switch 2
* FGS-213, Single Switch 2
* FGS-221, Double Relay Switch
* FGS-222, Double Relay Switch 2
* FGS-223, Double Switch 2
* FGSD-002, Smoke Detector (Z-Wave Plus)
* FGSS-001, Smoke Sensor
* FGCD-001, CO Sensor
* FGRGBWM-441, RGBW Controller
* FGWPx-101/102, Wall Plug
* FGWPx-102-PLUS, Wall Plug (Z-Wave Plus)
* FGKF-601, KeyFob (Z-Wave Plus)
* FGDW-002, Door/Window Sensor 2

## Supported devices with some parameters:
* FGR-221, Roller Shutter
* FGRM-222, Roller Shutter 2
* FGR-222, Roller Shutter 2 (v2.5)

## Supported Languages:
* English
* Dutch (Nederlands)

## NOTE:
**FGKF-601**
This device has no wake up interval. After changing settings, wake up the device manually (by using the exclusion button press sequence) to store them on the device.

**FGS-2xx Devices:**  
Main Device = Also Relay/Switch 1 (S1/Q1)  
Relay/Switch 2 = Relay/Switch 2 (S2/Q2)

**FGS-223:**  
Scene cards only triggers with the "Main Node" as device.  
The "Right Switch (S2)" as device doesn't work.

**FGPB-101:**  
When the app has just started, it can take up to 2 minutes before it reacts.  
If it takes longer you (probably) need to restart your homey.

## Change Log:

### v 2.1.0

Fixed a lot of bugs in the SDK2 rewrite, overall stability of the app should be improved, please report any issues.

### v 2.0.0

Complete rewrite and restructuring of the application. This should improve overall stability

### v 1.5.11

Add possible fix for Door/Windows sensors not reporting tamper alarm

### v 1.5.8

Added support for FGCD-001 (CO Sensor)

### v 1.5.4

Added custom save messages (FGKF-601/FGPB-101), fix wake up interval (FGBP-101)

### v 1.5.3

Added support for FGDW-002 (Door/Window Sensor 2)

### v 1.5.0
Added support for FGR-221 (Roller Shutter), various minor bug fixes

### v 1.4.3
Update smoke sensor fix

### v 1.4.2
Add possible fix for smoke sensors not triggering on smoke alarm

### v 1.4.0
**fixed:**  
FGD-211, FGD-212: dimmer on/off state not updated   
**update:**
FGD-212, FGRGBWM-441, FGRM-222, FGS-2x3, FGWPE-101, FGWPx-102-PLUS: add power meter reset flow card   
FGD-212: add set timer flow card    

### v 1.3.1
FGGC-001: add additional functionality for Swipe

### v 1.3.0
FGR-222: add dim capability
FGKF-601: add KeyFob support

### v 1.2.4
**fixed:**  
FGMS-001(-PLUS) - Parameter size corrections several parameters
**update:**  
FGMS-001(-PLUS) - Add parameters to enable direct triggering (direct association) on motion alarm
FGMS-001(-PLUS) - Add Battery alarm capability
FGD-212 - Add 'Change brightness over time' action card
FGMS-001(-PLUS), FGD-212 - Improved hints (range and default), addition of association group hints

### v 1.2.3
Add Dim for FGRM-222 and setting to invert direction of shutter movement

### v 1.2.0
Add "get battery level" on wakeup, to battery devices  
Add [Full Support](https://github.com/caseda/com.fibaro/commit/1d7e9a794a3938572a57436ee8d5a99d06d3aac7) FGRGBWM-441 - RGBW controller  
FGRGBWM-441 Update Notes:  
It is recommended to at least save the settings once.  
For full support (input usage) a re-pair is needed.
FGD-212 - Add 'Set forced brightness level' action card

### v 1.1.9
Fixed settings (range -128 - 127 => 0 - 255)  
Fixed FGPB-101 not triggering anymore  
FGMS-001-PLUS/FGS-222 - Textual Update

### v 1.1.8
FGK-10 & FGK-10x - Fixed crashes

### v 1.1.7
**add support:**  
FGS-213 - Scene Activation  
FGS-223 - Scene Activation  
**update:**  
Z-Wave Driver (v1.1.2)  

### v 1.1.6
**update:**  
FGD-212 - Textual fixes

### v 1.1.5
**fixed:**  
FGFS-101 (Z-Wave Plus) - Reporting  
**update:**  
FGD-212 - Power reporting parameters

### v 1.1.4
**fixed:**  
FGK-10x (Z-Wave Plus) - Temperature Reporting

### v 1.1.2/1.1.3
**update:**  
New way of error logging.

### v 1.1.1
**add support:**  
FGWPx-102-PLUS  
FGD-211 - Scene Activation  
FGD-212 - Scene Activation

### v 1.1.0
**fixed:**  
Removed "Fibaro" from all names  
FGMS-001-PLUS - Motion and Tamper Trigger report  
FGWPx-101/102 - led ring color now also changes in device's settings

**add support:**  
FGBS-Universal Binary Sensor  
FGRGBWM-441 - light temperature (capability)  
FGS-223 - S2 support re-added  
FGD-212 - parameter 29 (Switch S1 and S2)  
FGS-213 - scene activation (S1 switched, S2 switched)

### v 1.0.12
**fixed:**  
FGK-101 - Trigger Report  
FGSS-001 - Trigger Report  
FGSD-002 - Trigger Report  
FGS-213 - Adding  
FGS-223 - Adding  
**add support**  
FGK-101 - Temperature Sensor now possible*  
FGK-101-PLUS Temperature Sensor now possible*  
*only when a temperature module (DS18B20) is attached, and re-inclusion is needed.

### v 1.0.11
**fixed:**  
FGFS-101 - can now be used using dc-power and battery

### v 1.0.10
**add support (incl. parameter):**  
FGS-213, FGS-223, FGPB-101, FGR-222  
**add parameters (incl. dutch translation):**  
FGGC-001, FGRGBWM-441, FGSD-002, FGSS-001, FGWPE-001  
**add triggers:**  
FGGC-001 - All default swipe posibilities  
FGWPE-001 - LED Ring colour (on status and off status)  
FGPB-101 - 1-5x Pressed, Long Press, Long Press Released

### v1.0.9
**add support (incl. parameters):**  
FGRM-222

### v1.0.8
**add support (incl. parameters):**  
FGS-211, FGS-212, FGS-221, FGS-222, FGFS-001-PLUS  
**add parameters (incl. dutch translation):**  
FGD-211, FGD-212, FGFS-001 (+ PLUS), FGK-001 (+ PLUS)

### v1.0.7
**add support:**  
FGD-211, FGD-212  
add dutch language to existing parameters.
