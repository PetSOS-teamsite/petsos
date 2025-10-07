import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsUser } from './utils/auth';
import { createClinicViaAPI } from './utils/database';
import { nanoid } from 'nanoid';

test.describe('Admin Dashboard', () => {
  test('should access admin clinic management', async ({ page }) => {
    await loginAsAdmin(page);
    
    await page.goto('/admin/clinics');
    
    // Verify admin dashboard is accessible
    await expect(page.getByTestId('heading-admin-clinics')).toBeVisible();
    await expect(page.getByTestId('button-add-clinic')).toBeVisible();
  });

  test('should create new clinic with GPS auto-fill', async ({ page }) => {
    await loginAsAdmin(page);
    
    await page.goto('/admin/clinics');
    
    // Click add clinic button
    await page.getByTestId('button-add-clinic').click();
    
    // Fill clinic form
    const clinicName = `New Clinic ${nanoid(6)}`;
    await page.getByTestId('input-name').fill(clinicName);
    await page.getByTestId('input-address').fill('123 Test Street, Hong Kong');
    await page.getByTestId('input-phone').fill('+852 1234 5678');
    
    // GPS auto-fill (if supported)
    const addressField = page.getByTestId('input-address');
    await addressField.fill('Central, Hong Kong');
    await addressField.press('Enter');
    
    // Verify lat/lng fields are populated
    await expect(page.getByTestId('input-latitude')).not.toHaveValue('');
    await expect(page.getByTestId('input-longitude')).not.toHaveValue('');
    
    // Submit form
    await page.getByTestId('button-submit').click();
    
    // Verify clinic appears in list
    await expect(page.getByText(clinicName)).toBeVisible();
  });

  test('should edit existing clinic', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Create a clinic first using test utilities
    const clinic = await createClinicViaAPI(page, {
      name: `Edit Test Clinic ${nanoid(6)}`,
      address: 'Old Address',
      phone: '+852 1111 1111',
      latitude: 22.3193,
      longitude: 114.1694,
    });
    
    await page.goto('/admin/clinics');
    
    // Click edit button
    await page.getByTestId(`button-edit-${clinic.name}`).click();
    
    // Update clinic information
    const newPhone = '+852 9999 9999';
    await page.getByTestId('input-phone').fill(newPhone);
    
    // Toggle Support Hospital status
    await page.getByTestId('checkbox-support-hospital').check();
    
    // Save changes
    await page.getByTestId('button-save').click();
    
    // Verify changes are saved
    await expect(page.getByText(newPhone)).toBeVisible();
    await expect(page.getByText(/Support Hospital/i)).toBeVisible();
  });

  test('should delete clinic', async ({ page }) => {
    await loginAsAdmin(page);
    
    const clinic = await createClinicViaAPI(page, {
      name: `Delete Test Clinic ${nanoid(6)}`,
      address: 'Delete Address',
      phone: '+852 2222 2222',
      latitude: 22.3193,
      longitude: 114.1694,
    });
    
    await page.goto('/admin/clinics');
    
    // Click delete button
    await page.getByTestId(`button-delete-${clinic.name}`).click();
    
    // Confirm deletion
    await page.getByTestId('button-confirm-delete').click();
    
    // Verify clinic is removed
    await expect(page.getByText(clinic.name)).not.toBeVisible();
  });

  test('should assign staff to clinic', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Create a clinic
    const clinic = await createClinicViaAPI(page, {
      name: `Staff Test Clinic ${nanoid(6)}`,
      address: 'Staff Address',
      phone: '+852 3333 3333',
      latitude: 22.3193,
      longitude: 114.1694,
    });
    
    await page.goto('/admin/clinics');
    
    // Click staff management button
    await page.getByTestId(`button-manage-staff-${clinic.id}`).click();
    
    // Add staff member
    await page.getByTestId('input-staff-email').fill('staff@test.com');
    await page.getByTestId('button-add-staff').click();
    
    // Verify staff is added
    await expect(page.getByText('staff@test.com')).toBeVisible();
  });

  test('should prevent non-admin access', async ({ page }) => {
    // Login as regular user (not admin)
    await loginAsUser(page);
    
    // Try to access admin page
    await page.goto('/admin/clinics');
    
    // Should be redirected to login or show access denied
    await expect(page.url()).toContain('/admin/login');
  });
});
