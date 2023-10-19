import ts from "typescript";

export function isPropertyPrivate(property: ts.Symbol) {
  const declarations = property.getDeclarations();

  if (!declarations) {
    return false;
  }

  let isPrivateFlag = false;

  for (const declaration of declarations) {
    isPrivateFlag = isPrivateFlag || !!(ts.getCombinedModifierFlags(declaration) & ts.ModifierFlags.Private);
  }

  return isPrivateFlag;
}
