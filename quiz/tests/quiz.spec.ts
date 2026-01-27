import { test, expect } from '@playwright/test';


test('User kann sich registrieren, einloggen und ausloggen. User kann ein Quiz erstellen zu diesem Fragen hinzufügen und zu diesen Antworten hinzufügen.', async ({ page }) => {

  const username = `testuser_${Date.now()}`;
  const password = 'secret123';
  const quizpublic = `qpub_${Date.now()}`;
  const quest = `quest_${Date.now()}`;
  const answer = `answ_${Date.now()}`;
  const quizprivate = `qpriv_${Date.now()}`;

  await page.goto('http://localhost:5173');

  await page.click('button[name="btn-switch-signup"]');
  const submitButton = page.locator('button[name="btn-signup-submit"]');

  await page.fill('#signup-username', username);
  await page.fill('#signup-password', password);

  const error = page.getByTestId('signup-password-mismatch');
  await expect(error).toBeVisible();

  await page.fill('#signup-password-repeat', password);
  await expect(error).toBeHidden();

  await expect(submitButton).toBeEnabled();
  await submitButton.click();

  await expect(page.getByTestId('login-form')).toBeVisible();

  await page.click('button[name="btn-switch-login"]');
  await expect(page.getByTestId('login-form')).toBeVisible();

  await page.fill('#login-username', username);
  await page.fill('#login-password', password);

  await page.click('button[name="btn-login-submit"]');

  await page.waitForSelector('#main-quiz-section');

  await expect(page.getByTestId('create-quiz-section')).toBeVisible();
  await page.fill('#quiz-name-input', quizpublic);
  await page.fill('#quiz-time-input', "10");

  const publicRadio = page.locator('#quiz-visibility-public-radio');

  await publicRadio.click();
  await expect(publicRadio).toBeChecked();

  const submitQuiz = page.locator('button[name="create-quiz-submit"]');
  await expect(submitQuiz).toBeEnabled();
  await submitQuiz.click();

  await expect(page.locator('#quiz-list-section')).toBeVisible();

  const row = page.locator('tr', { hasText: quizpublic });
  await row.locator('button', { hasText: 'edit' }).click();

  await expect(page.locator('#edit-quiz-question-container')).toBeVisible();

  const editQuiz = page.locator('#nav-questions-button');

  await expect(editQuiz).toBeVisible();
  await expect(editQuiz).toBeEnabled();
  await editQuiz.click();

  await expect(page.locator('#new-question-box')).toBeVisible();

  await page.fill('#new-question-input', quest);
  await page.selectOption('#new-question-type-select', 'Multiple choice');

  const addQuest = page.locator('#add-question-button');

  await expect(addQuest).toBeVisible();
  await expect(addQuest).toBeEnabled();
  await addQuest.click();

  const questionInput = page.locator('#edit-quiz-question-container input[type="text"]');

  await expect(questionInput).toHaveValue(quest);

  const firstQuestionRow = page.locator('#questions-table tbody tr').first();

  const addAnswerSection = firstQuestionRow.locator('div[id^="add-answer-section-"]').first();
  await expect(addAnswerSection).toBeVisible();

  const addAnswerInput = addAnswerSection.locator('input[id^="new-answer-input-"]').first();
  await addAnswerInput.fill(answer);

  const addAnswerButton = addAnswerSection.locator('button[id^="add-answer-button-"]').first();
  await expect(addAnswerButton).toBeEnabled();
  await addAnswerButton.click();

  const AnswerField = firstQuestionRow.locator("p[id^='answer-text-']").first();
  await expect(AnswerField).toHaveText(answer + " (Falsch)");

  await page.click('#logout-button');

  await expect(page.getByTestId('form-signup')).toBeVisible();
});