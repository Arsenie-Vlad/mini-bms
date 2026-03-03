package ro.varse.backend.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Entity
@Table(name = "telemetry")
public class Telemetry {

    // --- getters/setters ---
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Setter
    @Column(nullable = false)
    private String roomId;

    @Setter
    @Column(nullable = false)
    private Instant ts;

    @Setter
    private Double tempC;
    @Setter
    private Integer lux;
    @Setter
    private Boolean occupied;
    @Setter
    private Double powerW;

    @Setter
    @Column(length = 32)
    private String mode;

    @Setter
    private Boolean actuatorLight;
    @Setter
    private Boolean actuatorHvac;

    public Telemetry() {}

}