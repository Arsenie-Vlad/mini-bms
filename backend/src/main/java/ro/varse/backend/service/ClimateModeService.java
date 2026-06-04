package ro.varse.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import ro.varse.backend.model.ModClima;

@Service
public class ClimateModeService {

    private ModClima currentMode = ModClima.ECO;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    public ClimateModeService(SimpMessagingTemplate messagingTemplate, ObjectMapper objectMapper) {
        this.messagingTemplate = messagingTemplate;
        this.objectMapper = objectMapper;
    }

    public void processTelemetryJson(String payload) {
        try {
            JsonNode node = objectMapper.readTree(payload);
            if (node.has("mode")) {
                updateModeIfChanged(node.get("mode").asText());
            }
        } catch (Exception e) {
            System.err.println("Eroare la parsarea JSON-ului de telemetrie: " + e.getMessage());
        }
    }

    public void processCsvLog(String csvLine) {
        if (csvLine != null && !csvLine.isEmpty()) {
            String[] splitString = csvLine.split(",");
            if (splitString.length > 0) {
                updateModeIfChanged(splitString[0]);
            }
        }
    }

    private void updateModeIfChanged(String modeString) {
        try {
            ModClima parsedMode = ModClima.valueOf(modeString.toUpperCase());
            if (this.currentMode != parsedMode) {
                this.currentMode = parsedMode;
                notifyFrontend();
            }
        } catch (IllegalArgumentException e) {
            System.err.println("Mod necunoscut primit prin MQTT: " + modeString);
        }
    }

    private void notifyFrontend() {
        // Trimite starea ca string (ex: "ECO") către clienții abonați
        messagingTemplate.convertAndSend("/topic/schimbare-mod", this.currentMode.name());
    }

    public ModClima getCurrentMode() {
        return currentMode;
    }
}
