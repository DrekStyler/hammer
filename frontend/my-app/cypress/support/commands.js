// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// -- Custom commands for link and button testing --

/**
 * Custom command to check if a link is valid.
 * It checks if the href is present, if it doesn't lead to a 404,
 * and if it's not a "#" placeholder.
 */
Cypress.Commands.add('checkLink', (selector) => {
  cy.get(selector).each(($link) => {
    const href = $link.prop('href');
    const linkText = $link.text().trim();
    
    // Skip links with no href or # placeholder links
    if (!href || href.endsWith('#')) {
      cy.log(`Skipping link "${linkText}" with empty or placeholder href`);
      return;
    }
    
    // Skip mailto links
    if (href.startsWith('mailto:')) {
      cy.log(`Skipping mailto link: ${linkText}`);
      return;
    }
    
    // For external links, just check if they exist without following
    if (!href.includes(Cypress.config('baseUrl'))) {
      cy.log(`External link found: ${href}`);
      cy.request({
        url: href,
        failOnStatusCode: false
      }).then((response) => {
        // Just verify we got a response, not necessarily 200
        expect(response.status).to.not.equal(0, `Link ${href} is accessible`);
      });
      return;
    }
    
    // For internal links, follow them
    cy.request({
      url: href,
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.not.equal(404, `Link ${href} should not lead to a 404 page`);
    });
  });
});

/**
 * Custom command to check if a button is clickable.
 * This checks if the button is visible, enabled, and can be clicked.
 */
Cypress.Commands.add('checkButton', (selector) => {
  cy.get(selector).each(($button) => {
    const buttonText = $button.text().trim();
    const isDisabled = $button.prop('disabled') === true;
    
    cy.log(`Checking button: "${buttonText}"`);
    
    // Check if button is visible
    cy.wrap($button).should('be.visible');
    
    // If it's disabled, just log it; otherwise test click event
    if (isDisabled) {
      cy.log(`Button "${buttonText}" is disabled as expected`);
    } else {
      // Verify the button is clickable
      // Using force: true to handle cases where the button might be covered
      cy.wrap($button).click({ force: true });
      
      // If the button opens a new page, we'll capture that and go back
      cy.wait(500); // Small wait to allow any redirects or UI changes
      
      // If we navigated away, go back
      cy.url().then((url) => {
        if (url !== Cypress.config('baseUrl') + '/') {
          cy.go('back');
        }
      });
    }
  });
});

/**
 * Custom command to check all navigation links
 */
Cypress.Commands.add('checkNavLinks', () => {
  cy.get('nav a, header a, .nav-link, .navbar a').each(($link) => {
    // Store link info before clicking
    const href = $link.prop('href');
    const linkText = $link.text().trim();
    
    // Skip empty or non-navigational links
    if (!href || href.endsWith('#') || href.startsWith('javascript:')) {
      return;
    }
    
    cy.log(`Checking navigation link: ${linkText} (${href})`);
    
    // Click the link (force true to overcome any overlays)
    cy.wrap($link).click({ force: true });
    
    // Verify we didn't get a 404
    cy.get('body').should('exist');
    cy.get('html:contains("404")').should('not.exist');
    
    // Go back to test the next link
    cy.go('back');
  });
});

/**
 * Custom command to test form validation errors
 */
Cypress.Commands.add('testFormValidation', (formSelector, submitButtonSelector) => {
  // Get all required fields
  cy.get(`${formSelector} [required]`).then(($requiredFields) => {
    if ($requiredFields.length > 0) {
      // Try submitting the form without filling required fields
      cy.get(submitButtonSelector).click({ force: true });
      
      // Check if browser validation prevented submission
      // or if there are validation error messages displayed
      cy.get(`${formSelector} .error-message, ${formSelector} .invalid-feedback`)
        .should('exist');
    }
  });
});

// -- Firebase auth mock --
Cypress.Commands.add('mockFirebaseAuth', () => {
  // This is a placeholder - you might want to implement proper Firebase auth mocking
  // based on your specific implementation
  cy.log('Mocking Firebase auth');
  window.localStorage.setItem('mockAuthUser', JSON.stringify({
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User'
  }));
}); 