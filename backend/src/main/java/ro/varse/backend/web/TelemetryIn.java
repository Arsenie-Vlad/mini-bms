package ro.varse.backend.web;

public class TelemetryIn {
    public String roomId;
    public Long ts; // epoch seconds
    public Double tempC;
    public Integer lux;
    public Boolean occupied;
    public Double powerW;
    public String mode;
    public Boolean actuatorLight;
    public Boolean actuatorHvac;
}