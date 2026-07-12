// Converts between screen/stage pixels and image-space pixels, given the
// current fit-to-container scale and letterbox offset. Storing points in
// image-space (not screen-space) means a canvas resize or a reload with a
// differently-sized container still maps saved points onto the same
// underlying image pixel — only the transform changes, not the data.

export interface ImageTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export function screenToImage(
  [x, y]: [number, number],
  transform: ImageTransform,
): [number, number] {
  return [
    (x - transform.offsetX) / transform.scale,
    (y - transform.offsetY) / transform.scale,
  ];
}

export function imageToScreen(
  [x, y]: [number, number],
  transform: ImageTransform,
): [number, number] {
  return [
    x * transform.scale + transform.offsetX,
    y * transform.scale + transform.offsetY,
  ];
}
