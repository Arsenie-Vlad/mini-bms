import json
import random
import time
import paho.mqtt.client as mqtt

BROKER = "localhost"
PORT = 1883
TOPIC = "miniBMS/room1/telemetry"

client = mqtt.Client()
client.connect(BROKER, PORT, 60)

print("Simulator started... sending data every 2 seconds")

temp = 22.0
lux = 200
occupied = True

while True:
    temp += random.uniform(-0.3, 0.3)
    lux += random.randint(-20, 20)

    lux = max(0, min(800, lux))

    power = 20
    if occupied:
        power += 30

    light = lux < 180
    if light:
        power += 15

    hvac = temp < 21 or temp > 24
    if hvac:
        power += 40

    payload = {
        "roomId": "room1",
        "ts": int(time.time()),
        "temp_c": round(temp, 2),
        "lux": lux,
        "occupied": occupied,
        "power_w": round(power, 1),
        "mode": "COMFORT",
        "actuators": {
            "light": light,
            "hvac": hvac
        }
    }

    client.publish(TOPIC, json.dumps(payload))
    print("Sent:", payload)

    time.sleep(2)