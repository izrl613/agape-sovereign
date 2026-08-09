"""
SHA256ID Display Components

Provides SHA256ID display components for splash screen, loading screen, and PDF footer
to ensure complete transparency and zero-knowledge data retention guarantees.
"""

from typing import Dict, Any
from datetime import datetime
from .sha256_id_system import SHA256IDGenerator, sha256_id_generator


class SHA256IDDisplay:
    """
    Manages SHA256ID display across all UI components.
    
    Ensures that every screen, document, and interface displays the SHA256ID
    for complete transparency and zero-knowledge guarantees.
    """
    
    def __init__(self):
        self.sha256_generator = sha256_id_generator
        self.current_id = None
        self.display_locations = {
            "splash_screen": False,
            "loading_screen": False,
            "pdf_footer": False,
            "settings_panel": False,
            "audit_log": False
        }
    
    def set_current_id(self, sha256_id: str):
        """Set the current SHA256ID for display"""
        self.current_id = sha256_id
    
    def generate_splash_screen_display(self) -> Dict[str, Any]:
        """Generate SHA256ID display for splash screen"""
        if not self.current_id:
            session_id = self.sha256_generator.generate_session_id("splash_screen")
            self.set_current_id(session_id.id)
        
        self.display_locations["splash_screen"] = True
        
        return {
            "component": "splash_screen",
            "sha256_id": self.current_id,
            "display_format": "footer_centered",
            "style": {
                "position": "fixed",
                "bottom": "10px",
                "left": "50%",
                "transform": "translateX(-50%)",
                "font_family": "monospace",
                "font_size": "10px",
                "color": "rgba(128, 128, 128, 0.7)",
                "text_align": "center"
            },
            "html": f'<div class="sha256id-footer">SHA256ID: {self.current_id[:16]}... | {datetime.utcnow().strftime("%Y-%m-%d")}</div>'
        }
    
    def generate_loading_screen_display(self) -> Dict[str, Any]:
        """Generate SHA256ID display for loading screen"""
        if not self.current_id:
            session_id = self.sha256_generator.generate_session_id("loading_screen")
            self.set_current_id(session_id.id)
        
        self.display_locations["loading_screen"] = True
        
        return {
            "component": "loading_screen",
            "sha256_id": self.current_id,
            "display_format": "footer_centered",
            "style": {
                "position": "fixed",
                "bottom": "10px",
                "left": "50%",
                "transform": "translateX(-50%)",
                "font_family": "monospace",
                "font_size": "10px",
                "color": "rgba(128, 128, 128, 0.7)",
                "text_align": "center"
            },
            "html": f'<div class="sha256id-footer">SHA256ID: {self.current_id[:16]}... | LOADING</div>'
        }
    
    def generate_pdf_footer_display(self, sha256_id: str) -> Dict[str, Any]:
        """Generate SHA256ID display for PDF footer"""
        self.display_locations["pdf_footer"] = True
        
        return {
            "component": "pdf_footer",
            "sha256_id": sha256_id,
            "display_format": "footer_centered",
            "style": {
                "position": "footer",
                "text_align": "center",
                "font_family": "monospace",
                "font_size": "8px",
                "color": "#666666",
                "margin_top": "20px",
                "border_top": "1px solid #dddddd",
                "padding_top": "10px"
            },
            "text": f"SHA256ID: {sha256_id} | Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} | Zero-Knowledge Encrypted"
        }
    
    def generate_settings_panel_display(self) -> Dict[str, Any]:
        """Generate SHA256ID display for settings panel"""
        if not self.current_id:
            session_id = self.sha256_generator.generate_session_id("settings_panel")
            self.set_current_id(session_id.id)
        
        self.display_locations["settings_panel"] = True
        
        return {
            "component": "settings_panel",
            "sha256_id": self.current_id,
            "display_format": "card",
            "full_id": self.current_id,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def generate_validation_center_display(self) -> Dict[str, Any]:
        """Generate SHA256ID display for validation center"""
        if not self.current_id:
            session_id = self.sha256_generator.generate_session_id("validation_center")
            self.set_current_id(session_id.id)
        
        self.display_locations["audit_log"] = True
        
        return {
            "component": "validation_center",
            "sha256_id": self.current_id,
            "display_format": "header",
            "full_id": self.current_id,
            "timestamp": datetime.utcnow().isoformat(),
            "verification_status": "pending"
        }
    
    def get_display_status(self) -> Dict[str, Any]:
        """Get current display status across all components"""
        return {
            "current_sha256_id": self.current_id,
            "display_locations": self.display_locations,
            "total_displays": sum(1 for displayed in self.display_locations.values() if displayed),
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def generate_transparency_footer_html(self) -> str:
        """Generate complete transparency footer HTML"""
        if not self.current_id:
            session_id = self.sha256_generator.generate_session_id("transparency_footer")
            self.set_current_id(session_id.id)
        
        return f'''
<div class="transparency-footer" style="
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.8);
    color: #888;
    padding: 8px 16px;
    font-family: monospace;
    font-size: 10px;
    text-align: center;
    border-top: 1px solid #333;
    z-index: 9999;
">
    <div class="sha256id-display">
        SHA256ID: {self.current_id[:16]}... | 
        Zero-Knowledge Encrypted | 
        AES-256-GCM | 
        {datetime.utcnow().strftime("%Y-%m-%d %H:%M")}
    </div>
</div>
'''


# Global singleton instance
sha256_id_display = SHA256IDDisplay()
