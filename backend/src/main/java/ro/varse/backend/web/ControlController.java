package ro.varse.backend.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import ro.varse.backend.mqtt.MqttTelemetryListener;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class ControlController {

    private final MqttTelemetryListener mqtt;
    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${mqtt.topicConfig}")
    private String topicConfig;

    @Value("${mqtt.topicCmd}")
    private String topicCmd;

    public ControlController(MqttTelemetryListener mqtt) {
        this.mqtt = mqtt;
    }

    // trimite config (mode, thresholds, sampling)
    @PostMapping("/config")
    public String sendConfig(@RequestBody Map<String, Object> body) throws Exception {
        String json = mapper.writeValueAsString(body);
        mqtt.publish(topicConfig, json);
        return "ok";
    }

    // trimite comenzi/override (ex: light/hvac/occupied)
    @PostMapping("/cmd")
    public String sendCmd(@RequestBody Map<String, Object> body) throws Exception {
        String json = mapper.writeValueAsString(body);
        mqtt.publish(topicCmd, json);
        return "ok";
    }
}