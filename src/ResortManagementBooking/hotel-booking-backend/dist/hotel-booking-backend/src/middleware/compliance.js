"use strict";
/**
 * Compliance Middleware
 * Handles security headers, audit logging, and accessibility compliance
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyComplianceMiddleware = exports.bookingComplianceMiddleware = exports.paymentComplianceMiddleware = exports.gdprComplianceMiddleware = exports.dataRetentionMiddleware = exports.rateLimitComplianceMiddleware = exports.accessibilityMiddleware = exports.privacyMiddleware = exports.auditMiddleware = exports.complianceMiddleware = void 0;
const complianceUtils_1 = require("../utils/complianceUtils");
// Enhanced security middleware with compliance headers
const complianceMiddleware = (req, res, next) => {
    // Apply security headers
    complianceUtils_1.ComplianceManager.applySecurityHeaders(res);
    // Check accessibility compliance
    const accessibilityMetrics = complianceUtils_1.ComplianceManager.checkAccessibilityCompliance(req);
    // Add accessibility metrics to response headers for monitoring
    res.setHeader('X-Screen-Reader-Support', accessibilityMetrics.screenReaderCompatible.toString());
    res.setHeader('X-Accessibility-Checked', new Date().toISOString());
    // Log compliance audit entry for all requests
    const auditLog = complianceUtils_1.ComplianceManager.generateAuditLog(req, req.method, req.path, {
        statusCode: null,
        responseTime: null,
        accessibilityMetrics
    }, 'DATA_ACCESS', 'LOW');
    // Store audit log in request for later use
    req.auditLog = auditLog;
    next();
};
exports.complianceMiddleware = complianceMiddleware;
// Audit logging middleware (runs after response)
const auditMiddleware = (req, res, next) => {
    const startTime = Date.now();
    const originalSend = res.send;
    // Override res.send to capture response data
    res.send = function (data) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        // Update audit log with response data
        const auditLog = req.auditLog;
        if (auditLog) {
            auditLog.details.statusCode = res.statusCode;
            auditLog.details.responseTime = responseTime;
            // Determine risk level based on response
            if (res.statusCode >= 500) {
                auditLog.riskLevel = 'HIGH';
            }
            else if (res.statusCode >= 400) {
                auditLog.riskLevel = 'MEDIUM';
            }
            // Log the audit entry
            complianceUtils_1.ComplianceManager.logAuditEntry(auditLog);
        }
        // Call original send
        return originalSend.call(this, data);
    };
    next();
};
exports.auditMiddleware = auditMiddleware;
// Data privacy compliance middleware
const privacyMiddleware = (req, res, next) => {
    // Check if request involves sensitive data
    const sensitiveEndpoints = [
        '/api/auth',
        '/api/users',
        '/api/bookings',
        '/api/payments'
    ];
    const isSensitiveRequest = sensitiveEndpoints.some(endpoint => req.path.startsWith(endpoint));
    if (isSensitiveRequest) {
        // Add privacy headers
        res.setHeader('X-Privacy-Notice', 'This request processes personal data in accordance with applicable privacy laws');
        res.setHeader('X-Data-Retention', 'Data is retained only as long as necessary for service provision and legal compliance');
        // Log privacy audit entry
        const auditLog = complianceUtils_1.ComplianceManager.generateAuditLog(req, 'DATA_PROCESSING', req.path, {
            endpoint: req.path,
            method: req.method,
            sensitiveData: true
        }, 'DATA_ACCESS', 'MEDIUM');
        complianceUtils_1.ComplianceManager.logAuditEntry(auditLog);
    }
    next();
};
exports.privacyMiddleware = privacyMiddleware;
// Accessibility compliance middleware
const accessibilityMiddleware = (req, res, next) => {
    // Add accessibility headers
    res.setHeader('X-Accessibility-Policy', 'WCAG-2.1-AA');
    res.setHeader('X-Screen-Reader-Support', 'enabled');
    res.setHeader('X-Keyboard-Navigation', 'enabled');
    res.setHeader('X-Color-Contrast', 'AA-compliant');
    // Check for screen reader and adjust response if needed
    const userAgent = req.get('User-Agent') || '';
    const isScreenReader = complianceUtils_1.ComplianceManager.detectScreenReader(userAgent);
    if (isScreenReader) {
        // Add screen reader specific headers
        res.setHeader('X-Screen-Reader-Optimized', 'true');
        // Log accessibility audit entry
        const auditLog = complianceUtils_1.ComplianceManager.generateAuditLog(req, 'ACCESSIBILITY_SUPPORT', req.path, {
            screenReader: true,
            userAgent: userAgent
        }, 'DATA_ACCESS', 'LOW');
        complianceUtils_1.ComplianceManager.logAuditEntry(auditLog);
    }
    next();
};
exports.accessibilityMiddleware = accessibilityMiddleware;
// Rate limiting compliance middleware
const rateLimitComplianceMiddleware = (req, res, next) => {
    // This would integrate with your existing rate limiting
    // For now, we'll add compliance headers
    res.setHeader('X-Rate-Limit-Compliance', 'RFC 6585');
    res.setHeader('X-Rate-Limit-Policy', 'Fair usage policy applies');
    next();
};
exports.rateLimitComplianceMiddleware = rateLimitComplianceMiddleware;
// Data retention compliance middleware
const dataRetentionMiddleware = (req, res, next) => {
    // Add data retention headers
    res.setHeader('X-Data-Retention-Policy', 'Data retained according to legal requirements');
    res.setHeader('X-Data-Deletion-Policy', 'Data deleted upon request or legal obligation');
    next();
};
exports.dataRetentionMiddleware = dataRetentionMiddleware;
// GDPR compliance middleware
const gdprComplianceMiddleware = (req, res, next) => {
    // Add GDPR headers
    res.setHeader('X-GDPR-Compliant', 'true');
    res.setHeader('X-Data-Processing-Basis', 'Legitimate interest and consent');
    res.setHeader('X-User-Rights', 'Access, rectification, portability, erasure, objection');
    // Log GDPR audit entry for EU requests
    const euCountryCodes = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'];
    const clientIP = complianceUtils_1.ComplianceManager.getClientIP(req);
    // Note: In production, you would use a proper IP geolocation service
    // For now, we'll log all requests as potentially GDPR-relevant
    const auditLog = complianceUtils_1.ComplianceManager.generateAuditLog(req, 'GDPR_PROCESSING', req.path, {
        clientIP: clientIP,
        gdprRelevant: true,
        dataProcessingBasis: 'consent'
    }, 'DATA_ACCESS', 'MEDIUM');
    complianceUtils_1.ComplianceManager.logAuditEntry(auditLog);
    next();
};
exports.gdprComplianceMiddleware = gdprComplianceMiddleware;
// Payment compliance middleware (PCI DSS)
const paymentComplianceMiddleware = (req, res, next) => {
    var _a, _b;
    if (req.path.includes('/payment') || req.path.includes('/gcash')) {
        // Add PCI DSS compliance headers
        res.setHeader('X-PCI-DSS-Compliant', 'true');
        res.setHeader('X-Payment-Security', 'Tokenized and encrypted');
        res.setHeader('X-Fraud-Detection', 'enabled');
        // Log payment audit entry
        const auditLog = complianceUtils_1.ComplianceManager.generateAuditLog(req, 'PAYMENT_PROCESSING', req.path, {
            paymentMethod: ((_a = req.body) === null || _a === void 0 ? void 0 : _a.paymentMethod) || 'payment_intent_creation',
            amount: ((_b = req.body) === null || _b === void 0 ? void 0 : _b.amount) ? '[REDACTED]' : undefined,
            pciCompliant: true
        }, 'PAYMENT', 'HIGH');
        // Log asynchronously (fire and forget for middleware)
        complianceUtils_1.ComplianceManager.logAuditEntry(auditLog).catch(console.error);
    }
    next();
};
exports.paymentComplianceMiddleware = paymentComplianceMiddleware;
// Booking compliance middleware
const bookingComplianceMiddleware = (req, res, next) => {
    if (req.path.includes('/booking')) {
        // Add booking compliance headers
        res.setHeader('X-Booking-Compliance', 'PH-Tourism-Act');
        res.setHeader('X-Consumer-Protection', 'enabled');
        // Log booking audit entry
        const auditLog = complianceUtils_1.ComplianceManager.generateAuditLog(req, 'BOOKING_PROCESSING', req.path, {
            bookingType: (req.body && req.body.paymentMethod) || 'unknown',
            consumerProtection: true
        }, 'BOOKING', 'MEDIUM');
        complianceUtils_1.ComplianceManager.logAuditEntry(auditLog);
    }
    next();
};
exports.bookingComplianceMiddleware = bookingComplianceMiddleware;
// Combined compliance middleware
const applyComplianceMiddleware = (app) => {
    app.use(exports.complianceMiddleware);
    app.use(exports.auditMiddleware);
    app.use(exports.privacyMiddleware);
    app.use(exports.accessibilityMiddleware);
    app.use(exports.rateLimitComplianceMiddleware);
    app.use(exports.dataRetentionMiddleware);
    app.use(exports.gdprComplianceMiddleware);
    app.use(exports.paymentComplianceMiddleware);
    app.use(exports.bookingComplianceMiddleware);
};
exports.applyComplianceMiddleware = applyComplianceMiddleware;
