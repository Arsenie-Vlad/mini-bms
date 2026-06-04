# Mini BMS - Full-Stack IoT Building Management System

Mini BMS is a full-stack IoT application developed for monitoring and optimizing the energy consumption of a smart room. The project combines an ESP32 hardware prototype, a Spring Boot backend, a PostgreSQL database, a Mosquitto MQTT broker and a React dashboard.

The purpose of the project is to collect environmental and energy data in real time, control lighting and ventilation automatically, store historical information and display the current state of the room in a web interface.

The system monitors temperature, humidity, motion, light level and power consumption. Based on these values, it can automatically control a white LED that simulates room lighting and a 5V fan that simulates an HVAC actuator.

The project is divided into three main parts:

* **Firmware** - the embedded part, developed in Arduino IDE for ESP32.
* **Backend** - the server-side part, built with Spring Boot.
* **Frontend** - the dashboard interface, built with React and Tailwind CSS.

The ESP32 communicates with the backend through MQTT. The backend receives the MQTT messages, processes the telemetry data and sends live updates to the frontend using WebSockets.

---

## Technologies Used

### Firmware

* **ESP32** - used as the main microcontroller.
* **Arduino IDE** - used for writing and uploading the firmware.
* **C/C++** - used for the embedded logic.
* **MQTT** - used for sending telemetry data to the backend.
* **MicroSD Card** - used for local CSV logging.
* **LCD I2C** - used for displaying local sensor values.

### Backend

* **Java 17+**
* **Spring Boot** - used for building the backend application.
* **Spring Data JPA / Hibernate** - used for database interaction.
* **PostgreSQL** - used for storing application data.
* **MQTT Client** - used for receiving telemetry from the ESP32.
* **WebSockets** - used for sending live updates to the frontend.

### Frontend

* **React.js** - used for building the dashboard interface.
* **Vite** - used for quickly starting and running the React project.
* **Tailwind CSS** - used for styling and responsive design.
* **REST API** - used for loading historical data.
* **WebSockets** - used for real-time telemetry updates.

### Infrastructure

* **Docker Desktop** - used for running PostgreSQL and Mosquitto locally.
* **PostgreSQL** - used as the database.
* **Mosquitto MQTT Broker** - used for communication between the ESP32 and the backend.

---

## Hardware Components

The hardware prototype includes:

* ESP32 development board
* DHT11 temperature and humidity sensor
* PIR motion sensor
* LDR light sensor
* INA219 power monitoring sensor
* LCD 16x2 with I2C module
* MicroSD card module
* White LED for lighting simulation
* Status LEDs for operating modes
* 5V fan used as HVAC actuator
* Physical button for changing modes

---

## Main Features

### 1. Real-Time Room Monitoring

The ESP32 reads data from multiple sensors:

* temperature;
* humidity;
* motion;
* light level;
* power consumption.

The LDR sensor value is converted into an approximate Lux value, while the INA219 sensor is used to calculate the power consumption in Watts.

The humidity value is read by the ESP32 and displayed locally on the LCD.

---

### 2. Operating Modes

The system has three operating modes. The active mode is changed manually using a physical button connected to the ESP32.

#### ECO Mode

This mode focuses on reducing energy consumption.

* The fan starts only if the temperature is above **29.0°C**.
* The light turns on only if the room is dark and motion is detected.

#### COMFORT Mode

This mode focuses on user comfort.

* The fan starts if the temperature is above **24.0°C**.
* The light turns on automatically when the room is dark.

#### NIGHT Mode

This mode is designed for night usage.

* The fan starts if the temperature is above **27.5°C**.
* The main light remains turned off.
* Motion detection is ignored for lighting control.

---

### 3. MQTT Communication

The ESP32 sends telemetry data to the backend through MQTT.

Telemetry topic:

```text
miniBMS/room1/telemetry
```

Log topic:

```text
miniBMS/room1/log
```

Example JSON telemetry message:

```json
{
  "roomId": "room1",
  "temp_c": 26.5,
  "lux": 430,
  "occupied": true,
  "power_w": 0.620,
  "mode": "ECO",
  "actuators": {
    "light": true,
    "hvac": false
  }
}
```

---

### 4. Local CSV Logging

The ESP32 also saves historical data locally on a MicroSD card.

CSV format:

```csv
Mode,Temp(C),Hum(%),Lumina(Lux),Miscare,Putere(W)
```

Example:

```csv
ECO,26.50,45.00,430,1,0.620
```

This makes the system more reliable because data can still be stored locally even if the network connection is lost.

---

### 5. Web Dashboard

The React dashboard displays the live state of the room.

The interface shows:

* temperature;
* light level;
* power consumption;
* occupancy state;
* current operating mode;
* light actuator state;
* fan / HVAC actuator state;
* telemetry charts;
* historical logs.

---

## Installation and Local Setup

To run the project on another computer, the following tools are required:

1. Git
2. Java 17 or newer
3. Node.js and npm
4. Docker Desktop
5. IntelliJ IDEA or another Java IDE for the backend
6. Visual Studio Code or another code editor for the frontend
7. Arduino IDE
8. ESP32 board support in Arduino IDE

PostgreSQL and Mosquitto are started using Docker.

---

## Step 1: Clone the Repository

Open a terminal and clone the project:

```bash
git clone https://github.com/Arsenie-Vlad/mini-bms.git
```

Enter the project folder:

```bash
cd mini-bms
```

---

## Step 2: Start PostgreSQL and Mosquitto

The project contains a `docker-compose.yml` file that starts PostgreSQL and Mosquitto.

Run:

```bash
docker compose up -d
```

This starts the required local services:

```text
PostgreSQL: localhost:5432
Mosquitto MQTT: localhost:1883
```

The Docker Compose configuration uses the following PostgreSQL values:

```text
Database: minibms
Username: minibms
Password: minibms
```

To check if the containers are running, use:

```bash
docker ps
```

---

## Step 3: Backend Configuration

The real backend configuration file is not committed to GitHub. Each developer creates it locally based on the example file included in the repository.

The backend needs this local file:

```text
backend/src/main/resources/application.properties
```

A safe example file is included in the project:

```text
backend/src/main/resources/application.example.properties
```

Copy `application.example.properties` and rename the copy to:

```text
application.properties
```

If you run the project with the included Docker Compose configuration, you can use the same values in your local `application.properties` file:

```properties
server.port=8080

spring.datasource.url=jdbc:postgresql://localhost:5432/minibms
spring.datasource.username=minibms
spring.datasource.password=minibms

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=true

mqtt.host=tcp://localhost:1883
mqtt.clientId=minibms-backend-${random.uuid}
mqtt.topicTelemetry=miniBMS/room1/telemetry
mqtt.topicConfig=miniBMS/room1/config
mqtt.topicCmd=miniBMS/room1/cmd
```

Only `application.example.properties` is committed to GitHub. Each developer creates their own `application.properties` locally from this template.

---

## Step 4: Open and Start the Backend

The backend can be opened in **IntelliJ IDEA** or any other Java IDE.

Recommended method:

1. Open **IntelliJ IDEA**.
2. Select **Open**.
3. Choose the `backend` folder from the cloned project.
4. Wait for IntelliJ to import the Maven dependencies.
5. Make sure Java 17 or newer is selected as the project SDK.
6. Make sure `application.properties` exists in:

```text
backend/src/main/resources/application.properties
```

7. Run the Spring Boot main class:

```text
BackendApplication.java
```

The backend will run on:

```text
http://localhost:8080
```

You can also start the backend from a terminal:

```bash
cd backend
mvn spring-boot:run
```

On Windows, if the project uses Maven Wrapper, you can also run:

```bash
mvnw.cmd spring-boot:run
```

At startup, Hibernate will create or update the required database tables automatically.

---

## Step 5: Open and Start the Frontend

The frontend can be opened in **Visual Studio Code** or any other code editor.

Recommended method:

1. Open **Visual Studio Code**.
2. Select **File > Open Folder**.
3. Choose the `frontend` folder from the cloned project.
4. Open a terminal inside Visual Studio Code.
5. Install the project dependencies:

```bash
npm install
```

6. Start the React application:

```bash
npm run dev
```

After starting, the terminal will display a local link, usually similar to:

```text
http://localhost:5173
```

Open this link in the browser to use the dashboard.

The frontend can also be started from a normal terminal:

```bash
cd frontend
npm install
npm run dev
```

---

## Step 6: Firmware Configuration

Open the Arduino sketch:

```text
firmware/mini_bms_arduino/mini_bms_arduino.ino
```

Before uploading the firmware, create a local file named:

```text
secrets.h
```

inside the same folder as the `.ino` file.

A safe template file is included in the repository:

```text
firmware/mini_bms_arduino/secrets.example.h
```

Copy `secrets.example.h` and rename the copy to:

```text
secrets.h
```

Then edit it with your local Wi-Fi and MQTT settings:

```cpp
#ifndef SECRETS_H
#define SECRETS_H

#define WIFI_SSID "your_wifi_name"
#define WIFI_PASSWORD "your_wifi_password"
#define MQTT_SERVER "192.168.1.100"

#endif
```

Important:

* For the backend, `mqtt.host` can be `tcp://localhost:1883` because the backend runs on the same computer as Docker.
* For the ESP32, `MQTT_SERVER` cannot be `localhost`.
* `MQTT_SERVER` must be the local IP address of the computer running the Mosquitto container.
* The ESP32 and the computer running Docker must be connected to the same network.

On Windows, the local IP address can be found with:

```bash
ipconfig
```

Use the `IPv4 Address` of the active Wi-Fi or Ethernet adapter.

The `secrets.h` file must remain local and should not be uploaded to GitHub.

---

## Step 7: Install Arduino Libraries

In Arduino IDE, install the required libraries from Library Manager:

* PubSubClient
* LiquidCrystal_I2C
* Adafruit INA219
* DHT sensor library
* Adafruit Unified Sensor

The following libraries are usually included with the ESP32 / Arduino environment:

* WiFi
* Wire
* SPI
* SD

---

## Step 8: Upload the Firmware to ESP32

In Arduino IDE:

1. Open `mini_bms_arduino.ino`.
2. Select the correct ESP32 board.
3. Select the correct COM port.
4. Make sure `secrets.h` exists in the same folder as the `.ino` file.
5. Click **Verify** to compile the code.
6. Click **Upload** to upload the firmware to the ESP32.

After uploading, open the Serial Monitor to check if the ESP32 connects to Wi-Fi and MQTT.

---

## Step 9: Test the Full System

After all components are started:

1. PostgreSQL must be running in Docker.
2. Mosquitto must be running in Docker.
3. The Spring Boot backend must be running.
4. The React frontend must be running.
5. The ESP32 must be powered on and connected to Wi-Fi.
6. The ESP32 must be connected to the same network as the computer running Mosquitto.

If everything is configured correctly:

* the ESP32 sends telemetry through MQTT;
* the backend receives and processes the messages;
* the frontend displays live sensor data;
* the dashboard updates with live values;
* CSV logs are stored locally on the MicroSD card.

---

## Security Notes

The following files should not be uploaded to GitHub:

```text
backend/src/main/resources/application.properties
firmware/mini_bms_arduino/secrets.h
backend/bms_central_log.csv
node_modules/
target/
dist/
build/
```

Use these example files instead:

```text
backend/src/main/resources/application.example.properties
firmware/mini_bms_arduino/secrets.example.h
```

This keeps local backend configuration, Wi-Fi passwords and local IP addresses outside the public repository.

---

## Conclusion

Mini BMS is a functional full-stack IoT project that combines embedded programming, backend development and frontend visualization. The system monitors a smart room using multiple sensors, controls lighting and ventilation automatically, stores historical data and displays live information through a React dashboard.

The project demonstrates how a small Building Management System can be built using accessible hardware components and modern software technologies.
