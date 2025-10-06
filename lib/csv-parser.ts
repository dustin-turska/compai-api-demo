export interface ISO27001Control {
  controlNumber: string;
  title: string;
  objective: string;
  drivers: {
    business: boolean;
    risk: boolean;
    legal: boolean;
    contract: boolean;
  };
  isRequired: boolean;
  isApplicable: 'Applicable' | 'Not Applicable';
  dateLastAssessed: string;
  notApplicableReason: string;
}

export interface EditableISO27001Control extends ISO27001Control {
  isEditing?: boolean;
}

export function parseISO27001CSV(csvContent: string): ISO27001Control[] {
  const controls: ISO27001Control[] = [];
  
  // Parse CSV properly handling quoted multi-line fields
  const rows = parseCSVContent(csvContent);
  
  // Skip header rows and find the data starting point
  let dataStartIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].some(cell => cell.includes('ISO 27001 Annex A Control'))) {
      dataStartIndex = i + 2; // Skip header and subheader
      break;
    }
  }
  
  if (dataStartIndex === -1) return controls;
  
  for (let i = dataStartIndex; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 10) continue;
    
    // Check if this is a control entry (starts with number after first comma)
    const controlMatch = row[1]?.match(/^(\d+(?:\.\d+)?)/);
    if (!controlMatch) continue;
    
    const controlNumber = controlMatch[1];
    const title = row[2]?.trim() || '';
    const objective = row[3]?.trim() || '';
    
    // Skip section headers (like "5,Organisational Controls")
    if (!title || title === 'Organisational Controls' || title.includes('Controls')) continue;
    
    // Parse driver columns
    const businessDriver = row[4]?.toLowerCase() === 'yes';
    const riskDriver = row[5]?.toLowerCase() === 'yes';
    const legalDriver = row[6]?.toLowerCase() === 'yes';
    const contractDriver = row[7]?.toLowerCase() === 'yes';
    const isRequired = businessDriver || riskDriver || legalDriver || contractDriver;
    
    const drivers = {
      business: businessDriver,
      risk: riskDriver,
      legal: legalDriver,
      contract: contractDriver
    };
    
    const isApplicable = (row[8]?.includes('Applicable') ? 'Applicable' : 'Not Applicable') as 'Applicable' | 'Not Applicable';
    const dateLastAssessed = row[9]?.trim() || '';
    const notApplicableReason = row[10]?.trim() || '';
    
    // If control is not required, ensure it's marked as Not Applicable
    const finalApplicable = !isRequired ? 'Not Applicable' : isApplicable;
    
    if (controlNumber && title && objective) {
      controls.push({
        controlNumber,
        title,
        objective,
        drivers,
        isRequired,
        isApplicable: finalApplicable,
        dateLastAssessed,
        notApplicableReason
      });
    }
  }
  
  return controls;
}

function parseCSVContent(csvContent: string): string[][] {
  const rows: string[][] = [];
  const lines = csvContent.split('\n');
  
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let fieldIndex = 0;
  
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          currentField += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        currentRow[fieldIndex] = currentField.trim();
        currentField = '';
        fieldIndex++;
      } else {
        currentField += char;
      }
    }
    
    if (!inQuotes) {
      // End of row
      currentRow[fieldIndex] = currentField.trim();
      rows.push([...currentRow]);
      currentRow = [];
      currentField = '';
      fieldIndex = 0;
    } else {
      // Multi-line field continues
      currentField += '\n';
    }
  }
  
  // Add final row if exists
  if (currentRow.length > 0 || currentField) {
    currentRow[fieldIndex] = currentField.trim();
    rows.push(currentRow);
  }
  
  return rows;
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(currentField.trim());
      currentField = '';
    } else {
      currentField += char;
    }
    
    i++;
  }
  
  // Add the last field
  fields.push(currentField.trim());
  
  return fields;
}

export async function loadISO27001Controls(): Promise<ISO27001Control[]> {
  try {
    const response = await fetch('/Statement of Applicability - ISO 27001.xlsx - Statement of Applicability 2022.csv');
    if (!response.ok) {
      throw new Error(`Failed to load CSV: ${response.statusText}`);
    }
    
    const csvContent = await response.text();
    return parseISO27001CSV(csvContent);
  } catch (error) {
    console.error('Error loading ISO 27001 controls:', error);
    throw error;
  }
}
