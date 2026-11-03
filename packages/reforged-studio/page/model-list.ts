/**
 * The edit of a list of models (#839), the value of a `modelList` field,
 * which the model picker adds to.
 */

/**
 * A list of models with one more, at its end: the list's entries trimmed,
 * the empty ones dropped, and the model left out when the list holds it.
 */
export function addModel(list: string, model: string): string {
  const models = list
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry !== "");
  const held = models.some(
    (entry) => entry.toLowerCase() === model.toLowerCase(),
  );
  return (held ? models : [...models, model]).join(",");
}
