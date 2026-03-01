package ro.varse.backend.mqtt;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.eclipse.paho.client.mqttv3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import ro.varse.backend.domain.Telemetry;
import ro.varse.backend.repository.TelemetryRepository;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.nio.charset.StandardCharsets;
import java.time.Instant;

@Service
public class MqttTelemetryListener {

    private final TelemetryRepository repo;
    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${mqtt.host}")
    private String mqttHost;

    @Value("${mqtt.clientId}")
    private String clientId;

    @Value("${mqtt.topicTelemetry}")
    private String topicTelemetry;

    private MqttClient client;

    public MqttTelemetryListener(TelemetryRepository repo) {
        this.repo = repo;
    }

    @PostConstruct
    public void start() throws Exception {
        client = new MqttClient(mqttHost, clientId, new MemoryPersistence());

        MqttConnectOptions options = new MqttConnectOptions();
        options.setAutomaticReconnect(true);
        options.setCleanSession(true);

        client.setCallback(new MqttCallback() {
            @Override
            public void connectionLost(Throwable cause) {
                System.out.println("MQTT connection lost: " + cause.getMessage());
            }

            @Override
            public void messageArrived(String topic, MqttMessage message) throws Exception {
                String payload = new String(message.getPayload(), StandardCharsets.UTF_8);
                saveTelemetryFromJson(payload);
            }

            @Override
            public void deliveryComplete(IMqttDeliveryToken token) { }
        });

        client.connect(options);
        client.subscribe(topicTelemetry, 0);

        System.out.println("MQTT connected to " + mqttHost + ", subscribed to " + topicTelemetry);
    }

    private void saveTelemetryFromJson(String payload) throws Exception {
        JsonNode n = mapper.readTree(payload);

        Telemetry t = new Telemetry();
        t.setRoomId(n.path("roomId").asText("room1"));

        long ts = n.path("ts").asLong(0);
        t.setTs(ts == 0 ? Instant.now() : Instant.ofEpochSecond(ts));

        if (!n.path("temp_c").isMissingNode()) t.setTempC(n.path("temp_c").asDouble());
        if (!n.path("lux").isMissingNode()) t.setLux(n.path("lux").asInt());
        if (!n.path("occupied").isMissingNode()) t.setOccupied(n.path("occupied").asBoolean());
        if (!n.path("power_w").isMissingNode()) t.setPowerW(n.path("power_w").asDouble());
        if (!n.path("mode").isMissingNode()) t.setMode(n.path("mode").asText());

        JsonNode act = n.path("actuators");
        if (!act.isMissingNode()) {
            if (!act.path("light").isMissingNode()) t.setActuatorLight(act.path("light").asBoolean());
            if (!act.path("hvac").isMissingNode()) t.setActuatorHvac(act.path("hvac").asBoolean());
        }

        repo.save(t);
    }

    @PreDestroy
    public void stop() throws Exception {
        if (client != null && client.isConnected()) {
            client.disconnect();
        }
    }
}