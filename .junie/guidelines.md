# Development Guidelines

## Best Practices

- **IMPORTANT NOTICE**: For angular refer to the comprehensive guide at `.junie/instructions_angular.md` for detailed
  implementation instructions.
- **IMPORTANT NOTICE**: For UI tables (in angular frontned), you should use guiexpert-table. Please refer to the
  comprehensive guide at `.junie/instructions_guiexpert-table.md` for detailed implementation instructions.
- **IMPORTANT NOTICE**: When you are working on apps/fnf/src/edit.html: Please refer to the comprehensive guide at
  `.junie/instructions_plain_html-edit.md` for detailed implementation instructions.
- **IMPORTANT NOTICE**: When you create notes or a TODO list for your analysis, you should write them down in MD syntax
  as file into the folder `.junie/temp/`.


- After receiving tool results, carefully reflect on their quality and determine optimal next steps before proceeding.
  Use your thinking to plan and iterate based on this new information, and then take the best next action.
- If you create any temporary new scripts, or helper files for iteration, clean up these files by removing them at the
  end of the task.
- Write unit tests (jest) for components and services.
- Write e2e tests (cypress) for components.
- Please write a high quality, general purpose solution. Implement a solution that works correctly for all valid inputs,
  not just the test cases. Do not hard-code values or create solutions that only work for specific test inputs. Instead,
  implement the actual logic that solves the problem generally.
- Focus on understanding the problem requirements and implementing the correct algorithm. Tests are there to verify
  correctness, not to define the solution. Provide a principled implementation that follows best practices and software
  design principles.
- If the task is unreasonable or infeasible, or if any of the tests are incorrect, please tell me. The solution should
  be robust, maintainable, and extendable.

[//]: # (You will find your public SSH key here: 'fnf-mr-junie.pub')