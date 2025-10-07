# CSV Clinic Import Guide

This guide explains how to import veterinary clinic data from CSV files into the PetSOS platform.

## Overview

The CSV import feature allows you to bulk import clinic data from a CSV file. It supports both English and Chinese clinic information, including contact details, location data, and operating hours.

## Quick Start

### Basic Import

```bash
tsx scripts/import-clinics-csv.ts path/to/clinics.csv
```

### Clear Existing Clinics Before Import

```bash
tsx scripts/import-clinics-csv.ts path/to/clinics.csv --clear
```

## CSV File Format

### Required Columns

The CSV file must include at least the following columns:

- **Name** (or Name of Vet Clinic (English), name, clinic_name) - Clinic name in English
- **Address** (or Address (English), address) - Clinic address in English
- **Phone** (or Call Phone Number, Call, phone) - Contact phone number (required for emergency contact)
- **Location** (or Region, region) - Must be one of:
  - `Hong Kong Island`, `HKI`, or `港島`
  - `Kowloon`, `KLN`, or `九龍`
  - `New Territories`, `NTI`, or `新界`

### Optional Columns

- **Name (Chinese)** (or 獸醫診所名稱 (Chinese), name_zh, chinese_name) - Clinic name in Chinese
- **Address (Chinese)** (or 營業地址, address_zh, chinese_address) - Clinic address in Chinese
- **WhatsApp** (or WhatsApp Number) - WhatsApp contact number
- **Email** (or E-mail, email) - Email address
- **24_hours** (or 24 hours, is_24_hour, is24Hour) - 24-hour service indicator
  - Accepted values: `Y`, `Yes`, `yes`, `true`, `1`
- **Latitude** (or lat) - GPS latitude coordinate
- **Longitude** (or lng, lon, longitude) - GPS longitude coordinate

### Sample CSV Template

A sample template is available at `attached_assets/clinic-import-template.csv`:

```csv
Name,Name (Chinese),Address,Address (Chinese),Phone,WhatsApp,Email,Location,24_hours,Latitude,Longitude
"Example Veterinary Clinic","示例獸醫診所","123 Example Street, Hong Kong","香港示例街123號","+852 1234 5678","+85298765432","info@example.com","Hong Kong Island","No","22.2820","114.1585"
```

## Column Name Flexibility

The import script supports multiple column name formats for compatibility with different CSV sources:

| Data Field | Supported Column Names |
|-----------|------------------------|
| Name (English) | `Name`, `Name of Vet Clinic (English)`, `name`, `clinic_name` |
| Name (Chinese) | `Name (Chinese)`, `獸醫診所名稱 (Chinese)`, `name_zh`, `chinese_name` |
| Address (English) | `Address`, `Address (English)`, `address` |
| Address (Chinese) | `Address (Chinese)`, `營業地址`, `address_zh`, `chinese_address` |
| Phone | `Phone`, `Call Phone Number`, `Call`, `phone` |
| WhatsApp | `WhatsApp`, `WhatsApp Number`, `whatsapp` |
| Email | `Email`, `E-mail`, `email` |
| Region | `Location`, `Region`, `region`, `location` |
| 24-Hour Service | `24_hours`, `24 hours`, `is_24_hour`, `is24Hour` |
| Latitude | `Latitude`, `lat`, `latitude` |
| Longitude | `Longitude`, `lng`, `lon`, `longitude` |

## Features

### Automatic Phone Number Formatting

- Phone numbers are automatically prefixed with `+852` if not already prefixed
- Spaces in phone numbers are preserved for readability

### WhatsApp Number Parsing

- Handles various formats (numeric, with/without country code)
- Automatically adds `+` prefix if missing
- Skips `N/A` and empty values

### Region Mapping

- Automatically creates regions if they don't exist
- Supports English, region codes, and Chinese region names
- Maps clinics to the correct region in the database

### Coordinate Support

- Imports GPS coordinates if available in CSV
- If coordinates are missing, you can run the geocoding script after import:
  ```bash
  tsx scripts/bulk-geocode-clinics.ts
  ```

### Data Validation

- Validates each row before import
- Skips invalid rows and reports errors
- Shows detailed progress during import
- Uses database transactions for data integrity

## Usage Examples

### Example 1: Import New Clinics

```bash
# Import clinics from a CSV file
tsx scripts/import-clinics-csv.ts attached_assets/new-clinics.csv
```

### Example 2: Replace All Clinics

```bash
# Clear existing clinics and import fresh data
tsx scripts/import-clinics-csv.ts attached_assets/all-clinics.csv --clear
```

### Example 3: Import with Custom CSV

```bash
# Create your CSV file following the template format
# Save it as my-clinics.csv
# Run the import
tsx scripts/import-clinics-csv.ts my-clinics.csv
```

## Import Process

The script follows these steps:

1. **File Validation**: Checks if CSV file exists
2. **Region Setup**: Creates or retrieves Hong Kong regions (HKI, KLN, NTI)
3. **Data Parsing**: Reads and parses CSV file
4. **Validation**: Validates each clinic record
5. **Transaction**: Executes database import in a transaction
6. **Reporting**: Shows import summary with success/error counts

## Error Handling

The script handles various error scenarios:

- **Missing CSV file**: Shows clear error message with file path
- **Invalid region**: Skips row and reports warning
- **Missing required fields**: Skips row and counts as validation error
- **Database errors**: Rolls back transaction and shows error details

## Post-Import Steps

After importing clinics:

1. **Geocode Missing Coordinates** (if coordinates weren't in CSV):
   ```bash
   tsx scripts/bulk-geocode-clinics.ts
   ```

2. **Setup PostGIS** (if not already done):
   ```bash
   tsx scripts/setup-postgis.ts
   ```

3. **Verify Import**:
   - Check the admin dashboard at `/admin/clinics`
   - Review clinic count and data accuracy
   - Test clinic search functionality

## Comparison: CSV vs Excel Import

| Feature | CSV Import | Excel Import |
|---------|-----------|--------------|
| File Format | .csv | .xlsx |
| Command Line Arguments | ✅ Yes | ❌ No |
| Clear Existing Data | Optional (--clear flag) | Always clears |
| Column Name Flexibility | ✅ Multiple formats | ❌ Fixed format |
| Coordinates Support | ✅ Yes | ❌ No |
| Email Support | ✅ Yes | ❌ No |

## Troubleshooting

### Import Fails with "CSV file not found"

**Solution**: Provide the correct path to your CSV file:
```bash
tsx scripts/import-clinics-csv.ts ./path/to/your/file.csv
```

### Some Rows Are Skipped

**Solution**: Check the import output for validation errors. Common issues:
- Missing clinic name
- Invalid region name
- Incorrectly formatted data

### Phone Numbers Not Formatted Correctly

**Solution**: Ensure phone numbers in CSV are:
- In format `1234 5678` or `+852 1234 5678`
- The script will auto-format with `+852` prefix

### Coordinates Not Imported

**Solution**: Ensure CSV has `Latitude` and `Longitude` columns with valid decimal coordinates:
```csv
Name,Address,Location,Latitude,Longitude
"Clinic Name","123 Street","Kowloon","22.3193","114.1694"
```

## Best Practices

1. **Always backup your database** before importing with `--clear` flag
2. **Test with a small CSV first** to verify format and column names
3. **Include coordinates when possible** to avoid geocoding API costs
4. **Use the template file** as a starting point for your CSV
5. **Check import summary** for validation errors and address issues
6. **Run geocoding after import** if coordinates are missing

## Related Scripts

- **Excel Import**: `scripts/import-clinics.ts` - Import from Excel files
- **Geocoding**: `scripts/bulk-geocode-clinics.ts` - Add GPS coordinates to clinics
- **PostGIS Setup**: `scripts/setup-postgis.ts` - Enable geo-spatial features
