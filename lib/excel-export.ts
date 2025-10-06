import * as XLSX from 'xlsx';
import { EditableISO27001Control } from './csv-parser';

export interface ExportUserData {
  id: string;
  name: string;
  email: string;
}

export interface ExportApprovalData {
  user: ExportUserData;
  title: string;
}

export function exportToExcel(controls: EditableISO27001Control[], companyName: string = '[Company]', filename: string = 'Statement_of_Applicability_ISO_27001.xlsx', preparedBy?: ExportUserData, approvedBy?: ExportApprovalData) {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Get current date for document metadata
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Prepare the data for the worksheet
  const worksheetData = [
    // Header row 1 - Document title
    [`${companyName} : Statement of Applicability | ISO 27001:2022 Annex A`],
    // Header row 2 - Classification
    ['Classification: Confidential'],
    // Empty row
    [''],
    // Document metadata section
    ['Document Information:', '', '', 'Version', 'Prepared By', 'Approved By', 'Approval Date'],
    ['', '', '', '1.0', preparedBy ? `${preparedBy.name}, Engagement Lead - ISO 27001 (External/Comp AI)` : 'Name, title', approvedBy ? `${approvedBy.user.name}, ${approvedBy.title}` : 'Name, title', currentDate],
    // Empty row
    [''],
    // Scope and context section
    ['Scope and Context:'],
    ['This Statement of Applicability (SoA) identifies the controls from ISO/IEC 27001:2022 Annex A'],
    ['that are applicable to our Information Security Management System (ISMS).'],
    ['Controls marked as "Not Applicable" include justification for their exclusion.'],
    // Empty row
    [''],
    // Control assessment criteria
    ['Assessment Criteria:'],
    ['Driver why control is required:', '', '', 'Business', 'Risk', 'Legal', 'Contract'],
    // Empty row
    [''],
    // Column headers
    [
      'ISO 27001 Annex A Control',
      'Title', 
      'Control Objective',
      'Driver why control is required',
      '',
      '',
      '',
      'Is this Applicable?',
      'Date Last Assessed',
      'Why is this not applicable?'
    ],
    // Sub-headers for drivers
    ['', '', '', 'Business', 'Risk', 'Legal', 'Contract', '', '', ''],
    // Empty row
    [''],
    // Section header
    ['5', 'Organisational Controls', '', '', '', '', '', '', '', '']
  ];

  // Add control data
  controls.forEach(control => {
    // If control is not applicable, all drivers should be "No"
    if (control.isApplicable === 'Not Applicable') {
      worksheetData.push([
        control.controlNumber,
        control.title,
        control.objective,
        'No', // Business driver - No because not applicable
        'No', // Risk driver - No because not applicable
        'No', // Legal driver - No because not applicable
        'No', // Contract driver - No because not applicable
        control.isApplicable,
        control.dateLastAssessed || '',
        control.notApplicableReason || ''
      ]);
    } else {
      // For applicable controls, provide fallback for legacy controls that don't have drivers property
      const drivers = control.drivers || {
        business: true,  // Default to Yes for business driver
        risk: true,      // Default to Yes for risk driver  
        legal: control.controlNumber.startsWith('5.31') || control.controlNumber.startsWith('5.32') || control.controlNumber.startsWith('5.34'), // Legal controls
        contract: false  // Default to No for contract driver
      };
      
      worksheetData.push([
        control.controlNumber,
        control.title,
        control.objective,
        drivers.business ? 'Yes' : 'No',
        drivers.risk ? 'Yes' : 'No',
        drivers.legal ? 'Yes' : 'No',
        drivers.contract ? 'Yes' : 'No',
        control.isApplicable,
        control.dateLastAssessed || '',
        control.notApplicableReason || ''
      ]);
    }
  });

  // Create worksheet from data
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // Set column widths for better formatting
  const columnWidths = [
    { wch: 8 },  // Control number
    { wch: 35 }, // Title
    { wch: 50 }, // Objective
    { wch: 12 }, // Business driver
    { wch: 10 }, // Risk driver
    { wch: 10 }, // Legal driver
    { wch: 12 }, // Contract driver
    { wch: 15 }, // Applicable
    { wch: 15 }, // Date
    { wch: 40 }  // Reason
  ];
  worksheet['!cols'] = columnWidths;

  // Merge cells for header and sections
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }, // Company header
    { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } }, // Classification
    { s: { r: 3, c: 0 }, e: { r: 3, c: 2 } }, // Document Information label
    { s: { r: 7, c: 0 }, e: { r: 7, c: 9 } }, // Scope and Context label
    { s: { r: 8, c: 0 }, e: { r: 8, c: 9 } }, // Scope description line 1
    { s: { r: 9, c: 0 }, e: { r: 9, c: 9 } }, // Scope description line 2
    { s: { r: 10, c: 0 }, e: { r: 10, c: 9 } }, // Scope description line 3
    { s: { r: 12, c: 0 }, e: { r: 12, c: 2 } }, // Assessment Criteria label
    { s: { r: 13, c: 0 }, e: { r: 13, c: 2 } }, // Driver label
    { s: { r: 15, c: 3 }, e: { r: 15, c: 6 } }, // Driver why control is required header merge
  ];

  // Style the headers
  const headerStyle = {
    font: { bold: true, sz: 12 },
    alignment: { horizontal: 'center', vertical: 'center' },
    fill: { fgColor: { rgb: 'E6F3FF' } },
    border: {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    }
  };

  // Apply styles to column header rows (main headers and sub-headers)
  for (let col = 0; col < 10; col++) {
    // Main column headers (row 15)
    const cellRef1 = XLSX.utils.encode_cell({ r: 15, c: col });
    if (!worksheet[cellRef1]) worksheet[cellRef1] = { v: '' };
    worksheet[cellRef1].s = headerStyle;
    
    // Sub-headers (row 16)
    const cellRef2 = XLSX.utils.encode_cell({ r: 16, c: col });
    if (!worksheet[cellRef2]) worksheet[cellRef2] = { v: '' };
    worksheet[cellRef2].s = headerStyle;
  }

  // Style metadata section headers
  const metadataHeaderStyle = {
    font: { bold: true, sz: 11 },
    alignment: { horizontal: 'left', vertical: 'center' }
  };

  // Apply metadata header styles
  const metadataHeaders = [3, 7, 12, 13]; // Rows with section headers
  metadataHeaders.forEach(row => {
    const cellRef = XLSX.utils.encode_cell({ r: row, c: 0 });
    if (!worksheet[cellRef]) worksheet[cellRef] = { v: '' };
    worksheet[cellRef].s = metadataHeaderStyle;
  });

  // Style data rows with borders
  const dataStyle = {
    border: {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    },
    alignment: { vertical: 'top', wrapText: true }
  };

  // Apply borders to data rows (starting from row 18 - after headers)
  for (let row = 18; row < worksheetData.length; row++) {
    for (let col = 0; col < 10; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
      if (!worksheet[cellRef]) worksheet[cellRef] = { v: '' };
      worksheet[cellRef].s = dataStyle;
    }
  }

  // Add the worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Statement of Applicability 2022');
  
  // Generate and download the file
  XLSX.writeFile(workbook, filename);
  
  console.log('✅ Excel file exported:', filename);
}

export function getExportStats(controls: EditableISO27001Control[]) {
  const applicable = controls.filter(c => c.isApplicable === 'Applicable').length;
  const notApplicable = controls.filter(c => c.isApplicable === 'Not Applicable').length;
  const total = controls.length;
  
  return {
    total,
    applicable,
    notApplicable,
    applicablePercentage: total > 0 ? Math.round((applicable / total) * 100) : 0,
    notApplicablePercentage: total > 0 ? Math.round((notApplicable / total) * 100) : 0
  };
}
