import ts from "typescript";
import { isPropertyPrivate } from "./is-property-private";

export class TypeInformer {
  constructor(public checker: ts.TypeChecker) {}
  getSymbol(symbol: ts.Symbol) {
    if (symbol && symbol.getFlags() & ts.SymbolFlags.Alias) {
      return this.checker.getAliasedSymbol(symbol);
    }

    return symbol;
  }

  getSymbolForType(type: ts.Type) {
    return this.getSymbol(type.getSymbol());
  }

  isValueSymbol(symbol: ts.Symbol) {
    return symbol && !!(symbol.getFlags() & ts.SymbolFlags.Value);
  }

  isTypeSymbol(symbol: ts.Symbol) {
    if (symbol.valueDeclaration && ts.isTypeOnlyImportOrExportDeclaration(symbol.valueDeclaration)) {
      return true;
    }

    if (symbol.declarations && symbol.declarations.every((declaration) => ts.isTypeOnlyImportOrExportDeclaration(declaration))) {
      return true;
    }

    return symbol && !!(symbol.getFlags() & ts.SymbolFlags.Type);
  }

  isClass(type: ts.Type) {
    const symbol = this.getSymbolForType(type);
    return symbol && !!(symbol.getFlags() & ts.SymbolFlags.Class);
  }

  isInterface(type: ts.Type) {
    const symbol = this.getSymbolForType(type);
    return symbol && !!(symbol.getFlags() & ts.SymbolFlags.Interface);
  }

  isNamespace(type: ts.Type) {
    const symbol = this.getSymbolForType(type);
    return symbol && !!(symbol.getFlags() & ts.SymbolFlags.Namespace);
  }

  isEnum(type: ts.Type) {
    const symbol = this.getSymbolForType(type);
    return (symbol && !!(symbol.getFlags() & ts.SymbolFlags.Enum)) || (symbol && !!(symbol.getFlags() & ts.SymbolFlags.ConstEnum));
  }

  isFunction(type: ts.Type) {
    const symbol = this.getSymbolForType(type);
    return symbol && !!(symbol.getFlags() & ts.SymbolFlags.Function);
  }

  isTypeAlias(type: ts.Type) {
    const symbol = this.getSymbolForType(type);
    return symbol && !!(symbol.getFlags() & ts.SymbolFlags.TypeAlias);
  }

  isTypeLiteral(type: ts.Type) {
    const symbol = this.getSymbolForType(type);
    return symbol && !!(symbol.getFlags() & ts.SymbolFlags.TypeLiteral);
  }

  isObjectType(type: ts.Type) {
    return this.isClass(type) || this.isInterface(type) || this.isTypeLiteral(type);
  }

  /**
   * A type is user-constructible if the consumer of a package is allowed to create their own objects which match a given type structurally, that is, without using a function or class exported from the package which provides the type.
   * See: https://www.semver-ts.org/
   * @param symbol
   * @returns
   */
  isUserConstructible(type: ts.Type) {
    if (!this.isObjectType(type)) {
      return false;
    }

    const symbol = this.getSymbolForType(type);

    let hasConstructorSignature = false;
    let hasPrivateProperty = false;

    for (const [name, member] of symbol.members) {
      if (member.getFlags() & ts.SymbolFlags.Signature && name === ts.InternalSymbolName.New) {
        hasConstructorSignature = true;
        break;
      }

      if (type.isClass() && isPropertyPrivate(member)) {
        hasPrivateProperty = true;
        break;
      }
    }

    return !hasConstructorSignature && !hasPrivateProperty;
  }

  getTypeOfExport(exportSymbol: ts.Symbol): ts.Type | undefined {
    // Handle aliases
    if (exportSymbol.getFlags() & ts.SymbolFlags.Alias) {
      return this.getTypeOfExport(this.checker.getAliasedSymbol(exportSymbol));
    }

    // Find the declaration from baseExport that is a type
    let typeDeclaration: ts.Declaration;
    for (const declaration of exportSymbol.declarations) {
      if (
        ts.isTypeAliasDeclaration(declaration) ||
        ts.isInterfaceDeclaration(declaration) ||
        ts.isClassDeclaration(declaration) ||
        ts.isTypeLiteralNode(declaration)
      ) {
        typeDeclaration = declaration;
      }

      typeDeclaration = declaration;
    }

    if (typeDeclaration) {
      return this.checker.getTypeAtLocation(typeDeclaration);
    }

    return undefined;
  }

  collectProperties(type: ts.Type) {
    const properties: Record<string, { type: ts.Type; symbol: ts.Symbol }> = {};
    type
      .getProperties()
      .sort((a, b) => (a.escapedName > b.escapedName ? 1 : -1))
      .forEach((property) => {
        if (isPropertyPrivate(property)) {
          return;
        }

        const propertyType = this.checker.getTypeOfSymbol(property);
        properties[property.name] = { type: propertyType, symbol: property };
      });

    return properties;
  }
}
