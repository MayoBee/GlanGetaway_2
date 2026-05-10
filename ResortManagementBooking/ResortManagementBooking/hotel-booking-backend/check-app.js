const mongoose = require('mongoose');
const ResortOwnerApplication = require('./src/domains/identity/models/resort-owner-application');

mongoose.connect('mongodb://localhost:27017/hotel-booking')
  .then(async () => {
    const app = await ResortOwnerApplication.findOne({status: 'pending'}).sort({submittedAt: -1});
    if (app) {
      console.log('Application found:');
      console.log('dtiPermit:', app.dtiPermit);
      console.log('municipalEngineeringCert:', app.municipalEngineeringCert);
      console.log('municipalHealthCert:', app.municipalHealthCert);
      console.log('menroCert:', app.menroCert);
      console.log('bfpPermit:', app.bfpPermit);
      console.log('businessPermit:', app.businessPermit);
      console.log('nationalId:', app.nationalId);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });
