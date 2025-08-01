describe("ButtonPanel Keyboard Interaction", () => {
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

    const tabs1Config = {
      panelIndex: 1,
      tabs: [
        {
          path: testDir + "/apps/fnf",
          history: [],
          filterActive: false,
          hiddenFilesVisible: false,
          filterText: "",
          id: 23,
          historyIndex: 0
        }
      ],
      selectedTabIndex: 0
    };

    localStorage.setItem("tabs0", JSON.stringify(tabs0Config));
    localStorage.setItem("tabs1", JSON.stringify(tabs1Config));

    cy.visit("/");

    // Wait for the application to load
    cy.get(".fnf-main-div").should("exist");
    cy.get(".button-panel").should("exist");
  });

  it("should display default buttons initially", () => {
    // Check that default buttons are displayed
    cy.get(".button-panel .panel-button").should("have.length.at.least", 6);

    // Verify specific default buttons are present
    cy.get(".button-panel .panel-button").should("contain", "Copy");
    cy.get(".button-panel .panel-button").should("contain", "Edit");
    cy.get(".button-panel .panel-button").should("contain", "Move");
    cy.get(".button-panel .panel-button").should("contain", "MkDir");
    cy.get(".button-panel .panel-button").should("contain", "Delete");

    cy.screenshot("buttonpanel-default-buttons");
  });

  it("should switch to shift buttons when shift key is pressed", () => {
    // Press and hold shift key
    cy.get("body").type("{shift}", {release: false});

    // Wait a moment for the change to take effect
    cy.wait(100);

    // Verify that rename button appears (specific to shift mode)
    cy.get(".button-panel .panel-button").should("contain", "Rename...");

    // Verify move button is not present (replaced by rename in shift mode)
    cy.get(".button-panel .panel-button").should("not.contain", "Move");

    cy.screenshot("buttonpanel-shift-buttons");

    // Release shift key
    cy.get("body").trigger("keyup", {key: "Shift"});

    // Wait for change back to default
    cy.wait(100);

    // Verify back to default (move button should be back)
    cy.get(".button-panel .panel-button").should("contain", "Move");
    cy.get(".button-panel .panel-button").should("not.contain", "Rename...");
  });

  it("should switch to cmd buttons when meta key is pressed", () => {
    // Press and hold meta/cmd key
    cy.get("body").trigger("keydown", {key: "Meta", metaKey: true});

    // Wait a moment for the change to take effect
    cy.wait(100);

    // Verify that multirename button appears (specific to cmd mode)
    cy.get(".button-panel .panel-button").should("contain", "Multi Rename...");

    cy.screenshot("buttonpanel-cmd-buttons");

    // Release meta key
    cy.get("body").trigger("keyup", {key: "Meta", metaKey: false});

    // Wait for change back to default
    cy.wait(100);

    // Verify back to default
    cy.get(".button-panel .panel-button").should("contain", "Move");
    cy.get(".button-panel .panel-button").should("not.contain", "Multi Rename...");
  });

  it("should switch to alt buttons when alt key is pressed", () => {
    // Press and hold alt key
    cy.get("body").trigger("keydown", {key: "Alt", altKey: true});

    // Wait a moment for the change to take effect
    cy.wait(100);

    // Verify that multirename button appears (specific to alt mode)
    cy.get(".button-panel .panel-button").should("contain", "Multi Rename...");

    cy.screenshot("buttonpanel-alt-buttons");

    // Release alt key
    cy.get("body").trigger("keyup", {key: "Alt", altKey: false});

    // Wait for change back to default
    cy.wait(100);

    // Verify back to default
    cy.get(".button-panel .panel-button").should("contain", "Move");
    cy.get(".button-panel .panel-button").should("not.contain", "Multi Rename...");
  });

  it("should handle multiple modifier keys with correct priority", () => {
    // Press both shift and alt keys simultaneously
    cy.get("body").trigger("keydown", {key: "Alt", altKey: true, shiftKey: true});

    // Wait a moment for the change to take effect
    cy.wait(100);

    // Alt should have priority over shift, so multirename should be visible
    cy.get(".button-panel .panel-button").should("contain", "Multi Rename...");

    cy.screenshot("buttonpanel-multiple-modifiers");

    // Release alt key first (shift still pressed)
    cy.get("body").trigger("keyup", {key: "Alt", altKey: false, shiftKey: true});
    cy.wait(100);

    // Now shift should be active, so rename should be visible
    cy.get(".button-panel .panel-button").should("contain", "Rename...");
    cy.get(".button-panel .panel-button").should("not.contain", "Multi Rename...");

    // Release shift key
    cy.get("body").trigger("keyup", {key: "Shift", shiftKey: false});

    // Wait for change back to default
    cy.wait(100);

    // Verify back to default
    cy.get(".button-panel .panel-button").should("contain", "Move");
    cy.get(".button-panel .panel-button").should("not.contain", "Multi Rename...");
    cy.get(".button-panel .panel-button").should("not.contain", "Rename...");
  });

  it("should maintain button functionality during modifier key changes", () => {
    // Test that buttons exist and maintain their structure during modifier key changes
    cy.get(".button-panel .panel-button").should("have.length.at.least", 6);

    // Press shift key
    cy.get("body").trigger("keydown", {key: "Shift", shiftKey: true});
    cy.wait(100);

    // Buttons should still exist
    cy.get(".button-panel .panel-button").should("have.length.at.least", 6);

    // Release shift key
    cy.get("body").trigger("keyup", {key: "Shift", shiftKey: false});
    cy.wait(100);

    // Buttons should still exist
    cy.get(".button-panel .panel-button").should("have.length.at.least", 6);

    cy.screenshot("buttonpanel-functionality-maintained");
  });

  it("should handle rapid modifier key changes without issues", () => {
    // Rapidly press and release different modifier keys
    for (let i = 0; i < 5; i++) {
      cy.get("body").trigger("keydown", {key: "Shift", shiftKey: true});
      cy.wait(50);
      cy.get("body").trigger("keyup", {key: "Shift", shiftKey: false});
      cy.wait(50);

      cy.get("body").trigger("keydown", {key: "Alt", altKey: true});
      cy.wait(50);
      cy.get("body").trigger("keyup", {key: "Alt", altKey: false});
      cy.wait(50);
    }

    // Should end up back at default state
    cy.get(".button-panel .panel-button").should("contain", "Move");
    cy.get(".button-panel .panel-button").should("not.contain", "Rename...");
    cy.get(".button-panel .panel-button").should("not.contain", "Multi Rename...");

    cy.screenshot("buttonpanel-rapid-changes");
  });
});