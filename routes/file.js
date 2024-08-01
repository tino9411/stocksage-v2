const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

router.get('/api/files/:fileId', async (req, res) => {
  const { fileId } = req.params;
  try {
    const filePath = path.join(__dirname, '..', 'public', 'uploads', fileId);
    console.log(`Attempting to serve file: ${filePath}`);
    
    if (fs.existsSync(filePath)) {
      res.download(filePath, (err) => {
        if (err) {
          console.error(`Error sending file ${fileId}:`, err);
          res.status(500).send('Error downloading file');
        }
      });
    } else {
      console.log(`File not found: ${filePath}`);
      res.status(404).send('File not found');
    }
  } catch (error) {
    console.error('Error processing file download request:', error);
    res.status(500).send('Internal server error');
  }
});

module.exports = router;