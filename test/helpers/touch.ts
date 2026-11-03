/** Touch sequences for interaction tests. happy-dom implements TouchEvent. */

export function touchPoint(element: Element, x: number, y: number, identifier = 1): Touch {
  return new Touch({ identifier, target: element, clientX: x, clientY: y });
}

export function touchStart(element: Element, x: number, y: number): void {
  const from = touchPoint(element, x, y);
  element.dispatchEvent(
    new TouchEvent("touchstart", {
      bubbles: true,
      cancelable: true,
      touches: [from],
      changedTouches: [from],
    }),
  );
}

export function touchMove(element: Element, x: number, y: number): void {
  const to = touchPoint(element, x, y);
  element.dispatchEvent(
    new TouchEvent("touchmove", {
      bubbles: true,
      cancelable: true,
      touches: [to],
      changedTouches: [to],
    }),
  );
}

export function touchEnd(element: Element, x: number, y: number): void {
  const to = touchPoint(element, x, y);
  element.dispatchEvent(
    new TouchEvent("touchend", {
      bubbles: true,
      cancelable: true,
      touches: [],
      changedTouches: [to],
    }),
  );
}

export function swipe(element: Element, from: [number, number], to: [number, number]): void {
  touchStart(element, from[0], from[1]);
  touchMove(element, to[0], to[1]);
  touchEnd(element, to[0], to[1]);
}
