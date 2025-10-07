import { test, expect } from '@playwright/test';
import { loginAsUser } from './utils/auth';
import { nanoid } from 'nanoid';

test.describe('Pet Profile Management', () => {
  test('should create a new pet with complete information', async ({ page }) => {
    await loginAsUser(page);
    
    await page.goto('/pets');
    
    // Click add pet button
    await page.getByTestId('button-add-pet').click();
    
    // Fill in pet form
    const petName = `TestDog-${nanoid(6)}`;
    await page.getByTestId('input-name').fill(petName);
    
    await page.getByTestId('select-species').click();
    await page.getByRole('option', { name: 'Dog' }).click();
    
    await page.getByTestId('input-breed').fill('Golden Retriever');
    await page.getByTestId('input-age').fill('5');
    await page.getByTestId('input-weight').fill('30');
    await page.getByTestId('textarea-medical-notes').fill('Allergic to certain foods');
    
    // Submit form
    await page.getByTestId('button-submit').click();
    
    // Verify pet appears in list
    await expect(page.getByTestId(`card-pet-${petName}`)).toBeVisible();
    await expect(page.getByText(petName)).toBeVisible();
    await expect(page.getByText('Golden Retriever')).toBeVisible();
  });

  test('should edit existing pet information', async ({ page }) => {
    const user = await loginAsUser(page);
    
    // Create a pet first via API
    const pet = {
      name: `TestCat-${nanoid(6)}`,
      species: 'cat',
      breed: 'Persian',
      age: 2
    };
    
    await page.request.post('/api/pets', {
      data: { ...pet, userId: user.sub }
    });
    
    await page.goto('/pets');
    
    // Click edit button for the pet
    await page.getByTestId(`button-edit-${pet.name}`).click();
    
    // Update pet information
    const updatedAge = '3';
    await page.getByTestId('input-age').fill(updatedAge);
    await page.getByTestId('input-weight').fill('5');
    
    // Save changes
    await page.getByTestId('button-save').click();
    
    // Verify updated information is displayed
    await expect(page.getByText(updatedAge)).toBeVisible();
  });

  test('should delete a pet', async ({ page }) => {
    const user = await loginAsUser(page);
    
    const petName = `TestBird-${nanoid(6)}`;
    await page.request.post('/api/pets', {
      data: {
        name: petName,
        species: 'bird',
        userId: user.sub
      }
    });
    
    await page.goto('/pets');
    
    // Click delete button
    await page.getByTestId(`button-delete-${petName}`).click();
    
    // Confirm deletion in dialog
    await page.getByTestId('button-confirm-delete').click();
    
    // Verify pet is removed from list
    await expect(page.getByTestId(`card-pet-${petName}`)).not.toBeVisible();
  });

  test('should display validation error for invalid pet data', async ({ page }) => {
    await loginAsUser(page);
    
    await page.goto('/pets');
    await page.getByTestId('button-add-pet').click();
    
    // Try to submit without required fields
    await page.getByTestId('button-submit').click();
    
    // Should show validation errors
    await expect(page.getByText(/name.*required/i)).toBeVisible();
    await expect(page.getByText(/species.*required/i)).toBeVisible();
  });

  test('should support bilingual breed selection (EN/zh-HK)', async ({ page }) => {
    await loginAsUser(page);
    
    await page.goto('/pets');
    await page.getByTestId('button-add-pet').click();
    
    await page.getByTestId('input-name').fill('TestDog');
    await page.getByTestId('select-species').click();
    await page.getByRole('option', { name: 'Dog' }).click();
    
    // Breed field should support both English and Chinese input
    await page.getByTestId('input-breed').click();
    
    // Verify breeds are available
    await expect(page.getByRole('option', { name: /labrador|拉布拉多/i })).toBeVisible();
  });
});
