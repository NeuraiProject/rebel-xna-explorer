export function getParam(_name: string) {
  const segments = window.location.pathname.split("/").filter(Boolean);
  if (segments.length >= 2) {
    return decodeURIComponent(segments[1]);
  }
  return null;
}
