package ro.varse.backend.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ro.varse.backend.service.CsvLogService;

import java.util.List;

@RestController
@RequestMapping("/api/logs")
public class CsvLogController {

    private final CsvLogService csvLogService;

    public CsvLogController(CsvLogService csvLogService) {
        this.csvLogService = csvLogService;
    }

    @GetMapping
    public List<String> getCsvLogs() {
        return csvLogService.readAllLogs();
    }
}
