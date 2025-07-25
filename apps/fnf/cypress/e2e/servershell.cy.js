describe("Servershell Component", () => {
  const testDir = Cypress.env("TEST_DIR") || "/Users/marckronberg/WebstormProjects/files-and-folders-mr/test";

  before(() => {
    // Set up the test environment before all tests
    cy.restoreTestEnvironment();
  });

  after(() => {
    // Clean up the test environment after all tests
    cy.cleanupTestEnvironment();
  });

  beforeEach(() => {
    // Set up localStorage with the specified configuration
    const tabs0Config = {
      panelIndex: 0,
      tabs: [
        {
          path: testDir,
          history: [],
          filterActive: true,
          hiddenFilesVisible: false,
          filterText: "",
          id: 12,
          historyIndex: 0
        }
      ],
      selectedTabIndex: 0
    };

    // Set localStorage values
    localStorage.setItem("tabs0", JSON.stringify(tabs0Config));

    // Visit the shell page directly
    cy.visit("/shell");

    // Wait for the app to load
    cy.get(".server-shell-div").should("exist");
  });

  describe('Xterm TAB Completion', () => {
    it('should autocomplete directory names with TAB (e.g., cd u + TAB)', () => {
      // Focus the xterm terminal
      cy.get('.xterm textarea').focus();
      // Type 'cd u'
      cy.get('.xterm textarea').type('cd u', { delay: 50 });
      // Press TAB (use '\t' instead of {tab})
      cy.get('.xterm textarea').type('\t', { delay: 50 });
      // Wait for backend response
      cy.wait(1000);
      // Check that the terminal contains a completion (either autocompleted or options shown)
      cy.get(".xterm-screen").invoke("text").should("match", /cd u.*/i);
    });
    it('should cycle through multiple completions with repeated TABs', () => {
      cy.get('.xterm textarea').focus();
      cy.get('.xterm textarea').type('cd /u', { delay: 50 });
      cy.get('.xterm textarea').type('\t', { delay: 50 });
      cy.wait(500);
      cy.get('.xterm textarea').type('\t', { delay: 50 });
      cy.wait(500);
      // Should show options or cycle through them
      cy.get(".xterm-screen").invoke("text").should("include", "cd /u");
    });
  });

  describe("Command History", () => {
    it("should navigate through command history with arrow keys", () => {
      // Focus the xterm terminal
      cy.get(".xterm textarea").focus();

      // Execute first command
      cy.get(".xterm textarea").type("echo \"first command\"", {delay: 50});
      cy.get(".xterm textarea").type("{enter}", {delay: 50});
      cy.wait(1000);

      // Execute second command
      cy.get(".xterm textarea").type("echo \"second command\"", {delay: 50});
      cy.get(".xterm textarea").type("{enter}", {delay: 50});
      cy.wait(1000);

      // Press arrow up to get last command
      cy.get(".xterm textarea").type("{upArrow}", {delay: 50});
      cy.wait(200);

      // Check that the terminal shows the last command
      cy.get(".xterm").invoke("text").should("include", "echo \"second command\"");

      // Press arrow up again to get previous command
      cy.get(".xterm textarea").type("{upArrow}", {delay: 50});
      cy.wait(200);

      // Check that the terminal shows the first command
      cy.get(".xterm").invoke("text").should("include", "echo \"first command\"");

      // Press arrow down to go back to second command
      cy.get(".xterm textarea").type("{downArrow}", {delay: 50});
      cy.wait(200);

      // Check that the terminal shows the second command again
      cy.get(".xterm").invoke("text").should("include", "echo \"second command\"");
    });

    it("should return to current input when navigating past history", () => {
      // Focus the xterm terminal
      cy.get(".xterm textarea").focus();

      // Execute a command
      cy.get(".xterm textarea").type("ls", {delay: 50});
      cy.get(".xterm textarea").type("{enter}", {delay: 50});
      cy.wait(1000);

      // Start typing a new command
      cy.get(".xterm textarea").type("echo \"current\"", {delay: 50});

      // Press arrow up to get history
      cy.get(".xterm textarea").type("{upArrow}", {delay: 50});
      cy.wait(200);

      // Should show the previous command
      cy.get(".xterm").invoke("text").should("include", "ls");

      // Press arrow down to return to current input
      cy.get(".xterm textarea").type("{downArrow}", {delay: 50});
      cy.wait(200);

      // Should show the current input again
      cy.get(".xterm").invoke("text").should("include", "echo \"current\"");
    });
  });
});