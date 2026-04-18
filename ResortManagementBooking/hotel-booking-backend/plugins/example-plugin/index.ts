import { Plugin } from '../../src/core/PluginManager';
import { Router } from 'express';

const ExamplePlugin: Plugin = {
  id: 'example-plugin',
  name: 'Example Plugin',
  version: '1.0.0',
  description: 'Example plugin demonstrating the plugin architecture',

  async install() {
    console.log('Example plugin installed successfully');
  },

  async enable() {
    console.log('Example plugin enabled');
  },

  async disable() {
    console.log('Example plugin disabled');
  },

  registerRoutes(router: Router) {
    router.get('/hello', (req, res) => {
      res.json({
        message: 'Hello from Example Plugin!',
        timestamp: new Date().toISOString()
      });
    });

    router.get('/status', (req, res) => {
      res.json({ status: 'running', version: this.version });
    });
  },

  getHooks() {
    return new Map([
      ['booking:afterCreate', async (booking: any) => {
        console.log(`Example Plugin: New booking created #${booking.id}`);
      }],
      ['booking:cancel', async (booking: any) => {
        console.log(`Example Plugin: Booking cancelled #${booking.id}`);
      }]
    ]);
  }
};

export default ExamplePlugin;
