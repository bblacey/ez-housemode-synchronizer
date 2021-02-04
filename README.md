# EZ-HouseMode-Synchronizer
![Continuous Integration](https://github.com/bblacey/ez-housemode-synchronizer/workflows/Continuous%20Integration/badge.svg)![Docker to ghcr.io](https://github.com/bblacey/ez-housemode-synchronizer/workflows/Docker%20to%20ghcr.io/badge.svg)

Easy (EZ) Node.js app that propogates Vera House Mode Changes to the Ezlo hub(s) on the local area network.  For convenience, the app is deployed as a dockerized app.

## Motivation
Example EZ-App to illustrate the simplicity of setting House Modes on Ezlo Hubs using the [ezlo-hub-kit](bblacey/ezlo-hub-kit) SDK.

This EZ-App also appeals to Vera users that are transitioning from a Vera hub to one or more Ezlo hubs that rely on House Modes for automation.  This EZ-App bridges this transition gap until solutions like [Ezlo's Meshene](https://community.getvera.com/t/until-we-linux/213748/4?u=blacey) and/or [Reactor Multi System](https://community.getvera.com/t/preview-of-multi-system-reactor/216320?u=blacey) become available.

## How it works
EZ-HouseModeManager subscribes to HouseMode1 MQTT messages broadcast by Vera.  The [Vera MQTT Plugin](jonferreira/vera-mqtt) enables a Vera to publish device-state change messages to MQTT. Users will need to confirm that their Vera MQTT Plugin "WatchDog" is configured to push HouseMode changes to MQTT. Upon receipt of the Vera HouseMode1 MQTT message, the Ezlo-HouseMode-Synchronizer sets the House Mode contained in the payload on each Ezlo Hub.

## Usage
1. Start the dockerized House Mode Synchronizer
```shell
$ docker run -it --network host \
             --name ez-mode-sync \
             -e veraSerial=<Vera Serial> \
             -e miosUser=<MIOS Portal User> \
             -e miosPassword=<MIOS Password> \
             -e mqttBrokerUrl=<broker url> \
             ghcr.io/bblacey/ez-housemode-synchronizer
```
3. Verify that the application starts successfully, connects to the mqtt broker, discovers the local Ezlo hubs and acts upon Vera House Mode changes by changing the House Mode on your Vera or simulating a house mode change (see below).  The log file shows the Easy HouseMode-Synchronizer docker app starting, connecting to the mqtt broker, subscribing to the HouseModes1 MQTT messages and reporting the discovered Ezlo Hubs.  Finally, you can see the Vera changing to Vaction mode causing each Ezlo hub to follow the mode.
```
Subscribed to HouseModes1 topic for Vera 50000796
Synchronizing HouseMode for: 90000330, architecture: armv7l	, model: h2.1	, firmware: 2.0.7.1313.16, uptime: 2d 22h 55m 0s
Synchronizing HouseMode for: 92000014, architecture: armv7l	, model: h2_secure.1	, firmware: 2.0.7.1313.16, uptime: 2d 8h 33m 31s
Synchronizing HouseMode for: 90000369, architecture: armv7l	, model: h2.1	, firmware: 2.0.7.1313.16, uptime: 0d 19h 43m 55s
Synchronizing HouseMode for: 76002425, architecture: esp32	, model: ATOM32	, firmware: 0.8.514, uptime: 0d 0h 48m 24s
Synchronizing HouseMode for: 70060017, architecture: esp32	, model: ATOM32	, firmware: 0.8.528, uptime: 3d 0h 11m 19s
Synchronizing HouseMode for: 70060095, architecture: esp32	, model: ATOM32	, firmware: 0.8.528, uptime: 0d 7h 36m 36s

* Vera 50000796: Changed  house mode (1 => 2)
+ Ezlo 90000330: Changing house mode (1 => 2)
+ Ezlo 92000014: Changing house mode (1 => 2)
+ Ezlo 90000369: Changing house mode (1 => 2)
+ Ezlo 76002425: Changing house mode (1 => 2)
+ Ezlo 70060017: Changing house mode (1 => 2)
+ Ezlo 70060095: Changing house mode (1 => 2)
✓ Ezlo 90000369: House mode is now 2                                                                                                                                            
✓ Ezlo 92000014: House mode is now 2
✓ Ezlo 90000330: House mode is now 2
✓ Ezlo 70060017: House mode is now 2
✓ Ezlo 76002425: House mode is now 2
✓ Ezlo 70060095: House mode is now 2

* Vera 50000796: Changed  house mode (2 => 1)
+ Ezlo 90000330: Changing house mode (2 => 1)
+ Ezlo 92000014: Changing house mode (2 => 1)
+ Ezlo 90000369: Changing house mode (2 => 1)
+ Ezlo 76002425: Changing house mode (2 => 1)
+ Ezlo 70060017: Changing house mode (2 => 1)
+ Ezlo 70060095: Changing house mode (2 => 1)
✓ Ezlo 92000014: House mode is now 1
✓ Ezlo 90000369: House mode is now 1
✓ Ezlo 90000330: House mode is now 1
✓ Ezlo 76002425: House mode is now 1
✓ Ezlo 70060017: House mode is now 1
✓ Ezlo 70060095: House mode is now 1
```
* NOTE: You can simulate a House Mode transition by running a [simulation script](./test/simulate.sh) in another terminal window.  For example, you can simulate changing from Home to Night on Vera 50000999 using MQTT broker 192.168.0.104 as follows:
```shell
./simulate.sh 50000999 1 2 192.168.0.104
```
To use the simulate<Mode>.sh scripts, edit the [config.env](config.env) 
### Production use

To run the dockerized Easy House-Mode-Syncrhonizer as a persistent process you can use docker-compose (recommended) or run the docker container 'detached' as a background process.

First, for either option, create or download [config.env](config.env) and edit the file to to use your MIOS portal username, password and MQTT broker URL.

#### *docker-compose* (recommended)
For those users who prefer to use `docker-compose`, you can download the [docker-compose.yml](docker-compose.yml) and start the relay with.
```shell
docker-compose up -d .
```
Compose users may find this [GitHub gist](https://gist.github.com/bblacey/9414231d29132a1f40c38f8ec04a915d) useful.  It is a docker-compose that will start all EZ-Apps with in a single compose file.

#### *docker run --detatch* (alternative)
Start the relay in detached mode.
```shell
$ docker run --detach --network host \
             --name ez-mode-sync \
             --env-file config.env \
             ghcr.io/bblacey/ez-housemode-synchronizer
```