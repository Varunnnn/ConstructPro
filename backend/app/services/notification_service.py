"""
Notification service abstraction.
V1: In-app activity log only.
Future: WhatsApp, SMS, Email, Push notification providers.
"""
from sqlalchemy.orm import Session
import uuid
from typing import Optional

from app.models.payment import ActivityLog


class NotificationService:
    """
    Abstract notification service.
    V1 implements only in-app activity logging.
    Future: add WhatsApp, SMS, Email providers.
    """

    def __init__(self, db: Session, org_id: uuid.UUID, user_id: Optional[uuid.UUID] = None):
        self.db = db
        self.org_id = org_id
        self.user_id = user_id

    def log_activity(
        self,
        action: str,
        entity_type: str,
        description: str,
        entity_id: Optional[uuid.UUID] = None,
        project_id: Optional[uuid.UUID] = None,
    ) -> ActivityLog:
        log = ActivityLog(
            organization_id=self.org_id,
            user_id=self.user_id,
            project_id=project_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            description=description,
        )
        self.db.add(log)
        self.db.commit()
        return log

    # Future provider methods (stubs for now)
    async def send_whatsapp(self, phone: str, message: str) -> None:
        """Future: Send WhatsApp message via provider."""
        pass

    async def send_sms(self, phone: str, message: str) -> None:
        """Future: Send SMS via provider."""
        pass

    async def send_email(self, email: str, subject: str, body: str) -> None:
        """Future: Send email via provider."""
        pass

    async def send_push(self, user_id: uuid.UUID, title: str, body: str) -> None:
        """Future: Send push notification."""
        pass
