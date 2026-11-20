// A map's SVG takes keyboard focus (pan and zoom by keys) but never shows a focus ring (19 Nov
// 2026, the user's wish: a click then any key, a screenshot's shortcut too, drew one round
// the whole map). Its keyboard focus shows as its hint (components/map/MapKeyboardHint), and
// only when the map was reached by Tab: a press marks the SVG until it loses focus, so keys
// pressed after a click never show it. Put these on the SVG as onPointerDownCapture and onBlur.
export const markPointerFocus = (e) => e.currentTarget.setAttribute('data-pointer-focus', '');
export const clearPointerFocus = (e) => e.currentTarget.removeAttribute('data-pointer-focus');
