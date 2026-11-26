// An icon from react-icons as plain shapes a canvas can draw (a badge's share card,
// drawShareCard.js drawBadgeSticker): its viewBox and the `d` of each path. A react-icons
// icon is a plain function that returns its <svg> element with the paths as children, so
// calling it (no hooks, nothing drawn) hands them over without React's server renderer.

/** `{ viewBox: [x, y, width, height], paths: [d, …] }` for a react-icons component, or null. */
export function iconShape(Icon) {
  if (typeof Icon !== 'function') return null;
  let element;
  try {
    element = Icon({});
  } catch {
    return null;
  }
  const viewBox = String(element?.props?.attr?.viewBox || '')
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  const paths = [];
  const walk = (children) => {
    for (const child of [].concat(children ?? [])) {
      if (!child || typeof child !== 'object') continue;
      if (child.type === 'path' && child.props?.d) paths.push(child.props.d);
      walk(child.props?.children);
    }
  };
  walk(element?.props?.children);
  if (viewBox.length !== 4 || viewBox.some((n) => !Number.isFinite(n)) || !paths.length) return null;
  return { viewBox, paths };
}
