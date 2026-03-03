package ro.varse.backend.mqtt;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.eclipse.paho.client.mqttv3.*;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import ro.varse.backend.domain.Telemetry;
import ro.varse.backend.repository.TelemetryRepository;
import ro.varse.backend.ws.TelemetryWsHandler;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.nio.charset.StandardCharsets;
import java.time.Instant;

@Service
public class MqttTelemetryListener {

    private final TelemetryRepository repo;
    private final TelemetryWsHandler wsHandler;
    private final ObjectMapper mapper;   // Injectat de Spring

    @Value("${mqtt.host}")
    private String mqttHost;

    @Value("${mqtt.clientId}")
    private String clientId;

    @Value("${mqtt.topicTelemetry}")
    private String topicTelemetry;

    private MqttClient client;

    public MqttTelemetryListener(
            TelemetryRepository repo,
            TelemetryWsHandler wsHandler,
            ObjectMapper mapper
    ) {
        this.repo = repo;
        this.wsHandler = wsHandler;
        this.mapper = mapper;
    }

    @PostConstruct
    public void start() throws Exception {
        client = new MqttClient(mqttHost, clientId, new MemoryPersistence());

        MqttConnectOptions options = new MqttConnectOptions();
        options.setAutomaticReconnect(true);
        options.setCleanSession(true);
        options.setConnectionTimeout(10);
        options.setKeepAliveInterval(20);

        client.setCallback(new MqttCallbackExtended() {

            @Override
            public void connectComplete(boolean reconnect, String serverURI) {
                System.out.println("MQTT connectComplete (reconnect=" + reconnect + ")");
                try {
                    client.subscribe(topicTelemetry, 0);
                    System.out.println("MQTT subscribed to " + topicTelemetry);
                } catch (Exception e) {
                    System.out.println("MQTT subscribe failed: " + e.getMessage());
                }
            }

            @Override
            public void connectionLost(Throwable cause) {
                System.out.println("MQTT connection lost: " + cause);
            }

            @Override
            public void messageArrived(String topic, MqttMessage message) throws Exception {
                String payload = new String(message.getPayload(), StandardCharsets.UTF_8);

                Telemetry saved = saveTelemetryFromJson(payload);

                // Trimitem Telemetry "curat" către WebSocket
                wsHandler.broadcast(mapper.writeValueAsString(saved));
            }

            @Override
            public void deliveryComplete(IMqttDeliveryToken token) {
            }
        });

        client.connect(options);

        System.out.println("MQTT connected to " + mqttHost + " (subscribe in connectComplete)");
    }

    public void publish(String topic, String payload) throws Exception {
        if (client == null || !client.isConnected()) {
            throw new IllegalStateException("MQTT client not connected");
        }
        client.publish(topic, payload.getBytes(StandardCharsets.UTF_8), 0, false);
    }

    private Telemetry saveTelemetryFromJson(String payload) throws Exception {
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

        return repo.save(t);
    }

    @PreDestroy
    public void stop() throws Exception {
        if (client != null && client.isConnected()) {
            client.disconnect();
        }
    }
}