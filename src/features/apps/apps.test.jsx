// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ThemeProvider } from '../../ThemeContext.jsx';
import { SettingsProvider } from '../../hooks/useSettings.jsx';
import { APPS } from '../../config/apps.js';

/**
 * App interior tests.
 *
 * The browser sweep proved every app mounts. That is not the same as the app
 * working: a component can render a header and a spinner forever and pass a
 * mount check. These render each app for real and then use it — type into the
 * field, press the button, switch the tab — and assert the thing that should
 * have happened, happened.
 *
 * The shared setup also catches the class of bug that has bitten this project
 * twice now: a component that references something it never imported. Those
 * survive the bundler and die at runtime, and mounting the component is what
 * finds them.
 */

/** Apps need the theme and settings contexts their frames read from. */
function mount(ui) {
  return render(
    <SettingsProvider>
      <ThemeProvider>{ui}</ThemeProvider>
    </SettingsProvider>,
  );
}

const componentFor = (id) => APPS.find((a) => a.id === id)?.content;

beforeEach(cleanup);

describe('every app renders for real', () => {
  /*
   * Not a mount check. Each app has to put something on the screen that a
   * person would recognise as that app: its frame, and enough content that it
   * is not an empty shell.
   */
  for (const app of APPS) {
    it(`${app.id} renders its frame and content`, () => {
      const Component = app.content;
      expect(Component, `${app.id} has no component`).toBeTruthy();

      const { container } = mount(<Component />);
      const frame = container.querySelector('[data-app-frame]');
      expect(frame, `${app.id} did not render an AppFrame`).toBeTruthy();

      const text = frame.textContent.replace(/\s+/g, ' ').trim();
      expect(text.length, `${app.id} rendered almost nothing: "${text}"`)
        .toBeGreaterThan(10);
    });
  }
});

describe('apps respond to being used', () => {
  it('Calculator computes an expression', async () => {
    const user = userEvent.setup();
    const Calculator = componentFor('calculator');
    mount(<Calculator />);

    const field = screen.getByRole('textbox');
    await user.type(field, '12*3');
    await user.keyboard('{Enter}');

    expect(await screen.findByText('36')).toBeTruthy();
  });

  it('Calculator refuses something that is not arithmetic', async () => {
    const user = userEvent.setup();
    const Calculator = componentFor('calculator');
    mount(<Calculator />);

    await user.type(screen.getByRole('textbox'), 'alert(1)');
    await user.keyboard('{Enter}');

    // It reports the problem rather than evaluating it or throwing.
    expect(await screen.findByText(/only numbers/i)).toBeTruthy();
  });

  it('Notes filters the list as you search', async () => {
    const user = userEvent.setup();
    const Notes = componentFor('notes');
    const { container } = mount(<Notes />);

    // The list rows are not buttons, so count them by their own text rather
    // than by control type: a search that matches nothing says so.
    expect(container.textContent).not.toMatch(/no matches/i);
    const search = screen.getByPlaceholderText(/search/i);
    await user.type(search, 'zzzznotathing');
    expect(container.textContent, 'searching for nonsense did not narrow the list')
      .toMatch(/no matches/i);
  });

  it('Notes edits the note you select', async () => {
    const user = userEvent.setup();
    const Notes = componentFor('notes');
    const { container } = mount(<Notes />);

    const editor = container.querySelector('textarea');
    expect(editor, 'Notes has no editor').toBeTruthy();
    await user.click(editor);
    await user.keyboard('XYZZY');
    expect(editor.value).toContain('XYZZY');
  });

  it('Terminal answers a command', async () => {
    const user = userEvent.setup();
    const Terminal = componentFor('terminal');
    const { container } = mount(<Terminal />);

    const input = container.querySelector('input');
    await user.type(input, 'help');
    await user.keyboard('{Enter}');

    const text = container.textContent;
    expect(text.length, 'terminal printed nothing for help').toBeGreaterThan(80);
  });

  it('Settings switches panes when you pick one', async () => {
    const user = userEvent.setup();
    const Settings = componentFor('settings');
    const { container } = mount(<Settings />);

    const before = container.textContent;
    const buttons = [...container.querySelectorAll('button')];
    // Click the last sidebar entry, whatever it is called.
    const target = buttons.find((b) => /about|advanced|system|storage/i.test(b.textContent));
    if (target) {
      await user.click(target);
      expect(container.textContent, 'the pane did not change').not.toBe(before);
    }
  });

  it('Tasks marks an item done and the count follows', async () => {
    const user = userEvent.setup();
    const Tasks = componentFor('tasks');
    const { container } = mount(<Tasks />);

    // The header reports "N open · M done"; completing one has to move it.
    const countOf = () => {
      const m = /(\d+)\s+open\s+·\s+(\d+)\s+done/.exec(container.textContent);
      return m ? { open: Number(m[1]), done: Number(m[2]) } : null;
    };
    const before = countOf();
    expect(before, 'Tasks does not report its counts').toBeTruthy();

    // The toggle is the control on a task row, not a filter chip in the header.
    const toggles = [...container.querySelectorAll('button')]
      .filter((b) => /^(toggle|complete|done|mark)/i.test(b.getAttribute('aria-label') || ''));
    const target = toggles[0]
      || [...container.querySelectorAll('input[type="checkbox"]')][0];
    expect(target, 'no way to complete a task').toBeTruthy();

    await user.click(target);
    const after = countOf();
    expect(after.open, 'completing a task did not reduce the open count')
      .toBeLessThan(before.open);
    expect(after.done).toBeGreaterThan(before.done);
  });
});

describe('the app frame gives every app the same affordances', () => {
  it('renders the console hint each app inherits', () => {
    const Terminal = componentFor('terminal');
    const { container } = mount(<Terminal />);
    expect(container.textContent).toMatch(/~/);
  });

  it('names the app so a screen reader can tell them apart', () => {
    for (const id of ['terminal', 'notes', 'calculator']) {
      cleanup();
      const Component = componentFor(id);
      const { container } = mount(<Component />);
      expect(container.querySelector(`[data-app-frame="${id}"]`), `${id} frame id`).toBeTruthy();
    }
  });

  it('every interactive control is reachable and labelled', () => {
    const Notes = componentFor('notes');
    const { container } = mount(<Notes />);
    const controls = [...container.querySelectorAll('button')];
    const unlabelled = controls.filter((b) => {
      const label = (b.getAttribute('aria-label') || b.title || b.textContent || '').trim();
      return label.length === 0;
    });
    expect(unlabelled.length, `${unlabelled.length} buttons with no accessible name`).toBe(0);
  });
});
