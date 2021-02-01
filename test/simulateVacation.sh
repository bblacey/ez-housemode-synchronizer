#!/bin/zsh

# Simulation script
simulate="$( cd "$( dirname "$0" )" && pwd )/simulate.sh"

# Load config.env
. "$(cd "$( dirname "$0" )" && pwd )/../config.env"
mqttBroker=$(echo ${mqttBrokerUrl} | sed -Ee 's/^((ht|mq)[a-z]+(:\/\/))//')

$simulate ${veraSerial} 1 4 ${mqttBroker}
