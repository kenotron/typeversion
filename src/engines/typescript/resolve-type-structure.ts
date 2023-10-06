import ts from "typescript";

export function getResolvedType(
  type: ts.Type,
  checker: ts.TypeChecker
): string {
  if (type.getFlags() & ts.TypeFlags.UnionOrIntersection) {
    const unionType = type as ts.UnionType | ts.IntersectionType;
    const resolvedTypes = unionType.types.map((type) =>
      getResolvedType(type, checker)
    );

    return resolvedTypes.join(" UNION/INTERSECTION ");
  } else if (type.getFlags() & ts.TypeFlags.Object) {
    return "YO";
  }

  return checker.typeToString(type) ?? "unknown";
}
