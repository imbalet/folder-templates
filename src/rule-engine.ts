import { RuleMatcher, substitute, type RuleMatch } from "obsidian-path-matcher";

import type { TemplateRule } from "./types";

export interface ResolvedTemplateRule {
  rule: TemplateRule;
  match: RuleMatch<TemplateRule>;
}

export class TemplateRuleEngine {
  private matcher: RuleMatcher<TemplateRule>;

  constructor(rules: TemplateRule[]) {
    this.matcher = new RuleMatcher(
      rules
        .filter((rule) => rule.enabled)
        .map((rule) => ({
          pattern: rule.pattern,
          mode: rule.mode,
          value: rule,
        })),
    );
  }

  match(path: string): ResolvedTemplateRule[] {
    const matches = this.matcher.matchAll(path);

    return matches.map((match) => ({
      rule: match.rule.value,
      match,
    }));
  }

  resolveTemplatePath(template: string, match: ResolvedTemplateRule): string {
    return substitute(template, match.match.match);
  }
}
