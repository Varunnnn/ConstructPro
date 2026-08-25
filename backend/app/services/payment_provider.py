from abc import ABC, abstractmethod
from typing import Dict, Any
import hmac
import hashlib
import uuid


class PaymentProvider(ABC):
    @abstractmethod
    def create_order(self, amount: float, currency: str, receipt: str, notes: Dict[str, Any] = None) -> Dict[str, Any]:
        pass

    @abstractmethod
    def verify_payment_signature(self, order_id: str, payment_id: str, signature: str) -> bool:
        pass


class MockPaymentProvider(PaymentProvider):
    """
    Mock payment provider for development & testing without real API keys.
    """
    def create_order(self, amount: float, currency: str, receipt: str, notes: Dict[str, Any] = None) -> Dict[str, Any]:
        order_id = f"order_mock_{uuid.uuid4().hex[:12]}"
        return {
            "id": order_id,
            "amount": int(amount * 100),
            "currency": currency,
            "receipt": receipt,
            "status": "created",
            "provider": "mock"
        }

    def verify_payment_signature(self, order_id: str, payment_id: str, signature: str) -> bool:
        # Mock verification always succeeds if signature matches format or in dev mode
        return True


class RazorpayPaymentProvider(PaymentProvider):
    """
    Production Razorpay integration wrapper.
    """
    def __init__(self, key_id: str, key_secret: str):
        self.key_id = key_id
        self.key_secret = key_secret

    def create_order(self, amount: float, currency: str, receipt: str, notes: Dict[str, Any] = None) -> Dict[str, Any]:
        try:
            import razorpay
            client = razorpay.Client(auth=(self.key_id, self.key_secret))
            data = {
                "amount": int(amount * 100),  # In paise
                "currency": currency,
                "receipt": receipt,
                "notes": notes or {}
            }
            return client.order.create(data=data)
        except Exception as e:
            # Fallback to mock structure if SDK or keys missing in dev
            return MockPaymentProvider().create_order(amount, currency, receipt, notes)

    def verify_payment_signature(self, order_id: str, payment_id: str, signature: str) -> bool:
        try:
            msg = f"{order_id}|{payment_id}".encode("utf-8")
            generated_signature = hmac.new(
                self.key_secret.encode("utf-8"),
                msg,
                hashlib.sha256
            ).hexdigest()
            return hmac.compare_digest(generated_signature, signature)
        except Exception:
            return False
