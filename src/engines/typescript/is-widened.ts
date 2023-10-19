import ts from "typescript";
import { TypeInformer } from "./type-informer";

export function isWidened(base: ts.Type, baseInformer: TypeInformer, target: ts.Type, targetInformer: TypeInformer) {
  const baseChecker = baseInformer.checker;
  const targetChecker = targetInformer.checker;

  // cannot widen from any
  if (base.flags & ts.TypeFlags.Any) {
    return false;
  }

  // if target is now an any or unknown but the base is not
  if (target.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown) && !(base.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown))) {
    return true;
  }

  // if a type went from a non-union to a union
  if (target.flags & ts.TypeFlags.Union && !(base.flags & ts.TypeFlags.Union)) {
    return true;
  }

  // if the base is a union type, check if the target is a superset of the base
  if (base.flags & ts.TypeFlags.Union) {
    const unionBase = base as ts.UnionType;
    const unionTarget = target as ts.UnionType;

    // place both unionBase and unionTarget types into sets
    const baseTypes = new Set(unionBase.types.map((t) => baseChecker.typeToString(t)));
    const targetTypes = new Set(unionTarget.types.map((t) => targetChecker.typeToString(t)));

    // check if target has more types than base
    const newTypes = [...targetTypes].filter((t) => !baseTypes.has(t));
    if (newTypes.length > 0) {
      return true;
    }

    // check if target has more types than base
    return unionBase.types.every((t) => isWidened(t, baseInformer, target, targetInformer));
  }

  // check if object types are widened
  if (base.flags & ts.TypeFlags.StructuredType && target.flags & ts.TypeFlags.StructuredType) {
    const baseObject = base as ts.StructuredType;
    const targetObject = target as ts.StructuredType;

    const baseProperties = baseInformer.collectProperties(baseObject);
    const targetProperties = targetInformer.collectProperties(targetObject);

    // place both base and target properties into sets
    const basePropertyNames = new Set(Object.keys(baseProperties));
    const targetPropertyNames = new Set(Object.keys(targetProperties));

    for (const name of targetPropertyNames) {
      if (!basePropertyNames.has(name)) {
        return true;
      }

      if (isWidened(baseProperties[name].type, baseInformer, targetProperties[name].type, targetInformer)) {
        return true;
      }
    }
  }

  // TODO: deal with arrays, tuples, etc.

  return false;
}
