const pdfParse = require('pdf-parse');

const parsePDF = async (buffer) => {
  try {
    console.log('Starting PDF parsing...');
    
    if (!buffer || buffer.length === 0) {
      throw new Error('Empty PDF buffer provided');
    }

    const data = await pdfParse(buffer);
    
    if (!data.text || data.text.trim().length === 0) {
      throw new Error('PDF appears to be empty or contains no extractable text');
    }

    console.log(`PDF parsed successfully. Pages: ${data.numpages}, Text length: ${data.text.length}`);
    
    // Clean and normalize the text
    let cleanedText = data.text
      .replace(/\n\s*\n/g, '\n') // Remove excessive newlines
      .replace(/\s+/g, ' ')      // Normalize whitespace
      .trim();

    return cleanedText;
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
};

module.exports = { parsePDF };
