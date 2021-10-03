describe('Traging strategy Home', () => {

    beforeEach(() => {
        cy.visit('/');
    })

    it('should render Home with navbar with 3 elements', () => {
        cy.contains('Algorithmic trading strategy protocol').should('be.visible');
        cy.contains(/Coming soon/i).should('be.visible');
        cy.get('.navbar-nav li').should('have.length', 3)
            .last()
            .should('have.text', 'Community')
    });

    it('has a link to datasets and should be the first element in nava', () => {
        cy.contains(/datasets/i).click();
        cy.get('.navbar-nav li')
            .first()
            .should('have.text', 'Datasets')
    });

    it('has a link to community', () => {
        const textNavLink = 'community';
        cy.contains(/community/i).click();
        cy.get('.navbar-nav li')
            .last()
            .should('have.text', 'Community')
    });
})
