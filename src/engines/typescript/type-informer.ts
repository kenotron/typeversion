import ts from "typescript";
import { isPropertyPrivate } from "./is-property-private";

export class TypeInformer {
  constructor(public checker: ts.TypeChecker) {}
  getSymbol(type: ts.Type) {
    if (type.symbol && type.symbol.getFlags() & ts.SymbolFlags.Alias) {
      return this.checker.getAliasedSymbol(type.symbol);
    }

    return type.symbol;
  }
  isValueType(type: ts.Type) {
    const symbol = this.getSymbol(type);
    return !!(symbol.getFlags() & ts.SymbolFlags.Value);
  }

  isCheckedType(type: ts.Type) {
    const symbol = this.getSymbol(type);
    return !!(symbol.getFlags() & ts.SymbolFlags.Value);
  }

  isClass(type: ts.Type) {
    const symbol = this.getSymbol(type);
    return !!(symbol.getFlags() & ts.SymbolFlags.Class);
  }

  isInterface(type: ts.Type) {
    const symbol = this.getSymbol(type);
    return !!(symbol.getFlags() & ts.SymbolFlags.Interface);
  }

  isNamespace(type: ts.Type) {
    const symbol = this.getSymbol(type);
    return !!(symbol.getFlags() & ts.SymbolFlags.Namespace);
  }

  isEnum(type: ts.Type) {
    const symbol = this.getSymbol(type);
    return (
      !!(symbol.getFlags() & ts.SymbolFlags.Enum) ||
      !!(symbol.getFlags() & ts.SymbolFlags.ConstEnum)
    );
  }

  isFunction(type: ts.Type) {
    const symbol = this.getSymbol(type);
    return !!(symbol.getFlags() & ts.SymbolFlags.Function);
  }

  isTypeAlias(type: ts.Type) {
    const symbol = this.getSymbol(type);
    return !!(symbol.getFlags() & ts.SymbolFlags.TypeAlias);
  }

  isTypeLiteral(type: ts.Type) {
    const symbol = this.getSymbol(type);
    return !!(symbol.getFlags() & ts.SymbolFlags.TypeLiteral);
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

    console.log(this.checker.typeToString(type), this.isObjectType(type));

    const symbol = this.getSymbol(type);

    let hasConstructorSignature = false;
    let hasPrivateProperty = false;

    for (const [name, member] of symbol.members) {
      if (
        member.getFlags() & ts.SymbolFlags.Signature &&
        name === ts.InternalSymbolName.New
      ) {
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

  getTypeOfExport(exportSymbol: ts.Symbol) {
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
  }
}
