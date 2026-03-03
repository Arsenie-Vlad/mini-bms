package ro.varse.backend.ws;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class TelemetryWsHandler extends TextWebSocketHandler {

    // păstrăm toate sesiunile conectate (clienți)
    private final Set<WebSocketSession> sessions = ConcurrentHashMap.newKeySet();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.add(session);
        System.out.println("WS client connected: " + session.getId());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
        System.out.println("WS client disconnected: " + session.getId());
    }

    // trimite mesaj JSON către toți clienții
    public void broadcast(String json) {
        for (WebSocketSession s : sessions) {
            try {
                if (s.isOpen()) {
                    s.sendMessage(new TextMessage(json));
                }
            } catch (Exception e) {
                // dacă un client moare, nu vrem să stricăm broadcast-ul
                System.out.println("WS send failed: " + e.getMessage());
            }
        }
    }
}