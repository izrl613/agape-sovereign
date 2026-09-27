"""
Identity Vector Modules Package

This package contains 16 specialized vector agents for processing different aspects
of digital identity before handing off to Architect AI.
"""

from .base_vector_agent import (
    BaseVectorAgent,
    VectorResult,
    VectorStatus,
    VectorPriority,
    UserQuery,
    VectorAgentRegistry,
    vector_registry
)

# Import all vector modules
from .v01_email_breach import EmailBreachVectorAgent
from .v02_social_media import SocialMediaFootprintVectorAgent
from .v03_device_scan import DeviceFileScanVectorAgent
from .v04_mobile_security import MobileSecurityLayerVectorAgent
from .v05_deep_web import DeepWebExposureVectorAgent
from .v06_data_broker import DataBrokerRemovalVectorAgent
from .v07_password_vault import PasswordVaultAnalysisVectorAgent
from .v08_location_data import LocationDataFootprintVectorAgent
from .v09_browser_tracker import BrowserCookieTrackerVectorAgent
from .v10_medical_data import MedicalDataFootprintVectorAgent
from .v11_biometric_data import VoiceBiometricDataVectorAgent
from .v12_iot_scan import IoTSmartDeviceScanVectorAgent
from .v13_cloud_storage import CloudStorageExposureVectorAgent
from .v14_dark_web import DarkWebMonitoringVectorAgent
from .v15_behavioral import BehavioralProfileAnalysisVectorAgent
from .v16_sovereign_erasure import SovereignErasureEngineVectorAgent


def register_all_agents():
    """Register all 16 vector agents in the global registry"""
    agents = [
        EmailBreachVectorAgent(),
        SocialMediaFootprintVectorAgent(),
        DeviceFileScanVectorAgent(),
        MobileSecurityLayerVectorAgent(),
        DeepWebExposureVectorAgent(),
        DataBrokerRemovalVectorAgent(),
        PasswordVaultAnalysisVectorAgent(),
        LocationDataFootprintVectorAgent(),
        BrowserCookieTrackerVectorAgent(),
        MedicalDataFootprintVectorAgent(),
        VoiceBiometricDataVectorAgent(),
        IoTSmartDeviceScanVectorAgent(),
        CloudStorageExposureVectorAgent(),
        DarkWebMonitoringVectorAgent(),
        BehavioralProfileAnalysisVectorAgent(),
        SovereignErasureEngineVectorAgent()
    ]
    
    for agent in agents:
        vector_registry.register(agent)
    
    return len(agents)


__all__ = [
    'BaseVectorAgent',
    'VectorResult', 
    'VectorStatus',
    'VectorPriority',
    'UserQuery',
    'VectorAgentRegistry',
    'vector_registry',
    'register_all_agents',
    # Individual agents
    'EmailBreachVectorAgent',
    'SocialMediaFootprintVectorAgent',
    'DeviceFileScanVectorAgent',
    'MobileSecurityLayerVectorAgent',
    'DeepWebExposureVectorAgent',
    'DataBrokerRemovalVectorAgent',
    'PasswordVaultAnalysisVectorAgent',
    'LocationDataFootprintVectorAgent',
    'BrowserCookieTrackerVectorAgent',
    'MedicalDataFootprintVectorAgent',
    'VoiceBiometricDataVectorAgent',
    'IoTSmartDeviceScanVectorAgent',
    'CloudStorageExposureVectorAgent',
    'DarkWebMonitoringVectorAgent',
    'BehavioralProfileAnalysisVectorAgent',
    'SovereignErasureEngineVectorAgent'
]