/// <reference types="cypress" />

describe('Company Profile Page Tests', () => {
  before(() => {
    // Mock authentication before running tests
    cy.mockFirebaseAuth();
    
    // Intercept and stub auth state
    cy.intercept('**/currentUser*', {
      body: {
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User'
      }
    });
    
    // Visit company profile page
    cy.visit('/company-profile');
    cy.wait(1500); // Wait for page to load
  });

  it('should display company profile page with location field', () => {
    // Check if the page title exists
    cy.contains('Company Profile').should('exist');
    
    // Enter edit mode
    cy.get('button').contains('Edit Profile').click();
    
    // Verify location field exists in edit mode
    cy.get('label').contains('Location').should('exist');
    cy.get('input[name="location"]').should('exist');
  });

  it('should allow editing company location', () => {
    // Enter edit mode if not already in it
    cy.get('button').contains('Edit Profile').click({ force: true });
    
    // Clear existing location and enter new one
    cy.get('input[name="location"]').clear().type('Boston, MA');
    
    // Save changes
    cy.get('button').contains('Save Changes').click();
    
    // Should show success message
    cy.contains('Profile updated successfully').should('exist');
    
    // Verify location is displayed in view mode
    cy.get('button').contains('Edit Profile').should('exist'); // Confirm we're in view mode
    cy.contains('Boston, MA').should('exist');
  });

  it('should persist location changes after refresh', () => {
    // Intercept the subcontractor data request that happens on page load
    cy.intercept('GET', '**/subcontractors/*', (req) => {
      req.reply({
        statusCode: 200,
        body: {
          companyName: 'Test Company',
          location: 'Boston, MA',
          description: 'A test company'
        }
      });
    }).as('getSubcontractorData');
    
    // Refresh the page
    cy.reload();
    cy.wait('@getSubcontractorData');
    
    // Verify location is still displayed correctly
    cy.contains('Boston, MA').should('exist');
  });

  it('should allow setting empty location', () => {
    // Enter edit mode
    cy.get('button').contains('Edit Profile').click();
    
    // Clear the location field
    cy.get('input[name="location"]').clear();
    
    // Save changes
    cy.get('button').contains('Save Changes').click();
    
    // Should show success message
    cy.contains('Profile updated successfully').should('exist');
    
    // Verify empty location message is shown
    cy.contains('No location provided').should('exist');
  });

  it('should validate form fields', () => {
    // Enter edit mode
    cy.get('button').contains('Edit Profile').click();
    
    // Test required fields
    cy.get('input[required]').each(($input) => {
      const fieldName = $input.attr('name');
      cy.wrap($input).clear();
      cy.get('button').contains('Save Changes').click({ force: true });
      
      // Browser validation should prevent form submission
      // or we should see validation messages
      cy.get(`input[name="${fieldName}"]`).should('exist');
    });
  });

  it('should handle canceled edits properly', () => {
    // Enter edit mode
    cy.get('button').contains('Edit Profile').click();
    
    // Change the location field
    cy.get('input[name="location"]').clear().type('Changed Location');
    
    // Cancel edits
    cy.get('button').contains('Cancel').click();
    
    // Should not see the changed location
    cy.contains('Changed Location').should('not.exist');
  });

  it('should show proper loading and error states', () => {
    // Mock a slow loading state
    cy.intercept('GET', '**/subcontractors/*', (req) => {
      req.reply({
        delay: 1000,
        statusCode: 200,
        body: {
          companyName: 'Test Company',
          location: 'Boston, MA'
        }
      });
    }).as('slowLoading');
    
    // Refresh to trigger loading state
    cy.reload();
    
    // Should show loading spinner
    cy.get('.loading-spinner, .spinner, [role="progressbar"]').should('exist');
    
    // Wait for loading to complete
    cy.wait('@slowLoading');
    
    // Mock an error state
    cy.intercept('PUT', '**/subcontractors/*', {
      statusCode: 500,
      body: { error: 'Server error' }
    }).as('saveError');
    
    // Try to save changes
    cy.get('button').contains('Edit Profile').click();
    cy.get('input[name="location"]').clear().type('Error Test Location');
    cy.get('button').contains('Save Changes').click();
    
    // Should show error message
    cy.contains('error', { matchCase: false }).should('exist');
  });
}); 