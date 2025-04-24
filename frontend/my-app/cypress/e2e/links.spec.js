/// <reference types="cypress" />

describe('Link Tests', () => {
  // Test public routes first
  describe('Public Pages Links', () => {
    beforeEach(() => {
      // Start fresh on homepage for each test
      cy.visit('/');
      cy.wait(1000); // Wait for page to load
    });

    it('should verify all links on homepage', () => {
      // Check all anchor tags
      cy.checkLink('a');
    });

    it('should verify all navigation links', () => {
      cy.checkNavLinks();
    });

    it('should follow login page links', () => {
      cy.visit('/login');
      cy.checkLink('a');
    });

    it('should follow signup page links', () => {
      cy.visit('/signup');
      cy.checkLink('a');
    });

    it('should follow register page links', () => {
      cy.visit('/register');
      cy.checkLink('a');
    });
  });

  // Test protected routes (requires auth)
  describe('Protected Pages Links (Authenticated)', () => {
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

    it('should verify all links on dashboard', () => {
      cy.checkLink('a');
    });

    it('should verify profile page links', () => {
      cy.visit('/profile');
      cy.checkLink('a');
    });

    it('should verify company profile page links', () => {
      cy.visit('/company-profile');
      cy.checkLink('a');
    });

    it('should verify projects page links', () => {
      cy.visit('/projects');
      cy.checkLink('a');
    });

    it('should verify subcontractor marketplace links', () => {
      cy.visit('/marketplace');
      cy.checkLink('a');
    });

    it('should verify project pool links', () => {
      cy.visit('/project-pool');
      cy.checkLink('a');
    });

    it('should verify project invites links', () => {
      cy.visit('/project-invites');
      cy.checkLink('a');
    });

    it('should verify project calendar links', () => {
      cy.visit('/project-calendar');
      cy.checkLink('a');
    });

    it('should verify my projects links', () => {
      cy.visit('/my-projects');
      cy.checkLink('a');
    });

    it('should verify my contractors links', () => {
      cy.visit('/my-contractors');
      cy.checkLink('a');
    });

    it('should verify explore page links', () => {
      cy.visit('/explore');
      cy.checkLink('a');
    });

    it('should verify inbox links', () => {
      cy.visit('/inbox');
      cy.checkLink('a');
    });

    it('should verify notifications page links', () => {
      cy.visit('/notifications');
      cy.checkLink('a');
    });
  });

  // Test edge cases
  describe('Edge Cases for Links', () => {
    it('should handle 404 page gracefully', () => {
      cy.visit('/non-existent-page', { failOnStatusCode: false });
      cy.contains('Login').should('exist'); // Assuming 404 redirects to login
    });
  });
}); 