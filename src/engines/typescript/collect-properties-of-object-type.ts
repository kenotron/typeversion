import ts from "typescript";
import { isPropertyPrivate } from "./is-property-private";

// Recursively collect all properties of a type
export function collectProperties(type: ts.Type, checker: ts.TypeChecker) {
  const properties: Record<string, { type: ts.Type; symbol: ts.Symbol }> = {};

  type
    .getProperties()
    .sort((a, b) => (a.escapedName > b.escapedName ? 1 : -1))
    .forEach((property) => {
      if (isPropertyPrivate(property)) {
        return;
      }

      const propertyType = checker.getTypeOfSymbol(property);
      properties[property.name] = { type: propertyType, symbol: property };
    });

  return properties;
}
