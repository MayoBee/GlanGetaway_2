import { Counter, Histogram, Gauge, register } from 'prom-client';
import { Request, Response, NextFunction } from 'express';

class MetricsCollector {
  private static instance: MetricsCollector;

  // Request Metrics
  private readonly requestDuration: Histogram<string>;
  private readonly requestCount: Counter<string>;
  private readonly requestErrors: Counter<string>;
  private readonly httpStatusCodes: Counter<string>;

  // Business Metrics
  private readonly bookingCreated: Counter<string>;
  private readonly bookingCancelled: Counter<string>;
  private readonly bookingCompleted: Counter<string>;
  private readonly revenueCollected: Counter<string>;
  private readonly userRegistrations: Counter<string>;
  private readonly userLogins: Counter<string>;

  // System Metrics
  private readonly activeConnections: Gauge<string>;
  private readonly memoryUsage: Gauge<string>;
  private readonly uptime: Gauge<string>;

  // APM Hooks
  private apmHooks: Array<(metric: string, value: number, tags?: Record<string, string>) => void> = [];

  private constructor() {
    // HTTP Request Metrics
    this.requestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
    });

    this.requestCount = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code']
    });

    this.requestErrors = new Counter({
      name: 'http_request_errors_total',
      help: 'Total number of HTTP request errors (4xx + 5xx)',
      labelNames: ['method', 'route', 'status_code']
    });

    this.httpStatusCodes = new Counter({
      name: 'http_status_codes_total',
      help: 'Total HTTP status codes returned',
      labelNames: ['status_code']
    });

    // Business Metrics
    this.bookingCreated = new Counter({
      name: 'booking_created_total',
      help: 'Total number of bookings created',
      labelNames: ['room_type', 'source']
    });

    this.bookingCancelled = new Counter({
      name: 'booking_cancelled_total',
      help: 'Total number of bookings cancelled',
      labelNames: ['reason']
    });

    this.bookingCompleted = new Counter({
      name: 'booking_completed_total',
      help: 'Total number of completed bookings',
      labelNames: ['room_type']
    });

    this.revenueCollected = new Counter({
      name: 'revenue_collected_total',
      help: 'Total revenue collected in cents',
      labelNames: ['payment_method']
    });

    this.userRegistrations = new Counter({
      name: 'user_registrations_total',
      help: 'Total number of user registrations'
    });

    this.userLogins = new Counter({
      name: 'user_logins_total',
      help: 'Total number of user logins',
      labelNames: ['auth_method']
    });

    // System Metrics
    this.activeConnections = new Gauge({
      name: 'active_connections',
      help: 'Number of active HTTP connections'
    });

    this.memoryUsage = new Gauge({
      name: 'process_memory_usage_bytes',
      help: 'Process memory usage in bytes',
      labelNames: ['type']
    });

    this.uptime = new Gauge({
      name: 'process_uptime_seconds',
      help: 'Process uptime in seconds'
    });

    // Start system metrics collection
    this.startSystemMetricsCollection();
  }

  public static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  public expressMiddleware(): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = process.hrtime();
      this.activeConnections.inc();

      res.on('finish', () => {
        const [seconds, nanoseconds] = process.hrtime(startTime);
        const duration = seconds + nanoseconds / 1e9;
        
        const route = req.route?.path || req.path || 'unknown';
        const method = req.method;
        const statusCode = res.statusCode.toString();

        this.requestDuration.labels(method, route, statusCode).observe(duration);
        this.requestCount.labels(method, route, statusCode).inc();
        this.httpStatusCodes.labels(statusCode).inc();

        if (res.statusCode >= 400) {
          this.requestErrors.labels(method, route, statusCode).inc();
        }

        this.activeConnections.dec();
      });

      next();
    };
  }

  // Business Metrics Methods
  public recordBookingCreated(roomType: string, source: string = 'website'): void {
    this.bookingCreated.labels(roomType, source).inc();
    this.triggerApmHooks('booking_created', 1, { roomType, source });
  }

  public recordBookingCancelled(reason: string): void {
    this.bookingCancelled.labels(reason).inc();
    this.triggerApmHooks('booking_cancelled', 1, { reason });
  }

  public recordBookingCompleted(roomType: string): void {
    this.bookingCompleted.labels(roomType).inc();
    this.triggerApmHooks('booking_completed', 1, { roomType });
  }

  public recordRevenue(amountCents: number, paymentMethod: string): void {
    this.revenueCollected.labels(paymentMethod).inc(amountCents);
    this.triggerApmHooks('revenue_collected', amountCents, { paymentMethod });
  }

  public recordUserRegistration(): void {
    this.userRegistrations.inc();
    this.triggerApmHooks('user_registration', 1);
  }

  public recordUserLogin(authMethod: string = 'email'): void {
    this.userLogins.labels(authMethod).inc();
    this.triggerApmHooks('user_login', 1, { authMethod });
  }

  // APM Integration Hooks
  public registerApmHook(hook: (metric: string, value: number, tags?: Record<string, string>) => void): void {
    this.apmHooks.push(hook);
  }

  private triggerApmHooks(metric: string, value: number, tags?: Record<string, string>): void {
    this.apmHooks.forEach(hook => {
      try {
        hook(metric, value, tags);
      } catch (err) {
        // Silently fail APM hooks to not break application
      }
    });
  }

  // Prometheus Metrics Endpoint Handler
  public async getMetricsHandler(req: Request, res: Response): Promise<void> {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  }

  // Health Check Endpoint Handler
  public async getHealthCheckHandler(req: Request, res: Response): Promise<void> {
    const memory = process.memoryUsage();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      process: {
        pid: process.pid,
        memory: {
          rss: memory.rss,
          heapTotal: memory.heapTotal,
          heapUsed: memory.heapUsed,
          external: memory.external
        },
        version: process.version
      },
      metrics: {
        totalRequests: await this.requestCount.get(),
        errorRate: await this.requestErrors.get()
      }
    };

    res.status(200).json(health);
  }

  private startSystemMetricsCollection(): void {
    setInterval(() => {
      const memory = process.memoryUsage();
      
      this.memoryUsage.labels('rss').set(memory.rss);
      this.memoryUsage.labels('heapTotal').set(memory.heapTotal);
      this.memoryUsage.labels('heapUsed').set(memory.heapUsed);
      this.memoryUsage.labels('external').set(memory.external);
      
      this.uptime.set(process.uptime());
    }, 5000);
  }

  public resetMetrics(): void {
    register.resetMetrics();
  }
}

export const metrics = MetricsCollector.getInstance();
