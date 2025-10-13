import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  FileText,
  Eye,
  Trash2
} from 'lucide-react';

const StudentImportPage = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [importStatus, setImportStatus] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileUpload = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const parseFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target.result;
      const lines = data.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const parsedData = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim());
        const row = {};
        headers.forEach((header, i) => {
          row[header] = values[i] || '';
        });
        row._rowIndex = index + 2; // Excel row number
        return row;
      }).filter(row => Object.values(row).some(value => value !== ''));

      setPreviewData(parsedData);
      validateData(parsedData);
      setShowPreview(true);
    };
    reader.readAsText(file);
  };

  const validateData = (data) => {
    const errors = [];
    const requiredFields = ['Student ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Course', 'Branch', 'Semester', 'Academic Year'];
    
    data.forEach((row, index) => {
      requiredFields.forEach(field => {
        if (!row[field] || row[field].trim() === '') {
          errors.push({
            row: row._rowIndex,
            field,
            message: `${field} is required`
          });
        }
      });

      // Email validation
      if (row.Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.Email)) {
        errors.push({
          row: row._rowIndex,
          field: 'Email',
          message: 'Invalid email format'
        });
      }

      // Phone validation
      if (row.Phone && !/^[0-9]{10}$/.test(row.Phone.replace(/\D/g, ''))) {
        errors.push({
          row: row._rowIndex,
          field: 'Phone',
          message: 'Phone number must be 10 digits'
        });
      }
    });

    setValidationErrors(errors);
  };

  const downloadTemplate = () => {
    const templateData = [
      'Student ID,First Name,Last Name,Email,Phone,Date of Birth,Course,Branch,Semester,Academic Year,Address,City,State,Pincode,Guardian Name,Guardian Phone',
      'STU001,John,Doe,john.doe@example.com,9876543210,2000-01-15,B.Tech,Computer Science,3,2023-24,123 Main St,New York,NY,10001,Robert Doe,9876543211',
      'STU002,Jane,Smith,jane.smith@example.com,9876543212,2000-02-20,B.Tech,Information Technology,3,2023-24,456 Oak Ave,Los Angeles,CA,90210,Mary Smith,9876543213'
    ];

    const blob = new Blob([templateData.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (validationErrors.length > 0) {
      alert('Please fix validation errors before importing');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'students');

      const response = await fetch('/api/erp/import/students', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (response.ok) {
        setImportStatus({
          type: 'success',
          message: `Successfully imported ${result.imported} students`,
          details: result
        });
        setShowPreview(false);
        setFile(null);
        setPreviewData([]);
        setValidationErrors([]);
      } else {
        setImportStatus({
          type: 'error',
          message: result.message || 'Import failed',
          details: result
        });
      }
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: 'Import failed: ' + error.message,
        details: null
      });
    } finally {
      setUploading(false);
    }
  };

  const clearData = () => {
    setFile(null);
    setPreviewData([]);
    setValidationErrors([]);
    setShowPreview(false);
    setImportStatus(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Data Import</h1>
              <p className="text-gray-600 dark:text-gray-400">Import student data from Excel/CSV files</p>
            </div>
            <button
              onClick={downloadTemplate}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Template</span>
            </button>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
            <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Upload Student Data File
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Select an Excel (.xlsx) or CSV file containing student information
            </p>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors cursor-pointer inline-flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Choose File</span>
            </label>
            {file && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Selected: {file.name}
                </p>
                <button
                  onClick={clearData}
                  className="text-red-600 hover:text-red-700 text-sm mt-2"
                >
                  Remove File
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Import Status */}
        {importStatus && (
          <div className={`rounded-lg p-4 ${
            importStatus.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700' 
              : 'bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700'
          }`}>
            <div className="flex items-center space-x-2">
              {importStatus.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <p className={`font-medium ${
                importStatus.type === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
              }`}>
                {importStatus.message}
              </p>
            </div>
            {importStatus.details && (
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                <p>Imported: {importStatus.details.imported || 0}</p>
                <p>Failed: {importStatus.details.failed || 0}</p>
                <p>Skipped: {importStatus.details.skipped || 0}</p>
              </div>
            )}
          </div>
        )}

        {/* Preview Section */}
        {showPreview && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Data Preview ({previewData.length} records)
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={clearData}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear</span>
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={uploading || validationErrors.length > 0}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span>{uploading ? 'Importing...' : 'Import Data'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="p-4 bg-red-50 dark:bg-red-900 border-b border-red-200 dark:border-red-700">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <h4 className="font-medium text-red-800 dark:text-red-200">
                    Validation Errors ({validationErrors.length})
                  </h4>
                </div>
                <div className="max-h-32 overflow-y-auto">
                  {validationErrors.map((error, index) => (
                    <p key={index} className="text-sm text-red-700 dark:text-red-300">
                      Row {error.row}: {error.message}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Row
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Student ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {previewData.slice(0, 10).map((row, index) => {
                    const hasErrors = validationErrors.some(error => error.row === row._rowIndex);
                    return (
                      <tr key={index} className={hasErrors ? 'bg-red-50 dark:bg-red-900' : ''}>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {row._rowIndex}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {row['Student ID']}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {row['First Name']} {row['Last Name']}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {row.Email}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {row.Course} - {row.Branch}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {hasErrors ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3 mr-1" />
                              Error
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Valid
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {previewData.length > 10 && (
                <div className="p-4 text-center text-sm text-gray-600 dark:text-gray-400">
                  Showing first 10 records of {previewData.length} total records
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
            Import Instructions
          </h3>
          <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <p>• Download the template file to ensure proper formatting</p>
            <p>• Required fields: Student ID, First Name, Last Name, Email, Phone, Course, Branch, Semester, Academic Year</p>
            <p>• Email addresses must be unique and valid</p>
            <p>• Phone numbers should be 10 digits</p>
            <p>• Date format should be YYYY-MM-DD</p>
            <p>• Maximum file size: 10MB</p>
            <p>• Supported formats: .xlsx, .xls, .csv</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentImportPage;
