"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metrics = void 0;
const prom_client_1 = require("prom-client");
class MetricsCollector {
    constructor() {
        // APM Hooks
        this.apmHooks = [];
        // HTTP Request Metrics
        this.requestDuration = new prom_client_1.Histogram({
            name: 'http_request_duration_seconds',
            help: 'Duration of HTTP requests in seconds',
            labelNames: ['method', 'route', 'status_code'],
            buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
        });
        this.requestCount = new prom_client_1.Counter({
            name: 'http_requests_total',
            help: 'Total number of HTTP requests',
            labelNames: ['method', 'route', 'status_code']
        });
        this.requestErrors = new prom_client_1.Counter({
            name: 'http_request_errors_total',
            help: 'Total number of HTTP request errors (4xx + 5xx)',
            labelNames: ['method', 'route', 'status_code']
        });
        this.httpStatusCodes = new prom_client_1.Counter({
            name: 'http_status_codes_total',
            help: 'Total HTTP status codes returned',
            labelNames: ['status_code']
        });
        // Business Metrics
        this.bookingCreated = new prom_client_1.Counter({
            name: 'booking_created_total',
            help: 'Total number of bookings created',
            labelNames: ['room_type', 'source']
        });
        this.bookingCancelled = new prom_client_1.Counter({
            name: 'booking_cancelled_total',
            help: 'Total number of bookings cancelled',
            labelNames: ['reason']
        });
        this.bookingCompleted = new prom_client_1.Counter({
            name: 'booking_completed_total',
            help: 'Total number of completed bookings',
            labelNames: ['room_type']
        });
        this.revenueCollected = new prom_client_1.Counter({
            name: 'revenue_collected_total',
            help: 'Total revenue collected in cents',
            labelNames: ['payment_method']
        });
        this.userRegistrations = new prom_client_1.Counter({
            name: 'user_registrations_total',
            help: 'Total number of user registrations'
        });
        this.userLogins = new prom_client_1.Counter({
            name: 'user_logins_total',
            help: 'Total number of user logins',
            labelNames: ['auth_method']
        });
        // System Metrics
        this.activeConnections = new prom_client_1.Gauge({
            name: 'active_connections',
            help: 'Number of active HTTP connections'
        });
        this.memoryUsage = new prom_client_1.Gauge({
            name: 'process_memory_usage_bytes',
            help: 'Process memory usage in bytes',
            labelNames: ['type']
        });
        this.uptime = new prom_client_1.Gauge({
            name: 'process_uptime_seconds',
            help: 'Process uptime in seconds'
        });
        // Start system metrics collection
        this.startSystemMetricsCollection();
    }
    static getInstance() {
        if (!MetricsCollector.instance) {
            MetricsCollector.instance = new MetricsCollector();
        }
        return MetricsCollector.instance;
    }
    expressMiddleware() {
        return (req, res, next) => {
            const startTime = process.hrtime();
            this.activeConnections.inc();
            res.on('finish', () => {
                var _a;
                const [seconds, nanoseconds] = process.hrtime(startTime);
                const duration = seconds + nanoseconds / 1e9;
                const route = ((_a = req.route) === null || _a === void 0 ? void 0 : _a.path) || req.path || 'unknown';
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
    recordBookingCreated(roomType, source = 'website') {
        this.bookingCreated.labels(roomType, source).inc();
        this.triggerApmHooks('booking_created', 1, { roomType, source });
    }
    recordBookingCancelled(reason) {
        this.bookingCancelled.labels(reason).inc();
        this.triggerApmHooks('booking_cancelled', 1, { reason });
    }
    recordBookingCompleted(roomType) {
        this.bookingCompleted.labels(roomType).inc();
        this.triggerApmHooks('booking_completed', 1, { roomType });
    }
    recordRevenue(amountCents, paymentMethod) {
        this.revenueCollected.labels(paymentMethod).inc(amountCents);
        this.triggerApmHooks('revenue_collected', amountCents, { paymentMethod });
    }
    recordUserRegistration() {
        this.userRegistrations.inc();
        this.triggerApmHooks('user_registration', 1);
    }
    recordUserLogin(authMethod = 'email') {
        this.userLogins.labels(authMethod).inc();
        this.triggerApmHooks('user_login', 1, { authMethod });
    }
    // APM Integration Hooks
    registerApmHook(hook) {
        this.apmHooks.push(hook);
    }
    triggerApmHooks(metric, value, tags) {
        this.apmHooks.forEach(hook => {
            try {
                hook(metric, value, tags);
            }
            catch (err) {
                // Silently fail APM hooks to not break application
            }
        });
    }
    // Prometheus Metrics Endpoint Handler
    getMetricsHandler(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            res.set('Content-Type', prom_client_1.register.contentType);
            res.end(yield prom_client_1.register.metrics());
        });
    }
    // Health Check Endpoint Handler
    getHealthCheckHandler(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
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
                    totalRequests: yield this.requestCount.get(),
                    errorRate: yield this.requestErrors.get()
                }
            };
            res.status(200).json(health);
        });
    }
    startSystemMetricsCollection() {
        setInterval(() => {
            const memory = process.memoryUsage();
            this.memoryUsage.labels('rss').set(memory.rss);
            this.memoryUsage.labels('heapTotal').set(memory.heapTotal);
            this.memoryUsage.labels('heapUsed').set(memory.heapUsed);
            this.memoryUsage.labels('external').set(memory.external);
            this.uptime.set(process.uptime());
        }, 5000);
    }
    resetMetrics() {
        prom_client_1.register.resetMetrics();
    }
}
exports.metrics = MetricsCollector.getInstance();
