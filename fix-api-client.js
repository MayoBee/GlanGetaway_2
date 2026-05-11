const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'ResortManagementBooking', 'hotel-booking-frontend', 'src', 'api-client.ts');

fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  // Normalize line endings
  const normalizedData = data.replace(/\r\n/g, '\n');

  // Original function with headers
  const originalFunction = `export const submitResortOwnerApplication = async (formData: FormData) => {
  const response = await axiosInstance.post("/api/resort-owner-application", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};`;

  // Corrected function without headers
  const correctedFunction = `export const submitResortOwnerApplication = async (formData: FormData) => {
  const response = await axiosInstance.post("/api/resort-owner-application", formData);
  return response.data;
};`;

  // Replace the function
  const updatedData = normalizedData.replace(originalFunction, correctedFunction);

  // Write back to file
  fs.writeFile(filePath, updatedData, 'utf8', (err) => {
    if (err) {
      console.error('Error writing file:', err);
      return;
    }

    // Verify the change
    fs.readFile(filePath, 'utf8', (err, verifyData) => {
      if (err) {
        console.error('Error verifying file:', err);
        return;
      }

      if (verifyData.includes(correctedFunction)) {
        console.log('Change verified: The headers object has been removed from submitResortOwnerApplication.');
      } else {
        console.log('Verification failed: The change was not applied correctly.');
      }
    });
  });
});