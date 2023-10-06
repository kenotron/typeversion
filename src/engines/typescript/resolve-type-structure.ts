import ts from "typescript";
import { isPropertyPrivate } from "./is-property-private";

export function getResolvedType(
  type: ts.Type,
  checker: ts.TypeChecker,
  program: ts.Program
): string {
  // Recurse into the generics type arguments
  if (type.getFlags() & ts.TypeFlags.Object) {
    const objectType = type as ts.ObjectType;
    if (objectType.objectFlags & ts.ObjectFlags.Reference) {
      const referenceType = objectType as ts.TypeReference;

      const hasTypeArgs =
        referenceType.typeArguments && referenceType.typeArguments.length > 0;

      if (!hasTypeArgs) {
        return checker.typeToString(type);
      }

      const resolvedTypeArguments = referenceType.typeArguments?.map((type) =>
        getResolvedType(type, checker, program)
      );

      return `${referenceType.getSymbol()!.name}<${resolvedTypeArguments?.join(
        ", "
      )}>`;
    }
  }

  // We will only crawl up the types that are within the same package:
  // these types should be guarded by semver rules in the package.json
  const declSourceFile = getOriginSourceFile(type);

  if (declSourceFile && program.isSourceFileDefaultLibrary(declSourceFile)) {
    return checker.typeToString(type);
  }

  if (
    declSourceFile &&
    program.isSourceFileFromExternalLibrary(declSourceFile)
  ) {
    return checker.typeToString(type);
  }

  if (type.getFlags() & ts.TypeFlags.UnionOrIntersection) {
    const unionType = type as ts.UnionType | ts.IntersectionType;
    const resolvedTypes = unionType.types.map((type) =>
      getResolvedType(type, checker, program)
    );

    return resolvedTypes.join(
      unionType.getFlags() & ts.TypeFlags.Union ? " | " : " & "
    );
  } else if (type.getFlags() & ts.TypeFlags.Object) {
    const members = checker.getPropertiesOfType(type);
    const resolvedMembers = members
      .sort((a, b) => (a.escapedName > b.escapedName ? 1 : -1))
      .map((member) => {
        if (isPropertyPrivate(member)) {
          return;
        }

        const memberType = checker.getTypeOfSymbolAtLocation(
          member,
          member.valueDeclaration!
        );

        return `${member.name}: ${getResolvedType(
          memberType,
          checker,
          program
        )}`;
      });

    return `{ ${resolvedMembers.filter(Boolean).join(", ")} }`;
  }

  return checker.typeToString(type);
}

function getOriginSourceFile(type: ts.Type) {
  const symbol = type.getSymbol();

  if (symbol && symbol.valueDeclaration) {
    return symbol.valueDeclaration.getSourceFile();
  } else {
    const declarations = symbol?.getDeclarations();

    if (declarations && declarations.length === 1) {
      return declarations[0].getSourceFile();
    }
  }
}
