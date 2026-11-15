from typing import Dict


class AuditAgent:
    def run(self, plan_text: str) -> Dict[str, object]:
        issues = []
        if "GDPR" in plan_text.upper():
            issues.append({"category": "compliance", "issue": "GDPR review required"})
        if "contract" in plan_text.lower() or "deviation" in plan_text.lower():
            issues.append({"category": "contract", "issue": "Contractual deviations should be documented"})
        return {"issues": issues, "status": "reviewed" if issues else "clear"}
