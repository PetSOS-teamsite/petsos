import { test, expect } from '@playwright/test';
import { loginAsUser } from './utils/auth';
import { createPetViaAPI, createClinicViaAPI } from './utils/database';
import { nanoid } from 'nanoid';

test.describe('Emergency Request Workflow', () => {
  test('should create emergency request, broadcast to clinics, and view results', async ({ page }) => {
    // Setup: Create user and login
    const user = await loginAsUser(page);
    
    // Setup: Create a pet for the user
    const pet = await createPetViaAPI(page, user.sub, {
      name: `TestPet-${nanoid(6)}`,
      species: 'dog',
      breed: 'Labrador',
      age: 3,
      weight: 25,
      medicalNotes: 'Test medical notes for emergency'
    });

    // Setup: Create a nearby clinic
    await createClinicViaAPI(page, {
      name: `Test Clinic ${nanoid(6)}`,
      address: '123 Test Street, Hong Kong',
      phone: '+852 1234 5678',
      latitude: 22.3193,
      longitude: 114.1694,
      is24Hours: true,
      isSupportHospital: false
    });

    // Step 1: Navigate to emergency page
    await page.goto('/emergency');
    await expect(page.getByTestId('heading-emergency')).toBeVisible();

    // Step 2: Fill emergency request form
    await page.getByTestId('select-pet').click();
    await page.getByRole('option', { name: pet.name }).click();

    await page.getByTestId('textarea-symptoms').fill('Test emergency symptoms - difficulty breathing');
    
    // Step 3: Submit emergency request
    await page.getByTestId('button-submit').click();
    
    // Step 4: Wait for redirect to results page
    await page.waitForURL(/\/emergency-results\/.+/);
    
    // Step 5: Verify request was created and clinics are shown
    await expect(page.getByTestId('text-request-status')).toBeVisible();
    
    // Step 6: Verify clinic results are displayed
    await expect(page.getByTestId(/card-clinic-.+/)).toBeVisible();
    
    // Step 7: Verify contact options (Call/WhatsApp)
    const firstClinicCard = page.getByTestId(/card-clinic-.+/).first();
    await expect(firstClinicCard.getByTestId('button-call')).toBeVisible();
    await expect(firstClinicCard.getByTestId('button-whatsapp')).toBeVisible();
  });

  test('should broadcast to Support Hospitals first when available', async ({ page }) => {
    const user = await loginAsUser(page);
    
    const pet = await createPetViaAPI(page, user.sub, {
      name: `TestPet-${nanoid(6)}`,
      species: 'cat',
    });

    // Create a Support Hospital
    const supportHospital = await createClinicViaAPI(page, {
      name: `Support Hospital ${nanoid(6)}`,
      address: '456 Support Street, Hong Kong',
      phone: '+852 9999 8888',
      latitude: 22.3193,
      longitude: 114.1694,
      is24Hours: true,
      isSupportHospital: true
    });

    // Create a regular clinic
    await createClinicViaAPI(page, {
      name: `Regular Clinic ${nanoid(6)}`,
      address: '789 Regular Street, Hong Kong',
      phone: '+852 7777 6666',
      latitude: 22.3193,
      longitude: 114.1694,
      is24Hours: true,
      isSupportHospital: false
    });

    await page.goto('/emergency');
    
    await page.getByTestId('select-pet').click();
    await page.getByRole('option', { name: pet.name }).click();
    await page.getByTestId('textarea-symptoms').fill('Emergency symptoms');
    await page.getByTestId('button-submit').click();
    
    await page.waitForURL(/\/emergency-results\/.+/);
    
    // Verify Support Hospital appears in results
    await expect(page.getByText(supportHospital.name)).toBeVisible();
  });

  test('should show "no pets" message when user has no pets', async ({ page }) => {
    await loginAsUser(page);
    
    await page.goto('/emergency');
    
    // Should show message about needing to add pets first
    await expect(page.getByText(/add.*pet.*first/i)).toBeVisible();
    await expect(page.getByTestId('link-add-pet')).toBeVisible();
  });
});
