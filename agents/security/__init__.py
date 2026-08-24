"""
Security Package Initialization

Provides unified access to all security components for zero-knowledge data retention guarantees.

Import policy: the stdlib-only modules (sha256_id_system, free_third_party_sources)
are imported unconditionally so the package always loads and the free third-party
source enrichment is available even when optional crypto deps (cryptography, PyJWT)
are absent. Sibling modules that depend on optional third-party packages degrade
gracefully: if a dep is missing, their names resolve to None rather than breaking
the whole package. In production (Cloud Run) all deps are present, so behavior is
identical to a plain import.
"""

# Stdlib-only — always available
from .sha256_id_system import SHA256IDGenerator, sha256_id_generator, SHA256ID
from .free_third_party_sources import (
    FreeThirdPartyEnricher,
    free_third_party_enricher,
    EnrichmentFinding,
    FREE_SOURCES_REGISTRY,
    DATA_BROKER_REGISTRY,
    sha256_hex,
    sha256_prefix,
    sha1_prefix,
)

# Optional-dep siblings — degrade to None if their deps are missing
try:
    from .mac_validation_center import MACValidationCenter, mac_validation_center, DeviceFingerprint
except Exception:  # noqa: BLE001 - optional dep missing
    MACValidationCenter = mac_validation_center = DeviceFingerprint = None

try:
    from .aes_gcm_sha256_encryption import AESGCMSHA256Encryptor, aes_gcm_encryptor, EncryptionMetadata
except Exception:  # noqa: BLE001 - cryptography not installed
    AESGCMSHA256Encryptor = aes_gcm_encryptor = EncryptionMetadata = None

try:
    from .third_party_tracker import ThirdPartyProviderTracker, third_party_tracker, ProviderInteraction
except Exception:  # noqa: BLE001
    ThirdPartyProviderTracker = third_party_tracker = ProviderInteraction = None

try:
    from .offline_online_manager import OfflineOnlineDataManager, offline_online_manager, DataState
except Exception:  # noqa: BLE001
    OfflineOnlineDataManager = offline_online_manager = DataState = None

try:
    from .sha256id_display import SHA256IDDisplay, sha256_id_display
except Exception:  # noqa: BLE001
    SHA256IDDisplay = sha256_id_display = None

try:
    from .zero_knowledge_validator import ZeroKnowledgeValidationSystem, zero_knowledge_validator, ValidationCheck
except Exception:  # noqa: BLE001
    ZeroKnowledgeValidationSystem = zero_knowledge_validator = ValidationCheck = None


__all__ = [
    # SHA256ID System
    'SHA256IDGenerator',
    'sha256_id_generator',
    'SHA256ID',

    # MAC Validation Center
    'MACValidationCenter',
    'mac_validation_center',
    'DeviceFingerprint',

    # Encryption
    'AESGCMSHA256Encryptor',
    'aes_gcm_encryptor',
    'EncryptionMetadata',

    # Third-Party Tracking
    'ThirdPartyProviderTracker',
    'third_party_tracker',
    'ProviderInteraction',

    # Offline/Online Manager
    'OfflineOnlineDataManager',
    'offline_online_manager',
    'DataState',

    # SHA256ID Display
    'SHA256IDDisplay',
    'sha256_id_display',

    # Zero-Knowledge Validator
    'ZeroKnowledgeValidationSystem',
    'zero_knowledge_validator',
    'ValidationCheck',

    # Free Third-Party Source Enrichment
    'FreeThirdPartyEnricher',
    'free_third_party_enricher',
    'EnrichmentFinding',
    'FREE_SOURCES_REGISTRY',
    'DATA_BROKER_REGISTRY',
    'sha256_hex',
    'sha256_prefix',
    'sha1_prefix'
]
