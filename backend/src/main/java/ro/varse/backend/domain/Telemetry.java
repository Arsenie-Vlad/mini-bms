package ro.varse.backend.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "telemetry")
public class Telemetry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String roomId;

    @Column(nullable = false)
    private Instant ts;

    private Double tempC;
    private Integer lux;
    private Boolean occupied;
    private Double powerW;

    @Column(length = 32)
    private String mode;

    private Boolean actuatorLight;
    private Boolean actuatorHvac;

    public Telemetry() {}

    // --- getters/setters ---
    public Long getId() { return id; }

    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }

    public Instant getTs() { return ts; }
    public void setTs(Instant ts) { this.ts = ts; }

    public Double getTempC() { return tempC; }
    public void setTempC(Double tempC) { this.tempC = tempC; }

    public Integer getLux() { return lux; }
    public void setLux(Integer lux) { this.lux = lux; }

    public Boolean getOccupied() { return occupied; }
    public void setOccupied(Boolean occupied) { this.occupied = occupied; }

    public Double getPowerW() { return powerW; }
    public void setPowerW(Double powerW) { this.powerW = powerW; }

    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }

    public Boolean getActuatorLight() { return actuatorLight; }
    public void setActuatorLight(Boolean actuatorLight) { this.actuatorLight = actuatorLight; }

    public Boolean getActuatorHvac() { return actuatorHvac; }
    public void setActuatorHvac(Boolean actuatorHvac) { this.actuatorHvac = actuatorHvac; }
}