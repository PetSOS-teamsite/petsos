import { test, expect } from '@playwright/test';
import { createClinicViaAPI } from './utils/database';
import { loginAsAdmin } from './utils/auth';
import { nanoid } from 'nanoid';

test.describe('Clinic Directory and Search', () => {
  test('should display list of clinics', async ({ page }) => {
    // Create test clinics
    const clinic1 = await createClinicViaAPI(page, {
      name: `Central Vet Clinic ${nanoid(6)}`,
      address: 'Central, Hong Kong',
      phone: '+852 2222 3333',
      latitude: 22.2819,
      longitude: 114.1577,
      is24Hours: true
    });

    await page.goto('/clinics');
    
    // Verify clinic appears in directory
    await expect(page.getByText(clinic1.name)).toBeVisible();
    await expect(page.getByText(clinic1.address)).toBeVisible();
    await expect(page.getByText(clinic1.phone)).toBeVisible();
  });

  test('should filter clinics by 24-hour availability', async ({ page }) => {
    // Create 24-hour and non-24-hour clinics
    const clinic24h = await createClinicViaAPI(page, {
      name: `24Hour Clinic ${nanoid(6)}`,
      address: 'Test Address 24h',
      phone: '+852 1111 2222',
      latitude: 22.3193,
      longitude: 114.1694,
      is24Hours: true
    });

    const clinicRegular = await createClinicViaAPI(page, {
      name: `Regular Clinic ${nanoid(6)}`,
      address: 'Test Address Regular',
      phone: '+852 3333 4444',
      latitude: 22.3193,
      longitude: 114.1694,
      is24Hours: false
    });

    await page.goto('/clinics');
    
    // Apply 24-hour filter
    await page.getByTestId('checkbox-24hours').check();
    
    // Should show 24-hour clinic
    await expect(page.getByText(clinic24h.name)).toBeVisible();
    
    // Should hide non-24-hour clinic
    await expect(page.getByText(clinicRegular.name)).not.toBeVisible();
  });

  test('should search clinics by location', async ({ page }) => {
    await createClinicViaAPI(page, {
      name: `Kowloon Vet ${nanoid(6)}`,
      address: 'Kowloon, Hong Kong',
      phone: '+852 5555 6666',
      latitude: 22.3193,
      longitude: 114.1694,
    });

    await page.goto('/clinics');
    
    // Search by location
    await page.getByTestId('input-location-search').fill('Kowloon');
    await page.getByTestId('button-search').click();
    
    // Should display clinics in Kowloon area
    await expect(page.getByText(/Kowloon/i)).toBeVisible();
  });

  test('should show clinic details when clicking on clinic card', async ({ page }) => {
    const clinic = await createClinicViaAPI(page, {
      name: `Detailed Clinic ${nanoid(6)}`,
      address: '123 Detail Street, Hong Kong',
      phone: '+852 7777 8888',
      latitude: 22.3193,
      longitude: 114.1694,
    });

    await page.goto('/clinics');
    
    // Click on clinic card
    await page.getByTestId(`card-clinic-${clinic.id}`).click();
    
    // Should show detailed information
    await expect(page.getByTestId('text-clinic-name')).toHaveText(clinic.name);
    await expect(page.getByTestId('text-clinic-address')).toHaveText(clinic.address);
    await expect(page.getByTestId('text-clinic-phone')).toHaveText(clinic.phone);
  });

  test('should show distance from user location when location is enabled', async ({ page }) => {
    // Grant geolocation permission
    await page.context().grantPermissions(['geolocation']);
    
    // Set user location to Central, Hong Kong
    await page.context().setGeolocation({
      latitude: 22.2819,
      longitude: 114.1577
    });

    await createClinicViaAPI(page, {
      name: `Nearby Clinic ${nanoid(6)}`,
      address: 'Near Central, Hong Kong',
      phone: '+852 9999 0000',
      latitude: 22.2850,  // Very close to user
      longitude: 114.1580,
    });

    await page.goto('/clinics');
    
    // Should display distance
    await expect(page.getByTestId(/text-distance-.+/)).toBeVisible();
    await expect(page.getByText(/km|m/i)).toBeVisible();
  });
});
