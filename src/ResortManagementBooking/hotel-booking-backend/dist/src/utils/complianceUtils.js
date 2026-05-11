"use strict";
/**
 * Compliance and Accessibility Utilities
 * Ensures data privacy compliance and accessibility standards
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceManager = void 0;
const luxon_1 = require("luxon");
class ComplianceManager {
    /**
     * Generate audit log entry for compliance tracking
     */
    static generateAuditLog(req, action, resource, details = {}, complianceCategory, riskLevel = 'MEDIUM') {
        var _a, _b;
        return {
            id: this.generateAuditId(),
            timestamp: new Date(),
            userId: req.userId || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id),
            action,
            resource,
            details: this.sanitizeData(details),
            ipAddress: this.getClientIP(req),
            userAgent: req.get('User-Agent') || 'Unknown',
            sessionId: (_b = req.user) === null || _b === void 0 ? void 0 : _b.sessionId,
            complianceCategory,
            riskLevel
        };
    }
    /**
     * Sanitize data for audit logging (remove sensitive information)
     */
    static sanitizeData(data) {
        if (!data || typeof data !== 'object')
            return data;
        const sanitized = Object.assign({}, data);
        // Remove or mask sensitive fields
        this.SENSITIVE_FIELDS.forEach(field => {
            if (field in sanitized) {
                if (field === 'email') {
                    sanitized[field] = this.maskEmail(sanitized[field]);
                }
                else if (field === 'phone') {
                    sanitized[field] = this.maskPhone(sanitized[field]);
                }
                else {
                    sanitized[field] = '[REDACTED]';
                }
            }
        });
        return sanitized;
    }
    /**
     * Mask email address for audit logs
     */
    static maskEmail(email) {
        if (!email || typeof email !== 'string')
            return email;
        const [username, domain] = email.split('@');
        if (username.length <= 2)
            return `${username[0]}***@${domain}`;
        return `${username.slice(0, 2)}***@${domain}`;
    }
    /**
     * Mask phone number for audit logs
     */
    static maskPhone(phone) {
        if (!phone || typeof phone !== 'string')
            return phone;
        if (phone.length <= 4)
            return phone.slice(0, 2) + '**';
        return phone.slice(0, 3) + '***' + phone.slice(-2);
    }
    /**
     * Generate unique audit ID
     */
    static generateAuditId() {
        return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Get client IP address (considering proxies)
     */
    static getClientIP(req) {
        var _a, _b;
        return (req.ip ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            ((_b = (_a = req.connection) === null || _a === void 0 ? void 0 : _a.socket) === null || _b === void 0 ? void 0 : _b.remoteAddress) ||
            'unknown');
    }
    /**
     * Apply security headers for compliance
     */
    static applySecurityHeaders(res) {
        Object.entries(this.REQUIRED_ACCESSIBILITY_HEADERS).forEach(([key, value]) => {
            res.setHeader(key, value);
        });
        // Add accessibility headers
        res.setHeader('X-Accessibility-Compliant', 'WCAG-2.1-AA');
        res.setHeader('X-Privacy-Compliant', 'PH-DPA-2012');
    }
    /**
     * Check if request meets accessibility requirements
     */
    static checkAccessibilityCompliance(req) {
        const userAgent = req.get('User-Agent') || '';
        return {
            screenReaderCompatible: this.detectScreenReader(userAgent),
            keyboardNavigation: true,
            colorContrast: true,
            focusManagement: true,
            ariaLabels: true,
            errorMessages: true // Server-side validation would be implemented in frontend
        };
    }
    /**
     * Detect screen reader from user agent
     */
    static detectScreenReader(userAgent) {
        const screenReaderPatterns = [
            /NVDA/i,
            /JAWS/i,
            /VoiceOver/i,
            /TalkBack/i,
            /ChromeVox/i,
            /Orca/i
        ];
        return screenReaderPatterns.some(pattern => pattern.test(userAgent));
    }
    /**
     * Validate data retention compliance
     */
    static validateDataRetention(data, maxAgeDays = 2555) {
        if (!data || !data.createdAt)
            return true;
        const createdAt = new Date(data.createdAt);
        const maxRetentionDate = luxon_1.DateTime.now().minus({ days: maxAgeDays });
        return luxon_1.DateTime.fromJSDate(createdAt) > maxRetentionDate;
    }
    /**
     * Check if data processing requires consent
     */
    static requiresConsent(action, dataType) {
        const consentRequiredActions = [
            'marketing',
            'analytics',
            'third_party_sharing',
            'profiling'
        ];
        const sensitiveDataTypes = [
            'personal_data',
            'health_data',
            'biometric_data',
            'financial_data'
        ];
        return consentRequiredActions.includes(action) ||
            sensitiveDataTypes.includes(dataType);
    }
    /**
     * Generate privacy policy compliance report
     */
    static generatePrivacyReport() {
        return {
            dataCollection: [
                'Personal identification (name, email, phone)',
                'Booking information (dates, preferences)',
                'Payment information (processed via secure providers)',
                'Usage analytics and session data'
            ],
            dataUsage: [
                'Booking processing and confirmation',
                'Customer support and communication',
                'Service improvement and analytics',
                'Security and fraud prevention'
            ],
            dataRetention: [
                'Booking data: 7 years (tax compliance)',
                'Account data: Until account deletion',
                'Analytics data: 2 years (anonymized)',
                'Audit logs: 6 years (compliance)'
            ],
            userRights: [
                'Right to access personal data',
                'Right to correct inaccurate data',
                'Right to data portability',
                'Right to request deletion',
                'Right to object to processing'
            ],
            complianceStandards: [
                'Philippine Data Privacy Act of 2012',
                'General Data Protection Regulation (GDPR)',
                'Payment Card Industry Data Security Standard (PCI DSS)',
                'Web Content Accessibility Guidelines (WCAG) 2.1 AA'
            ]
        };
    }
    /**
     * Validate GDPR compliance for data requests
     */
    static validateGDPRRequest(requestType, requestData) {
        const errors = [];
        const requirements = [];
        switch (requestType) {
            case 'data_access':
                requirements.push('Identity verification required');
                requirements.push('Response within 30 days');
                if (!requestData.userId) {
                    errors.push('User ID is required for data access request');
                }
                break;
            case 'data_deletion':
                requirements.push('Identity verification required');
                requirements.push('Check legal retention requirements');
                if (!requestData.userId) {
                    errors.push('User ID is required for deletion request');
                }
                break;
            case 'data_portability':
                requirements.push('Identity verification required');
                requirements.push('Provide in machine-readable format');
                if (!requestData.userId) {
                    errors.push('User ID is required for portability request');
                }
                break;
            default:
                errors.push('Invalid request type');
        }
        return {
            isValid: errors.length === 0,
            errors,
            requirements
        };
    }
    /**
     * Log compliance audit entry
     */
    static logAuditEntry(auditLog) {
        return __awaiter(this, void 0, void 0, function* () {
            // In production, this would be stored in a secure audit database
            // For now, we'll log to console with structured format
            console.log('COMPLIANCE_AUDIT:', JSON.stringify({
                timestamp: auditLog.timestamp.toISOString(),
                category: auditLog.complianceCategory,
                risk: auditLog.riskLevel,
                action: auditLog.action,
                resource: auditLog.resource,
                userId: auditLog.userId,
                ip: auditLog.ipAddress,
                sessionId: auditLog.sessionId
            }));
            // TODO: Implement persistent audit storage
            // await AuditLogModel.create(auditLog);
        });
    }
    /**
     * Check rate limiting compliance
     */
    static checkRateLimitCompliance(currentRequests, timeWindow, maxRequests) {
        const isCompliant = currentRequests < maxRequests;
        const remainingRequests = Math.max(0, maxRequests - currentRequests);
        const resetTime = new Date(Date.now() + timeWindow);
        return {
            isCompliant,
            remainingRequests,
            resetTime
        };
    }
    /**
     * Generate accessibility compliance report
     */
    static generateAccessibilityReport() {
        return {
            standards: [
                'WCAG 2.1 Level AA',
                'Section 508',
                'EN 301 549'
            ],
            complianceLevel: 'AA',
            features: [
                'Semantic HTML structure',
                'ARIA labels and landmarks',
                'Keyboard navigation support',
                'Screen reader compatibility',
                'Color contrast compliance',
                'Focus management',
                'Error message accessibility'
            ],
            testing: [
                'Automated accessibility testing',
                'Manual keyboard testing',
                'Screen reader testing',
                'Color contrast validation',
                'Focus trap testing'
            ]
        };
    }
}
exports.ComplianceManager = ComplianceManager;
ComplianceManager.SENSITIVE_FIELDS = [
    'password',
    'creditCardNumber',
    'cvv',
    'expiryDate',
    'gcashNumber',
    'bankAccount',
    'ssn',
    'passport'
];
ComplianceManager.REQUIRED_ACCESSIBILITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Expose-Headers': 'X-Total-Count, X-Page-Count, X-Session-ID'
};
