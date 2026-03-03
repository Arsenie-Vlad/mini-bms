package ro.varse.backend.web;

import ro.varse.backend.domain.Telemetry;
import ro.varse.backend.repository.TelemetryRepository;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/telemetry")
public class TelemetryController {

    private final TelemetryRepository repo;

    public TelemetryController(TelemetryRepository repo) {
        this.repo = repo;
    }

    @PostMapping
    public Telemetry save(@RequestBody TelemetryIn in) {
        Telemetry t = new Telemetry();
        t.setRoomId(in.roomId == null ? "room1" : in.roomId);
        t.setTs(in.ts == null ? Instant.now() : Instant.ofEpochSecond(in.ts));
        t.setTempC(in.tempC);
        t.setLux(in.lux);
        t.setOccupied(in.occupied);
        t.setPowerW(in.powerW);
        t.setMode(in.mode);
        t.setActuatorLight(in.actuatorLight);
        t.setActuatorHvac(in.actuatorHvac);
        return repo.save(t);
    }

    @GetMapping("/last")
    public Telemetry last(@RequestParam(defaultValue = "room1") String roomId) {
        return repo.findTopByRoomIdOrderByTsDesc(roomId).orElse(null);
    }

    @GetMapping("/range")
    public List<Telemetry> range(
            @RequestParam(defaultValue = "room1") String roomId,
            @RequestParam long from,   // epoch seconds
            @RequestParam long to      // epoch seconds
    ) {
        return repo.findByRoomIdAndTsBetweenOrderByTsAsc(
                roomId,
                Instant.ofEpochSecond(from),
                Instant.ofEpochSecond(to)
        );
    }
}