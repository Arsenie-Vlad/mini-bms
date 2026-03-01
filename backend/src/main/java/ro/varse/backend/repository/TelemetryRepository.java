package ro.varse.backend.repository;

import ro.varse.backend.domain.Telemetry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TelemetryRepository extends JpaRepository<Telemetry, Long> {
    Optional<Telemetry> findTopByRoomIdOrderByTsDesc(String roomId);
}