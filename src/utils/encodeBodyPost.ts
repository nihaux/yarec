export const encodeBodyPost = (bodyObject: Record<string, string>) =>
  Object.entries(bodyObject)
    .map(([key, value]) => {
      return encodeURIComponent(key) + '=' + encodeURIComponent(value);
    })
    .join('&');
