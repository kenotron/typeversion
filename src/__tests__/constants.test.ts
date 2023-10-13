import { test } from "@jest/globals";
import { comapreHarness, getCasesByGroup } from "./compare-harness";

const group = "constants";

test.concurrent.each(getCasesByGroup(group))(
  `Test case "%s"`,
  async (testCase) => {
    comapreHarness(group, testCase);
  }
);
