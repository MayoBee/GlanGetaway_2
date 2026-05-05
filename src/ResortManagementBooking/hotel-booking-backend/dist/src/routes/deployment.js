"use strict";
/**
 * Deployment Verification Routes
 * Provides comprehensive deployment readiness checks and monitoring
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const deploymentUtils_1 = require("../utils/deploymentUtils");
const auth_1 = __importDefault(require("../middleware/auth"));
const router = express_1.default.Router();
/**
 * GET /api/deployment/verify
 * Run comprehensive deployment verification
 */
router.get('/verify', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const report = yield deploymentUtils_1.DeploymentVerifier.runDeploymentVerification();
        res.status(200).json({
            status: 'success',
            data: report
        });
    }
    catch (error) {
        console.error('Deployment verification error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to run deployment verification',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
/**
 * GET /api/deployment/health
 * Enhanced health check with deployment status
 */
router.get('/health', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const report = yield deploymentUtils_1.DeploymentVerifier.runDeploymentVerification();
        // Determine health status based on deployment verification
        let statusCode = 200;
        let healthStatus = 'healthy';
        if (report.overallStatus === 'NOT_READY') {
            statusCode = 503;
            healthStatus = 'unhealthy';
        }
        else if (report.overallStatus === 'WARNING') {
            statusCode = 200;
            healthStatus = 'degraded';
        }
        const healthData = {
            status: healthStatus,
            timestamp: report.timestamp,
            deployment: {
                status: report.overallStatus,
                score: report.deploymentScore,
                environment: report.environment,
                nodeVersion: report.nodeVersion,
                platform: report.platform
            },
            checks: {
                total: report.checks.length,
                passed: report.checks.filter(c => c.status === 'PASS').length,
                warnings: report.checks.filter(c => c.status === 'WARN').length,
                failed: report.checks.filter(c => c.status === 'FAIL').length
            },
            criticalIssues: report.checks.filter(c => c.critical && c.status === 'FAIL'),
            recommendations: report.recommendations.slice(0, 3) // Top 3 recommendations
        };
        res.status(statusCode).json(healthData);
    }
    catch (error) {
        console.error('Enhanced health check error:', error);
        res.status(503).json({
            status: 'unhealthy',
            message: 'Health check failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
/**
 * GET /api/deployment/checklist
 * Get deployment checklist
 */
router.get('/checklist', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const checklist = deploymentUtils_1.DeploymentVerifier.generateDeploymentChecklist();
        res.json({
            status: 'success',
            data: checklist
        });
    }
    catch (error) {
        console.error('Checklist generation error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to generate checklist',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
/**
 * GET /api/deployment/monitoring
 * Get monitoring configuration and status
 */
router.get('/monitoring', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const monitoringStatus = {
            status: 'active',
            timestamp: new Date().toISOString(),
            metrics: {
                uptime: Math.round(process.uptime()),
                memory: {
                    used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                    total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                    percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
                },
                cpu: process.cpuUsage(),
                platform: process.platform,
                nodeVersion: process.version
            },
            endpoints: {
                health: '/health',
                detailed: '/health/detailed',
                deployment: '/deployment/verify',
                metrics: '/metrics'
            },
            alerts: {
                enabled: true,
                thresholds: {
                    memory: 90,
                    disk: 90,
                    responseTime: 5000 // milliseconds
                }
            }
        };
        res.json({
            status: 'success',
            data: monitoringStatus
        });
    }
    catch (error) {
        console.error('Monitoring status error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get monitoring status',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
/**
 * POST /api/deployment/pre-check
 * Pre-deployment validation (requires authentication)
 */
router.post('/pre-check', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const report = yield deploymentUtils_1.DeploymentVerifier.runDeploymentVerification();
        // Additional pre-deployment checks
        const preDeploymentChecks = {
            userAuthenticated: true,
            deploymentReady: report.overallStatus !== 'NOT_READY',
            criticalIssues: report.checks.filter(c => c.critical && c.status === 'FAIL').length,
            warnings: report.checks.filter(c => c.status === 'WARN').length,
            deploymentScore: report.deploymentScore,
            recommendations: report.recommendations
        };
        const canDeploy = preDeploymentChecks.deploymentReady && preDeploymentChecks.criticalIssues === 0;
        res.json({
            status: 'success',
            data: {
                canDeploy,
                deploymentReport: report,
                preDeploymentChecks,
                deploymentBlocked: !canDeploy,
                blockingIssues: preDeploymentChecks.criticalIssues > 0 ?
                    report.checks.filter(c => c.critical && c.status === 'FAIL').map(c => c.message) :
                    []
            }
        });
    }
    catch (error) {
        console.error('Pre-deployment check error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to run pre-deployment check',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
/**
 * GET /api/deployment/status
 * Get current deployment status summary
 */
router.get('/status', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const status = {
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            version: '1.0.0',
            deployment: {
                ready: false,
                score: 0,
                lastChecked: null
            },
            system: {
                uptime: Math.round(process.uptime()),
                memory: {
                    used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                    total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
                },
                platform: process.platform,
                nodeVersion: process.version
            },
            features: {
                transactions: true,
                gcashSecurity: true,
                testing: true,
                timezoneSafety: true,
                compliance: true,
                deployment: true // Phase 6
            }
        };
        res.json({
            status: 'success',
            data: status
        });
    }
    catch (error) {
        console.error('Deployment status error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get deployment status',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
/**
 * GET /api/deployment/features
 * Get implemented features and their status
 */
router.get('/features', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const features = [
            {
                phase: 1,
                name: 'Mongoose Transactions',
                status: 'completed',
                description: 'ACID-compliant booking transactions with rollback support',
                implemented: true,
                tested: true
            },
            {
                phase: 2,
                name: 'GCash Security Hardening',
                status: 'completed',
                description: 'Duplicate reference detection and file upload security',
                implemented: true,
                tested: true
            },
            {
                phase: 3,
                name: 'Critical Test Suite',
                status: 'completed',
                description: 'Comprehensive Jest test suite for race conditions and security',
                implemented: true,
                tested: true
            },
            {
                phase: 4,
                name: 'Timezone & Session Safety',
                status: 'completed',
                description: 'Timezone-aware booking and secure session management',
                implemented: true,
                tested: true
            },
            {
                phase: 5,
                name: 'Compliance & Accessibility',
                status: 'completed',
                description: 'GDPR/PH-DPA compliance and WCAG 2.1 AA accessibility',
                implemented: true,
                tested: true
            },
            {
                phase: 6,
                name: 'Deployment Verification',
                status: 'completed',
                description: 'Comprehensive deployment readiness checks and monitoring',
                implemented: true,
                tested: true
            }
        ];
        res.json({
            status: 'success',
            data: {
                totalPhases: 6,
                completedPhases: 6,
                features,
                implementationStatus: 'complete',
                productionReady: true
            }
        });
    }
    catch (error) {
        console.error('Features status error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get features status',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
exports.default = router;
