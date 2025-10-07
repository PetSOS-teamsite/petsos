import { Page } from '@playwright/test';
import { nanoid } from 'nanoid';

export interface TestPet {
  id?: string;
  name: string;
  species: string;
  breed?: string;
  age?: number;
  weight?: number;
  medicalNotes?: string;
}

export interface TestClinic {
  id?: string;
  name: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  is24Hours?: boolean;
  isSupportHospital?: boolean;
}

export async function createPetViaAPI(page: Page, userId: string, pet: Omit<TestPet, 'id'>): Promise<TestPet> {
  const response = await page.request.post('/api/pets', {
    data: {
      ...pet,
      userId,
      name: pet.name || `Pet-${nanoid(6)}`,
      species: pet.species || 'dog',
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to create pet: ${await response.text()}`);
  }

  return await response.json();
}

export async function createClinicViaAPI(page: Page, clinic: Omit<TestClinic, 'id'>): Promise<TestClinic> {
  // Use test endpoint to create clinics without auth requirements
  const response = await page.request.post('/api/test/clinics', {
    data: {
      ...clinic,
      name: clinic.name || `Clinic-${nanoid(6)}`,
      is24Hours: clinic.is24Hours ?? true,
      isSupportHospital: clinic.isSupportHospital ?? false,
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to create clinic: ${await response.text()}`);
  }

  return await response.json();
}

export async function assignStaffToClinic(page: Page, userId: string, clinicId: string): Promise<void> {
  const response = await page.request.post('/api/test/assign-staff', {
    data: { userId, clinicId },
  });

  if (!response.ok()) {
    throw new Error(`Failed to assign staff: ${await response.text()}`);
  }
}
