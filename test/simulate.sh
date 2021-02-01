#!/bin/bash

# Parse the arguments (vera serial, from mode, to mode)
veraSerial=${1:-${veraSerial}}
oldMode=${2:-2}
newMode=${3:-1}
mqttBrokerUrl=${4}
mqttBroker=$(echo ${mqttBrokerUrl} | sed -Ee 's/^((ht|mq)[a-z]+(:\/\/))//')

echo "Simulating Vera ${veraSerial} transition to House Mode ${newMode} from mode ${oldMode} using MQTT Broker ${mqttBroker}"

payload="{\"DeviceId\":17,\"DeviceName\":\"House Modes Plugin\",\"DeviceType\":\"urn:schemas-micasaverde-com:device:HouseModes:1\",\"HMode\":${newMode},\"OldHMode\":${oldMode},\"RoomId\":0,\"RoomName\":\"No Room\",\"ServiceId\":\"urn:micasaverde-com:serviceId:HouseModes1\",\"Time\":1610853323,\"Variable\":\"HMode\"}"

mosquitto_pub -t "Vera/${veraSerial}/HouseModes1/17" -m "${payload}" -h ${mqttBroker}
