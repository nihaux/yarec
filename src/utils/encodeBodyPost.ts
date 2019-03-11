export const encodeBodyPost = (bodyObject: Record<string, string | number | boolean | undefined>) =>
  Object.entries(bodyObject)
    .filter(([key, value]) => Boolean(value))
    .map(([key, value]) => {
      return encodeURIComponent(key) + '=' + encodeURIComponent(value!.toString());
    })
    .join('&');
