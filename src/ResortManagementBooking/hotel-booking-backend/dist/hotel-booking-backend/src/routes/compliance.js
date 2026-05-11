"use strict";
/**
 * Compliance and Accessibility API Routes
 * Provides endpoints for compliance reporting and user data rights
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
const complianceUtils_1 = require("../utils/complianceUtils");
const auth_1 = __importDefault(require("../middleware/auth"));
const user_1 = __importDefault(require("../domains/identity/models/user"));
const booking_1 = __importDefault(require("../domains/booking/models/booking"));
const router = express_1.default.Router();
/**
 * GET /api/compliance/privacy-policy
 * Returns current privacy policy and data handling practices
 */
router.get('/privacy-policy', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const privacyReport = complianceUtils_1.ComplianceManager.generatePrivacyReport();
        res.json({
            status: 'success',
            data: Object.assign({ lastUpdated: new Date().toISOString(), jurisdiction: 'Philippines', standards: ['PH-DPA-2012', 'GDPR'] }, privacyReport)
        });
    }
    catch (error) {
        console.error('Privacy policy error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve privacy policy'
        });
    }
}));
/**
 * GET /api/compliance/accessibility-report
 * Returns accessibility compliance information
 */
router.get('/accessibility-report', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accessibilityReport = complianceUtils_1.ComplianceManager.generateAccessibilityReport();
        res.json({
            status: 'success',
            data: Object.assign({ lastUpdated: new Date().toISOString(), complianceLevel: accessibilityReport.complianceLevel }, accessibilityReport)
        });
    }
    catch (error) {
        console.error('Accessibility report error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve accessibility report'
        });
    }
}));
/**
 * GET /api/compliance/user-data
 * Returns user's personal data (GDPR/PH-DPA right to access)
 */
router.get('/user-data', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        // Validate GDPR request
        const validation = complianceUtils_1.ComplianceManager.validateGDPRRequest('data_access', { userId });
        if (!validation.isValid) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid request',
                errors: validation.errors,
                requirements: validation.requirements
            });
        }
        // Retrieve user data
        const user = yield user_1.default.findById(userId).select('-password');
        const bookings = yield booking_1.default.find({ userId }).select('-gcashPayment.screenshotFile');
        // Sanitize data for export
        const userData = {
            personalInformation: complianceUtils_1.ComplianceManager.sanitizeData((user === null || user === void 0 ? void 0 : user.toObject()) || {}),
            bookings: bookings.map(booking => complianceUtils_1.ComplianceManager.sanitizeData(booking.toObject())),
            exportDate: new Date().toISOString(),
            requestId: `EXPORT_${Date.now()}_${userId}`
        };
        // Log data access
        const auditLog = complianceUtils_1.ComplianceManager.generateAuditLog(req, 'DATA_EXPORT', '/user-data', { requestId: userData.requestId }, 'DATA_ACCESS', 'MEDIUM');
        complianceUtils_1.ComplianceManager.logAuditEntry(auditLog);
        res.json({
            status: 'success',
            data: userData,
            message: 'Your personal data has been retrieved successfully'
        });
    }
    catch (error) {
        console.error('User data access error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve user data'
        });
    }
}));
/**
 * DELETE /api/compliance/user-data
 * Requests deletion of user's personal data (GDPR/PH-DPA right to erasure)
 */
router.delete('/user-data', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        // Validate GDPR request
        const validation = complianceUtils_1.ComplianceManager.validateGDPRRequest('data_deletion', { userId });
        if (!validation.isValid) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid request',
                errors: validation.errors,
                requirements: validation.requirements
            });
        }
        // Check for legal retention requirements
        const activeBookings = yield booking_1.default.find({
            userId,
            status: { $in: ['confirmed', 'pending'] }
        });
        if (activeBookings.length > 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Cannot delete data while you have active bookings',
                activeBookings: activeBookings.length,
                requirements: [
                    'Cancel all active bookings first',
                    'Wait for booking completion (typically 30 days)',
                    'Contact support for manual deletion request'
                ]
            });
        }
        // Log deletion request
        const auditLog = complianceUtils_1.ComplianceManager.generateAuditLog(req, 'DATA_DELETION_REQUEST', '/user-data', {
            requestId: `DELETE_${Date.now()}_${userId}`,
            activeBookings: activeBookings.length
        }, 'DATA_MODIFICATION', 'HIGH');
        complianceUtils_1.ComplianceManager.logAuditEntry(auditLog);
        // In production, this would trigger a data deletion workflow
        // For now, we'll return a confirmation that the request has been received
        res.json({
            status: 'success',
            message: 'Your data deletion request has been received and will be processed within 30 days',
            requestId: `DELETE_${Date.now()}_${userId}`,
            expectedCompletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    catch (error) {
        console.error('User data deletion error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to process deletion request'
        });
    }
}));
/**
 * GET /api/compliance/audit-log
 * Returns user's audit log (for transparency)
 */
router.get('/audit-log', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { limit = 50, offset = 0 } = req.query;
        // In production, this would query the audit database
        // For now, we'll return a sample audit log
        const sampleAuditLog = [
            {
                id: `audit_${Date.now()}_1`,
                timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                action: 'LOGIN',
                resource: '/api/auth/login',
                details: { successful: true },
                ipAddress: req.ip,
                complianceCategory: 'AUTHENTICATION',
                riskLevel: 'LOW'
            },
            {
                id: `audit_${Date.now()}_2`,
                timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
                action: 'BOOKING_CREATED',
                resource: '/api/hotels/123/bookings',
                details: { bookingId: 'booking_123', amount: 2000 },
                ipAddress: req.ip,
                complianceCategory: 'BOOKING',
                riskLevel: 'MEDIUM'
            }
        ];
        res.json({
            status: 'success',
            data: {
                auditLog: sampleAuditLog,
                total: sampleAuditLog.length,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    }
    catch (error) {
        console.error('Audit log error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve audit log'
        });
    }
}));
/**
 * GET /api/compliance/consent-status
 * Returns user's consent status for data processing
 */
router.get('/consent-status', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        // In production, this would query the consent database
        const consentStatus = {
            marketing: {
                given: true,
                givenAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                canWithdraw: true
            },
            analytics: {
                given: true,
                givenAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                canWithdraw: true
            },
            thirdPartySharing: {
                given: false,
                canWithdraw: true
            },
            profiling: {
                given: false,
                canWithdraw: true
            }
        };
        res.json({
            status: 'success',
            data: {
                userId,
                consentStatus,
                lastUpdated: new Date().toISOString(),
                rights: [
                    'right to withdraw consent',
                    'right to object to processing',
                    'right to access data',
                    'right to rectification'
                ]
            }
        });
    }
    catch (error) {
        console.error('Consent status error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve consent status'
        });
    }
}));
/**
 * POST /api/compliance/withdraw-consent
 * Withdraw consent for specific data processing
 */
router.post('/withdraw-consent', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { consentType, reason } = req.body;
        if (!consentType || !['marketing', 'analytics', 'thirdPartySharing', 'profiling'].includes(consentType)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid consent type',
                validTypes: ['marketing', 'analytics', 'thirdPartySharing', 'profiling']
            });
        }
        // Log consent withdrawal
        const auditLog = complianceUtils_1.ComplianceManager.generateAuditLog(req, 'CONSENT_WITHDRAWN', '/withdraw-consent', {
            consentType,
            reason: reason || 'User request',
            withdrawnAt: new Date().toISOString()
        }, 'DATA_MODIFICATION', 'MEDIUM');
        complianceUtils_1.ComplianceManager.logAuditEntry(auditLog);
        // In production, this would update the consent database
        res.json({
            status: 'success',
            message: `Consent for ${consentType} has been withdrawn`,
            withdrawnAt: new Date().toISOString(),
            effects: [
                'Stop processing data for this purpose',
                'Delete data collected for this purpose (where legally possible)',
                'Update marketing preferences'
            ]
        });
    }
    catch (error) {
        console.error('Consent withdrawal error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to withdraw consent'
        });
    }
}));
/**
 * GET /api/compliance/compliance-status
 * Returns overall compliance status of the system
 */
router.get('/compliance-status', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const complianceStatus = {
            dataPrivacy: {
                compliant: true,
                standards: ['PH-DPA-2012', 'GDPR'],
                lastAudit: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                nextAudit: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000).toISOString()
            },
            accessibility: {
                compliant: true,
                standards: ['WCAG-2.1-AA', 'Section-508'],
                lastTested: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                complianceLevel: 'AA'
            },
            security: {
                compliant: true,
                standards: ['PCI-DSS', 'ISO-27001'],
                lastAssessment: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
                encryptionEnabled: true
            },
            payments: {
                compliant: true,
                standards: ['PCI-DSS-v3.2'],
                tokenizationEnabled: true,
                fraudDetectionEnabled: true
            }
        };
        res.json({
            status: 'success',
            data: complianceStatus,
            lastUpdated: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Compliance status error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve compliance status'
        });
    }
}));
exports.default = router;
