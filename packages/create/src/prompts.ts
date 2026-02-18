/**
 * Dynamic Prompts - Execute template-specific prompts using Enquirer
 */

import Enquirer from 'enquirer';
import type { TemplatePrompt } from './template-loader.js';

const enquirer = new Enquirer();

/**
 * Run template-specific prompts and return the answers
 */
export async function runTemplatePrompts(
  prompts: TemplatePrompt[],
  previousAnswers: Record<string, any> = {}
): Promise<Record<string, any>> {
  if (!prompts || prompts.length === 0) {
    return {};
  }

  const enquirerPrompts = prompts.map((p) => {
    // Build the prompt configuration
    const promptConfig: Record<string, any> = {
      type: p.type,
      name: p.name,
      message: p.message,
      initial: p.default,
      choices: p.choices,
    };

    // Handle validation function
    if (p.validate) {
      try {
        // Create a function from the validate string
        // The validate string should be like: "value => value.trim().length > 0 || 'Error message'"
        const validateFn = new Function('value', 'return ' + p.validate);
        promptConfig.validate = (value: any) => {
          try {
            return validateFn(value);
          } catch {
            return true;
          }
        };
      } catch {
        // If validation function creation fails, skip validation
      }
    }

    // Handle conditional display (when)
    if (p.when) {
      promptConfig.skip = (answers: any) => {
        try {
          // Merge previous answers with current answers
          const allAnswers = { ...previousAnswers, ...answers };
          // Create a function to evaluate the when condition
          const conditionFn = new Function('answers', `with(answers) { return ${p.when}; }`);
          const shouldShow = conditionFn(allAnswers);
          // Return true to skip (hide) when condition is false
          return !shouldShow;
        } catch {
          // If evaluation fails, show the prompt
          return false;
        }
      };
    }

    return promptConfig;
  });

  try {
    const result = await enquirer.prompt(enquirerPrompts);
    return result;
  } catch (error) {
    // Handle cancellation (Ctrl+C)
    if ((error as any).cursor === 0 && !(error as any).state) {
      console.log('\n\nPrompt cancelled.');
      process.exit(0);
    }
    throw error;
  }
}

/**
 * Validate a single prompt value
 */
export function validatePromptValue(
  value: any,
  validate?: string
): true | string {
  if (!validate) {
    return true;
  }

  try {
    const validateFn = new Function('value', 'return ' + validate);
    const result = validateFn(value);
    return result === true ? true : (result || 'Invalid value');
  } catch (error) {
    return 'Validation error';
  }
}
