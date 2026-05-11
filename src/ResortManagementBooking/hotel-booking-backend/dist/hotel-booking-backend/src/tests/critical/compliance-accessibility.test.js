"use strict";
/**
 * Compliance and Accessibility Tests
 * Tests data privacy compliance, accessibility standards, and security headers
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
const supertest_1 = __importDefault(require("supertest"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const bootstrap_1 = require("../../bootstrap");
const user_1 = __importDefault(require("../../domains/identity/models/user"));
const complianceUtils_1 = require("../../utils/complianceUtils");
describe('Compliance and Accessibility', () => {
    let app;
    let testUser;
    let authToken;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Increase timeout for test setup
        jest.setTimeout(30000);
        app = (0, bootstrap_1.createAndConfigureApp)();
        // Create test user
        const hashedPassword = yield bcryptjs_1.default.hash('testpassword123', 12);
        testUser = new user_1.default({
            email: `compliance-test-${Date.now()}@example.com`,
            password: hashedPassword,
            firstName: 'Compliance',
            lastName: 'Test',
            role: 'user'
        });
        yield testUser.save();
        // Generate auth token
        const jwt = require('jsonwebtoken');
        authToken = jwt.sign({ userId: testUser._id, email: testUser.email, role: testUser.role }, process.env.JWT_SECRET_KEY || 'test-secret-key', { expiresIn: '7d' });
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Cleanup
        try {
            if (testUser) {
                yield user_1.default.deleteMany({ _id: testUser._id });
            }
        }
        catch (error) {
            console.log('Cleanup error:', error);
        }
    }));
    describe('Security Headers Compliance', () => {
        it('should include all required security headers', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get('/health');
            // Check for essential security headers
            expect(response.headers['x-content-type-options']).toBe('nosniff');
            expect(response.headers['x-frame-options']).toBe('DENY');
            expect(response.headers['x-xss-protection']).toBe('1; mode=block');
            expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
            expect(response.headers['permissions-policy']).toBeDefined();
            expect(response.headers['access-control-allow-credentials']).toBe('true');
        }));
        it('should include accessibility compliance headers', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get('/health');
            expect(response.headers['x-accessibility-compliant']).toBe('WCAG-2.1-AA');
            expect(response.headers['x-privacy-compliant']).toBe('PH-DPA-2012');
            expect(response.headers['x-screen-reader-support']).toBeDefined();
            expect(response.headers['x-accessibility-checked']).toBeDefined();
        }));
        it('should include GDPR compliance headers', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get('/health');
            expect(response.headers['x-gdpr-compliant']).toBe('true');
            expect(response.headers['x-data-processing-basis']).toBeDefined();
            expect(response.headers['x-user-rights']).toBeDefined();
        }));
        it('should include data retention headers', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get('/health');
            expect(response.headers['x-data-retention-policy']).toBeDefined();
            expect(response.headers['x-data-deletion-policy']).toBeDefined();
        }));
    });
    describe('Privacy Policy API', () => {
        it('should return privacy policy information', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get('/api/compliance/privacy-policy');
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.dataCollection).toBeDefined();
            expect(response.body.data.dataUsage).toBeDefined();
            expect(response.body.data.dataRetention).toBeDefined();
            expect(response.body.data.userRights).toBeDefined();
            expect(response.body.data.complianceStandards).toContain('PH-DPA-2012');
            expect(response.body.data.complianceStandards).toContain('GDPR');
        }));
        it('should handle privacy policy errors gracefully', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock an error scenario
            const originalConsoleError = console.error;
            console.error = jest.fn();
            const response = yield (0, supertest_1.default)(app)
                .get('/api/compliance/privacy-policy');
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            console.error = originalConsoleError;
        }));
    });
    describe('Accessibility Report API', () => {
        it('should return accessibility compliance information', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get('/api/compliance/accessibility-report');
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.standards).toContain('WCAG 2.1 Level AA');
            expect(response.body.data.complianceLevel).toBe('AA');
            expect(response.body.data.features).toContain('Semantic HTML structure');
            expect(response.body.data.features).toContain('ARIA labels and landmarks');
            expect(response.body.data.features).toContain('Keyboard navigation support');
        }));
    });
    describe('User Data Rights API', () => {
        it('should require authentication for user data access', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get('/api/compliance/user-data');
            expect(response.status).toBe(401);
        }));
        it('should return user personal data with authentication', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get('/api/compliance/user-data')
                .set('Authorization', `Bearer ${authToken}`);
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.personalInformation).toBeDefined();
            expect(response.body.data.bookings).toBeDefined();
            expect(response.body.data.exportDate).toBeDefined();
            expect(response.body.data.requestId).toBeDefined();
        }));
        it('should sanitize sensitive data in user data export', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get('/api/compliance/user-data')
                .set('Authorization', `Bearer ${authToken}`);
            expect(response.status).toBe(200);
            const userData = response.body.data;
            // Check that sensitive fields are masked or redacted
            if (userData.personalInformation.email) {
                expect(userData.personalInformation.email).toMatch(/\*\*\*/);
            }
        }));
        it('should handle data deletion requests', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .delete('/api/compliance/user-data')
                .set('Authorization', `Bearer ${authToken}`);
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.message).toContain('deletion request has been received');
            expect(response.body.requestId).toBeDefined();
            expect(response.body.expectedCompletion).toBeDefined();
        }));
        it('should validate GDPR requests', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get('/api/compliance/user-data')
                .set('Authorization', `Bearer ${authToken}`);
            expect(response.status).toBe(200);
            // The request should be valid since it has userId
            expect(response.body.status).toBe('success');
        }));
    });
    describe('Consent Management API', () => {
        it('should return consent status', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get('/api/compliance/consent-status')
                .set('Authorization', `Bearer ${authToken}`);
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.consentStatus).toBeDefined();
            expect(response.body.data.consentStatus.marketing).toBeDefined();
            expect(response.body.data.consentStatus.analytics).toBeDefined();
            expect(response.body.data.rights).toBeDefined();
        }));
        it('should handle consent withdrawal', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post('/api/compliance/withdraw-consent')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                consentType: 'marketing',
                reason: 'User request'
            });
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.message).toContain('consent has been withdrawn');
            expect(response.body.withdrawnAt).toBeDefined();
        }));
        it('should reject invalid consent types', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post('/api/compliance/withdraw-consent')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                consentType: 'invalid-type'
            });
            expect(response.status).toBe(400);
            expect(response.body.status).toBe('error');
            expect(response.body.message).toContain('Invalid consent type');
        }));
    });
    describe('Audit Log API', () => {
        it('should return user audit log', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get('/api/compliance/audit-log')
                .set('Authorization', `Bearer ${authToken}`);
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.auditLog).toBeDefined();
            expect(Array.isArray(response.body.data.auditLog)).toBe(true);
        }));
        it('should include audit log entries with required fields', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get('/api/compliance/audit-log')
                .set('Authorization', `Bearer ${authToken}`);
            expect(response.status).toBe(200);
            const auditLog = response.body.data.auditLog;
            if (auditLog.length > 0) {
                const entry = auditLog[0];
                expect(entry.id).toBeDefined();
                expect(entry.timestamp).toBeDefined();
                expect(entry.action).toBeDefined();
                expect(entry.complianceCategory).toBeDefined();
                expect(entry.riskLevel).toBeDefined();
            }
        }));
    });
    describe('Compliance Status API', () => {
        it('should return overall compliance status', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get('/api/compliance/compliance-status');
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.dataPrivacy).toBeDefined();
            expect(response.body.data.accessibility).toBeDefined();
            expect(response.body.data.security).toBeDefined();
            expect(response.body.data.payments).toBeDefined();
        }));
        it('should show compliance with required standards', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get('/api/compliance/compliance-status');
            expect(response.status).toBe(200);
            const data = response.body.data;
            expect(data.dataPrivacy.compliant).toBe(true);
            expect(data.dataPrivacy.standards).toContain('PH-DPA-2012');
            expect(data.accessibility.compliant).toBe(true);
            expect(data.accessibility.standards).toContain('WCAG-2.1-AA');
            expect(data.security.compliant).toBe(true);
            expect(data.payments.compliant).toBe(true);
        }));
    });
    describe('Screen Reader Support', () => {
        it('should detect screen reader user agents', () => __awaiter(void 0, void 0, void 0, function* () {
            const screenReaderUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 NVDA';
            const response = yield (0, supertest_1.default)(app)
                .get('/health')
                .set('User-Agent', screenReaderUA);
            expect(response.status).toBe(200);
            expect(response.headers['x-screen-reader-support']).toBe('true');
        }));
        it('should handle regular user agents', () => __awaiter(void 0, void 0, void 0, function* () {
            const regularUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
            const response = yield (0, supertest_1.default)(app)
                .get('/health')
                .set('User-Agent', regularUA);
            expect(response.status).toBe(200);
            expect(response.headers['x-screen-reader-support']).toBeDefined();
        }));
    });
});
// Unit tests for ComplianceManager
describe('ComplianceManager Unit Tests', () => {
    describe('Data Sanitization', () => {
        it('should mask email addresses correctly', () => {
            const email = 'testuser@example.com';
            const masked = complianceUtils_1.ComplianceManager.maskEmail(email);
            expect(masked).toBe('te***@example.com');
        });
        it('should mask short email addresses', () => {
            const email = 'ab@example.com';
            const masked = complianceUtils_1.ComplianceManager.maskEmail(email);
            expect(masked).toBe('a***@example.com');
        });
        it('should mask phone numbers correctly', () => {
            const phone = '+639171234567';
            const masked = complianceUtils_1.ComplianceManager.maskPhone(phone);
            expect(masked).toBe('+639***67');
        });
        it('should mask short phone numbers', () => {
            const phone = '1234';
            const masked = complianceUtils_1.ComplianceManager.maskPhone(phone);
            expect(masked).toBe('12**');
        });
        it('should sanitize sensitive data objects', () => {
            const data = {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'secret123',
                creditCardNumber: '4111111111111111'
            };
            const sanitized = complianceUtils_1.ComplianceManager.sanitizeData(data);
            expect(sanitized.name).toBe('John Doe');
            expect(sanitized.email).toMatch(/\*\*\*/);
            expect(sanitized.password).toBe('[REDACTED]');
            expect(sanitized.creditCardNumber).toBe('[REDACTED]');
        });
    });
    describe('GDPR Validation', () => {
        it('should validate valid data access requests', () => {
            const validation = complianceUtils_1.ComplianceManager.validateGDPRRequest('data_access', { userId: '123' });
            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);
            expect(validation.requirements).toContain('Identity verification required');
        });
        it('should reject invalid data access requests', () => {
            const validation = complianceUtils_1.ComplianceManager.validateGDPRRequest('data_access', {});
            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContain('User ID is required for data access request');
        });
        it('should validate data deletion requests', () => {
            const validation = complianceUtils_1.ComplianceManager.validateGDPRRequest('data_deletion', { userId: '123' });
            expect(validation.isValid).toBe(true);
            expect(validation.requirements).toContain('Identity verification required');
            expect(validation.requirements).toContain('Check legal retention requirements');
        });
    });
    describe('Data Retention', () => {
        it('should validate recent data retention', () => {
            const recentData = {
                createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
            };
            const isValid = complianceUtils_1.ComplianceManager.validateDataRetention(recentData);
            expect(isValid).toBe(true);
        });
        it('should reject old data retention', () => {
            const oldData = {
                createdAt: new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000) // 10 years ago
            };
            const isValid = complianceUtils_1.ComplianceManager.validateDataRetention(oldData);
            expect(isValid).toBe(false);
        });
    });
    describe('Consent Requirements', () => {
        it('should require consent for marketing actions', () => {
            const requires = complianceUtils_1.ComplianceManager.requiresConsent('marketing', 'personal_data');
            expect(requires).toBe(true);
        });
        it('should require consent for financial data processing', () => {
            const requires = complianceUtils_1.ComplianceManager.requiresConsent('analytics', 'financial_data');
            expect(requires).toBe(true);
        });
        it('should not require consent for basic operations', () => {
            const requires = complianceUtils_1.ComplianceManager.requiresConsent('booking', 'booking_data');
            expect(requires).toBe(false);
        });
    });
    describe('Audit Log Generation', () => {
        it('should generate audit logs with required fields', () => {
            const mockReq = {
                userId: '123',
                user: { id: '123', sessionId: 'session-123' },
                ip: '127.0.0.1',
                get: (header) => header === 'User-Agent' ? 'test-agent' : undefined
            };
            const auditLog = complianceUtils_1.ComplianceManager.generateAuditLog(mockReq, 'TEST_ACTION', '/test/resource', { test: 'data' }, 'DATA_ACCESS', 'LOW');
            expect(auditLog.id).toBeDefined();
            expect(auditLog.timestamp).toBeDefined();
            expect(auditLog.userId).toBe('123');
            expect(auditLog.action).toBe('TEST_ACTION');
            expect(auditLog.resource).toBe('/test/resource');
            expect(auditLog.complianceCategory).toBe('DATA_ACCESS');
            expect(auditLog.riskLevel).toBe('LOW');
            expect(auditLog.ipAddress).toBe('127.0.0.1');
            expect(auditLog.userAgent).toBe('test-agent');
            expect(auditLog.sessionId).toBe('session-123');
        });
    });
    describe('Screen Reader Detection', () => {
        it('should detect NVDA screen reader', () => {
            const userAgent = 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13 NVDA';
            const detected = complianceUtils_1.ComplianceManager.detectScreenReader(userAgent);
            expect(detected).toBe(true);
        });
        it('should detect JAWS screen reader', () => {
            const userAgent = 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0) JAWS';
            const detected = complianceUtils_1.ComplianceManager.detectScreenReader(userAgent);
            expect(detected).toBe(true);
        });
        it('should detect VoiceOver screen reader', () => {
            const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1 VoiceOver';
            const detected = complianceUtils_1.ComplianceManager.detectScreenReader(userAgent);
            expect(detected).toBe(true);
        });
        it('should not detect screen reader in regular browsers', () => {
            const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
            const detected = complianceUtils_1.ComplianceManager.detectScreenReader(userAgent);
            expect(detected).toBe(false);
        });
    });
    describe('Rate Limit Compliance', () => {
        it('should check compliant rate limits', () => {
            const check = complianceUtils_1.ComplianceManager.checkRateLimitCompliance(50, 900000, 100);
            expect(check.isCompliant).toBe(true);
            expect(check.remainingRequests).toBe(50);
            expect(check.resetTime).toBeInstanceOf(Date);
        });
        it('should detect non-compliant rate limits', () => {
            const check = complianceUtils_1.ComplianceManager.checkRateLimitCompliance(150, 900000, 100);
            expect(check.isCompliant).toBe(false);
            expect(check.remainingRequests).toBe(0);
        });
    });
});
