import { test } from "@jest/globals";
import { comapreHarness, getCasesByGroup } from "./compare-harness";

const group = "complex";

test.concurrent.each(getCasesByGroup(group))(`Test case "%s"`, async (testCase) => {
  comapreHarness(group, testCase);
});
