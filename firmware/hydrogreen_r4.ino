/*
  HydroGreenAI: Lettuce — firmware for Arduino Uno R4 WiFi

  Reads DHT11 (air temperature + humidity) and BH1750 (light), publishes
  telemetry over MQTT/TLS every 30 s, and switches the pump and fan through an L298N H-bridge
  on commands received from the cloud.

  Libraries (Arduino IDE > Library Manager):
    - ArduinoMqttClient   (Arduino)
    - DHT sensor library  (Adafruit)  + Adafruit Unified Sensor
    - BH1750              (Christopher Laws)
    - ArduinoJson         (Benoit Blanchon, v7)
  WiFiS3 ships with the "Arduino UNO R4 Boards" core.

  Credentials live in arduino_secrets.h, which must NOT be committed.
*/

#include <WiFiS3.h>
#include <ArduinoMqttClient.h>
#include <Wire.h>
#include <DHT.h>
#include <BH1750.h>
#include <ArduinoJson.h>
#include "arduino_secrets.h"

// ---------- Identity and topics ----------
const char SYSTEM_ID[] = "NFT-001";
const char DEVICE_ID[] = "R4-001";

char topicTelemetry[64];
char topicStatus[64];
char topicCommand[64];
char topicAck[64];

// ---------- Pins ----------
const int PIN_DHT = 2;

// L298N H-bridge. The pump and the fan are 3-6 V motors, but the L298N delivers
// about 10 V from the 12 V supply. So the ENA and ENB jumpers are REMOVED and
// speed is limited with PWM: the motor receives roughly 10 V x duty on average.
const int PIN_PUMP_IN1 = 7;   // OUT1/OUT2 -> pump
const int PIN_PUMP_IN2 = 8;
const int PIN_PUMP_EN  = 9;   // ENA (PWM)
const int PIN_FAN_IN3  = 4;   // OUT3/OUT4 -> fan
const int PIN_FAN_IN4  = 5;
const int PIN_FAN_EN   = 10;  // ENB (PWM)

// Duty cycle 0-255. 110 is about 43 %, so about 4.3 V average: safe for 3-6 V motors.
// Raise in small steps only if a motor is too weak, and never above 150 (about 6 V).
const int PUMP_DUTY = 110;
const int FAN_DUTY  = 110;
const int MAX_DUTY  = 150;

// ---------- Timing ----------
const unsigned long TELEMETRY_INTERVAL_MS = 10000;
const unsigned long STATUS_INTERVAL_MS    = 10000;
const unsigned long RECONNECT_INTERVAL_MS = 10000;   // offline: retry WiFi/MQTT every minute
unsigned long lastTelemetry = 0;
unsigned long lastStatus    = 0;
unsigned long lastReconnect = 0;
bool online = false;   // false = offline mode: sensors still read and print to Serial

// ---------- Objects ----------
WiFiSSLClient sslClient;
MqttClient mqtt(sslClient);
DHT dht(PIN_DHT, DHT11);
BH1750 lightMeter;
bool lightOk = false;

bool pumpOn = false;
bool fanOn  = false;

// =====================================================================

void setup() {
  // Motors stopped before anything else, so the pump never blips on boot
  int motorPins[] = {PIN_PUMP_IN1, PIN_PUMP_IN2, PIN_PUMP_EN, PIN_FAN_IN3, PIN_FAN_IN4, PIN_FAN_EN};
  for (int p : motorPins) {
    digitalWrite(p, LOW);
    pinMode(p, OUTPUT);
  }

  Serial.begin(115200);
  delay(1500);

  snprintf(topicTelemetry, sizeof(topicTelemetry), "hg/%s/%s/telemetry",   SYSTEM_ID, DEVICE_ID);
  snprintf(topicStatus,    sizeof(topicStatus),    "hg/%s/%s/status",      SYSTEM_ID, DEVICE_ID);
  snprintf(topicCommand,   sizeof(topicCommand),   "hg/%s/%s/command",     SYSTEM_ID, DEVICE_ID);
  snprintf(topicAck,       sizeof(topicAck),       "hg/%s/%s/command/ack", SYSTEM_ID, DEVICE_ID);

  dht.begin();
  Wire.begin();
  lightOk = lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE);
  if (!lightOk) Serial.println("BH1750 not found — check SDA/SCL wiring");

  // Try a few times; if there is no WiFi or broker, keep going offline
  online = connectWiFi(3) && connectMqtt(3);
  lastReconnect = millis();

  publishTelemetry();   // first reading right away instead of waiting 30 s
  lastTelemetry = millis();
}

void loop() {
  unsigned long now = millis();

  if (online && WiFi.status() == WL_CONNECTED && mqtt.connected()) {
    mqtt.poll();   // processes incoming commands
  } else {
    online = false;
    if (now - lastReconnect >= RECONNECT_INTERVAL_MS) {
      lastReconnect = now;
      online = (WiFi.status() == WL_CONNECTED || connectWiFi(1)) && connectMqtt(2);
    }
  }

  if (now - lastTelemetry >= TELEMETRY_INTERVAL_MS) {
    lastTelemetry = now;
    publishTelemetry();
  }
  if (online && now - lastStatus >= STATUS_INTERVAL_MS) {
    lastStatus = now;
    publishStatus("online");
  }
}

// ---------- Connectivity ----------

bool connectWiFi(int maxTries) {
  Serial.print("Connecting to WiFi ");
  Serial.println(SECRET_SSID);
  for (int i = 0; i < maxTries; i++) {
    if (WiFi.begin(SECRET_SSID, SECRET_PASS) == WL_CONNECTED) {
      // Wait for DHCP: the R4 can report "connected" before it has an IP
      unsigned long t0 = millis();
      while (WiFi.localIP() == IPAddress(0, 0, 0, 0) && millis() - t0 < 15000) delay(250);
      Serial.print("\nWiFi OK, IP ");
      Serial.println(WiFi.localIP());
      return true;
    }
    Serial.print(".");
    delay(2000);
  }
  Serial.println("\nNo WiFi - OFFLINE mode: readings only on Serial, retrying every 60 s");
  return false;
}

bool connectMqtt(int maxTries) {
  mqtt.setId(DEVICE_ID);
  mqtt.setUsernamePassword(SECRET_MQTT_USER, SECRET_MQTT_PASS);
  mqtt.setKeepAliveInterval(60 * 1000L);

  // Last Will: the broker publishes "offline" if the device disappears (FR-14)
  mqtt.beginWill(topicStatus, true, 1);
  mqtt.print("{\"status\":\"offline\"}");
  mqtt.endWill();

  Serial.print("Connecting to MQTT broker ");
  Serial.println(SECRET_MQTT_HOST);
  for (int i = 0; i < maxTries; i++) {
    if (mqtt.connect(SECRET_MQTT_HOST, 8883)) {
      Serial.println("MQTT OK");
      mqtt.onMessage(onCommand);
      mqtt.subscribe(topicCommand, 1);
      publishStatus("online");
      return true;
    }
    Serial.print("MQTT error ");
    Serial.println(mqtt.connectError());
    delay(3000);
  }
  Serial.println("No broker - OFFLINE mode: readings only on Serial");
  return false;
}

// ---------- Telemetry ----------

void addReading(JsonArray readings, const char* sensorId, const char* type,
                float value, const char* unit, unsigned long ts) {
  JsonObject r = readings.add<JsonObject>();
  r["sensor_id"] = sensorId;
  r["measurement_type"] = type;
  r["value"] = value;
  r["unit"] = unit;
  if (ts > 0) r["timestamp"] = ts;   // epoch seconds; the server stamps it if missing
}

void publishTelemetry() {
  unsigned long ts = WiFi.getTime();   // NTP time from the WiFi module, 0 if unavailable

  JsonDocument doc;
  JsonArray readings = doc["readings"].to<JsonArray>();

  float t = dht.readTemperature();
  float h = dht.readHumidity();
  if (!isnan(t)) addReading(readings, "TEMP-001", "air_temperature", t, "C", ts);
  else Serial.println("DHT11 temperature read failed");
  if (!isnan(h)) addReading(readings, "HUM-001", "humidity", h, "%", ts);
  else Serial.println("DHT11 humidity read failed");

  if (lightOk) {
    float lux = lightMeter.readLightLevel();
    if (lux >= 0) addReading(readings, "LUX-001", "light", lux, "lux", ts);
  }

  doc["pump"] = pumpOn ? "on" : "off";
  doc["fan"]  = fanOn  ? "on" : "off";

  char payload[512];
  size_t len = serializeJson(doc, payload, sizeof(payload));

  if (online) {
    mqtt.beginMessage(topicTelemetry, false, 1);
    mqtt.write((const uint8_t*)payload, len);
    mqtt.endMessage();
  }

  Serial.print(online ? "Telemetry: " : "Telemetry (offline): ");
  Serial.println(payload);
}

void publishStatus(const char* state) {
  char payload[128];
  snprintf(payload, sizeof(payload),
           "{\"status\":\"%s\",\"uptime_s\":%lu,\"rssi\":%d}",
           state, millis() / 1000, WiFi.RSSI());
  mqtt.beginMessage(topicStatus, true, 1);   // retained
  mqtt.print(payload);
  mqtt.endMessage();
}

// ---------- Motors (L298N) ----------

// Forward = IN_a HIGH, IN_b LOW, EN = PWM duty. Stop = EN 0 and both IN LOW.
// If a motor spins the wrong way, swap its two wires on OUT1/OUT2 or OUT3/OUT4.
void setMotor(int inA, int inB, int en, int duty, bool on) {
  duty = constrain(duty, 0, MAX_DUTY);
  if (!on) {
    analogWrite(en, 0);
    digitalWrite(inA, LOW);
    digitalWrite(inB, LOW);
    return;
  }
  digitalWrite(inB, LOW);
  digitalWrite(inA, HIGH);
  analogWrite(en, duty);
}

// ---------- Commands ----------
// Expected payload: {"command_id":"abc123","actuator":"pump","action":"on"}

void onCommand(int messageSize) {
  char buf[256];
  int i = 0;
  while (mqtt.available() && i < (int)sizeof(buf) - 1) buf[i++] = (char)mqtt.read();
  buf[i] = '\0';
  Serial.print("Command: ");
  Serial.println(buf);

  JsonDocument cmd;
  if (deserializeJson(cmd, buf)) {
    Serial.println("Invalid command JSON");
    return;
  }

  const char* commandId = cmd["command_id"] | "";
  const char* actuator  = cmd["actuator"]   | "";
  const char* action    = cmd["action"]     | "";
  bool turnOn = strcmp(action, "on") == 0;
  bool valid  = turnOn || strcmp(action, "off") == 0;

  const char* result = "rejected";
  if (valid && strcmp(actuator, "pump") == 0) {
    setMotor(PIN_PUMP_IN1, PIN_PUMP_IN2, PIN_PUMP_EN, PUMP_DUTY, turnOn);
    pumpOn = turnOn;
    result = "ok";
  } else if (valid && strcmp(actuator, "fan") == 0) {
    setMotor(PIN_FAN_IN3, PIN_FAN_IN4, PIN_FAN_EN, FAN_DUTY, turnOn);
    fanOn = turnOn;
    result = "ok";
  }

  char ack[192];
  snprintf(ack, sizeof(ack),
           "{\"command_id\":\"%s\",\"actuator\":\"%s\",\"state\":\"%s\",\"result\":\"%s\"}",
           commandId, actuator, turnOn ? "on" : "off", result);
  mqtt.beginMessage(topicAck, false, 1);
  mqtt.print(ack);
  mqtt.endMessage();
}
