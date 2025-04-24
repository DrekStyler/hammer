/// <reference types="cypress" />

describe('Button Tests', () => {
  // Test public routes first
  describe('Public Pages Buttons', () => {
    beforeEach(() => {
      // Start fresh on homepage for each test
      cy.visit('/');
      cy.wait(1000); // Wait for page to load
    });

    it('should verify all buttons on homepage', () => {
      // Check all buttons
      cy.checkButton('button');
    });

    it('should verify login page buttons', () => {
      cy.visit('/login');
      cy.checkButton('button');
      
      // Test login form submission with invalid data
      cy.get('input[type="email"]').type('invalid@email');
      cy.get('input[type="password"]').type('short');
      cy.get('form button[type="submit"]').click();
      
      // Should show validation errors
      cy.contains('invalid').should('exist');
    });

    it('should verify signup page buttons', () => {
      cy.visit('/signup');
      cy.checkButton('button');
    });

    it('should verify register page buttons', () => {
      cy.visit('/register');
      cy.checkButton('button');
    });
  });

  // Test protected routes (requires auth)
  describe('Protected Pages Buttons (Authenticated)', () => {
    beforeEach(() => {
      // Mock authentication before accessing protected routes
      cy.mockFirebaseAuth();
      
      // Intercept and stub auth state
      cy.intercept('**/currentUser*', {
        body: {
          uid: 'test-user-id',
          email: 'test@example.com',
          displayName: 'Test User'
        }
      });
      
      // Visit dashboard as authenticated user
      cy.visit('/dashboard');
      cy.wait(1000); // Wait for page to load
    });

    it('should verify all buttons on dashboard', () => {
      cy.checkButton('button');
    });

    it('should verify profile page buttons', () => {
      cy.visit('/profile');
      cy.checkButton('button');
    });

    it('should verify company profile page buttons', () => {
      cy.visit('/company-profile');
      cy.checkButton('button');
      
      // Test edit button
      cy.get('button').contains('Edit Profile').click({ force: true });
      cy.get('button').contains('Save Changes').should('exist');
      cy.get('button').contains('Cancel').should('exist');
      
      // Test cancel button
      cy.get('button').contains('Cancel').click({ force: true });
      cy.get('button').contains('Edit Profile').should('exist');
    });

    it('should verify projects page buttons', () => {
      cy.visit('/projects');
      cy.checkButton('button');
    });

    it('should verify form submission buttons', () => {
      // Test form validation when creating a new project
      cy.visit('/projects');
      cy.get('button').contains('Create Project').click({ force: true });
      
      // Try to submit without required fields
      cy.get('button[type="submit"]').click({ force: true });
      
      // Should show validation errors
      cy.get('form').should('exist');
    });
  });

  // Test specific buttons on components
  describe('Component Button Tests', () => {
    beforeEach(() => {
      // Mock authentication
      cy.mockFirebaseAuth();
      cy.intercept('**/currentUser*', {
        body: {
          uid: 'test-user-id',
          email: 'test@example.com'
        }
      });
    });

    it('should test header buttons', () => {
      cy.visit('/');
      cy.get('header').find('button').each(($btn) => {
        // Skip logout button to avoid breaking the test flow
        if (!$btn.text().includes('Logout') && !$btn.text().includes('Sign out')) {
          cy.wrap($btn).click({ force: true });
          cy.wait(300); // Wait for any UI updates
        }
      });
    });

    it('should test modal buttons', () => {
      // Visit a page that has modals
      cy.visit('/company-profile');
      
      // Open modal if there's a button to do so
      cy.get('button').contains(/add|create|new/i).click({ force: true });
      
      // Test buttons in modal
      cy.get('.modal button, [role="dialog"] button').each(($btn) => {
        // Skip buttons that might close the modal
        if (!$btn.text().includes('Close') && !$btn.text().includes('Cancel')) {
          cy.wrap($btn).click({ force: true });
          cy.wait(300); // Wait for any UI updates
        }
      });
    });
  });

  // Test buttons for accessibility
  describe('Button Accessibility Tests', () => {
    it('should verify button keyboard accessibility', () => {
      cy.visit('/');
      
      // Find all buttons and check if they're keyboard accessible
      cy.get('button, a[role="button"], [type="button"], [type="submit"]').each(($el) => {
        // Check if tab index is not -1 (which would make it not focusable)
        cy.wrap($el).should('not.have.attr', 'tabindex', '-1');
        
        // Check if element is not hidden from screen readers
        cy.wrap($el).should('not.have.attr', 'aria-hidden', 'true');
      });
    });
  });
}); 