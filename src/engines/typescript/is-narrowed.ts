import ts from "typescript";
import { TypeInformer } from "./type-informer";

export function isNarrowed(base: ts.Type, baseInformer: TypeInformer, target: ts.Type, targetInformer: TypeInformer) {
  const baseChecker = baseInformer.checker;
  const targetChecker = targetInformer.checker;

  // cannot narrow TO a target of any type
  if (target.flags & ts.TypeFlags.Any && !(base.flags & ts.TypeFlags.Any)) {
    return false;
  }

  // if target is now an any or unknown but the base is not
  if (base.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown) && !(target.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown))) {
    return true;
  }

  // if a type went from a union to a non-union type, and one of the types is represented
  if (!(target.flags & ts.TypeFlags.Union) && base.flags & ts.TypeFlags.Union) {
    return true;
  }

  // if the base is a union type, check if the base is a superset of the target
  if (!!(target.flags & ts.TypeFlags.Union) && !!(base.flags & ts.TypeFlags.Union)) {
    const unionBase = base as ts.UnionType;
    const unionTarget = target as ts.UnionType;

    // place both unionBase and unionTarget types into sets
    const baseTypes = new Set(unionBase.types.map((t) => baseChecker.typeToString(t)));
    const targetTypes = new Set(unionTarget.types.map((t) => targetChecker.typeToString(t)));

    // check if base has more types than target
    const newTypes = [...baseTypes].filter((t) => !targetTypes.has(t));

    if (newTypes.length > 0) {
      return true;
    }

    return unionBase.types.every((t) => isNarrowed(t, baseInformer, target, targetInformer));
  }

  // check if object types are narrowed
  if (base.flags & ts.TypeFlags.StructuredType && target.flags & ts.TypeFlags.StructuredType) {
    const baseObject = base as ts.StructuredType;
    const targetObject = target as ts.StructuredType;

    const baseProperties = baseInformer.collectProperties(baseObject);
    const targetProperties = targetInformer.collectProperties(targetObject);

    // place both base and target properties into sets
    const basePropertyNames = new Set(Object.keys(baseProperties));
    const targetPropertyNames = new Set(Object.keys(targetProperties));

    for (const name of basePropertyNames) {
      if (!targetPropertyNames.has(name)) {
        return true;
      }

      if (isNarrowed(baseProperties[name].type, baseInformer, targetProperties[name].type, targetInformer)) {
        return true;
      }
    }
  }

  // TODO: deal with arrays, tuples, etc.

  return false;
}
