import { Page } from '@playwright/test';
import { nanoid } from 'nanoid';

export interface TestUser {
  sub: string;
  email: string;
  first_name: string;
  last_name: string;
  role?: 'admin' | 'user';
}

export async function loginAsUser(page: Page, userData?: Partial<TestUser>): Promise<TestUser> {
  const user: TestUser = {
    sub: userData?.sub || nanoid(10),
    email: userData?.email || `user-${nanoid(6)}@test.com`,
    first_name: userData?.first_name || 'Test',
    last_name: userData?.last_name || 'User',
    role: userData?.role || 'user',
  };

  // Create authenticated session via test endpoint
  const response = await page.request.post('/api/test/auth/session', {
    data: {
      sub: user.sub,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to create test session: ${await response.text()}`);
  }

  // Navigate to a page to establish the session in the browser
  await page.goto('/');

  return user;
}

export async function loginAsAdmin(page: Page): Promise<TestUser> {
  return loginAsUser(page, {
    email: `admin-${nanoid(6)}@test.com`,
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
  });
}

export async function logout(page: Page) {
  await page.goto('/api/logout');
  await page.waitForURL('/');
}
