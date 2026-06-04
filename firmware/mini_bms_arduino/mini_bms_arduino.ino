#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Adafruit_INA219.h>
#include <DHT.h>
#include <SPI.h>
#include <SD.h>

// ================= WIFI & MQTT CONFIG =================
const char* ssid = "iPhone - Vlad";
const char* password = "12345678";
const char* mqtt_server = "172.20.10.10";
const int mqtt_port = 1883;

// --- TOPICE SINCRO CU SPRING BOOT ---
const char* topic_telemetry = "miniBMS/room1/telemetry";
const char* topic_log = "miniBMS/room1/log";

// --- DEFINIRE PINI ---
#define DHTPIN 4
#define DHTTYPE DHT11   
#define PIRPIN 13
#define LDRPIN 34
#define BUTTONPIN 15
#define FANPIN 25
#define LED_WHITE 12
#define LED_ECO 14
#define LED_CONFORT 27
#define LED_NIGHT 26
#define SD_CS 5

// --- INIȚIALIZARE MODULE ---
LiquidCrystal_I2C lcd(0x27, 16, 2); 
Adafruit_INA219 ina219;
DHT dht(DHTPIN, DHTTYPE);

WiFiClient espClient;
PubSubClient client(espClient);

// --- VARIABILE GLOBALE & TIMERE NON-BLOCANTE ---
enum Mode { MODE_ECO, MODE_CONFORT, MODE_NIGHT };
Mode currentMode = MODE_ECO;

unsigned long lastButtonPress = 0;
unsigned long lastDisplayUpdate = 0;
unsigned long lastMqttPublish = 0;      // Interval 2 secunde (JSON)
unsigned long lastLogTime = 0;          // Interval 10 secunde (CSV + SD)
unsigned long lastReconnectAttempt = 0; 

int displayScreen = 0; 
bool sdState = false;

// ================= WIFI CONNECT =================
void setup_wifi() {
  delay(1000);
  Serial.println();
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  int timeout = 0;
  while (WiFi.status() != WL_CONNECTED && timeout < 20) {
    delay(500);
    Serial.print(".");
    timeout++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("ESP32 IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi timeout! Pornire in mod offline.");
  }
}

// ================= MQTT CONNECT (NON-BLOCKING) =================
bool checkMQTTConnection() {
  if (!client.connected()) {
    unsigned long now = millis();
    if (now - lastReconnectAttempt > 5000) {
      lastReconnectAttempt = now;
      Serial.print("Connecting to MQTT...");
      
      if (client.connect("ESP32_MiniBMS")) {
        Serial.println("connected!");
        return true;
      } else {
        Serial.print("failed, rc=");
        Serial.print(client.state());
        Serial.println(" -> Mod local activ.");
      }
    }
    return false;
  }
  return true;
}

void setup() {
  Serial.begin(115200);

  // Configurare pini ca intrări/ieșiri
  pinMode(PIRPIN, INPUT);
  pinMode(LDRPIN, INPUT);
  pinMode(BUTTONPIN, INPUT_PULLUP); 
  
  pinMode(FANPIN, OUTPUT);
  pinMode(LED_WHITE, OUTPUT);
  pinMode(LED_ECO, OUTPUT);
  pinMode(LED_CONFORT, OUTPUT);
  pinMode(LED_NIGHT, OUTPUT);

  // Pornire senzori și I2C
  dht.begin();
  Wire.begin(21, 22); 
  
  lcd.init();
  lcd.backlight();
  lcd.print("BMS House Setup");

  if (!ina219.begin()) {
    Serial.println("Eroare initializare INA219!");
  }

  // Inițializare Card SD și crearea fișierului
  if (SD.begin(SD_CS)) {
    Serial.println("Card SD functional!");
    sdState = true;
    File logFile = SD.open("/history.csv", FILE_WRITE);
    if (logFile) {
      logFile.println("Mod,Temp(C),Hum(%),Lumina(Lux),Miscare,Putere(W)");
      logFile.close();
    }
  } else {
    Serial.println("Eroare initializare Card SD.");
  }

  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);

  delay(1000);
  lcd.clear();
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    if (checkMQTTConnection()) {
      client.loop();
    }
  }

  unsigned long currentMillis = millis();

  // 1. CITIRE BUTON (Schimbare Moduri Secvențială)
  if (digitalRead(BUTTONPIN) == LOW) {
    if (currentMillis - lastButtonPress > 300) { 
      if (currentMode == MODE_ECO) currentMode = MODE_CONFORT;
      else if (currentMode == MODE_CONFORT) currentMode = MODE_NIGHT;
      else currentMode = MODE_ECO;
      
      lastButtonPress = currentMillis;
      lcd.clear();
      lcd.print("Mod nou setat!");
      delay(300); // Mic delay pentru efectul vizual la tranziție pe ecran
      lastDisplayUpdate = currentMillis; 
    }
  }

  // 2. CITIRE SENZORI HARDWARE
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  int pirState = digitalRead(PIRPIN);
  int ldrValue = analogRead(LDRPIN); 
  
  if (isnan(temp)) temp = 0.0;
  if (isnan(hum)) hum = 0.0;

  // Transformare LDR în Lux aproximat
  float lux = map(ldrValue, 0, 4095, 1000, 0);

  // MĂSURARE CONSUM REAL INA219 (Calculare Wați)
  float busVoltage = ina219.getBusVoltage_V();      
  float current_mA = ina219.getCurrent_mA();        
  if (current_mA < 0) current_mA = 0;              
  float power_w = busVoltage * (current_mA / 1000.0);

  // 3. LOGICA AUTOMATIZĂRII ACTUATOARELOR & LED-URILOR
  bool isDark = (ldrValue > 2500); 

  switch (currentMode) {
    case MODE_ECO:
      digitalWrite(LED_ECO, HIGH);
      digitalWrite(LED_CONFORT, LOW);
      digitalWrite(LED_NIGHT, LOW);

      if (temp > 29.0) digitalWrite(FANPIN, HIGH);
      else digitalWrite(FANPIN, LOW);

      if (isDark && pirState == HIGH) digitalWrite(LED_WHITE, HIGH);
      else digitalWrite(LED_WHITE, LOW);
      break;

    case MODE_CONFORT:
      digitalWrite(LED_ECO, LOW);
      digitalWrite(LED_CONFORT, HIGH);
      digitalWrite(LED_NIGHT, LOW);

      if (temp > 24.0) digitalWrite(FANPIN, HIGH);
      else digitalWrite(FANPIN, LOW);

      if (isDark) digitalWrite(LED_WHITE, HIGH);
      else digitalWrite(LED_WHITE, LOW);
      break;

    case MODE_NIGHT:
      digitalWrite(LED_ECO, LOW);      
      digitalWrite(LED_CONFORT, LOW); // LED-ul albastru rămâne APRINS pentru a semnala vizual modul de noapte
      digitalWrite(LED_NIGHT, HIGH);    

      // Control ventilator pe timp de noapte
      if (temp > 27.5) digitalWrite(FANPIN, HIGH);
      else digitalWrite(FANPIN, LOW);

      // NOU: Lumina din cameră (LED_WHITE) rămâne STINSĂ complet, ignorând total senzorul PIR
      digitalWrite(LED_WHITE, LOW); 
      break;
  }

  // Booleene text pentru JSON
  String lightBool = (digitalRead(LED_WHITE) == HIGH) ? "true" : "false";
  String hvacBool = (digitalRead(FANPIN) == HIGH) ? "true" : "false";
  String occupiedBool = (pirState == HIGH) ? "true" : "false";

  // Sincronizare directă cu Enum-ul din Spring Boot (ModClima.java)
  String currentModeStr = "ECO";
  if (currentMode == MODE_CONFORT) currentModeStr = "CONFORT";
  if (currentMode == MODE_NIGHT) currentModeStr = "NOAPTE";

  // 4. INTERVAL 2 SECUNDE: TELEMETRIE JSON (Declanșează processTelemetryJson)
  if (client.connected() && (currentMillis - lastMqttPublish >= 2000)) {
    lastMqttPublish = currentMillis;

    String payload = "{";
    payload += "\"roomId\":\"room1\",";
    payload += "\"temp_c\":" + String(temp, 2) + ",";
    payload += "\"lux\":" + String((int)lux) + ",";
    payload += "\"occupied\":" + occupiedBool + ",";
    payload += "\"power_w\":" + String(power_w, 3) + ",";
    payload += "\"mode\":\"" + currentModeStr + "\","; 
    payload += "\"actuators\":{";
    payload += "\"light\":" + lightBool + ",";
    payload += "\"hvac\":" + hvacBool;
    payload += "}";
    payload += "}";

    client.publish(topic_telemetry, payload.c_str());
    Serial.println("-> [MQTT JSON 2s] Trimis.");
  }

  // 5. INTERVAL 10 SECUNDE: COPIE PE SD CARD + TRANSMITERE CSV BRUT (Lux și Wați)
  if (currentMillis - lastLogTime >= 10000) {
    lastLogTime = currentMillis;

    String logLine = currentModeStr + "," + 
                     String(temp, 2) + "," + 
                     String(hum, 2) + "," + 
                     String((int)lux) + "," + 
                     String(pirState) + "," + 
                     String(power_w, 3);

    // Append local în /history.csv
    if (sdState) {
      File logFile = SD.open("/history.csv", FILE_APPEND);
      if (logFile) {
        logFile.println(logLine);
        logFile.close();
        Serial.println("-> [SD 10s] Salvat istoric.");
      }
    }

    // Publicare pe topicul de log brut
    if (client.connected()) {
      client.publish(topic_log, logLine.c_str());
      Serial.print("-> [MQTT CSV 10s] Trimis: ");
      Serial.println(logLine);
    }
  }

  // 6. VISUAL DISPLAY MANAGEMENT (Fără delay, o dată la 3 secunde)
  if (currentMillis - lastDisplayUpdate > 3000) {
    lastDisplayUpdate = currentMillis;
    lcd.clear();
    
    if (displayScreen == 0) {
      lcd.setCursor(0, 0);
      lcd.print("Mod: "); lcd.print(currentModeStr);
      lcd.setCursor(0, 1);
      lcd.print("Temp: "); lcd.print(temp, 1); lcd.print("C");
      displayScreen = 1;
    } 
    else if (displayScreen == 1) {
      lcd.setCursor(0, 0);
      lcd.print("Umid: "); lcd.print(hum, 1); lcd.print("%");
      lcd.setCursor(0, 1);
      lcd.print("Lumina: "); lcd.print((int)lux); lcd.print("Lx");
      displayScreen = 2;
    }
    else {
      lcd.setCursor(0, 0);
      lcd.print("Pwr: "); lcd.print(power_w, 3); lcd.print("W");
      lcd.setCursor(0, 1);
      lcd.print("PIR: "); lcd.print(pirState == HIGH ? "Miscare!" : "Liber");
      displayScreen = 0;
    }
  }

  delay(1); 
}