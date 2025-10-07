import { test, expect } from '@playwright/test';
import { loginAsUser } from './utils/auth';
import { createClinicViaAPI, createPetViaAPI, assignStaffToClinic } from './utils/database';
import { nanoid } from 'nanoid';

test.describe('Clinic Staff Dashboard', () => {
  test('should access clinic dashboard as staff member', async ({ page }) => {
    const staff = await loginAsUser(page, {
      email: `staff-${nanoid(6)}@clinic.com`
    });
    
    // Create a clinic
    const clinic = await createClinicViaAPI(page, {
      name: `Staff Clinic ${nanoid(6)}`,
      address: 'Staff Address',
      phone: '+852 5555 5555',
      latitude: 22.3193,
      longitude: 114.1694,
    });
    
    // Assign user as staff to clinic
    await assignStaffToClinic(page, staff.sub, clinic.id!);
    
    await page.goto('/clinic/dashboard');
    
    // Verify dashboard is accessible
    await expect(page.getByTestId('heading-clinic-dashboard')).toBeVisible();
    await expect(page.getByText(clinic.name)).toBeVisible();
  });

  test('should toggle clinic availability', async ({ page }) => {
    const staff = await loginAsUser(page);
    
    const clinic = await createClinicViaAPI(page, {
      name: `Availability Clinic ${nanoid(6)}`,
      address: 'Availability Address',
      phone: '+852 6666 6666',
      latitude: 22.3193,
      longitude: 114.1694,
    });
    
    await assignStaffToClinic(page, staff.sub, clinic.id!);
    
    await page.goto('/clinic/dashboard');
    
    // Toggle availability
    const availabilitySwitch = page.getByTestId('switch-availability');
    await expect(availabilitySwitch).toBeVisible();
    
    // Turn off availability
    await availabilitySwitch.click();
    await expect(page.getByText(/currently unavailable/i)).toBeVisible();
    
    // Turn on availability
    await availabilitySwitch.click();
    await expect(page.getByText(/currently available/i)).toBeVisible();
  });

  test('should view incoming emergency requests', async ({ page }) => {
    const staff = await loginAsUser(page);
    
    const clinic = await createClinicViaAPI(page, {
      name: `Emergency Clinic ${nanoid(6)}`,
      address: 'Emergency Address',
      phone: '+852 7777 7777',
      latitude: 22.3193,
      longitude: 114.1694,
      is24Hours: true
    });
    
    await assignStaffToClinic(page, staff.sub, clinic.id!);
    
    // Create a pet owner and emergency request
    const owner = await loginAsUser(page);
    const pet = await createPetViaAPI(page, owner.sub, {
      name: `Emergency Pet ${nanoid(6)}`,
      species: 'dog',
    });
    
    // Create emergency request
    await page.request.post('/api/emergency-requests', {
      data: {
        userId: owner.sub,
        petId: pet.id,
        symptoms: 'Emergency symptoms',
        latitude: 22.3193,
        longitude: 114.1694,
      }
    });
    
    // Switch back to staff and view dashboard
    await loginAsUser(page, staff);
    await page.goto('/clinic/dashboard');
    
    // Verify emergency request appears
    await expect(page.getByTestId(/card-request-.+/)).toBeVisible();
    await expect(page.getByText('Emergency symptoms')).toBeVisible();
  });

  test('should respond to emergency request', async ({ page }) => {
    const staff = await loginAsUser(page);
    
    const clinic = await createClinicViaAPI(page, {
      name: `Response Clinic ${nanoid(6)}`,
      address: 'Response Address',
      phone: '+852 8888 8888',
      latitude: 22.3193,
      longitude: 114.1694,
    });
    
    await assignStaffToClinic(page, staff.sub, clinic.id!);
    
    // Create emergency request
    const request = await page.request.post('/api/emergency-requests', {
      data: {
        userId: nanoid(),
        petId: nanoid(),
        symptoms: 'Test symptoms',
        latitude: 22.3193,
        longitude: 114.1694,
      }
    }).then(r => r.json());
    
    await page.goto('/clinic/dashboard');
    
    // Click on request to view details
    await page.getByTestId(`card-request-${request.id}`).click();
    
    // Verify request details are shown
    await expect(page.getByTestId('text-request-symptoms')).toHaveText('Test symptoms');
    
    // Respond to request
    await page.getByTestId('button-accept-request').click();
    
    // Verify response is recorded
    await expect(page.getByText(/accepted/i)).toBeVisible();
  });

  test('should prevent non-staff access to clinic dashboard', async ({ page }) => {
    // Login as regular user without clinic assignment
    await loginAsUser(page);
    
    // Try to access clinic dashboard
    await page.goto('/clinic/dashboard');
    
    // Should be redirected or show access denied
    await expect(page.getByText(/no access|not authorized/i)).toBeVisible();
  });
});
