import { ReportHandler } from 'web-vitals';

const reportWebVitals = (onPerfEntry?: ReportHandler) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    // Use static import instead of dynamic import for better compatibility
    try {
      const { getCLS, getFID, getFCP, getLCP, getTTFB } = require('web-vitals');
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    } catch (error) {
      console.warn('Web vitals not available:', error);
    }
  }
};

export default reportWebVitals;
