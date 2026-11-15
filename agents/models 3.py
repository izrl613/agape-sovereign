from dataclasses import dataclass, field
from typing import List


@dataclass
class ExtractionResult:
    names: List[str] = field(default_factory=list)
    dates: List[str] = field(default_factory=list)
    financial_figures: List[str] = field(default_factory=list)
    technical_schematics: List[str] = field(default_factory=list)
