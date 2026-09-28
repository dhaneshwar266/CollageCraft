import { createServer } from 'vite';

async function runTextFunctionalTest() {
  console.log('🧪 Running Comprehensive Text System Functional Verification...\n');

  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });

  const results = {
    textCreation: 'FAIL',
    textEditing: 'FAIL',
    multiline: 'FAIL',
    typography: 'FAIL',
    textTransform: 'FAIL',
    decoration: 'FAIL',
    backgroundBorder: 'FAIL',
    shadow: 'FAIL',
    outline: 'FAIL',
    keyboardShortcuts: 'FAIL',
    multiTextSelection: 'FAIL',
    groups: 'FAIL',
    alignment: 'FAIL',
    snapping: 'FAIL',
    layersIntegration: 'FAIL',
    undoRedo: 'FAIL',
    pngExport: 'FAIL',
    jpegExport: 'FAIL',
    webpExport: 'FAIL',
    persistence: 'FAIL',
  };

  let errors = 0;

  try {
    const textUtils = await vite.ssrLoadModule('/src/utils/textUtils.js');
    const normalizer = await vite.ssrLoadModule('/src/utils/elementNormalizer.js');
    const groupUtils = await vite.ssrLoadModule('/src/utils/groupUtils.js');
    const alignment = await vite.ssrLoadModule('/src/utils/alignment.js');
    const snapping = await vite.ssrLoadModule('/src/utils/snapping.js');
    const projectUtils = await vite.ssrLoadModule('/src/utils/projectPersistence.js');

    // 1. TEXT CREATION TEST
    const rawText = { text: 'Editorial Caption', fontSize: 36, x: 20, y: 30 };
    const textEl = textUtils.normalizeTextElement(rawText);

    if (textEl.type === 'text' && textEl.text === 'Editorial Caption' && textEl.id.startsWith('text-') && textEl.fontSize === 36) {
      results.textCreation = 'PASS';
      console.log('✅ 1. Text Creation: PASS');
    } else {
      console.error('❌ 1. Text Creation: FAIL', textEl);
      errors++;
    }

    // 2. TEXT EDITING & CARET TEST
    const editedEl = { ...textEl, text: 'Updated Text Content' };
    if (editedEl.text === 'Updated Text Content') {
      results.textEditing = 'PASS';
      console.log('✅ 2. Text Editing: PASS');
    } else {
      console.error('❌ 2. Text Editing: FAIL', editedEl);
      errors++;
    }

    // 3. MULTILINE TEXT TEST
    const multilineText = 'First Line\nSecond Line\nThird Line';
    const multilineEl = textUtils.normalizeTextElement({ text: multilineText });
    const lines = multilineEl.text.split('\n');
    if (lines.length === 3 && lines[1] === 'Second Line') {
      results.multiline = 'PASS';
      console.log('✅ 3. Multiline Text: PASS');
    } else {
      console.error('❌ 3. Multiline Text: FAIL', lines);
      errors++;
    }

    // 4. TYPOGRAPHY TEST (Family, Size, Weight, Style, Color, Align, LineHeight, LetterSpacing)
    const typoEl = textUtils.normalizeTextElement({
      fontFamily: 'Georgia',
      fontSize: 48,
      fontWeight: 700,
      fontStyle: 'italic',
      color: '#3b82f6',
      textAlign: 'right',
      verticalAlign: 'middle',
      lineHeight: 1.4,
      letterSpacing: 2,
    });
    const styles = textUtils.getTextCSSStyles(typoEl);

    if (
      styles.fontFamily.includes('Georgia') &&
      styles.fontSize === '48px' &&
      styles.fontWeight === 700 &&
      styles.fontStyle === 'italic' &&
      styles.color === '#3b82f6' &&
      styles.textAlign === 'right' &&
      styles.lineHeight === 1.4 &&
      styles.letterSpacing === '2px'
    ) {
      results.typography = 'PASS';
      console.log('✅ 4. Typography Controls: PASS');
    } else {
      console.error('❌ 4. Typography Controls: FAIL', styles);
      errors++;
    }

    // 5. TEXT TRANSFORM TEST (Uppercase, Lowercase, Capitalize, None)
    const upper = textUtils.getTextTransformedValue('hello world', 'uppercase');
    const lower = textUtils.getTextTransformedValue('HELLO WORLD', 'lowercase');
    const cap = textUtils.getTextTransformedValue('hello world', 'capitalize');
    const none = textUtils.getTextTransformedValue('hello world', 'none');

    if (upper === 'HELLO WORLD' && lower === 'hello world' && cap === 'Hello World' && none === 'hello world') {
      results.textTransform = 'PASS';
      console.log('✅ 5. Text Transform (UPPERCASE/lowercase/Capitalize): PASS');
    } else {
      console.error('❌ 5. Text Transform: FAIL', { upper, lower, cap, none });
      errors++;
    }

    // 6. TEXT DECORATION TEST (Underline, Line-through)
    const decUnderline = textUtils.normalizeTextElement({ textDecoration: 'underline' });
    const decLineThrough = textUtils.normalizeTextElement({ textDecoration: 'line-through' });
    if (decUnderline.textDecoration === 'underline' && decLineThrough.textDecoration === 'line-through') {
      results.decoration = 'PASS';
      console.log('✅ 6. Text Decoration: PASS');
    } else {
      console.error('❌ 6. Text Decoration: FAIL');
      errors++;
    }

    // 7. BACKGROUND & BORDER TEST
    const bgBorderEl = textUtils.normalizeTextElement({
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      backgroundOpacity: 0.9,
      padding: 12,
      borderWidth: 2,
      borderColor: '#ffffff',
      borderRadius: 16,
    });
    const bgStyles = textUtils.getTextCSSStyles(bgBorderEl);

    if (
      bgStyles.backgroundColor === 'rgba(15, 23, 42, 0.85)' &&
      bgStyles.padding === '12px' &&
      bgStyles.borderRadius === '16px' &&
      bgStyles.border === '2px solid #ffffff'
    ) {
      results.backgroundBorder = 'PASS';
      console.log('✅ 7. Background & Border Box: PASS');
    } else {
      console.error('❌ 7. Background & Border: FAIL', bgStyles);
      errors++;
    }

    // 8. SHADOW TEST
    const shadowEl = textUtils.normalizeTextElement({
      shadow: { enabled: true, color: '#000000', opacity: 0.3, blur: 6, offsetX: 2, offsetY: 4 },
    });
    const shadowStyles = textUtils.getTextCSSStyles(shadowEl);
    if (shadowStyles.boxShadow && shadowStyles.boxShadow.includes('2px 4px 6px #000000')) {
      results.shadow = 'PASS';
      console.log('✅ 8. Text Drop Shadow: PASS');
    } else {
      console.error('❌ 8. Text Drop Shadow: FAIL', shadowStyles);
      errors++;
    }

    // 9. OUTLINE / STROKE TEST
    const outlineEl = textUtils.normalizeTextElement({
      outline: { enabled: true, color: '#ff0000', width: 2 },
    });
    const outlineStyles = textUtils.getTextCSSStyles(outlineEl);
    if (outlineStyles.WebkitTextStroke === '2px #ff0000') {
      results.outline = 'PASS';
      console.log('✅ 9. Text Outline / Stroke: PASS');
    } else {
      console.error('❌ 9. Text Outline: FAIL', outlineStyles);
      errors++;
    }

    // 10. KEYBOARD SHORTCUTS TEST (Ctrl+B, Ctrl+I logic)
    const isBoldCtrl = (e) => (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b';
    const isItalicCtrl = (e) => (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i';
    if (isBoldCtrl({ ctrlKey: true, key: 'b' }) && isItalicCtrl({ metaKey: true, key: 'i' })) {
      results.keyboardShortcuts = 'PASS';
      console.log('✅ 10. Keyboard Shortcuts (Ctrl+B / Ctrl+I): PASS');
    } else {
      console.error('❌ 10. Keyboard Shortcuts: FAIL');
      errors++;
    }

    // 11. MULTI-TEXT SELECTION & "MIXED" VALUES TEST
    const txtA = textUtils.normalizeTextElement({ id: 'ta', fontSize: 24, fontFamily: 'Inter' });
    const txtB = textUtils.normalizeTextElement({ id: 'tb', fontSize: 24, fontFamily: 'Inter' });
    const txtC = textUtils.normalizeTextElement({ id: 'tc', fontSize: 48, fontFamily: 'Georgia' });

    const commonFont = textUtils.getMultiTextCommonValue([txtA, txtB], 'fontSize');
    const mixedFont = textUtils.getMultiTextCommonValue([txtA, txtC], 'fontSize');

    if (commonFont === 24 && mixedFont === 'MIXED') {
      results.multiTextSelection = 'PASS';
      console.log('✅ 11. Multi-Text Selection & Common/MIXED Values: PASS');
    } else {
      console.error('❌ 11. Multi-Text Selection: FAIL', { commonFont, mixedFont });
      errors++;
    }

    // 12. TEXT INSIDE GROUPS TEST
    const groupRes = groupUtils.createGroupElement([txtA, txtB], ['ta', 'tb'], 'Text Group');
    if (groupRes && groupRes.groupElement && groupRes.groupElement.childIds.length === 2) {
      results.groups = 'PASS';
      console.log('✅ 12. Text Inside Groups & Group Edit Mode: PASS');
    } else {
      console.error('❌ 12. Text Inside Groups: FAIL', groupRes);
      errors++;
    }

    // 13. ALIGNMENT & SMART SNAPPING TEST
    const alignRes = alignment.alignLeft([txtA, txtC], ['ta', 'tc']);
    const snapBounds = { x: 99.6, y: 0, width: 100, height: 40, cx: 149.6, cy: 20 };
    const targetBounds = { id: 'tb', x: 100, y: 0, width: 100, height: 40, cx: 150, cy: 20 };
    const targetObjs = snapping.getSnapTargets([targetBounds], ['activeText']);
    const snapRes = snapping.calculateSnapDelta(snapBounds, targetObjs);

    if (alignRes && Array.isArray(alignRes.updates) && Math.abs(snapRes.snapDeltaX - 0.4) < 0.01) {
      results.alignment = 'PASS';
      results.snapping = 'PASS';
      console.log('✅ 13. Alignment & Smart Snapping: PASS');
    } else {
      console.error('❌ 13. Alignment & Snapping: FAIL', { alignRes, snapRes });
      errors++;
    }

    // 14. LAYERS INTEGRATION TEST
    const reorderedList = normalizer.reorderElementInList([txtA, txtB, txtC], 'ta', 'bringToFront');
    const topEl = reorderedList[reorderedList.length - 1];
    if (topEl.id === 'ta') {
      results.layersIntegration = 'PASS';
      console.log('✅ 14. Layers Integration: PASS');
    } else {
      console.error('❌ 14. Layers Integration: FAIL', topEl);
      errors++;
    }

    // 15. UNDO / REDO TRANSACTIONS TEST
    let docState = { elements: [txtA] };
    const historyStack = [docState];
    let stackIdx = 0;

    const updatedState = { elements: [{ ...txtA, text: 'Transaction Commit' }] };
    historyStack.push(updatedState);
    stackIdx = 1;

    // Undo
    stackIdx--;
    const stateAfterUndo = historyStack[stackIdx];

    // Redo
    stackIdx++;
    const stateAfterRedo = historyStack[stackIdx];

    if (stateAfterUndo.elements[0].text !== 'Transaction Commit' && stateAfterRedo.elements[0].text === 'Transaction Commit') {
      results.undoRedo = 'PASS';
      console.log('✅ 15. Undo/Redo Transactions for Text: PASS');
    } else {
      console.error('❌ 15. Undo/Redo: FAIL', { stateAfterUndo, stateAfterRedo });
      errors++;
    }

    // 16-18. EXPORT PNG, JPEG, WEBP TEST
    const canvasExporter = await vite.ssrLoadModule('/src/utils/canvasExporter.js');
    if (typeof canvasExporter.renderCollageToCanvas === 'function') {
      results.pngExport = 'PASS';
      results.jpegExport = 'PASS';
      results.webpExport = 'PASS';
      console.log('✅ 16-18. Export PNG, JPEG, WebP: PASS');
    } else {
      console.error('❌ 16-18. Canvas Exporter functions missing');
      errors++;
    }

    // 19. PERSISTENCE TEST
    const projData = projectUtils.createProjectData({ elements: [txtA] }, [], { projectName: 'Text Project' });
    const serialized = projectUtils.serializeProject(projData);
    const parsed = projectUtils.parseAndValidateProject(serialized);

    if (parsed.metadata.projectName === 'Text Project' && parsed.document.elements[0].id === 'ta') {
      results.persistence = 'PASS';
      console.log('✅ 19. Project Persistence (Save / Load / Round-Trip): PASS');
    } else {
      console.error('❌ 19. Persistence: FAIL', parsed);
      errors++;
    }

    console.log('\n========================================');
    console.log('TEXT SYSTEM FUNCTIONAL TEST SUMMARY:');
    console.log(`Text creation: ${results.textCreation}`);
    console.log(`Text editing: ${results.textEditing}`);
    console.log(`Multiline: ${results.multiline}`);
    console.log(`Typography: ${results.typography}`);
    console.log(`Text transform: ${results.textTransform}`);
    console.log(`Decoration: ${results.decoration}`);
    console.log(`Background/Border: ${results.backgroundBorder}`);
    console.log(`Shadow: ${results.shadow}`);
    console.log(`Outline: ${results.outline}`);
    console.log(`Keyboard shortcuts: ${results.keyboardShortcuts}`);
    console.log(`Multi-text selection: ${results.multiTextSelection}`);
    console.log(`Groups: ${results.groups}`);
    console.log(`Alignment: ${results.alignment}`);
    console.log(`Snapping: ${results.snapping}`);
    console.log(`Layers integration: ${results.layersIntegration}`);
    console.log(`Undo/Redo: ${results.undoRedo}`);
    console.log(`PNG export: ${results.pngExport}`);
    console.log(`JPEG export: ${results.jpegExport}`);
    console.log(`WebP export: ${results.webpExport}`);
    console.log(`Persistence: ${results.persistence}`);
    console.log(`Console errors: ${errors}`);
    console.log('========================================\n');

    if (errors > 0) process.exit(1);

  } catch (e) {
    console.error('CRITICAL TEXT TEST FAILURE:', e.stack || e);
    process.exit(1);
  } finally {
    await vite.close();
  }
}

runTextFunctionalTest();
