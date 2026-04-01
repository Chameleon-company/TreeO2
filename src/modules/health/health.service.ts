export class HealthService {
  getHealthStatus() {
    return {
      success: true,
      status: "OK",
      timestamp: new Date().toISOString(),
    };
  }
}
