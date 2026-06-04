package ro.varse.backend.service;

import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.Collections;
import java.util.List;

@Service
public class CsvLogService {

    private static final Path LOG_FILE = Paths.get("bms_central_log.csv");

    public void appendLog(String logLine) {
        try {
            String lineWithNewline = logLine + System.lineSeparator();
            Files.write(
                    LOG_FILE,
                    lineWithNewline.getBytes(),
                    StandardOpenOption.CREATE,
                    StandardOpenOption.APPEND
            );
        } catch (IOException e) {
            System.err.println("Failed to write to CSV log: " + e.getMessage());
        }
    }

    public List<String> readAllLogs() {
        try {
            if (Files.exists(LOG_FILE)) {
                return Files.readAllLines(LOG_FILE);
            }
        } catch (IOException e) {
            System.err.println("Failed to read CSV log: " + e.getMessage());
        }
        return Collections.emptyList();
    }
}
