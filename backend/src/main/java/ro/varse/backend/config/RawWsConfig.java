package ro.varse.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import ro.varse.backend.ws.TelemetryWsHandler;

@Configuration
@EnableWebSocket
public class RawWsConfig implements WebSocketConfigurer {

    private final TelemetryWsHandler handler;

    public RawWsConfig(TelemetryWsHandler handler) {
        this.handler = handler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(handler, "/ws-telemetry")
                .setAllowedOrigins("http://localhost:5173");
    }
}