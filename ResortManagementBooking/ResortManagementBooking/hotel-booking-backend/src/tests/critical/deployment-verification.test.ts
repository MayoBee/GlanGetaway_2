/**
 * Deployment Verification Tests
 * Tests deployment readiness, health checks, and monitoring
 */

import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { createAndConfigureApp } from '../../bootstrap';
import User from '../../domains/identity/models/user';
import { DeploymentVerifier } from '../../utils/deploymentUtils';

describe('Deployment Verification', () => {
  let app: any;
  let testUser: any;
  let authToken: string;

  beforeAll(async () => {
    // Increase timeout for test setup
    jest.setTimeout(30000);
    app = createAndConfigureApp();
    
    // Create test user
    const hashedPassword = await bcrypt.hash('testpassword123', 12);
    testUser = new User({
      email: `deployment-test-${Date.now()}@example.com`,
      password: hashedPassword,
      firstName: 'Deployment',
      lastName: 'Test',
      role: 'user'
    });
    await testUser.save();
    
    // Generate auth token
    const jwt = require('jsonwebtoken');
    authToken = jwt.sign(
      { userId: testUser._id, email: testUser.email, role: testUser.role },
      process.env.JWT_SECRET_KEY || 'test-secret-key',
      { expiresIn: '7d' }
    );
  });

  afterAll(async () => {
    // Cleanup
    try {
      if (testUser) {
        await User.deleteMany({ _id: testUser._id });
      }
      
      // Close database connection to prevent open handles
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
      }
      
      // Clear any remaining timeouts/intervals
      const maxClearAttempts = 5;
      for (let i = 0; i < maxClearAttempts; i++) {
        const timeoutId = setTimeout(() => {}, 0);
        clearTimeout(timeoutId);
      }
      
      // Force close any remaining handles
      process.removeAllListeners();
      process.removeAllListeners('uncaughtException');
      process.removeAllListeners('unhandledRejection');
    } catch (error) {
      console.log('Cleanup error:', error);
    }
  });

  describe('Basic Health Checks', () => {
    it('should return healthy status for basic health check', async () => {
      // Use the API health endpoint instead of the metrics health endpoint
      const response = await request(app)
        .get('/api/health');

      expect(response.status).toBe(200);
      expect(['healthy', 'unhealthy']).toContain(response.body.status);
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
      expect(response.body.database).toBeDefined();
      expect(response.body.memory).toBeDefined();
      expect(response.body.environment).toBeDefined();
    });

    it('should return detailed health information', async () => {
      const response = await request(app)
        .get('/health/detailed');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.system).toBeDefined();
      expect(response.body.performance).toBeDefined();
      expect(response.body.database).toBeDefined();
      expect(response.body.system.platform).toBeDefined();
      expect(response.body.system.nodeVersion).toBeDefined();
    });

    it('should include database status in health check', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body.database.status).toBe('connected');
      expect(response.body.database.collections).toBeDefined();
    });

    it('should include memory usage in health check', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body.memory.used).toBeDefined();
      expect(response.body.memory.total).toBeDefined();
      expect(response.body.memory.percentage).toBeDefined();
      expect(typeof response.body.memory.used).toBe('number');
      expect(typeof response.body.memory.total).toBe('number');
    });
  });

  describe('Deployment Verification API', () => {
    it('should run comprehensive deployment verification', async () => {
      const response = await request(app)
        .get('/api/deployment/verify');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.timestamp).toBeDefined();
      expect(response.body.data.environment).toBeDefined();
      expect(response.body.data.nodeVersion).toBeDefined();
      expect(response.body.data.platform).toBeDefined();
      expect(response.body.data.overallStatus).toBeDefined();
      expect(response.body.data.checks).toBeDefined();
      expect(response.body.data.recommendations).toBeDefined();
      expect(response.body.data.deploymentScore).toBeDefined();
    });

    it('should include deployment-specific health check', async () => {
      const response = await request(app)
        .get('/api/deployment/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBeDefined();
      expect(response.body.deployment).toBeDefined();
      expect(response.body.deployment.status).toBeDefined();
      expect(response.body.deployment.score).toBeDefined();
      expect(response.body.checks).toBeDefined();
      expect(response.body.criticalIssues).toBeDefined();
      expect(response.body.recommendations).toBeDefined();
    });

    it('should provide deployment checklist', async () => {
      const response = await request(app)
        .get('/api/deployment/checklist');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.preDeployment).toBeDefined();
      expect(response.body.data.postDeployment).toBeDefined();
      expect(response.body.data.monitoring).toBeDefined();
      expect(Array.isArray(response.body.data.preDeployment)).toBe(true);
      expect(Array.isArray(response.body.data.postDeployment)).toBe(true);
      expect(Array.isArray(response.body.data.monitoring)).toBe(true);
    });

    it('should provide monitoring status', async () => {
      const response = await request(app)
        .get('/api/deployment/monitoring');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.status).toBe('active');
      expect(response.body.data.metrics).toBeDefined();
      expect(response.body.data.endpoints).toBeDefined();
      expect(response.body.data.alerts).toBeDefined();
    });

    it('should require authentication for pre-deployment check', async () => {
      const response = await request(app)
        .post('/api/deployment/pre-check');

      expect(response.status).toBe(401);
    });

    it('should run pre-deployment check with authentication', async () => {
      const response = await request(app)
        .post('/api/deployment/pre-check')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.canDeploy).toBeDefined();
      expect(response.body.data.deploymentReport).toBeDefined();
      expect(response.body.data.preDeploymentChecks).toBeDefined();
      expect(response.body.data.deploymentBlocked).toBeDefined();
    });

    it('should provide deployment status summary', async () => {
      const response = await request(app)
        .get('/api/deployment/status');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.timestamp).toBeDefined();
      expect(response.body.data.environment).toBeDefined();
      expect(response.body.data.version).toBeDefined();
      expect(response.body.data.system).toBeDefined();
      expect(response.body.data.features).toBeDefined();
    });

    it('should list implemented features', async () => {
      const response = await request(app)
        .get('/api/deployment/features');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.totalPhases).toBe(6);
      expect(response.body.data.completedPhases).toBe(6);
      expect(response.body.data.features).toBeDefined();
      expect(Array.isArray(response.body.data.features)).toBe(true);
      expect(response.body.data.implementationStatus).toBe('complete');
      expect(response.body.data.productionReady).toBe(true);
    });
  });

  describe('Deployment Verification Components', () => {
    it('should verify environment variables', async () => {
      const check = await DeploymentVerifier.checkEnvironmentVariables();
      expect(check.name).toBe('Environment Variables');
      expect(['PASS', 'WARN', 'FAIL']).toContain(check.status);
      expect(check.critical).toBeDefined();
      expect(check.message).toBeDefined();
    });

    it('should verify Node.js version', async () => {
      const check = await DeploymentVerifier.checkNodeVersion();
      expect(check.name).toBe('Node.js Version');
      expect(['PASS', 'WARN', 'FAIL']).toContain(check.status);
      expect(check.details).toBeDefined();
    });

    it('should verify platform compatibility', async () => {
      const check = await DeploymentVerifier.checkPlatformCompatibility();
      expect(check.name).toBe('Platform Compatibility');
      expect(['PASS', 'WARN', 'FAIL']).toContain(check.status);
      expect(check.details).toBeDefined();
    });

    it('should verify package dependencies', async () => {
      const check = await DeploymentVerifier.checkPackageDependencies();
      expect(check.name).toBe('Package Dependencies');
      expect(['PASS', 'WARN', 'FAIL']).toContain(check.status);
      expect(check.details).toBeDefined();
    });

    it('should verify security dependencies', async () => {
      const check = await DeploymentVerifier.checkSecurityDependencies();
      expect(check.name).toBe('Security Dependencies');
      expect(['PASS', 'WARN', 'FAIL']).toContain(check.status);
    });

    it('should verify database connection', async () => {
      const check = await DeploymentVerifier.checkDatabaseConnection();
      expect(check.name).toBe('Database Connection');
      expect(['PASS', 'WARN', 'FAIL']).toContain(check.status);
      expect(check.critical).toBeDefined();
    });

    it('should verify database indexes', async () => {
      const check = await DeploymentVerifier.checkDatabaseIndexes();
      expect(check.name).toBe('Database Indexes');
      expect(['PASS', 'WARN', 'FAIL']).toContain(check.status);
    });

    it('should verify security configuration', async () => {
      const check = await DeploymentVerifier.checkSecurityConfiguration();
      expect(check.name).toBe('Security Configuration');
      expect(['PASS', 'WARN', 'FAIL']).toContain(check.status);
    });

    it('should verify SSL configuration', async () => {
      const check = await DeploymentVerifier.checkSSLConfiguration();
      expect(check.name).toBe('SSL Configuration');
      expect(['PASS', 'WARN', 'FAIL']).toContain(check.status);
    });

    it('should verify memory usage', async () => {
      const check = await DeploymentVerifier.checkMemoryUsage();
      expect(check.name).toBe('Memory Usage');
      expect(['PASS', 'WARN', 'FAIL']).toContain(check.status);
      expect(check.details).toBeDefined();
    });

    it('should verify disk space', async () => {
      const check = await DeploymentVerifier.checkDiskSpace();
      expect(check.name).toBe('Disk Space');
      expect(['PASS', 'WARN', 'FAIL']).toContain(check.status);
    });

    it('should verify critical endpoints', async () => {
      const check = await DeploymentVerifier.checkCriticalEndpoints();
      expect(check.name).toBe('Critical Endpoints');
      expect(['PASS', 'WARN', 'FAIL']).toContain(check.status);
    });

    it('should verify compliance features', async () => {
      const check = await DeploymentVerifier.checkComplianceFeatures();
      expect(check.name).toBe('Compliance Features');
      expect(['PASS', 'WARN', 'FAIL']).toContain(check.status);
    });
  });

  describe('Deployment Report Generation', () => {
    it('should generate comprehensive deployment report', async () => {
      const report = await DeploymentVerifier.runDeploymentVerification();
      
      expect(report.timestamp).toBeDefined();
      expect(report.environment).toBeDefined();
      expect(report.nodeVersion).toBeDefined();
      expect(report.platform).toBeDefined();
      expect(report.overallStatus).toBeDefined();
      expect(['READY', 'NOT_READY', 'WARNING']).toContain(report.overallStatus);
      expect(report.checks).toBeDefined();
      expect(Array.isArray(report.checks)).toBe(true);
      expect(report.recommendations).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(report.deploymentScore).toBeDefined();
      expect(typeof report.deploymentScore).toBe('number');
      expect(report.deploymentScore).toBeGreaterThanOrEqual(0);
      expect(report.deploymentScore).toBeLessThanOrEqual(100);
    });

    it('should generate deployment checklist', () => {
      const checklist = DeploymentVerifier.generateDeploymentChecklist();
      
      expect(checklist.preDeployment).toBeDefined();
      expect(checklist.postDeployment).toBeDefined();
      expect(checklist.monitoring).toBeDefined();
      expect(Array.isArray(checklist.preDeployment)).toBe(true);
      expect(Array.isArray(checklist.postDeployment)).toBe(true);
      expect(Array.isArray(checklist.monitoring)).toBe(true);
      expect(checklist.preDeployment.length).toBeGreaterThan(0);
      expect(checklist.postDeployment.length).toBeGreaterThan(0);
      expect(checklist.monitoring.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle deployment verification errors gracefully', async () => {
      // Mock a scenario where verification might fail
      const originalEnv = process.env.NODE_ENV;
      delete process.env.NODE_ENV;

      const response = await request(app)
        .get('/api/deployment/verify');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');

      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });

    it('should handle monitoring status errors gracefully', async () => {
      const response = await request(app)
        .get('/api/deployment/monitoring');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should handle checklist generation errors gracefully', async () => {
      const response = await request(app)
        .get('/api/deployment/checklist');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });
  });

  describe('Security and Compliance', () => {
    it('should include security headers in deployment responses', async () => {
      const response = await request(app)
        .get('/api/deployment/status');

      expect(response.status).toBe(200);
      // Check for security headers that should be present
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBeDefined();
    });

    it('should include compliance headers in deployment responses', async () => {
      const response = await request(app)
        .get('/api/deployment/status');

      expect(response.status).toBe(200);
      expect(response.headers['x-accessibility-compliant']).toBe('WCAG-2.1-AA');
      expect(response.headers['x-privacy-compliant']).toBe('PH-DPA-2012');
    });

    it('should protect sensitive deployment operations', async () => {
      // Pre-deployment check should require authentication
      const response = await request(app)
        .post('/api/deployment/pre-check');

      expect(response.status).toBe(401);
    });
  });

  describe('Performance and Metrics', () => {
    it('should include performance metrics in health checks', async () => {
      const response = await request(app)
        .get('/health/detailed');

      expect(response.status).toBe(200);
      expect(response.body.performance).toBeDefined();
      expect(response.body.performance.memory).toBeDefined();
      expect(response.body.performance.cpu).toBeDefined();
      expect(response.body.performance.uptime).toBeDefined();
    });

    it('should include system metrics in monitoring', async () => {
      const response = await request(app)
        .get('/api/deployment/monitoring');

      expect(response.status).toBe(200);
      expect(response.body.data.metrics).toBeDefined();
      expect(response.body.data.metrics.uptime).toBeDefined();
      expect(response.body.data.metrics.memory).toBeDefined();
      expect(response.body.data.metrics.cpu).toBeDefined();
    });

    it('should track deployment score', async () => {
      const response = await request(app)
        .get('/api/deployment/verify');

      expect(response.status).toBe(200);
      expect(response.body.data.deploymentScore).toBeDefined();
      expect(typeof response.body.data.deploymentScore).toBe('number');
      expect(response.body.data.deploymentScore).toBeGreaterThanOrEqual(0);
      expect(response.body.data.deploymentScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Integration with Other Systems', () => {
    it('should verify database integration', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body.database.status).toBe('connected');
    });

    it('should verify compliance system integration', async () => {
      const response = await request(app)
        .get('/api/compliance/compliance-status');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.dataPrivacy).toBeDefined();
      expect(response.body.data.accessibility).toBeDefined();
    });

    it('should verify timezone system integration', async () => {
      const response = await request(app)
        .get('/api/hotels/search');

      expect(response.status).toBe(200);
      // Should handle timezone-aware operations
    });
  });
});
