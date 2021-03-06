const mqtt = require('mqtt');
const { EzloHub, EzloCloudResolver, discoverEzloHubs, UIBroadcastHouseModeChangeDonePredicate } = require('ezlo-hub-kit');

// Shutdown in a clean manner
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Track hubs for clean shutdown on exit
const hubs = {};

// Retrieve the Vera serial, mqtt broker url and MIOS user credentials from the environment
const mqttBrokerUrl = process.env.mqttBrokerUrl;
const veraSerial = process.env.veraSerial;
const miosUser = process.env.miosUser;
const miosPassword = process.env.miosPassword;

// Parse the mqtt message for the new house mode
function parseMQTTmessage(payload) {
	const veraEvent = JSON.parse(payload.toString());
	const newMode = veraEvent.HMode.toString();
	const oldMode = veraEvent.OldHMode.toString();
	return {newMode: newMode, oldMode: oldMode};
}

// Connect to the MQTT broker and subscribe to Vera House Mode change messages
const client = mqtt.connect(mqttBrokerUrl);

client.on('connect', () => {
	console.log(`Connected to mqtt broker ${mqttBrokerUrl}`);
	client.subscribe(`Vera/${veraSerial}/HouseModes1/#`, (err) => {
		if (!err) {
			console.log(`Subscribed to HouseModes1 topic for Vera ${veraSerial}`);
		}
		else {
			console.log(`Error subscribing to HouseModes1 topic. error: ${err}`);
			shutdown();
		}
	});
	// Log Vera mode changes
	client.on('message', async (topic, payload) => {
		const context = parseMQTTmessage(payload);
		console.log(`\n* Vera ${veraSerial}: Changed  house mode (${context.oldMode} => ${context.newMode})`);
	});
});

// Discover all local Ezlo Hubs and register an mqtt message handler for each
discoverEzloHubs(new EzloCloudResolver(miosUser, miosPassword), async (hub) => {

	// Log some information about the discovered hub
	const info = await hub.info();
	console.log('Synchronizing HouseMode for: %s, architecture: %s\t, model: %s\t, firmware: %s, uptime: %s',
		info.serial, info.architecture, info.model, info.firmware, info.uptime);

	// Register an mqtt message handler to that will synchronize Vera modes with this Ezlo Hub
	client.on('message', async (topic, payload) => {

		// Change the house house mode - a hub will not actually change modes unless the requested mode is not the current mode
		// Ezlo Hubs default to waiting 30 seconds before changing from Home to Night, Away or Vacation and 
		// setHouseMode enables App to asynchronousely wait until the hub completes the transition.
		const context = parseMQTTmessage(payload);
		try {
			console.log(`+ Ezlo ${hub.identity}: Changing house mode (${context.oldMode} => ${context.newMode})`);
			const mode = await hub.setHouseMode(context.newMode); // Wait until hub finishes changing modes
			console.log(`✓ Ezlo ${hub.identity}: House mode is now ${mode}`);
		} catch(err) {
			console.log(`✖ Ezlo ${hub.identity}: Failed to set house mode ${context.newMode} - ${err}`);
		}
	});

	// Track hubs for clean shutdown on exit
	hubs[hub.identity] = hub;
});

function shutdown() {
    console.log('Disconnecting from ezlo hubs and mqtt broker');
    Promise.all(Object.values(hubs).map(hub => hub.disconnect()))
    .then(() => {
        client.end();
        process.exit();
    });
}